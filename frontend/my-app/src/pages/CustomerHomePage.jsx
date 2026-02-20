import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, 
  Search, 
  Star, 
  Filter, 
  Map as MapIcon, 
  List, 
  Heart,
  Clock,
  DollarSign,
  Navigation,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Bike,
  Shield,
  Percent,
  Coffee,
  Pizza,
  Sandwich,
  IceCream,
  IndianRupee,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  Timer,
  FileText
} from 'lucide-react';

const CustomerHomePage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(60);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [popularCuisines, setPopularCuisines] = useState([]);
  const [featuredCollections, setFeaturedCollections] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [offerRestaurants, setOfferRestaurants] = useState([]);
  const [vegFilter, setVegFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showPriceRange, setShowPriceRange] = useState(false);
  const navigate = useNavigate();
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Food categories for quick filters
  const foodCategories = [
    { id: 'pizza', name: 'Pizza', icon: '🍕', color: 'orange' },
    { id: 'burger', name: 'Burger', icon: '🍔', color: 'blue' },
    { id: 'biryani', name: 'Biryani', icon: '🍛', color: 'red' },
    { id: 'north-indian', name: 'North Indian', icon: '🍲', color: 'purple' },
    { id: 'south-indian', name: 'South Indian', icon: '🥘', color: 'green' },
    { id: 'chinese', name: 'Chinese', icon: '🥡', color: 'pink' },
    { id: 'desserts', name: 'Desserts', icon: '🍰', color: 'amber' },
    { id: 'beverages', name: 'Beverages', icon: '🥤', color: 'indigo' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (userData.addresses && userData.addresses.length > 0) {
        setSelectedCity(userData.addresses[0].city || '');
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const restaurantsRes = await axios.get(`${VITE_API_URL}/api/restaurants`);
      setRestaurants(restaurantsRes.data);
      setFilteredRestaurants(restaurantsRes.data);

      const uniqueCities = [...new Set(
        restaurantsRes.data
          .map(r => r.location?.city)
          .filter(city => city)
      )];
      setCities(uniqueCities);

      if (user?.addresses?.[0]?.city && uniqueCities.includes(user.addresses[0].city)) {
        setSelectedCity(user.addresses[0].city);
      }

      const cuisineCount = {};
      restaurantsRes.data.forEach(restaurant => {
        if (restaurant.cuisine) {
          restaurant.cuisine.forEach(cuisine => {
            cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
          });
        }
      });
      
      const sortedCuisines = Object.entries(cuisineCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([cuisine]) => cuisine);
      
      setPopularCuisines(sortedCuisines);

      const topRated = [...restaurantsRes.data]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);
      setTopRestaurants(topRated);

      const withOffers = restaurantsRes.data
        .filter((_, index) => index % 3 === 0)
        .slice(0, 6);
      setOfferRestaurants(withOffers);

      setFeaturedCollections([
        { id: 1, name: 'Trending Now', icon: '🔥', color: 'orange' },
        { id: 2, name: 'New Arrivals', icon: '🆕', color: 'blue' },
        { id: 3, name: 'Best Offers', icon: '🏷️', color: 'red' },
        { id: 4, name: 'Quick Delivery', icon: '⚡', color: 'purple' },
        { id: 5, name: 'Pure Veg', icon: '🌱', color: 'green' },
        { id: 6, name: 'Premium', icon: '👑', color: 'amber' },
      ]);

    } catch (err) {
      setError('Could not fetch restaurants. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyRestaurants = async () => {
    if (!userLocation && !selectedCity) {
      alert('Please enable location or select a city to find nearby restaurants');
      return;
    }

    try {
      setLoading(true);
      
      const params = {
        maxDistance: 5000
      };

      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }
      
      if (selectedCity) {
        params.city = selectedCity;
      }

      const response = await axios.get(`${VITE_API_URL}/api/restaurants/nearby`, { params });
      setNearbyRestaurants(response.data);
      setFilteredRestaurants(response.data);
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err);
      setFilteredRestaurants(restaurants);
    } finally {
      setLoading(false);
    }
  };

  const searchRestaurants = async (query) => {
    if (!query) {
      applyAllFilters();
      return;
    }

    try {
      const response = await axios.get(`${VITE_API_URL}/api/restaurants/search`, {
        params: { query }
      });
      setFilteredRestaurants(response.data);
    } catch (err) {
      console.error('Search error:', err);
      applyAllFilters();
    }
  };

  const filterByCuisine = async (cuisine) => {
    setSelectedCuisine(cuisine);
    if (!cuisine) {
      applyAllFilters();
      return;
    }

    try {
      const response = await axios.get(`${VITE_API_URL}/api/restaurants/cuisine`, {
        params: { cuisine }
      });
      setFilteredRestaurants(response.data);
    } catch (err) {
      console.error('Filter error:', err);
      applyAllFilters();
    }
  };

  const applyAllFilters = () => {
    let result = [...restaurants];

    if (selectedCity) {
      result = result.filter(r => 
        r.location?.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (searchTerm) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCuisine) {
      result = result.filter(r => 
        r.cuisine?.some(c => c.toLowerCase().includes(selectedCuisine.toLowerCase()))
      );
    }

    if (ratingFilter > 0) {
      result = result.filter(r => (r.rating || 0) >= ratingFilter);
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'low') {
        result = result.filter(r => (r.avgPrice || 200) <= 300);
      } else if (priceFilter === 'medium') {
        result = result.filter(r => (r.avgPrice || 200) > 300 && (r.avgPrice || 200) <= 600);
      } else if (priceFilter === 'high') {
        result = result.filter(r => (r.avgPrice || 200) > 600);
      }
    }

    if (vegFilter === 'veg') {
      result = result.filter(r => r.isVeg === true);
    } else if (vegFilter === 'non-veg') {
      result = result.filter(r => r.isVeg === false);
    }

    result = result.filter(r => (r.avgPrice || 200) <= maxPrice);

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => (a.avgPrice || 0) - (b.avgPrice || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0));
    } else if (sortBy === 'delivery-time') {
      result.sort((a, b) => (a.deliveryTime || 30) - (b.deliveryTime || 30));
    }

    setFilteredRestaurants(result);
  };

  useEffect(() => {
    applyAllFilters();
  }, [searchTerm, selectedCuisine, ratingFilter, priceFilter, sortBy, selectedCity, vegFilter, maxPrice, restaurants]);

  useEffect(() => {
    if (activeTab === 'nearby') {
      fetchNearbyRestaurants();
    } else if (activeTab === 'all') {
      setFilteredRestaurants(restaurants);
    } else if (activeTab === 'offers') {
      setFilteredRestaurants(offerRestaurants);
    } else if (activeTab === 'top-rated') {
      setFilteredRestaurants(topRestaurants);
    }
  }, [activeTab]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const RestaurantCard = ({ restaurant }) => {
    const distance = userLocation && restaurant.location?.latitude && restaurant.location?.longitude
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.location.latitude,
          restaurant.location.longitude
        ).toFixed(1)
      : null;

    const offers = [
      { text: '50% off up to ₹100', code: 'WELCOME50' },
      { text: 'Free delivery', code: 'FREEDEL' },
      { text: '20% off on first order', code: 'FIRST20' },
    ];
    const randomOffer = offers[Math.floor(Math.random() * offers.length)];

    return (
      <Link 
        to={`/restaurant/${restaurant._id}`} 
        className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={restaurant.image || `https://source.unsplash.com/400x300/?food,${restaurant.cuisine?.[0] || 'restaurant'}`} 
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{restaurant.rating || (4 + Math.random()).toFixed(1)}</span>
            </div>
            {distance && (
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                <Navigation size={12} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">{distance} km</span>
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <button 
            className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <Heart size={16} className="text-gray-600 hover:text-red-500" />
          </button>

          {/* Pure Veg Badge */}
          {restaurant.isVeg && (
            <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-lg shadow-lg">
              🌱 Pure Veg
            </div>
          )}

          {/* Offer Badge */}
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Percent size={12} />
            {randomOffer.text}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-orange-500 transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {restaurant.cuisine?.join(', ') || 'Various Cuisines'}
          </p>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock size={14} className="text-gray-400" />
              <span>{(restaurant.deliveryTime || 25) + Math.floor(Math.random() * 15)}-{(restaurant.deliveryTime || 25) + 15 + Math.floor(Math.random() * 15)} min</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <IndianRupee size={14} className="text-gray-400" />
              <span>₹{(restaurant.avgPrice || 200)} for two</span>
            </div>
          </div>

          {restaurant.location?.area && (
            <p className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={12} />
              {restaurant.location.area}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Artistic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-yellow-100/10 to-orange-100/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Food<span className="text-orange-500">Delight</span>
              </span>
            </Link>

            {/* Location Selector */}
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <MapPin size={18} className="text-orange-500" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none"
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search for restaurants, cuisines, or dishes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition-all"
                />
                {searchTerm && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border transition-all ${
                  showFilters 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
            
{/* Add View Receipt Button - For demo purposes, you can link to a sample order */}
<button
  onClick={(e) => {
    e.preventDefault();
    // For demo, navigate to a sample order receipt
    // In production, this would navigate to a specific order
    navigate('/orders');
  }}
  className="mt-3 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
>
  <FileText size={14} />
  View Sample Receipt
</button>
            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link to={`/profile/${user._id}`} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 p-0.5">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">{user.name}</span>
                </Link>
              ) : (
                <>
                  <Link 
                    to="/customer-login" 
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/customer-register" 
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl hover:shadow-lg transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Location Selector */}
          <div className="md:hidden mt-3 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <MapPin size={18} className="text-orange-500" />
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none"
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-left">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Filter Restaurants</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Sort By */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Sort By</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['relevance', 'rating', 'delivery-time', 'price-low', 'price-high'].map(option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 py-2 text-sm rounded-xl capitalize transition-all ${
                        sortBy === option
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisines */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Cuisines</h4>
                <div className="flex flex-wrap gap-2">
                  {popularCuisines.map(cuisine => (
                    <button
                      key={cuisine}
                      onClick={() => filterByCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        selectedCuisine === cuisine
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Rating</h4>
                <div className="flex gap-2">
                  {[4.5, 4.0, 3.5, 3.0].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
                      className={`flex-1 px-3 py-2 text-sm rounded-xl flex items-center justify-center gap-1 transition-all ${
                        ratingFilter === rating
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rating}+ <Star size={12} className={ratingFilter === rating ? 'fill-white' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Price Range</h4>
                <div className="space-y-2">
                  {['low', 'medium', 'high'].map(price => (
                    <button
                      key={price}
                      onClick={() => setPriceFilter(priceFilter === price ? 'all' : price)}
                      className={`w-full px-3 py-2 text-sm rounded-xl flex items-center justify-between transition-all ${
                        priceFilter === price
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="capitalize">{price}</span>
                      <span className="text-xs opacity-75">
                        {price === 'low' && 'Under ₹300'}
                        {price === 'medium' && '₹300 - ₹600'}
                        {price === 'high' && 'Above ₹600'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preferences */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Dietary Preferences</h4>
                <div className="flex gap-2">
                  {['veg', 'non-veg'].map(type => (
                    <button
                      key={type}
                      onClick={() => setVegFilter(vegFilter === type ? 'all' : type)}
                      className={`flex-1 px-3 py-2 text-sm rounded-xl capitalize transition-all ${
                        vegFilter === type
                          ? type === 'veg' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'veg' ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price Slider */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Maximum Price (for two)</h4>
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₹100</span>
                    <span className="font-medium text-orange-500">₹{maxPrice}</span>
                    <span>₹2000</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button 
                onClick={() => {
                  setSelectedCuisine('');
                  setRatingFilter(0);
                  setPriceFilter('all');
                  setSortBy('relevance');
                  setVegFilter('all');
                  setMaxPrice(1000);
                }}
                className="w-full py-3 text-sm font-medium text-orange-500 border-2 border-orange-500 rounded-xl hover:bg-orange-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Food Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {foodCategories.map(category => (
            <button 
              key={category.id}
              onClick={() => filterByCuisine(category.name)}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-${category.color}-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Collections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Collections</h2>
          <Link to="/collections" className="flex items-center gap-1 text-orange-500 hover:text-orange-600">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredCollections.map(collection => (
            <div 
              key={collection.id} 
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl p-4 text-center cursor-pointer transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${collection.color}-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                {collection.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{collection.name}</h3>
              <p className="text-xs text-gray-500">Discover new favorites</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'nearby', label: 'Nearby', icon: Navigation },
              { id: 'top-rated', label: 'Top Rated', icon: TrendingUp },
              { id: 'offers', label: 'Offers', icon: Percent },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort and View */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:border-orange-300 transition-colors"
              >
                <Sparkles size={16} className="text-orange-500" />
                Sort by: {sortBy.replace('-', ' ')}
                <ChevronDown size={16} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-10 animate-fade-in">
                  {['relevance', 'rating', 'delivery-time', 'price-low', 'price-high'].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-50 transition-colors ${
                        sortBy === option ? 'text-orange-500 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-md' : 'text-gray-500'
                }`}
              >
                <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                  <div className={`w-2 h-2 rounded-sm ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                  <div className={`w-2 h-2 rounded-sm ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                  <div className={`w-2 h-2 rounded-sm ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                  <div className={`w-2 h-2 rounded-sm ${viewMode === 'grid' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-md' : 'text-gray-500'
                }`}
              >
                <List size={20} className={viewMode === 'list' ? 'text-orange-500' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {activeTab === 'all' && 'All Restaurants'}
            {activeTab === 'nearby' && 'Restaurants Near You'}
            {activeTab === 'top-rated' && 'Top Rated Restaurants'}
            {activeTab === 'offers' && 'Best Offers For You'}
          </h2>
          <p className="text-sm text-gray-500">
            {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
            {selectedCity && ` in ${selectedCity}`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 animate-pulse">Finding the best restaurants for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map(restaurant => (
                  <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredRestaurants.map(restaurant => {
                  const distance = userLocation && restaurant.location?.latitude && restaurant.location?.longitude
                    ? calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        restaurant.location.latitude,
                        restaurant.location.longitude
                      ).toFixed(1)
                    : null;

                  return (
                    <Link 
                      to={`/restaurant/${restaurant._id}`} 
                      key={restaurant._id} 
                      className="group block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-48 h-48 sm:h-auto overflow-hidden">
                          <img 
                            src={restaurant.image || `https://source.unsplash.com/200x200/?food,${restaurant.cuisine?.[0]}`} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">
                                {restaurant.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {restaurant.cuisine?.join(' • ')} • ₹{(restaurant.avgPrice || 200)} for two
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                              <Star size={16} className="fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-gray-700">{restaurant.rating || (4 + Math.random()).toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Info Row */}
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Timer size={16} className="text-gray-400" />
                              <span>{(restaurant.deliveryTime || 25) + Math.floor(Math.random() * 15)}-{(restaurant.deliveryTime || 25) + 15 + Math.floor(Math.random() * 15)} min</span>
                            </div>
                            {distance && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Navigation size={16} className="text-gray-400" />
                                <span>{distance} km</span>
                              </div>
                            )}
                            {restaurant.location?.area && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{restaurant.location.area}</span>
                              </div>
                            )}
                          </div>

                          {/* Offers */}
                          <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-50 px-3 py-2 rounded-xl">
                            <Percent size={16} />
                            <span>50% off up to ₹100 • Free delivery • 20% off on first order</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="hidden sm:flex items-center pr-6">
                          <ChevronRight size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {filteredRestaurants.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No restaurants found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCuisine('');
                    setRatingFilter(0);
                    setPriceFilter('all');
                    setActiveTab('all');
                    setVegFilter('all');
                    setMaxPrice(1000);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">About FoodDelight</h4>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                  <li key={item}>
                    <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">For Restaurants</h4>
              <ul className="space-y-2">
                {['Partner With Us', 'Apps For Business'].map(item => (
                  <li key={item}>
                    <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Learn More</h4>
              <ul className="space-y-2">
                {['Privacy', 'Security', 'Terms', 'Sitemap'].map(item => (
                  <li key={item}>
                    <Link to={`/${item.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact Us</h4>
              <ul className="space-y-2">
                {['Help & Support', 'Partner Support'].map(item => (
                  <li key={item}>
                    <Link to={`/${item.toLowerCase().replace(' & ', '-').replace(' ', '-')}`} className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FoodDelight. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerHomePage;