import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import FaceRegistration from '../components/FaceRegistration';
import io from 'socket.io-client';
import { 
  FaUtensils, 
  FaMicrophone, 
  FaSignOutAlt, 
  FaCamera, 
  FaClock, 
  FaCheckCircle, 
  FaListAlt,
  FaTable,
  FaArrowRight,
  FaPlus,
  FaStar,
  FaSpinner,
  FaExclamationTriangle,
  FaInbox,
  FaCheck,
  FaTag,
  FaHashtag,
  FaEdit,
  FaPaperPlane,
  FaTimes,
  FaStop,
  FaReceipt,
  FaRedo,
  FaCrown,
  FaBolt,
  FaGem,
  FaShieldAlt,
  FaRocket
} from 'react-icons/fa';
import { 
  GiChefToque, 
  GiHotSpices,
  GiForkKnifeSpoon
} from 'react-icons/gi';

const SOCKET_URL = 'http://localhost:5000';

export default function WaiterDashboard() {
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [galleryModalDish, setGalleryModalDish] = useState(null);
  const [galleryOrderQty, setGalleryOrderQty] = useState('');
  const [galleryOrderMods, setGalleryOrderMods] = useState('');
  const [galleryOrderTableNo, setGalleryOrderTableNo] = useState('');
  const [galleryOrderSuccess, setGalleryOrderSuccess] = useState(false);
  const [galleryOrderError, setGalleryOrderError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [dishesError, setDishesError] = useState('');
  const navigate = useNavigate();
  const [voiceOrderModal, setVoiceOrderModal] = useState(false);
  const [voiceOrderTranscript, setVoiceOrderTranscript] = useState('');
  const [voiceOrderParsed, setVoiceOrderParsed] = useState(null);
  const [voiceOrderError, setVoiceOrderError] = useState('');
  const [voiceOrderLoading, setVoiceOrderLoading] = useState(false);
  const [voiceOrderConfirmStep, setVoiceOrderConfirmStep] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Enhanced fuzzy matching functions
  function levenshtein(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = [];
    for (let i = 0; i <= bn; ++i) matrix[i] = [i];
    for (let j = 0; j <= an; ++j) matrix[0][j] = j;
    for (let i = 1; i <= bn; ++i) {
      for (let j = 1; j <= an; ++j) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[bn][an];
  }

  function jaroWinkler(s1, s2) {
    const m = (s1, s2) => {
      let matches = 0, transpositions = 0;
      let s1Matches = Array(s1.length).fill(false);
      let s2Matches = Array(s2.length).fill(false);
      let matchWindow = Math.max(s1.length, s2.length) / 2 - 1;
      for (let i = 0; i < s1.length; i++) {
        let start = Math.max(0, i - matchWindow);
        let end = Math.min(i + matchWindow + 1, s2.length);
        for (let j = start; j < end; j++) {
          if (!s2Matches[j] && s1[i] === s2[j]) {
            s1Matches[i] = s2Matches[j] = true;
            matches++;
            break;
          }
        }
      }
      if (!matches) return 0;
      let k = 0;
      for (let i = 0; i < s1.length; i++) {
        if (s1Matches[i]) {
          while (!s2Matches[k]) k++;
          if (s1[i] !== s2[k]) transpositions++;
          k++;
        }
      }
      return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
    };
    let jw = m(s1, s2);
    let prefix = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    return jw + 0.1 * prefix * (1 - jw);
  }

  // Enhanced voice order parsing
  function parseVoiceOrder(transcript) {
    const wordToNum = w => {
      const map = {
        one: '1', won: '1', single: '1',
        two: '2', to: '2', too: '2', tu: '2', do: '2', du: '2',
        three: '3', tree: '3', free: '3',
        four: '4', for: '4',
        five: '5', fiv: '5',
        six: '6', sex: '6',
        seven: '7',
        eight: '8', ate: '8',
        nine: '9', nain: '9',
        ten: '10',
      };
      return map[w] || w;
    };

    const dishAliases = {
      rice: ['rise', 'rize', 'raice', 'rais'],
      chole: ['choley', 'chhole', 'sholay', 'sholey', 'chana', 'chana masala'],
      dal: ['daal', 'dahl', 'dall'],
      idli: ['idly', 'idlee', 'idlly'],
      dosa: ['dosha', 'dosa', 'dhosa'],
      samosa: ['samose', 'samosa', 'samosas'],
      roti: ['rotti', 'roty', 'roti', 'rooti'],
      chapati: ['chapathi', 'chapatti', 'chapati', 'chappati'],
      sabji: ['sabzi', 'sabji', 'sabjee', 'sabji'],
      paneer: ['paneer', 'panir', 'paneeer'],
      coke: ['coke', 'kok', 'coca', 'coca cola'],
      pepsi: ['pepsi', 'pepsie'],
      chai: ['chai', 'tea', 'chaay', 'chay'],
      coffee: ['coffee', 'cofee', 'kofi'],
      biryani: ['biryani', 'biriyani', 'biriani', 'briani'],
      curd: ['curd', 'dahi', 'yogurt'],
      butter: ['butter', 'buttar'],
      naan: ['naan', 'nan', 'naaan'],
      lassi: ['lassi', 'lasi', 'lassie'],
      thali: ['thali', 'thaali'],
      soup: ['soup', 'soop'],
      salad: ['salad', 'salad'],
      papad: ['papad', 'papadum', 'papadum'],
      pickle: ['pickle', 'achaar', 'achar'],
      gulab: ['gulab', 'gulaab'],
      jamun: ['jamun', 'jamoon', 'jammun'],
      rasgulla: ['rasgulla', 'rasgula', 'rasgoola'],
      rasmalai: ['rasmalai', 'rasmalay'],
      jalebi: ['jalebi', 'jaleebi'],
      icecream: ['ice cream', 'icecream', 'ice-cream', 'ice', 'cream'],
      vada: ['vada', 'wada', 'vadaa'],
      poha: ['poha', 'pohaa'],
      upma: ['upma', 'upmaa'],
      paratha: ['paratha', 'parantha', 'parota', 'parotta'],
      puri: ['puri', 'poori', 'poodi'],
      bhaji: ['bhaji', 'bhajji', 'bhajee'],
      pav: ['pav', 'pau', 'pow'],
      misal: ['misal', 'missal'],
      usal: ['usal', 'usal'],
      sambar: ['sambar', 'sambhar', 'sambaar'],
      chutney: ['chutney', 'chatni', 'chutni'],
      halwa: ['halwa', 'halva', 'haluaa'],
      kheer: ['kheer', 'khir', 'kheerr'],
      payasam: ['payasam', 'paysam', 'payasum'],
      rabri: ['rabri', 'rabdi', 'rabree'],
      shrikhand: ['shrikhand', 'shreekhand'],
      modak: ['modak', 'modhak'],
      ladoo: ['ladoo', 'laddu', 'laddoo'],
      barfi: ['barfi', 'burfi', 'barfee'],
      sandwich: ['sandwich', 'sandwitch'],
      burger: ['burger', 'burgar'],
      pizza: ['pizza', 'piza', 'pitsa'],
      fries: ['fries', 'fry', 'frize'],
      pasta: ['pasta', 'pasta'],
      maggi: ['maggi', 'maggie'],
      omelette: ['omelette', 'omlet', 'omlette'],
      egg: ['egg', 'eggs'],
      chicken: ['chicken', 'chiken', 'chikn'],
      mutton: ['mutton', 'matton'],
      fish: ['fish', 'fissh'],
      prawn: ['prawn', 'prawns'],
      shrimp: ['shrimp', 'shrimps'],
      crab: ['crab', 'krab'],
      veg: ['veg', 'vegetable', 'vegetarian'],
      nonveg: ['nonveg', 'non-veg', 'non vegetarian'],
      springroll: ['spring roll', 'springroll', 'spring rolls'],
      manchurian: ['manchurian', 'manchuriun'],
      momos: ['momos', 'momo', 'momos'],
      chowmein: ['chowmein', 'chow mein', 'chowmin'],
      cutlet: ['cutlet', 'katlet'],
      juice: ['juice', 'juce', 'jus'],
      shake: ['shake', 'sheikh', 'shak'],
      falooda: ['falooda', 'faluda'],
      kulfi: ['kulfi', 'kulfee'],
      milk: ['milk', 'milkk'],
      water: ['water', 'watter', 'vater'],
      soda: ['soda', 'sodha'],
      thumsup: ['thums up', 'thumbs up', 'thumsup'],
      sprite: ['sprite', 'spright'],
      fanta: ['fanta', 'fenta'],
      mirinda: ['mirinda', 'mirrinda'],
      dew: ['dew', 'du', 'do'],
      appy: ['appy', 'appie'],
      maaza: ['maaza', 'maja', 'maza'],
      slice: ['slice', 'slyce'],
      limca: ['limca', 'limka'],
      sting: ['sting', 'stink'],
      redbull: ['red bull', 'redbull'],
      monster: ['monster', 'monstor'],
      '7up': ['7up', 'seven up', 'sevenup'],
      mountain: ['mountain dew', 'mountain', 'mountain due'],
    };

    const aliasToDish = {};
    Object.entries(dishAliases).forEach(([main, arr]) => {
      arr.forEach(alias => { aliasToDish[alias] = main; });
      aliasToDish[main] = main;
    });

    let text = transcript.toLowerCase().replace(/\s+/g, ' ').trim();
    text = text.replace(/\b(please|thank you|can i get|i'd like|i would like|may i have|could i get|give me|get me|order for|for me|for us|for table|table for|table please|table number|table is|table no|table no\.|table no:|table:)\b/gi, '').trim();
    text = text.replace(/\b(one|won|single|two|to|too|tu|do|du|three|tree|free|four|for|five|fiv|six|sex|seven|eight|ate|nine|nain|ten)\b/g, m => wordToNum(m));

    let tableMatch = text.match(/(?:for|at|to|is|number)?\s*table\s*(\d+)/i) || text.match(/table\s*(\d+)/i);
    let table = tableMatch ? wordToNum(tableMatch[1]) : '';
    if (table) text = text.replace(/(?:for|at|to|is|number)?\s*table\s*\w+/i, '').trim();

    text = text.replace(/^(get|order|add|bring)\s+/g, '');
    let itemPhrases = text.split(/\band\b|,|\./).map(s => s.trim()).filter(Boolean);
    let items = [];

    for (let phrase of itemPhrases) {
      let m = phrase.match(/(\d+)\s+([\w\s]+)/) || phrase.match(/([\w\s]+)\s+(\d+)/);
      let name = '', qty = '1';
      if (m) {
        qty = m[1].match(/\d+/) ? m[1] : m[2];
        name = m[2] && m[2].match(/\d+/) ? m[1] : m[2];
      } else if (phrase) {
        name = phrase.trim();
        qty = '1';
      }

      let bestDish = null, bestScore = 0;
      let words = name.split(' ');
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length; j++) {
          let candidate = words.slice(i, j).join(' ');
          let dishKey = aliasToDish[candidate];
          if (dishKey) {
            bestDish = dishKey;
            bestScore = 1;
          } else {
            for (let alias in aliasToDish) {
              let jw = jaroWinkler(candidate, alias);
              let lev = levenshtein(candidate, alias);
              if (jw > bestScore || (jw === bestScore && lev < 3)) {
                bestScore = jw;
                bestDish = aliasToDish[alias];
              }
            }
          }
        }
      }
      if (bestDish) {
        items.push({
          name: bestDish,
          quantity: qty,
          modifications: []
        });
      } else if (name) {
        items.push({
          name: name,
          quantity: qty,
          modifications: []
        });
      }
    }

    let mods = [];
    let modRegex = /(no|extra|less|without|with)\s+([\w\s]+)/gi;
    let modMatch;
    while ((modMatch = modRegex.exec(transcript)) !== null) {
      mods.push(modMatch[0].trim());
    }

    if (items.length && mods.length) {
      items[items.length - 1].modifications = mods;
    }

    return { table, items };
  }

  // Enhanced voice order handling
  const handleStartVoiceOrder = () => {
    if (!browserSupportsSpeechRecognition) {
      setVoiceOrderError('Speech recognition is not supported in this browser.');
      return;
    }

    setVoiceOrderModal(true);
    setVoiceOrderTranscript('');
    setVoiceOrderParsed(null);
    setVoiceOrderError('');
    setVoiceOrderConfirmStep(false);
    resetTranscript();
    
    SpeechRecognition.startListening({ 
      continuous: true, 
      language: 'en-IN',
      interimResults: true
    });
  };

  const handleStopVoiceOrder = () => {
    SpeechRecognition.stopListening();
    setVoiceOrderTranscript(transcript);
    
    if (transcript && transcript.trim().length > 2) {
      try {
        const parsed = parseVoiceOrder(transcript);
        setVoiceOrderParsed(parsed);
        setVoiceOrderError('');
      } catch (error) {
        setVoiceOrderError('Failed to parse your order. Please try again.');
      }
    } else {
      setVoiceOrderError('No speech detected or input too short. Please try again.');
    }
  };

  const handleConfirmVoiceOrder = async () => {
    setVoiceOrderLoading(true);
    setVoiceOrderError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      let items = [];
      for (let item of voiceOrderParsed.items) {
        let bestDish = null;
        let bestScore = 1e9;
        for (let d of dishes) {
          let dist = levenshtein(item.name.toLowerCase(), d.name.toLowerCase());
          if (dist < bestScore) {
            bestScore = dist;
            bestDish = d;
          }
        }
        
        if (bestDish && (bestScore <= 2 || 
            bestDish.name.toLowerCase().includes(item.name.toLowerCase()) || 
            item.name.toLowerCase().includes(bestDish.name.toLowerCase()))) {
          items.push({
            dish: bestDish._id,
            name: bestDish.name,
            quantity: item.quantity,
            price: bestDish.price,
            modifications: item.modifications
          });
        }
      }

      if (!voiceOrderParsed.table || items.length === 0) {
        setVoiceOrderError('Could not parse table number or valid items. Please try again.');
        setVoiceOrderLoading(false);
        return;
      }

      const payload = {
        table: voiceOrderParsed.table,
        items
      };

      await axios.post('http://localhost:5000/api/orders/create', payload, { headers });
      setVoiceOrderLoading(false);
      setVoiceOrderModal(false);
      fetchOrders();
    } catch (err) {
      setVoiceOrderError('Failed to place order. Please try again.');
      setVoiceOrderLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:5000/api/orders', { headers });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDishes = async () => {
    setDishesLoading(true);
    setDishesError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:5000/api/orders/dishes', { headers });
      setDishes(res.data);
    } catch (err) {
      setDishesError('Could not load dishes');
    } finally {
      setDishesLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDishes();
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId);
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }

    const socket = io(SOCKET_URL);
    socket.on('order:new', (order) => {
      setOrders(prev => [...prev, order]);
    });
    socket.on('order:assigned', (order) => {
      setOrders(prev => [...prev, order]);
    });
    socket.on('order:update', (updatedOrder) => {
      setOrders(prev => prev.map(order => order._id === updatedOrder._id ? updatedOrder : order));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (voiceOrderParsed && voiceOrderParsed.items) {
      const unavailable = voiceOrderParsed.items.filter(item => {
        return !dishes.some(d => d.name.toLowerCase().includes(item.name.toLowerCase()));
      });
      if (unavailable.length > 0) {
        setVoiceOrderError('Unavailable dish(es): ' + unavailable.map(u => u.name).join(', '));
      } else {
        setVoiceOrderError('');
      }
    }
  }, [voiceOrderParsed, dishes]);

  const handleGalleryOrder = async (e) => {
    e.preventDefault();
    setGalleryOrderError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        table: galleryOrderTableNo,
        items: [
          {
            dish: galleryModalDish._id,
            name: galleryModalDish.name,
            quantity: galleryOrderQty,
            price: galleryModalDish.price,
            modifications: galleryOrderMods ? galleryOrderMods.split(',').map(m => m.trim()).filter(Boolean) : []
          }
        ]
      };
      await axios.post('http://localhost:5000/api/orders/create', payload, { headers });
      setGalleryOrderSuccess(true);
      setGalleryOrderQty('');
      setGalleryOrderMods('');
      setGalleryOrderTableNo('');
      fetchOrders();
      setTimeout(() => {
        setGalleryOrderSuccess(false);
        setGalleryModalDish(null);
      }, 2000);
    } catch (err) {
      setGalleryOrderError('Failed to place order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus }, { headers });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#6366f1';
      case 'served': return '#10b981';
      case 'paid': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'served';
      case 'served': return 'paid';
      default: return currentStatus;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'served' || o.status === 'paid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-satoshi w-full max-w-[1920px] mx-auto">
      {/* Custom Fonts and Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-clash {
          font-family: 'Clash Display', sans-serif;
        }
        
        .font-satoshi {
          font-family: 'Satoshi', sans-serif;
        }
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .pulse-dot {
          animation: pulse 1.5s infinite;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .premium-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .premium-gradient-reverse {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
        }
        
        .premium-border {
          border: 2px solid;
          border-image: linear-gradient(135deg, #667eea, #764ba2) 1;
        }
      `}</style>

      {/* Header */}
      <header className="glass-effect border-b border-white/10 shadow-2xl sticky top-0 z-50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <GiForkKnifeSpoon className="text-xl" />
            </button>

            {/* Title */}
            <div className="flex items-center flex-1 lg:flex-none">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-clash font-bold text-white flex items-center gap-3">
                <div className="p-3 rounded-2xl premium-gradient shadow-lg">
                  <GiChefToque className="text-white text-2xl" />
                </div>
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Waiter Dashboard
                </span>
                <div className="flex items-center gap-1 gold-gradient px-3 py-1 rounded-full text-xs font-inter font-bold">
                  <FaCrown className="text-amber-700" />
                  <span className="text-amber-900">PREMIUM</span>
                </div>
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-6 py-3 rounded-2xl font-semibold shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 group font-inter"
                onClick={() => setShowFaceRegistration(true)}
              >
                <FaCamera className="text-lg group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Register Face</span>
              </button>
              <button 
                className="premium-gradient hover:premium-gradient-reverse text-white px-4 sm:px-6 py-3 rounded-2xl font-semibold shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 group font-inter"
                onClick={handleStartVoiceOrder}
              >
                <FaMicrophone className="text-lg group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Voice Order</span>
                <FaBolt className="text-yellow-300 text-xs" />
              </button>
              <button 
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-3 rounded-2xl font-semibold shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 group font-inter"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="text-lg group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-white/10 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
                <FaClock className="text-xl sm:text-2xl text-blue-400" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-clash font-bold text-white">{activeOrders.length}</div>
            </div>
            <div className="text-white/80 font-inter font-semibold text-base sm:text-lg">Active Orders</div>
            <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 mt-3 rounded-full"></div>
          </div>
          
          <div className="glass-effect rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-white/10 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors duration-300">
                <FaCheckCircle className="text-xl sm:text-2xl text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-clash font-bold text-white">{completedOrders.length}</div>
            </div>
            <div className="text-white/80 font-inter font-semibold text-base sm:text-lg">Completed Today</div>
            <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 mt-3 rounded-full"></div>
          </div>
          
          <div className="glass-effect rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 border border-white/10 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                <FaListAlt className="text-xl sm:text-2xl text-purple-400" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-clash font-bold text-white">{dishes.length}</div>
            </div>
            <div className="text-white/80 font-inter font-semibold text-base sm:text-lg">Menu Items</div>
            <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500 mt-3 rounded-full"></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-effect rounded-3xl p-3 mb-8 w-full overflow-x-auto">
          <div className="flex space-x-3 min-w-max">
            <button 
              className={`flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-inter font-semibold transition-all duration-300 whitespace-nowrap group ${
                activeTab === 'menu' 
                  ? 'premium-gradient text-white shadow-2xl transform -translate-y-1' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('menu')}
            >
              <FaUtensils className={`text-lg ${activeTab === 'menu' ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
              <span>Menu</span>
            </button>
            <button 
              className={`flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-inter font-semibold transition-all duration-300 whitespace-nowrap group ${
                activeTab === 'orders' 
                  ? 'premium-gradient text-white shadow-2xl transform -translate-y-1' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FaClock className={`text-lg ${activeTab === 'orders' ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
              <span>Active Orders ({activeOrders.length})</span>
            </button>
            <button 
              className={`flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-inter font-semibold transition-all duration-300 whitespace-nowrap group ${
                activeTab === 'completed' 
                  ? 'premium-gradient text-white shadow-2xl transform -translate-y-1' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              <FaCheckCircle className={`text-lg ${activeTab === 'completed' ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
              <span>Completed ({completedOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="w-full">
            <h2 className="text-3xl sm:text-4xl font-clash font-bold text-white mb-8 flex items-center gap-4">
              <div className="p-3 sm:p-4 rounded-2xl premium-gradient shadow-lg">
                <GiHotSpices className="text-2xl text-white" />
              </div>
              <span>Our Premium Menu</span>
              <FaGem className="text-purple-400 text-xl" />
            </h2>
            
            {dishesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="glass-effect rounded-3xl overflow-hidden shadow-2xl animate-pulse">
                    <div className="h-48 sm:h-56 bg-white/10"></div>
                    <div className="p-4 sm:p-6">
                      <div className="h-6 bg-white/10 rounded mb-3"></div>
                      <div className="h-4 bg-white/10 rounded mb-4"></div>
                      <div className="h-7 bg-white/10 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dishesError ? (
              <div className="glass-effect rounded-3xl p-6 sm:p-8 text-center border border-red-400/20">
                <FaExclamationTriangle className="text-red-400 text-3xl sm:text-4xl mb-4 mx-auto" />
                <div className="text-red-300 font-inter font-semibold text-lg sm:text-xl">{dishesError}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {dishes.map(dish => (
                  <div 
                    key={dish._id} 
                    className="glass-effect rounded-3xl overflow-hidden shadow-2xl border border-white/10 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer group"
                    onClick={() => setGalleryModalDish(dish)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={dish.image || '/images/chef3.png'} 
                        alt={dish.name}
                        className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4">
                        <div className="premium-gradient text-white px-3 py-2 rounded-xl font-inter font-semibold text-sm shadow-lg flex items-center gap-1">
                          <FaTag className="text-xs" />
                          ₹{dish.price}
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <div className="gold-gradient text-amber-900 px-2 py-1 rounded-lg font-inter font-bold text-xs flex items-center gap-1">
                          <FaRocket className="text-xs" />
                          PREMIUM
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-clash font-bold text-white mb-3 line-clamp-1 group-hover:text-blue-200 transition-colors duration-300">{dish.name}</h3>
                      <p className="text-white/70 text-sm font-inter mb-4 line-clamp-2">{dish.description}</p>
                      <div className="flex items-center justify-between">
                        <button className="premium-gradient text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-inter font-semibold text-sm hover:premium-gradient-reverse transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
                          <FaPlus className="text-xs" />
                          Order Now
                        </button>
                        <div className="flex items-center gap-2 text-amber-400">
                          <FaStar className="text-sm" />
                          <span className="font-inter font-semibold text-sm">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Orders Tab */}
        {activeTab === 'orders' && (
          <div className="glass-effect rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 w-full">
            <h2 className="text-3xl sm:text-4xl font-clash font-bold text-white mb-8 flex items-center gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-blue-500/20 shadow-lg">
                <FaClock className="text-2xl text-blue-400" />
              </div>
              <span>Active Orders</span>
              <FaShieldAlt className="text-blue-400 text-xl" />
            </h2>
            
            {ordersLoading ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-blue-400 mb-4 mx-auto" />
                <div className="text-white/70 font-inter text-xl">Loading orders...</div>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <FaInbox className="text-6xl text-white/30 mb-6 mx-auto" />
                <div className="text-white/70 font-inter text-2xl">No active orders</div>
                <div className="text-white/50 font-inter text-lg mt-2">New orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-6">
                {[...new Set(activeOrders.map(o => o.table))].map(tableNo => {
                  const tableOrders = activeOrders.filter(o => o.table === tableNo);
                  let allItems = [];
                  tableOrders.forEach(order => {
                    order.items.forEach(item => {
                      allItems.push({ ...item, _orderId: order._id });
                    });
                  });

                  const groupedItems = [];
                  allItems.forEach(item => {
                    const key = item.name + '|' + (item.modifications ? item.modifications.join(',') : '');
                    const existing = groupedItems.find(i => i.key === key);
                    if (existing) {
                      existing.quantity += Number(item.quantity);
                    } else {
                      groupedItems.push({
                        key,
                        name: item.name,
                        modifications: item.modifications,
                        price: item.price,
                        quantity: Number(item.quantity)
                      });
                    }
                  });

                  const total = groupedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

                  return (
                    <div key={tableNo} className="bg-white/5 rounded-3xl p-4 sm:p-6 shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="premium-gradient text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-clash font-bold text-lg sm:text-xl flex items-center gap-3 shadow-lg">
                            <FaTable />
                            Table {tableNo}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {tableOrders.map(order => (
                            <div key={order._id} className="flex items-center gap-3">
                              <span 
                                className="px-3 sm:px-4 py-2 rounded-xl text-sm font-inter font-semibold border shadow-lg"
                                style={{
                                  backgroundColor: getStatusColor(order.status) + '20',
                                  color: getStatusColor(order.status),
                                  borderColor: getStatusColor(order.status) + '40'
                                }}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                              {order.status !== 'paid' && (
                                <button
                                  onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                                  className="premium-gradient text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-inter font-semibold hover:premium-gradient-reverse transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                  <FaArrowRight className="text-xs" />
                                  {getStatusLabel(getNextStatus(order.status))}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto rounded-2xl">
                        <table className="w-full min-w-full">
                          <thead>
                            <tr className="bg-white/10">
                              <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Item</th>
                              <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Qty</th>
                              <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Modifications</th>
                              <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Price</th>
                              <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedItems.map((item, idx) => (
                              <tr key={item.key + idx} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                                <td className="p-3 sm:p-4 font-inter font-semibold text-white text-base sm:text-lg">{item.name}</td>
                                <td className="p-3 sm:p-4 font-inter text-white/70 text-base sm:text-lg">{item.quantity}</td>
                                <td className="p-3 sm:p-4 font-inter text-white/50 text-xs sm:text-sm">
                                  {item.modifications && item.modifications.length > 0 ? item.modifications.join(', ') : '-'}
                                </td>
                                <td className="p-3 sm:p-4 font-inter font-semibold text-amber-400 text-base sm:text-lg">₹{item.price}</td>
                                <td className="p-3 sm:p-4 font-inter font-semibold text-amber-400 text-base sm:text-lg">₹{item.price * item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <div className="text-xl sm:text-2xl font-clash font-bold text-amber-400 bg-white/5 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl">
                          Total: ₹{total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === 'completed' && (
          <div className="glass-effect rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 w-full">
            <h2 className="text-3xl sm:text-4xl font-clash font-bold text-white mb-8 flex items-center gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/20 shadow-lg">
                <FaCheckCircle className="text-2xl text-emerald-400" />
              </div>
              <span>Completed Orders</span>
              <FaGem className="text-emerald-400 text-xl" />
            </h2>
            
            {completedOrders.length === 0 ? (
              <div className="text-center py-12">
                <FaCheck className="text-6xl text-white/30 mb-6 mx-auto" />
                <div className="text-white/70 font-inter text-2xl">No completed orders</div>
                <div className="text-white/50 font-inter text-lg mt-2">Completed orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-6">
                {completedOrders.map(order => (
                  <div key={order._id} className="bg-white/5 rounded-3xl p-4 sm:p-6 shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 text-emerald-400 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-clash font-bold text-lg sm:text-xl flex items-center gap-3 shadow-lg">
                          <FaTable />
                          Table {order.table}
                        </div>
                      </div>
                      <span 
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-inter font-semibold text-base sm:text-lg border shadow-lg"
                        style={{
                          backgroundColor: getStatusColor(order.status) + '20',
                          color: getStatusColor(order.status),
                          borderColor: getStatusColor(order.status) + '40'
                        }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-2xl">
                      <table className="w-full min-w-full">
                        <thead>
                          <tr className="bg-white/10">
                            <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Item</th>
                            <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Qty</th>
                            <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Price</th>
                            <th className="text-left p-3 sm:p-4 font-inter font-semibold text-white/80 text-base sm:text-lg">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                              <td className="p-3 sm:p-4 font-inter text-white text-base sm:text-lg">{item.name}</td>
                              <td className="p-3 sm:p-4 font-inter text-white/70 text-base sm:text-lg">{item.quantity}</td>
                              <td className="p-3 sm:p-4 font-inter text-amber-400 text-base sm:text-lg">₹{item.price}</td>
                              <td className="p-3 sm:p-4 font-inter font-semibold text-amber-400 text-base sm:text-lg">₹{item.price * item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <div className="text-xl sm:text-2xl font-clash font-bold text-amber-400 bg-white/5 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl">
                        Total: ₹{order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dish Order Modal */}
      {galleryModalDish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-scale-in">
            <form onSubmit={handleGalleryOrder} className="p-6 sm:p-8">
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <img 
                  src={galleryModalDish.image || '/images/chef3.png'} 
                  alt={galleryModalDish.name}
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-2xl sm:text-3xl font-clash font-bold text-white mb-2 flex items-center gap-3">
                    <FaUtensils className="text-blue-400" />
                    {galleryModalDish.name}
                  </h2>
                  <p className="text-2xl sm:text-3xl font-clash font-bold text-amber-400 flex items-center gap-2">
                    <FaTag />
                    ₹{galleryModalDish.price}
                  </p>
                </div>
              </div>
              
              <p className="text-white/70 font-inter text-base sm:text-lg mb-8">{galleryModalDish.description}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-base sm:text-lg font-inter font-semibold text-white mb-3 flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-500/20">
                      <FaTable className="text-blue-400" />
                    </div>
                    Table Number
                  </label>
                  <input 
                    required 
                    placeholder="Enter table number"
                    value={galleryOrderTableNo}
                    onChange={e => setGalleryOrderTableNo(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 font-inter text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-base sm:text-lg font-inter font-semibold text-white mb-3 flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-purple-500/20">
                      <FaHashtag className="text-purple-400" />
                    </div>
                    Quantity
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    placeholder="Enter quantity"
                    value={galleryOrderQty}
                    onChange={e => setGalleryOrderQty(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 font-inter text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-base sm:text-lg font-inter font-semibold text-white mb-3 flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/20">
                      <FaEdit className="text-emerald-400" />
                    </div>
                    Modifications
                  </label>
                  <input 
                    placeholder="Special requests (comma separated)"
                    value={galleryOrderMods}
                    onChange={e => setGalleryOrderMods(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 font-inter text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {galleryOrderSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4 sm:p-6 mt-6 flex items-center gap-4">
                  <FaCheckCircle className="text-xl sm:text-2xl text-emerald-400" />
                  <span className="text-emerald-300 font-inter font-semibold text-base sm:text-lg">Order placed successfully!</span>
                </div>
              )}

              {galleryOrderError && (
                <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-4 sm:p-6 mt-6 flex items-center gap-4">
                  <FaExclamationTriangle className="text-xl sm:text-2xl text-rose-400" />
                  <span className="text-rose-300 font-inter text-base sm:text-lg">{galleryOrderError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  type="submit" 
                  className="flex-1 premium-gradient text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:premium-gradient-reverse transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <FaPaperPlane />
                  Place Order
                </button>
                <button 
                  type="button" 
                  onClick={() => setGalleryModalDish(null)}
                  className="flex-1 bg-white/10 text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3 border border-white/20 hover:border-white/30"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Order Modal */}
      {voiceOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-3xl max-w-2xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-scale-in">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-clash font-bold text-white mb-6 flex items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl premium-gradient shadow-lg">
                  <FaMicrophone className="text-xl sm:text-2xl text-white" />
                </div>
                Voice Order
                <FaBolt className="text-yellow-300 text-lg sm:text-xl" />
              </h2>

              {!voiceOrderParsed ? (
                <>
                  <div className="flex items-center gap-4 text-blue-400 font-inter font-semibold text-lg sm:text-xl mb-6">
                    {listening && <div className="w-3 h-3 sm:w-4 sm:h-4 bg-rose-500 rounded-full pulse-dot"></div>}
                    <FaMicrophone className={`text-xl sm:text-2xl ${listening ? 'text-rose-400' : 'text-blue-400'}`} />
                    {listening ? 'Listening... Speak now' : 'Ready to listen'}
                  </div>

                  <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-4 sm:p-6 min-h-48 font-inter text-white/70 text-base sm:text-lg mb-6">
                    {transcript || 'Your speech will appear here... Speak clearly and include table number and items.'}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleStopVoiceOrder}
                      disabled={!transcript}
                      className="flex-1 premium-gradient text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:premium-gradient-reverse transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      <FaStop />
                      Stop & Process
                    </button>
                    <button 
                      onClick={() => {
                        setVoiceOrderModal(false);
                        SpeechRecognition.stopListening();
                      }}
                      className="flex-1 bg-white/10 text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3 border border-white/20 hover:border-white/30"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-500/20 border-l-4 border-blue-400 rounded-2xl p-4 sm:p-6 mb-6">
                    <h3 className="text-xl sm:text-2xl font-clash font-bold text-white mb-4 flex items-center gap-3">
                      <FaReceipt className="text-blue-400" />
                      Order Summary
                    </h3>
                    <p className="font-inter text-white text-base sm:text-lg mb-2"><strong>Table:</strong> {voiceOrderParsed.table || 'Not specified'}</p>
                    <p className="font-inter text-white text-base sm:text-lg mt-4"><strong>Items:</strong></p>
                    <ul className="font-inter text-white mt-2 space-y-2">
                      {voiceOrderParsed.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <FaCheck className="text-emerald-400 text-sm" />
                          <span className="text-base sm:text-lg">
                            {item.quantity}x {item.name}
                            {item.modifications.length > 0 && (
                              <span className="text-white/60 text-xs sm:text-sm ml-2">
                                ({item.modifications.join(', ')})
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {voiceOrderError && (
                    <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-4 sm:p-6 mb-6 flex items-center gap-4">
                      <FaExclamationTriangle className="text-xl sm:text-2xl text-rose-400" />
                      <span className="text-rose-300 font-inter text-base sm:text-lg">{voiceOrderError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                    <button 
                      onClick={handleConfirmVoiceOrder}
                      disabled={voiceOrderLoading || !!voiceOrderError}
                      className="flex-1 premium-gradient text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:premium-gradient-reverse transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl min-w-0"
                    >
                      {voiceOrderLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          Confirm Order
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setVoiceOrderParsed(null);
                        resetTranscript();
                        setVoiceOrderError('');
                      }}
                      disabled={voiceOrderLoading}
                      className="flex-1 bg-white/10 text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 border border-white/20 hover:border-white/30 min-w-0"
                    >
                      <FaRedo />
                      Try Again
                    </button>
                    <button 
                      onClick={() => {
                        setVoiceOrderModal(false);
                        SpeechRecognition.stopListening();
                      }}
                      disabled={voiceOrderLoading}
                      className="flex-1 bg-white/10 text-white py-3 sm:py-4 rounded-2xl font-inter font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 border border-white/20 hover:border-white/30 min-w-0"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Face Registration Modal */}
      {showFaceRegistration && (
        <FaceRegistration
          employeeId={userId || 'test-id'}
          onClose={() => setShowFaceRegistration(false)}
        />
      )}
    </div>
  );
}