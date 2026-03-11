import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Heading, Text, VStack, HStack, Badge,
  IconButton, Button, Spinner, useToast, Card, CardBody,
  Image, Flex, Divider, Grid, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  Input, InputGroup, InputLeftElement, Select, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb, Switch,
  FormControl, FormLabel, Alert, AlertIcon, AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  MapPin, Navigation, Star, Clock, IndianRupee, Search,
  Filter, Maximize2, Minimize2, Locate, Users, Percent,
  Heart, RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || 'aa5340f7ea7246bf862e89964c901398';
const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// --- Load Leaflet CSS & JS dynamically ---
const loadLeaflet = () => new Promise((resolve, reject) => {
  if (window.L) return resolve(window.L);

  // Load CSS
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  // Load JS
  if (!document.querySelector('script[src*="leaflet"]')) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  } else {
    const interval = setInterval(() => {
      if (window.L) { clearInterval(interval); resolve(window.L); }
    }, 100);
  }
});

const MapWithNearbyRestaurants = ({ apiKey }) => {
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [error, setError] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0, maxPrice: 1000, vegOnly: false, openNow: true, cuisine: '',
  });
  const [stats, setStats] = useState({
    totalRestaurants: 0, avgRating: 0, avgDeliveryTime: 0, restaurantsWithOffers: 0,
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // --- Initialize map with Leaflet ---
  const initMap = async (lat, lng) => {
    const L = await loadLeaflet();
    if (!mapContainerRef.current) return;

    // Destroy existing map instance before creating new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // User location marker (orange circle)
    const userIcon = L.divIcon({
      html: `<div style="background:#f97316;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 2px 10px rgba(0,0,0,0.4);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: '',
    });
    userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('📍 Your Location');

    // Radius circle
    L.circle([lat, lng], {
      radius: searchRadius * 1000,
      color: '#f97316', fillColor: '#f97316', fillOpacity: 0.08, weight: 2,
    }).addTo(map);

    mapRef.current = map;
    return map;
  };

  // --- Add restaurant marker to Leaflet map ---
  const addRestaurantMarker = (L, restaurant) => {
    if (!mapRef.current || !L) return;
    const lat = restaurant.location?.latitude;
    const lng = restaurant.location?.longitude;
    if (!lat || !lng) return;

    const rating = parseFloat(restaurant.rating) || 0;
    const color = rating >= 4.5 ? '#10b981' : rating >= 4 ? '#f59e0b' : '#ef4444';

    const icon = L.divIcon({
      html: `<div style="background:white;border:2px solid ${color};border-radius:8px;padding:3px 7px;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:12px;font-weight:bold;color:#1f2937;white-space:nowrap;">
        ${restaurant.isVeg ? '🌱 ' : ''}${rating}${restaurant.offers?.length > 0 ? ' 🏷️' : ''}
      </div>`,
      iconAnchor: [30, 14],
      className: '',
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(mapRef.current)
      .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.address || ''}`);

    marker.on('click', () => {
      setSelectedRestaurant(restaurant);
      onOpen();
    });

    markersRef.current.push(marker);
  };

  // --- Reverse geocode to get address from coords ---
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      );
      if (res.data.features?.length > 0) {
        setUserAddress(res.data.features[0].properties);
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err.message);
    }
  };

  // --- Fetch restaurants by coords ---
  const fetchRestaurants = async (lat, lng) => {
    setLoading(true);
    setError('');

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    let restaurants = [];

    try {
      // Try backend first
      const res = await axios.get(`${VITE_API_URL}/api/restaurants/nearby`, {
        params: { latitude: lat, longitude: lng, maxDistance: searchRadius * 1000 },
      });
      restaurants = res.data || [];
    } catch (backendErr) {
      console.log('Backend unavailable, falling back to Geoapify Places API');
    }

    // Fallback to Geoapify Places API
    if (restaurants.length === 0) {
      try {
        const placesRes = await axios.get(
          `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=circle:${lng},${lat},${searchRadius * 1000}&limit=40&apiKey=${GEOAPIFY_API_KEY}`
        );
        restaurants = placesRes.data.features
          .filter(p => p.properties.name) // Only named places
          .map(place => ({
            _id: place.properties.place_id,
            name: place.properties.name,
            address: place.properties.formatted,
            location: {
              latitude: place.geometry.coordinates[1],
              longitude: place.geometry.coordinates[0],
              city: place.properties.city || place.properties.county,
            },
            cuisine: (place.properties.datasource?.raw?.cuisine || 'Various')
              .split(';').map(c => c.trim()),
            rating: (3.8 + Math.random() * 1.2).toFixed(1),
            deliveryTime: Math.floor(20 + Math.random() * 30),
            avgPrice: Math.floor(150 + Math.random() * 700),
            image: `https://source.unsplash.com/400x300/?${encodeURIComponent('restaurant food')}`,
            isVeg: Math.random() > 0.65,
            isOpen: place.properties.opening_hours ? true : Math.random() > 0.2,
            offers: Math.random() > 0.5 ? [{ text: '20% off on first order', code: 'FIRST20' }] : [],
          }));
      } catch (placesErr) {
        console.error('Geoapify Places API failed:', placesErr.message);
        // Final fallback: sample data
        restaurants = getSampleRestaurants(lat, lng);
      }
    }

    // Compute distances
    const L = window.L;
    const withDistance = restaurants.map(r => ({
      ...r,
      distance: calculateDistance(lat, lng, r.location?.latitude, r.location?.longitude).toFixed(1),
    }));

    // Apply filters
    const filtered = applyFilters(withDistance);
    setNearbyRestaurants(filtered);
    computeStats(filtered);

    // Add markers
    if (L && mapRef.current) {
      filtered.forEach(r => addRestaurantMarker(L, r));

      // Fit bounds if we have results
      if (filtered.length > 0) {
        const group = L.featureGroup([
          userMarkerRef.current,
          ...markersRef.current,
        ]);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }

    setLoading(false);
  };

  // --- Trigger full location + map init + fetch ---
  const handleLocateMe = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', status: 'error', duration: 4000 });
      useFallbackLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        await reverseGeocode(latitude, longitude);
        await initMap(latitude, longitude);
        await fetchRestaurants(latitude, longitude);
      },
      (err) => {
        toast({
          title: 'Location access denied',
          description: 'Using default location (Kalyan, Maharashtra)',
          status: 'warning', duration: 5000, isClosable: true,
        });
        useFallbackLocation();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const useFallbackLocation = async () => {
    const lat = 19.265929, lng = 73.238978; // Kalyan, Maharashtra
    setUserCoords({ latitude: lat, longitude: lng });
    await initMap(lat, lng);
    await fetchRestaurants(lat, lng);
  };

  // --- Filters ---
  const applyFilters = (restaurants) => {
    return restaurants
      .filter(r => {
        if (filters.minRating > 0 && parseFloat(r.rating) < filters.minRating) return false;
        if (r.avgPrice > filters.maxPrice) return false;
        if (filters.vegOnly && !r.isVeg) return false;
        if (filters.openNow && !r.isOpen) return false;
        if (filters.cuisine && !r.cuisine?.some(c => c.toLowerCase().includes(filters.cuisine.toLowerCase()))) return false;
        return true;
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  };

  const computeStats = (list) => {
    const n = list.length || 1;
    setStats({
      totalRestaurants: list.length,
      avgRating: (list.reduce((s, r) => s + parseFloat(r.rating), 0) / n).toFixed(1),
      avgDeliveryTime: Math.round(list.reduce((s, r) => s + (r.deliveryTime || 30), 0) / n),
      restaurantsWithOffers: list.filter(r => r.offers?.length > 0).length,
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // --- Sample data fallback ---
  const getSampleRestaurants = (lat, lng) => [
    { _id: 's1', name: 'The Spice House', address: 'Sai Complex, Kalyan West', location: { latitude: lat + 0.005, longitude: lng + 0.003 }, cuisine: ['North Indian', 'Mughlai'], rating: '4.5', deliveryTime: 35, avgPrice: 450, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', isVeg: false, isOpen: true, offers: [{ text: '50% off up to ₹150', code: 'SPICE50' }] },
    { _id: 's2', name: 'Pizza Paradise', address: 'MIDC Road, Kalyan East', location: { latitude: lat - 0.003, longitude: lng + 0.006 }, cuisine: ['Italian', 'Fast Food'], rating: '4.3', deliveryTime: 30, avgPrice: 600, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', isVeg: true, isOpen: true, offers: [{ text: 'Free delivery', code: 'FREEDEL' }] },
    { _id: 's3', name: 'Biryani Blues', address: 'Shahad Station Road', location: { latitude: lat - 0.008, longitude: lng - 0.005 }, cuisine: ['Biryani', 'Hyderabadi'], rating: '4.7', deliveryTime: 40, avgPrice: 500, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', isVeg: false, isOpen: true, offers: [] },
    { _id: 's4', name: 'South Indian Cafe', address: 'Mharal Village', location: { latitude: lat + 0.002, longitude: lng - 0.007 }, cuisine: ['South Indian'], rating: '4.4', deliveryTime: 25, avgPrice: 300, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400', isVeg: true, isOpen: true, offers: [] },
  ];

  // On mount — get location
  useEffect(() => {
    handleLocateMe();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // --- Restaurant Modal ---
  const RestaurantModal = () => {
    if (!selectedRestaurant) return null;
    const r = selectedRestaurant;
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader fontFamily="ClashDisplay, sans-serif">{r.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Image src={r.image} alt={r.name} borderRadius="xl" h="200px" objectFit="cover"
                fallbackSrc="https://via.placeholder.com/400x200?text=Restaurant" />
              <Text color="gray.500" fontSize="sm">{r.address}</Text>
              <Flex justify="space-between" align="center">
                <HStack spacing={2} flexWrap="wrap">
                  {r.cuisine?.map((c, i) => (
                    <Badge key={i} colorScheme="orange" borderRadius="full" px={3} py={1}>{c}</Badge>
                  ))}
                </HStack>
                <Badge fontSize="lg" px={3} py={1} borderRadius="lg" bg="green.50" color="green.700">
                  {r.rating} ★
                </Badge>
              </Flex>
              <Divider />
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box><Text fontSize="sm" color="gray.500">Delivery Time</Text>
                  <HStack><Clock size={16} /><Text fontWeight="bold">{r.deliveryTime} min</Text></HStack></Box>
                <Box><Text fontSize="sm" color="gray.500">Avg Price</Text>
                  <HStack><IndianRupee size={16} /><Text fontWeight="bold">₹{r.avgPrice}</Text></HStack></Box>
                <Box><Text fontSize="sm" color="gray.500">Distance</Text>
                  <HStack><Navigation size={16} /><Text fontWeight="bold">{r.distance} km</Text></HStack></Box>
                <Box><Text fontSize="sm" color="gray.500">Status</Text>
                  <Badge colorScheme={r.isOpen ? 'green' : 'red'}>{r.isOpen ? 'Open' : 'Closed'}</Badge></Box>
              </Grid>
              {r.offers?.length > 0 && (
                <Box>
                  <Heading size="sm" mb={2}>Offers</Heading>
                  {r.offers.map((o, i) => (
                    <Box key={i} bg="orange.50" p={3} borderRadius="lg">
                      <Flex justify="space-between">
                        <Text fontWeight="semibold" color="orange.600">{o.text}</Text>
                        <Badge colorScheme="orange">Code: {o.code}</Badge>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              )}
              <HStack spacing={3} pt={2}>
                <Button flex={1} colorScheme="orange" leftIcon={<Navigation size={16} />}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.location?.latitude},${r.location?.longitude}`, '_blank')}
                  borderRadius="xl">
                  Directions
                </Button>
                <IconButton icon={<Heart size={16} />} borderRadius="xl" aria-label="Favourite" />
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // --- Stat Card ---
  const StatCard = ({ icon, label, value }) => (
    <HStack spacing={2} bg="white" px={3} py={2} borderRadius="xl" boxShadow="sm" borderWidth={1} borderColor="gray.100">
      <Box color="orange.500">{icon}</Box>
      <Box>
        <Text fontSize="xs" color="gray.500">{label}</Text>
        <Text fontWeight="bold" fontSize="sm">{value}</Text>
      </Box>
    </HStack>
  );

  if (loading) return (
    <VStack spacing={4} py={20}>
      <Spinner size="xl" color="orange.500" thickness="4px" />
      <Text color="gray.600">Finding restaurants near you...</Text>
    </VStack>
  );

  return (
    <Container maxW="7xl" py={4}>
      {/* Header */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={4} gap={4}>
        <HStack spacing={4}>
          <Box p={3} bgGradient="linear(to-br, orange.500, pink.500)" borderRadius="xl" boxShadow="lg">
            <MapPin size={24} color="white" />
          </Box>
          <Box>
            <Heading size="lg" fontFamily="ClashDisplay, sans-serif">Restaurants Near You</Heading>
            <Text color="gray.500" fontSize="sm">
              {userAddress ? `${userAddress.city || ''}, ${userAddress.state || ''} — ${userAddress.postcode || ''}` : 'Getting your location...'}
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2} flexWrap="wrap">
          <StatCard icon={<Users size={20} />} label="Found" value={stats.totalRestaurants} />
          <StatCard icon={<Star size={20} />} label="Avg Rating" value={stats.avgRating} />
          <StatCard icon={<Clock size={20} />} label="Avg Time" value={`${stats.avgDeliveryTime} min`} />
          <StatCard icon={<Percent size={20} />} label="With Offers" value={stats.restaurantsWithOffers} />
        </HStack>
      </Flex>

      {/* Search & Filter Bar */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={3} mb={4} p={4} bg="white" borderRadius="2xl" boxShadow="sm">
        <InputGroup flex={1}>
          <InputLeftElement><Search size={18} color="#718096" /></InputLeftElement>
          <Input placeholder="Search restaurants, cuisines..."
            value={filters.cuisine} onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            borderRadius="xl" borderColor="gray.200" />
        </InputGroup>
        <HStack spacing={2}>
          <Select w="150px" value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} borderRadius="xl">
            <option value={0}>Any Rating</option>
            <option value={4.5}>4.5+ ★</option>
            <option value={4}>4.0+ ★</option>
            <option value={3.5}>3.5+ ★</option>
          </Select>
          <IconButton icon={<Filter size={18} />} onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'solid' : 'outline'} colorScheme="orange" borderRadius="xl" aria-label="Filters" />
          <IconButton icon={<Locate size={18} />} onClick={handleLocateMe}
            variant="outline" borderRadius="xl" aria-label="Locate Me" colorScheme="orange" />
          <IconButton icon={<RefreshCw size={18} />}
            onClick={() => userCoords && fetchRestaurants(userCoords.latitude, userCoords.longitude)}
            variant="outline" borderRadius="xl" aria-label="Refresh" />
          <IconButton
            icon={<Maximize2 size={18} />} onClick={() => {
              if (!document.fullscreenElement) mapContainerRef.current?.requestFullscreen();
              else document.exitFullscreen();
            }}
            variant="outline" borderRadius="xl" aria-label="Fullscreen" />
        </HStack>
      </Flex>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <MotionBox initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} overflow="hidden" mb={4}>
            <Box p={4} bg="white" borderRadius="2xl" boxShadow="sm">
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="sm">Filter Options</Heading>
                  <Button size="sm" variant="ghost" colorScheme="orange"
                    onClick={() => setFilters({ minRating: 0, maxPrice: 1000, vegOnly: false, openNow: true, cuisine: '' })}>
                    Reset All
                  </Button>
                </Flex>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Radius: {searchRadius}km</FormLabel>
                    <Slider min={1} max={15} step={0.5} value={searchRadius} onChange={setSearchRadius} colorScheme="orange">
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Max Price: ₹{filters.maxPrice}</FormLabel>
                    <Slider min={100} max={2000} step={50} value={filters.maxPrice}
                      onChange={(val) => setFilters({ ...filters, maxPrice: val })} colorScheme="orange">
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                </Grid>
                <HStack spacing={8}>
                  <FormControl display="flex" alignItems="center" w="auto">
                    <Switch id="veg" isChecked={filters.vegOnly} onChange={e => setFilters({ ...filters, vegOnly: e.target.checked })} colorScheme="green" mr={2} />
                    <FormLabel htmlFor="veg" mb={0} fontSize="sm">Pure Veg Only</FormLabel>
                  </FormControl>
                  <FormControl display="flex" alignItems="center" w="auto">
                    <Switch id="open" isChecked={filters.openNow} onChange={e => setFilters({ ...filters, openNow: e.target.checked })} colorScheme="green" mr={2} />
                    <FormLabel htmlFor="open" mb={0} fontSize="sm">Open Now</FormLabel>
                  </FormControl>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Map */}
      <Box ref={mapContainerRef} h={{ base: '380px', md: '480px' }} w="100%"
        borderRadius="2xl" overflow="hidden" boxShadow="xl" borderWidth={1}
        borderColor="gray.200" bg="gray.100" mb={6} />

      {/* Restaurant Grid */}
      {nearbyRestaurants.length > 0 && (
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">
              Restaurants Near {userAddress?.city || 'You'}
            </Heading>
            <Text fontSize="sm" color="gray.500">{nearbyRestaurants.length} found</Text>
          </Flex>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
            {nearbyRestaurants.map((r) => (
              <Card key={r._id} borderRadius="xl" overflow="hidden" cursor="pointer"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.2s" onClick={() => { setSelectedRestaurant(r); onOpen(); }}>
                <Box position="relative" h="140px">
                  <Image src={r.image} alt={r.name} w="100%" h="100%" objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/400x140?text=Restaurant" />
                  <Badge position="absolute" top={2} left={2} bg="whiteAlpha.900"
                    backdropFilter="blur(4px)" borderRadius="full" px={2} py={1}
                    display="flex" alignItems="center" gap={1}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text fontSize="xs" fontWeight="bold">{r.rating}</Text>
                  </Badge>
                  {r.isVeg && (
                    <Badge position="absolute" top={2} right={2} bg="green.500" color="white" fontSize="xs" px={2} borderRadius="full">
                      🌱 Pure Veg
                    </Badge>
                  )}
                </Box>
                <CardBody p={3}>
                  <Heading size="sm" mb={1} noOfLines={1}>{r.name}</Heading>
                  <Text fontSize="xs" color="gray.500" mb={2} noOfLines={1}>{r.cuisine?.join(' • ')}</Text>
                  <HStack spacing={3} fontSize="xs" color="gray.600">
                    <HStack spacing={1}><Clock size={12} /><Text>{r.deliveryTime} min</Text></HStack>
                    <HStack spacing={1}><IndianRupee size={12} /><Text>₹{r.avgPrice}</Text></HStack>
                    <HStack spacing={1}><Navigation size={12} /><Text>{r.distance} km</Text></HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Box>
      )}

      {nearbyRestaurants.length === 0 && !loading && (
        <Box textAlign="center" py={16} bg="white" borderRadius="2xl" boxShadow="sm">
          <Text fontSize="xl" mb={2}>🍽️ No restaurants found</Text>
          <Text color="gray.500" mb={4}>Try increasing the search radius or changing filters.</Text>
          <Button colorScheme="orange" leftIcon={<RefreshCw size={16} />} onClick={handleLocateMe}>
            Retry
          </Button>
        </Box>
      )}

      <RestaurantModal />
    </Container>
  );
};

export default MapWithNearbyRestaurants;