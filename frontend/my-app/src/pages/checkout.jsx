import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  MapPin,
  ChevronLeft,
  CreditCard,
  Truck,
  Wallet,
  Clock,
  Shield,
  IndianRupee,
  Plus,
  Minus,
  X,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Home,
  Building,
  Briefcase,
  Star,
  Info,
  Lock,
  Sparkles,
  Gift,
  Percent,
  Award,
  Bike,
  Utensils,
  BadgePercent,
  Loader2
} from 'lucide-react';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurantId, restaurant, cart, total, itemCount } = location.state || {};

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // User and addresses
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    address: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    phone: '',
    instructions: ''
  });

  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [upiApps, setUpiApps] = useState([
    { id: 'gpay', name: 'Google Pay', icon: '📱' },
    { id: 'phonepe', name: 'PhonePe', icon: '📲' },
    { id: 'paytm', name: 'Paytm', icon: '💰' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🏦' }
  ]);
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // Order timing
  const [deliveryTime, setDeliveryTime] = useState('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryTimes] = useState([
    { id: 'now', label: 'Now', time: '30-40 min' },
    { id: 'later', label: 'Schedule', time: 'Pick later time' }
  ]);

  // Coupons and offers
  const [availableCoupons, setAvailableCoupons] = useState([
    {
      id: 1,
      code: 'WELCOME50',
      description: '50% off up to ₹100',
      minOrder: 199,
      validUntil: '2024-12-31',
      applicable: true
    },
    {
      id: 2,
      code: 'FIRSTORDER',
      description: 'Free delivery on first order',
      minOrder: 0,
      validUntil: '2024-12-31',
      applicable: true
    },
    {
      id: 3,
      code: 'SAVE20',
      description: '20% off on orders above ₹500',
      minOrder: 500,
      validUntil: '2024-12-31',
      applicable: total >= 500
    }
  ]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);

  // Donation option
  const [donateToCharity, setDonateToCharity] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);

  // Calculate totals
  const [subtotal, setSubtotal] = useState(total || 0);
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [packagingFee, setPackagingFee] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!restaurant || !cart || Object.keys(cart).length === 0) {
      navigate('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.addresses && parsedUser.addresses.length > 0) {
        setAddresses(parsedUser.addresses);
        setSelectedAddress(parsedUser.addresses[0]);
        setNewAddress(prev => ({
          ...prev,
          phone: parsedUser.phone || ''
        }));
      }
    }

    calculateTotals();
  }, [restaurant, cart, navigate]);

  useEffect(() => {
    calculateTotals();
  }, [subtotal, appliedCoupon, donateToCharity, donationAmount]);

  const calculateTotals = () => {
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.code === 'WELCOME50') {
        discountAmount = Math.min(subtotal * 0.5, 100);
      } else if (appliedCoupon.code === 'SAVE20') {
        discountAmount = subtotal * 0.2;
      }
    }

    const taxAmount = subtotal * 0.05; // 5% GST
    setTax(taxAmount);
    setDiscount(discountAmount);
    
    const donation = donateToCharity ? donationAmount : 0;
    const finalTotal = subtotal + deliveryFee + packagingFee + taxAmount + donation - discountAmount;
    setGrandTotal(finalTotal);
  };

  const handleApplyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      if (coupon.minOrder <= subtotal) {
        setAppliedCoupon(coupon);
        setCouponError('');
        setShowCoupons(false);
      } else {
        setCouponError(`Minimum order of ₹${coupon.minOrder} required`);
      }
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = Object.values(cart).map(item => ({
        dishId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      }));

      const orderData = {
        restaurantId,
        restaurantName: restaurant?.name,
        items: orderItems,
        totalAmount: grandTotal,
        subtotal,
        deliveryFee,
        packagingFee,
        tax,
        discount,
        appliedCoupon: appliedCoupon?.code,
        deliveryAddress: selectedAddress,
        paymentMethod,
        paymentDetails: paymentMethod === 'upi' ? selectedUpiApp : cardDetails,
        deliveryTime: deliveryTime === 'now' ? 'ASAP' : scheduledTime,
        instructions: selectedAddress.instructions,
        orderType: 'delivery',
        donation: donateToCharity ? donationAmount : 0
      };

      const response = await axios.post(
        `${VITE_API_URL}/api/orders/create`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrderId(response.data.orderId || response.data._id);
      setSuccess(true);
      localStorage.removeItem(`cart_${restaurantId}`);
      
      // Simulate payment processing
      setTimeout(() => {
        setStep(4);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = () => {
    const addressObj = {
      id: Date.now().toString(),
      type: newAddress.type,
      address: newAddress.address,
      landmark: newAddress.landmark,
      area: newAddress.area,
      city: newAddress.city,
      pincode: newAddress.pincode,
      phone: newAddress.phone,
      instructions: newAddress.instructions,
      fullAddress: `${newAddress.address}, ${newAddress.landmark ? newAddress.landmark + ', ' : ''}${newAddress.area}, ${newAddress.city} - ${newAddress.pincode}`
    };

    setAddresses([...addresses, addressObj]);
    setSelectedAddress(addressObj);
    setShowAddressForm(false);
    setNewAddress({
      type: 'home',
      address: '',
      landmark: '',
      area: '',
      city: '',
      pincode: '',
      phone: user?.phone || '',
      instructions: ''
    });
  };

  const getAddressIcon = (type) => {
    switch(type) {
      case 'home': return <Home size={18} />;
      case 'work': return <Briefcase size={18} />;
      default: return <Building size={18} />;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Placed! 🎉</h2>
          <p className="text-gray-600 mb-6">Your order has been confirmed</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-2">Order ID</p>
            <p className="text-lg font-mono font-bold text-gray-800">{orderId || 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-600">Estimated delivery: 30-40 minutes</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Truck size={16} className="text-gray-400" />
              <span className="text-gray-600">Delivery to: {selectedAddress?.area || 'Your address'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {['Cart', 'Address', 'Payment', 'Confirm'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                  ${step > index + 1 ? 'bg-green-500 text-white' : 
                    step === index + 1 ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg scale-110' : 
                    'bg-gray-200 text-gray-500'}`}>
                  {step > index + 1 ? <CheckCircle size={18} /> : index + 1}
                </div>
                <span className={`text-xs mt-2 ${step === index + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {index < 3 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                  step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Cart Review */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-orange-500" />
                  Your Order
                </h2>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {Object.values(cart).map(item => (
                    <div key={item._id} className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                      <img 
                        src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Qty: {item.quantity}</p>
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 bg-white p-2 rounded-lg">
                            📝 {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Continue to Address
                </button>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-orange-500" />
                  Delivery Address
                </h2>

                {!showAddressForm ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {addresses.map(address => (
                        <div
                          key={address.id}
                          onClick={() => setSelectedAddress(address)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedAddress?.id === address.id
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${
                                selectedAddress?.id === address.id ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {getAddressIcon(address.type)}
                              </div>
                              <span className="text-xs font-medium capitalize bg-gray-200 px-2 py-1 rounded-full">
                                {address.type}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-1 hover:bg-white rounded-lg">
                                <Edit size={14} className="text-gray-400" />
                              </button>
                              <button className="p-1 hover:bg-white rounded-lg">
                                <Trash2 size={14} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 pl-8">{address.fullAddress || address.address}</p>
                          <p className="text-xs text-gray-500 mt-1 pl-8">📞 {address.phone}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                      <Plus size={18} />
                      Add New Address
                    </button>

                    <button
                      onClick={() => setStep(3)}
                      disabled={!selectedAddress}
                      className={`w-full py-3 rounded-xl font-medium transition-all ${
                        selectedAddress
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Continue to Payment
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Add New Address</h3>
                    
                    <div className="flex gap-2 mb-4">
                      {['home', 'work', 'other'].map(type => (
                        <button
                          key={type}
                          onClick={() => setNewAddress({...newAddress, type})}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                            newAddress.type === type
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type === 'home' && <Home size={14} className="inline mr-1" />}
                          {type === 'work' && <Briefcase size={14} className="inline mr-1" />}
                          {type === 'other' && <Building size={14} className="inline mr-1" />}
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Address"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                        className="col-span-2 p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <input
                        type="text"
                        placeholder="Landmark"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                        className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <input
                        type="text"
                        placeholder="Area"
                        value={newAddress.area}
                        onChange={(e) => setNewAddress({...newAddress, area: e.target.value})}
                        className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                        className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                        className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                        className="col-span-2 p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <textarea
                        placeholder="Delivery instructions (optional)"
                        value={newAddress.instructions}
                        onChange={(e) => setNewAddress({...newAddress, instructions: e.target.value})}
                        rows="2"
                        className="col-span-2 p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAddress}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Save Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-orange-500" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* UPI Option */}
                  <div className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'online' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-3" onClick={() => setPaymentMethod('online')}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'online' ? 'border-orange-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'online' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                      </div>
                      <Wallet size={20} className="text-gray-600" />
                      <span className="font-medium">UPI / Online Payment</span>
                    </div>

                    {paymentMethod === 'online' && (
                      <div className="pl-8 mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {upiApps.map(app => (
                            <button
                              key={app.id}
                              onClick={() => setSelectedUpiApp(app.id)}
                              className={`p-3 border rounded-xl text-center transition-all ${
                                selectedUpiApp === app.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <span className="text-2xl mb-1 block">{app.icon}</span>
                              <span className="text-xs">{app.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter UPI ID"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Payment */}
                  <div className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-3" onClick={() => setPaymentMethod('card')}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'card' ? 'border-orange-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'card' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                      </div>
                      <CreditCard size={20} className="text-gray-600" />
                      <span className="font-medium">Credit / Debit Card</span>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="pl-8 mt-3 space-y-3">
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        />
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                            className="p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash on Delivery */}
                  <div className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}>
                    <div className="flex items-center gap-3" onClick={() => setPaymentMethod('cod')}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod' ? 'border-orange-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cod' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                      </div>
                      <IndianRupee size={20} className="text-gray-600" />
                      <span className="font-medium">Cash on Delivery</span>
                      <span className="text-xs text-gray-500 ml-auto">Pay when you receive</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Review Order
                </button>
              </div>
            )}

            {/* Step 4: Order Confirmation */}
            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  Review Your Order
                </h2>

                {/* Delivery Details Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <MapPin size={18} className="text-blue-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivering to</p>
                      <p className="text-sm font-medium">{selectedAddress?.fullAddress || selectedAddress?.address}</p>
                      <p className="text-xs text-gray-500 mt-1">📞 {selectedAddress?.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                    <Clock size={18} className="text-green-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivery Time</p>
                      <p className="text-sm font-medium">30-40 minutes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                    <CreditCard size={18} className="text-purple-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                      <p className="text-sm font-medium capitalize">
                        {paymentMethod === 'online' ? `UPI (${selectedUpiApp})` : 
                         paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.values(cart).map(item => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order • ₹${grandTotal.toFixed(2)}`
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                  <Lock size={12} />
                  Your payment information is secure
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>

              {/* Restaurant Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <img 
                  src={restaurant?.image || 'https://source.unsplash.com/200x200/?restaurant'}
                  alt={restaurant?.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">{restaurant?.name}</p>
                  <p className="text-xs text-gray-500">{itemCount} items</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Packaging Fee</span>
                  <span className="font-medium">₹{packagingFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST)</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                {donateToCharity && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Donation</span>
                    <span>+₹{donationAmount}</span>
                  </div>
                )}
              </div>

              {/* Coupon Section */}
              <div className="mb-4">
                <button
                  onClick={() => setShowCoupons(!showCoupons)}
                  className="w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center justify-between text-purple-600 hover:shadow-md transition-all"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <BadgePercent size={16} />
                    {appliedCoupon ? `Applied: ${appliedCoupon.code}` : 'Apply Coupon'}
                  </span>
                  <ChevronLeft size={16} className={`transform transition-transform ${showCoupons ? '-rotate-90' : 'rotate-0'}`} />
                </button>

                {showCoupons && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 p-2 text-sm border border-gray-200 rounded-xl focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500">{couponError}</p>
                    )}

                    <div className="space-y-2">
                      {availableCoupons.map(coupon => (
                        <div
                          key={coupon.id}
                          onClick={() => {
                            setCouponCode(coupon.code);
                            handleApplyCoupon();
                          }}
                          className={`p-3 border rounded-xl cursor-pointer transition-all ${
                            coupon.applicable 
                              ? 'border-green-200 bg-green-50 hover:border-green-400' 
                              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Gift size={14} className={coupon.applicable ? 'text-green-600' : 'text-gray-400'} />
                            <span className="font-mono font-bold text-sm">{coupon.code}</span>
                            {coupon.applicable && <span className="text-xs text-green-600 ml-auto">Available</span>}
                          </div>
                          <p className="text-xs text-gray-600">{coupon.description}</p>
                          <p className="text-xs text-gray-400 mt-1">Min. order: ₹{coupon.minOrder}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Donation Option */}
              <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donateToCharity}
                    onChange={(e) => setDonateToCharity(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Donate ₹10 to charity</p>
                    <p className="text-xs text-gray-500">Support local communities with every order</p>
                  </div>
                </label>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-orange-500">₹{grandTotal.toFixed(2)}</span>
              </div>

              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Shield size={12} className="text-green-500" />
                Secure payment. Your data is protected.
              </p>

              {/* Delivery Time Selection */}
              {step === 4 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                  <div className="flex gap-2">
                    {deliveryTimes.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setDeliveryTime(option.id)}
                        className={`flex-1 p-2 border rounded-xl text-sm transition-all ${
                          deliveryTime === option.id
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.time}</div>
                      </button>
                    ))}
                  </div>
                  {deliveryTime === 'later' && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full mt-2 p-2 border border-gray-200 rounded-xl text-sm"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;