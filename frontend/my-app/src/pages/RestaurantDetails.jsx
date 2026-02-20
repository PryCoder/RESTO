import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star,
  MapPin,
  ChevronLeft,
  Heart,
  Share2,
  Info,
  IndianRupee,
  Minus,
  Plus,
  ShoppingBag,
  Percent,
  Navigation,
  Bike,
  Shield,
  Award,
  X,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Utensils,
  Flame,
  ThumbsUp,
  MessageCircle,
  Truck,
  Wallet,
  Timer,
  TrendingUp,
  Award as AwardIcon,
  Medal,
  Crown
} from 'lucide-react';

const RestaurantDetailsPage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [trendingDishes, setTrendingDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vegFilter, setVegFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [orderType, setOrderType] = useState('delivery');
  const [dishLoading, setDishLoading] = useState(false);
  const [dishError, setDishError] = useState('');
  const [restaurantRating, setRestaurantRating] = useState(4.2);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [useDishesAsMenu, setUseDishesAsMenu] = useState(false);
  
  const navigate = useNavigate();
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchDishes();
    fetchTrendingDishes();
    fetchReviews();

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

    const savedCart = localStorage.getItem(`cart_${id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));

    if (user?.addresses && user.addresses.length > 0) {
      setDeliveryAddress(user.addresses[0].address);
    }
  }, [id, user]);

  // API: GET restaurant details
  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/restaurants/${id}`);
      
      // Handle different response structures
      const restaurantData = response.data.data || response.data;
      setRestaurant(restaurantData);
      
      if (restaurantData.menu && restaurantData.menu.length > 0) {
        setMenu(restaurantData.menu);
        setUseDishesAsMenu(false);
      }
    } catch (err) {
      setError('Could not fetch restaurant details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // API: GET all dishes from /api/orders/dishes
  const fetchDishes = async () => {
    setDishLoading(true);
    setDishError('');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `${VITE_API_URL}/api/orders/dishes`,
        { headers }
      );
      
      // Handle different response structures
      const dishesData = res.data.data || res.data;
      setDishes(dishesData);
      
      console.log('Fetched dishes:', dishesData);
      
      // For testing: If dishes exist but no restaurant menu, use dishes as menu
      // This is a temporary fix for your testing
      if (dishesData.length > 0) {
        // Check if any dish has a category
        const hasValidDishes = dishesData.some(dish => dish.name && dish.price);
        
        if (hasValidDishes) {
          console.log('Using dishes as menu items');
          setMenu(dishesData);
          setUseDishesAsMenu(true);
        }
      }
      
    } catch (err) {
      setDishError('Could not load dishes');
      console.error('Error fetching dishes:', err);
    } finally {
      setDishLoading(false);
    }
  };

  // API: Get trending dishes
  const fetchTrendingDishes = async () => {
    try {
      if (token) {
        const ordersRes = await axios.get(`${VITE_API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const ordersData = ordersRes.data.data || ordersRes.data;
        const dishCounts = {};
        
        ordersData.forEach(order => {
          order.items?.forEach(item => {
            dishCounts[item.name] = (dishCounts[item.name] || 0) + (item.quantity || 1);
          });
        });
        
        const trending = Object.entries(dishCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        
        setTrendingDishes(trending);
      }
    } catch (err) {
      console.error('Error fetching trending dishes:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const mockReviews = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        user: `Customer ${i + 1}`,
        rating: (4 + Math.random()).toFixed(1),
        comment: "Amazing food! Great ambiance and quick service. Will definitely visit again.",
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        likes: Math.floor(Math.random() * 50),
        avatar: `https://ui-avatars.com/api/?name=Customer+${i + 1}&background=6366f1&color=fff`,
        images: i % 4 === 0 ? ['/images/food1.jpg', '/images/food2.jpg'] : []
      }));
      setReviews(mockReviews);
      setTotalReviews(mockReviews.length);
      
      const avgRating = mockReviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / mockReviews.length;
      setRestaurantRating(avgRating.toFixed(1));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const addToCart = (item) => {
    const newCart = { ...cart };
    if (newCart[item._id]) {
      newCart[item._id].quantity += 1;
    } else {
      newCart[item._id] = {
        ...item,
        quantity: 1,
        specialInstructions: ''
      };
    }
    setCart(newCart);
    localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 animate-slide-in';
    notification.textContent = '✓ Added to cart';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const removeFromCart = (itemId) => {
    const newCart = { ...cart };
    if (newCart[itemId].quantity > 1) {
      newCart[itemId].quantity -= 1;
    } else {
      delete newCart[itemId];
    }
    setCart(newCart);
    localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
  };

  const updateSpecialInstructions = (itemId, instructions) => {
    const newCart = { ...cart };
    if (newCart[itemId]) {
      newCart[itemId].specialInstructions = instructions;
      setCart(newCart);
      localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
    }
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((count, item) => count + item.quantity, 0);
  };

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

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== id);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } else {
      favorites.push(id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    setIsFavorite(!isFavorite);
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      alert('Your cart is empty!');
      return;
    }
    if (!user) {
      alert('Please login to proceed to checkout');
      navigate('/customer-login');
      return;
    }
    navigate('/checkout', { 
      state: { 
        restaurantId: id,
        restaurant,
        cart,
        total: getCartTotal(),
        itemCount: getCartItemCount()
      } 
    });
  };

  const filterMenuItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.filter(item => {
      // Search filter
      if (searchTerm && item.name && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Veg/Non-veg filter
      if (vegFilter === 'veg' && item.isVeg === false) return false;
      if (vegFilter === 'non-veg' && item.isVeg === true) return false;
      
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular') return ((b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      return 0;
    });
  };

  // Get menu items - SIMPLIFIED for testing
  const menuItems = menu.length > 0 ? menu : [];
  
  // Get categories
  const getCategories = () => {
    if (menuItems.length === 0) return ['all'];
    
    const cats = menuItems
      .map(item => item.category || 'Uncategorized')
      .filter(category => category && typeof category === 'string');
    
    return ['all', ...new Set(cats)];
  };
  
  const categories = getCategories();

  const distance = userLocation && restaurant?.location?.coordinates
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0]
      ).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="text-gray-600 animate-pulse">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error || 'Restaurant not found'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Heart 
                  size={20} 
                  className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}
                />
              </button>
              <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Share2 size={20} className="text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        <img 
          src={restaurant.image || restaurant.coverImage || `https://source.unsplash.com/1200x400/?restaurant,${restaurant.cuisine?.[0] || 'food'}`} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.isVeg && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  🌱 Pure Veg
                </span>
              )}
              {restaurant.isPremium && (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-medium rounded-full">
                  ⭐ Premium
                </span>
              )}
              <span className={`px-3 py-1 ${isOpen ? 'bg-green-500' : 'bg-red-500'} text-white text-xs font-medium rounded-full`}>
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              {restaurant.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-200">
              {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(' • ') : restaurant.cuisine || 'Various Cuisines'}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rating</p>
              <p className="text-sm font-semibold text-gray-800">{restaurant.rating || restaurantRating} ({restaurant.totalReviews || totalReviews}+ ratings)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Timer size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Delivery Time</p>
              <p className="text-sm font-semibold text-gray-800">{restaurant.deliveryTime || 25}-40 min</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <IndianRupee size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cost for two</p>
              <p className="text-sm font-semibold text-gray-800">₹{restaurant.avgPrice || 300}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Navigation size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-semibold text-gray-800">{distance ? `${distance} km` : 'Available'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Dishes Section */}
      {trendingDishes.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={24} />
              <h2 className="text-xl font-bold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingDishes.map((dish, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && <Crown size={16} className="text-yellow-300" />}
                    {index === 1 && <Medal size={16} className="text-gray-300" />}
                    {index === 2 && <AwardIcon size={16} className="text-amber-600" />}
                    <span className="font-medium">{dish.name}</span>
                  </div>
                  <p className="text-sm opacity-90">{dish.count} orders today</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location and Offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setShowAddressModal(true)}
          >
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-orange-500 mt-1" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p className="text-sm text-gray-700">{deliveryAddress || 'Add delivery address'}</p>
                {!deliveryAddress && (
                  <p className="text-xs text-orange-500 mt-1">Click to add address</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-start gap-3">
              <Percent size={20} className="text-orange-500 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Available Offers</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white text-xs font-medium text-orange-500 rounded-full">50% off up to ₹100</span>
                  <span className="px-2 py-1 bg-white text-xs font-medium text-orange-500 rounded-full">Free delivery</span>
                  <span className="px-2 py-1 bg-white text-xs font-medium text-orange-500 rounded-full">20% off on first order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Type Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex gap-3 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setOrderType('delivery')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              orderType === 'delivery'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck size={16} />
            Delivery
          </button>
          <button
            onClick={() => setOrderType('pickup')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              orderType === 'pickup'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wallet size={16} />
            Pickup
          </button>
        </div>
      </div>

      {/* Quick Info Chips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm">
            <Bike size={16} />
            <span>Free delivery above ₹199</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm">
            <Shield size={16} />
            <span>Hygiene certified</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm">
            <Award size={16} />
            <span>Popular in {restaurant.address?.city || 'your area'}</span>
          </div>
        </div>
      </div>

      {/* Menu Section with Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Menu Header with Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Our Menu
                  {dishLoading && <span className="ml-2 text-sm font-normal text-gray-400 animate-pulse">(Loading...)</span>}
                  {useDishesAsMenu && menuItems.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-green-500 bg-green-50 px-2 py-1 rounded-full">
                      {menuItems.length} items available
                    </span>
                  )}
                </h2>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors sm:hidden"
                >
                  <Filter size={16} />
                  Filters
                </button>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search in menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full text-sm border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  />
                </div>
                
                <div className="hidden sm:flex gap-3">
                  <div className="relative">
                    <select 
                      value={vegFilter} 
                      onChange={(e) => setVegFilter(e.target.value)}
                      className="px-4 py-2 w-40 text-sm border border-gray-200 rounded-xl appearance-none focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    >
                      <option value="all">All Items</option>
                      <option value="veg">Veg Only</option>
                      <option value="non-veg">Non-Veg Only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    <option value="popular">Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Mobile Filters Panel */}
              {showFilters && (
                <div className="sm:hidden space-y-3 mt-3 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Veg/Non-Veg</label>
                    <select
                      value={vegFilter}
                      onChange={(e) => setVegFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                    >
                      <option value="all">All Items</option>
                      <option value="veg">Veg Only</option>
                      <option value="non-veg">Non-Veg Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                    >
                      <option value="popular">Popular</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex px-6">
                {categories.map(category => {
                  const categoryItems = menuItems.filter(item => 
                    category === 'all' ? true : (item.category || 'Uncategorized') === category
                  );
                  const filteredItems = filterMenuItems(categoryItems);
                  
                  if (filteredItems.length === 0 && category !== 'all') return null;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                      }}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
                        (selectedCategory === category || (category === 'all' && selectedCategory === 'all'))
                          ? 'border-orange-500 text-orange-500'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {category === 'all' ? 'All Items' : category}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto">
            {dishError && (
              <div className="text-center py-12 text-red-500">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p>{dishError}</p>
              </div>
            )}

            {menuItems.length === 0 && !dishLoading ? (
              <div className="text-center py-12">
                <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No menu items available</p>
              </div>
            ) : (
              (selectedCategory === 'all' ? categories.filter(c => c !== 'all') : [selectedCategory]).map(category => {
                const categoryItems = menuItems.filter(item => 
                  (item.category || 'Uncategorized') === category
                );
                const filteredItems = filterMenuItems(categoryItems);
                
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 capitalize">{category}</h3>
                    
                    <div className="space-y-4">
                      {filteredItems.map(item => (
                        <div key={item._id} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                          {/* Item Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {item.isVeg !== undefined && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  item.isVeg 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                                </span>
                              )}
                              {item.spicy && (
                                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Flame size={12} />
                                  Spicy
                                </span>
                              )}
                              {item.popular && (
                                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                                  <ThumbsUp size={12} />
                                  Popular
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                            )}
                            
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-gray-800">₹{item.price}</span>
                            </div>
                            
                            <button 
                              onClick={() => {
                                setSelectedDish(item);
                                setShowDishModal(true);
                              }}
                              className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
                            >
                              <Info size={14} />
                              View details
                            </button>
                          </div>

                          {/* Item Image and Add to Cart */}
                          <div className="relative">
                            <img 
                              src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`} 
                              alt={item.name}
                              className="w-24 h-24 rounded-xl object-cover"
                              onError={(e) => {
                                e.target.src = 'https://source.unsplash.com/200x200/?food';
                              }}
                            />
                            
                            {cart[item._id] ? (
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full shadow-lg border border-gray-200">
                                <button 
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-semibold w-6 text-center">
                                  {cart[item._id].quantity}
                                </span>
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => addToCart(item)}
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                              >
                                ADD
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Reviews</h2>
            <button 
              onClick={() => setShowReviews(!showReviews)}
              className="text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              {showReviews ? 'Show less' : 'View all reviews'}
            </button>
          </div>

          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center md:text-left">
              <div className="text-5xl font-bold text-gray-800 mb-2">{restaurant.rating || restaurantRating}</div>
              <div className="flex justify-center md:justify-start gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    size={20}
                    className={star <= Math.floor(restaurant.rating || restaurantRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">Based on {restaurant.totalReviews || totalReviews} ratings</p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-gray-600">{rating} star</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
                      style={{ width: `${Math.random() * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-gray-500">{Math.floor(Math.random() * 200)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          {showReviews && (
            <div className="space-y-4">
              {reviews.slice(0, 5).map(review => (
                <div key={review.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <img 
                    src={review.avatar} 
                    alt={review.user} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-800">{review.user}</h4>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{review.date}</p>
                    <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {review.images.map((img, idx) => (
                          <img key={idx} src={img} alt="Review" className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <button className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <MessageCircle size={12} />
                      Helpful ({review.likes})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dish Details Modal */}
      {showDishModal && selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img 
                src={selectedDish.image || `https://source.unsplash.com/400x300/?food,${selectedDish.name}`} 
                alt={selectedDish.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://source.unsplash.com/400x300/?food';
                }}
              />
              <button 
                onClick={() => setShowDishModal(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {selectedDish.isVeg !== undefined && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    selectedDish.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedDish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                  </span>
                )}
                {selectedDish.spicy && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">🌶️ Spicy</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedDish.name}</h3>
              {selectedDish.description && (
                <p className="text-gray-600 mb-4">{selectedDish.description}</p>
              )}
              
              {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-700">Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDish.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDish.dietary && selectedDish.dietary.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-700">Dietary Information</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDish.dietary.map((diet, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
                        {diet}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-gray-800">₹{selectedDish.price}</span>
                <button 
                  onClick={() => {
                    addToCart(selectedDish);
                    setShowDishModal(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Delivery Address</h3>
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
              
              {user?.addresses?.map((addr, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setDeliveryAddress(addr.address);
                    setShowAddressModal(false);
                  }}
                  className={`p-4 border rounded-xl mb-3 cursor-pointer transition-all ${
                    deliveryAddress === addr.address 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-800">{addr.address}</p>
                      <p className="text-xs text-gray-500 mt-1">{addr.type || 'Home'}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  navigate('/profile');
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                + Add New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div 
              onClick={() => setShowCart(!showCart)}
              className="p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <span className="font-medium">{getCartItemCount()} items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">₹{getCartTotal()}</span>
                {showCart ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            </div>

            {showCart && (
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="space-y-4 mb-4">
                  {Object.values(cart).map(item => (
                    <div key={item._id} className="flex gap-3">
                      <img 
                        src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`} 
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover"
                        onError={(e) => {
                          e.target.src = 'https://source.unsplash.com/200x200/?food';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">₹{item.price} x {item.quantity}</p>
                        
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.specialInstructions}
                          onChange={(e) => updateSpecialInstructions(item._id, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg mb-2 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        />
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RestaurantDetailsPage;