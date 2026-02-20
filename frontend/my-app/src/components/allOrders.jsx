// pages/CustomerAllOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  Home,
  Star,
  IndianRupee,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  Share2,
  Utensils,
  TrendingUp,
  Award,
  Bike,
  Percent,
  Coffee,
  Pizza,
  Sandwich,
  IceCream,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Receipt,
  CreditCard,
  Smartphone,
  Wallet,
  List,
  Grid3x3,
  Menu
} from 'lucide-react';

const CustomerAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    served: 0,
    paid: 0,
    cancelled: 0,
    totalSpent: 0
  });

  const navigate = useNavigate();
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserOrders(userData._id);
    } else {
      navigate('/customer-login');
    }
  }, []);

  const fetchUserOrders = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(
        `${VITE_API_URL}/api/orders/customer/${userId}`,
        { headers }
      );

      setOrders(response.data);
      setFilteredOrders(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      preparing: ordersData.filter(o => o.status === 'preparing').length,
      served: ordersData.filter(o => o.status === 'served').length,
      paid: ordersData.filter(o => o.status === 'paid').length,
      cancelled: ordersData.filter(o => o.status === 'cancelled').length,
      totalSpent: ordersData
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'today') {
          return orderDate >= today;
        } else if (dateFilter === 'week') {
          return orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, dateFilter, sortBy, orders]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'served': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={16} />;
      case 'preparing': return <Package size={16} />;
      case 'served': return <Truck size={16} />;
      case 'paid': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertCircle size={16} />;
      default: return <ShoppingBag size={16} />;
    }
  };

  const getStatusProgress = (status) => {
    const steps = ['pending', 'preparing', 'served', 'paid'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? (currentIndex + 1) * 25 : 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <Wallet size={16} />;
      case 'card': return <CreditCard size={16} />;
      case 'upi': return <Smartphone size={16} />;
      case 'online': return <Receipt size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  const OrderCard = ({ order }) => {
    const firstItem = order.items?.[0];
    const otherItemsCount = (order.items?.length || 1) - 1;
    const progress = getStatusProgress(order.status);

    return (
      <Link 
        to={`/order/${order._id}`}
        className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
      >
        {/* Restaurant Header */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-orange-500 to-pink-500 p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-white mb-1 truncate pr-2">
                {order.restaurant?.name || 'Restaurant'}
              </h3>
              <div className="flex items-center gap-1 text-white/90 text-xs sm:text-sm">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{order.restaurant?.location?.city || 'Delivery'}</span>
              </div>
            </div>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border-2 border-white/30 backdrop-blur-sm whitespace-nowrap ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-3 sm:p-4">
          {/* Items Preview */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            {firstItem && (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-orange-200 flex-shrink-0">
                <img 
                  src={firstItem.image || `https://source.unsplash.com/100x100/?food,${firstItem.name}`}
                  alt={firstItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${firstItem.name}&background=random`;
                  }}
                />
                {otherItemsCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    +{otherItemsCount}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-gray-800 truncate">
                {firstItem?.name || 'Order Items'}
                {otherItemsCount > 0 && ` and ${otherItemsCount} more`}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {/* Progress Bar - Hidden on very small screens */}
          <div className="hidden xs:block mb-3 sm:mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Placed</span>
              <span>Prep</span>
              <span>Served</span>
              <span>Done</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                <span className="whitespace-nowrap">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                {getPaymentIcon(order.paymentMethod)}
                <span className="capitalize hidden xs:inline">{order.paymentMethod}</span>
              </div>
            </div>
            <div className="flex items-center justify-between xs:justify-end gap-2">
              <div className="text-right">
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-bold text-orange-500 flex items-center text-sm sm:text-base">
                  <IndianRupee size={12} className="sm:hidden" />
                  <IndianRupee size={14} className="hidden sm:block" />
                  {order.totalAmount?.toLocaleString() || '0'}
                </div>
              </div>
              <ChevronRight size={16} className="sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const OrderListItem = ({ order }) => {
    const progress = getStatusProgress(order.status);

    return (
      <Link 
        to={`/order/${order._id}`}
        className="group block bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      >
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Restaurant Image */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img 
                  src={order.restaurant?.image || `https://source.unsplash.com/100x100/?restaurant`}
                  alt={order.restaurant?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${order.restaurant?.name}&background=random`;
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                    {order.restaurant?.name || 'Restaurant'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{order.restaurant?.location?.city || 'Delivery'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getPaymentIcon(order.paymentMethod)}
                    <span className="capitalize hidden xs:inline">{order.paymentMethod}</span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <span key={idx} className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded-lg">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                  {(order.items?.length || 0) > 2 && (
                    <span className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded-lg">
                      +{order.items.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg sm:text-xl font-bold text-gray-800 flex items-center sm:justify-end gap-1">
                <IndianRupee size={14} className="sm:hidden" />
                <IndianRupee size={16} className="hidden sm:block" />
                {order.totalAmount?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">Total Amount</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className={order.status !== 'cancelled' ? 'text-orange-500' : ''}>Placed</span>
              <span className={order.status === 'preparing' || order.status === 'served' || order.status === 'paid' ? 'text-orange-500' : ''}>Prep</span>
              <span className={order.status === 'served' || order.status === 'paid' ? 'text-orange-500' : ''}>Served</span>
              <span className={order.status === 'paid' ? 'text-green-500' : ''}>Done</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  order.status === 'cancelled' 
                    ? 'bg-red-500' 
                    : 'bg-gradient-to-r from-orange-500 to-pink-500'
                }`}
                style={{ width: order.status === 'cancelled' ? '100%' : `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const StatsCard = ({ label, value, color, bgColor }) => (
    <div className={`bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 ${color}`}>
      <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${bgColor}`}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Artistic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/" className="flex items-center gap-1 sm:gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                  <Utensils size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My<span className="text-orange-500">Orders</span>
                </span>
              </Link>
            </div>

            {/* Stats Pills - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-orange-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl">
                <span className="text-xs sm:text-sm text-gray-600">Total: </span>
                <span className="font-bold text-orange-500 text-sm sm:text-base">{stats.total}</span>
              </div>
              <div className="bg-green-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl">
                <span className="text-xs sm:text-sm text-gray-600">Spent: </span>
                <span className="font-bold text-green-500 text-sm sm:text-base">₹{stats.totalSpent.toLocaleString()}</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <Link to={`/profile/${user._id}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 p-0.5">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">{user.name}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Your Orders</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage all your food orders in one place.</p>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard label="Total" value={stats.total} color="border-orange-500" bgColor="text-gray-800" />
          <StatsCard label="Pending" value={stats.pending} color="border-yellow-500" bgColor="text-yellow-600" />
          <StatsCard label="Prep" value={stats.preparing} color="border-blue-500" bgColor="text-blue-600" />
          <StatsCard label="Served" value={stats.served} color="border-purple-500" bgColor="text-purple-600" />
          <StatsCard label="Done" value={stats.paid} color="border-green-500" bgColor="text-green-600" />
          <StatsCard label="Cancelled" value={stats.cancelled} color="border-red-500" bgColor="text-red-600" />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={14} className="sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center gap-2"
              >
                <Filter size={16} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Filter</span>
              </button>

              {/* Desktop Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`hidden lg:flex px-4 py-3 rounded-xl border transition-all items-center gap-2 ${
                  showFilters 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:border-orange-300 transition-colors flex items-center gap-1 sm:gap-2"
                >
                  <Sparkles size={14} className="sm:w-4 sm:h-4 text-orange-500" />
                  <span className="hidden xs:inline text-sm sm:text-base">Sort</span>
                  <ChevronDown size={12} className="sm:w-4 sm:h-4 transition-transform sm:ml-1" />
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 mt-2 w-36 sm:w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-10 animate-fade-in">
                    {['newest', 'oldest', 'highest', 'lowest'].map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm capitalize hover:bg-gray-50 transition-colors ${
                          sortBy === option ? 'text-orange-500 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white shadow-md' : 'text-gray-500'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-md' : 'text-gray-500'
                  }`}
                  aria-label="List view"
                >
                  <List size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showMobileFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="served">Served</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                    setSearchTerm('');
                    setShowMobileFilters(false);
                  }}
                  className="w-full px-4 py-2 text-orange-500 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Desktop Filters Panel */}
          {showFilters && (
            <div className="hidden lg:block mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="served">Served</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2 text-orange-500 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600 animate-pulse">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
            <AlertCircle size={36} className="sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-red-600 mb-3 sm:mb-4">{error}</p>
            <button
              onClick={() => fetchUserOrders(user?._id)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <RefreshCw size={14} className="sm:w-4 sm:h-4" />
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <ShoppingBag size={28} className="sm:w-10 sm:h-10 text-orange-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No orders found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? "Try adjusting your filters"
                : "You haven't placed any orders yet"}
            </p>
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setDateFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 text-white rounded-lg sm:rounded-xl hover:bg-orange-600 transition-colors text-sm sm:text-base"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2 text-sm sm:text-base"
              >
                <Home size={14} className="sm:w-4 sm:h-4" />
                Browse Restaurants
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-500">
                Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </p>
              <button
                onClick={() => fetchUserOrders(user?._id)}
                className="text-xs sm:text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <RefreshCw size={12} className="sm:w-3 sm:h-3" />
                Refresh
              </button>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {filteredOrders.map(order => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3 sm:space-y-4">
                {filteredOrders.map(order => (
                  <OrderListItem key={order._id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add custom breakpoint for extra small devices */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .xs\\:block {
            display: block;
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:inline {
            display: inline;
          }
        }

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

export default CustomerAllOrders;