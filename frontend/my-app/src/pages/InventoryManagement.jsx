import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import React from 'react';
import QrBarcodeScanner from 'react-qr-barcode-scanner';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
// Premium Feather icons
import { FiArrowLeftCircle, FiPackage, FiPlusCircle, FiMic } from 'react-icons/fi';

export default function InventoryManagement({ highlightedItem: highlightedItems, refreshKey }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [recognition, setRecognition] = useState(null);
  const [addingToBulkForm, setAddingToBulkForm] = useState(false);
  const [useTextInput, setUseTextInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();
 const VITE_API_URL =  import.meta.env.VITE_API_URL;
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pieces'
  });

  // Bulk form state
  const [bulkItems, setBulkItems] = useState([
    { name: '', quantity: '', unit: 'pieces' }
  ]);

  const units = ['pieces', 'kg', 'liters', 'gms', 'ml', 'packs'];

  useEffect(() => {
    getInventory();
    fetchUserRole();
  }, [refreshKey]);

  // Initialize voice recognition
  useEffect(() => {
    try {
      // Detect Brave browser
      const isBrave = navigator.brave?.isBrave() || false;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = voiceLanguage;
        
        recognitionInstance.onstart = () => {
          setIsListening(true);
          setVoiceText('');
        };
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setVoiceText(prev => prev + finalTranscript + ' ');
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Handle specific error types
          switch (event.error) {
            case 'network':
              if (isBrave) {
                setError('Brave browser detected: Please enable "Allow sites to access your microphone" in Brave settings. Go to Settings > Privacy and security > Site and Shield settings > Microphone.');
              } else {
                setError('Network error: Please check your internet connection and try again.');
              }
              setUseTextInput(true); // Auto-switch to text input
              break;
            case 'not-allowed':
              if (isBrave) {
                setError('Brave browser detected: Please allow microphone access. Click the microphone icon in the address bar and select "Allow".');
              } else {
                setError('Microphone access denied: Please allow microphone access and try again.');
              }
              setUseTextInput(true); // Auto-switch to text input
              break;
            case 'no-speech':
              setError('No speech detected: Please speak clearly and try again.');
              break;
            case 'audio-capture':
              if (isBrave) {
                setError('Brave browser detected: Please check microphone permissions in Brave settings and ensure microphone is not blocked.');
              } else {
                setError('Audio capture error: Please check your microphone and try again.');
              }
              setUseTextInput(true); // Auto-switch to text input
              break;
            case 'service-not-allowed':
              if (isBrave) {
                setError('Brave browser detected: Speech recognition may be blocked. Try disabling Brave Shields for this site or use text input.');
              } else {
                setError('Speech recognition service not available: Please try again later.');
              }
              setUseTextInput(true); // Auto-switch to text input
              break;
            default:
              setError(`Speech recognition error: ${event.error}. Please try again.`);
          }
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
        
        // Show Brave-specific warning
        if (isBrave) {
          setError('Brave browser detected: If voice input doesn\'t work, you may need to enable microphone access in Brave settings. You can also use text input as an alternative.');
        }
      } else {
        console.warn('Speech recognition not supported in this browser');
        setUseTextInput(true); // Auto-switch to text input
        setError('Voice input not supported in your browser. Using text input instead.');
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setUseTextInput(true); // Auto-switch to text input
      setError('Voice input failed to initialize. Using text input instead.');
    }
  }, [voiceLanguage]);

  // Voice recognition functions
  const startListening = () => {
    try {
      if (recognition) {
        recognition.lang = voiceLanguage;
        recognition.start();
      } else {
        setError('Speech recognition is not supported in your browser');
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setError('Failed to start voice recognition. Please try again.');
    }
  };

  const stopListening = () => {
    try {
      if (recognition) {
        recognition.stop();
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const processVoiceInput = () => {
    if (!voiceText.trim()) {
      setError('No voice input detected');
      return;
    }

    try {
      // Parse voice input to extract inventory items
      const items = parseVoiceToInventory(voiceText);
      
      if (items.length === 0) {
        setError('Could not understand inventory items from voice input. Please try again.');
        return;
      }

      if (addingToBulkForm) {
        // Add items to existing bulk form
        setBulkItems(prevItems => [...prevItems, ...items]);
        setShowBulkForm(true);
        setAddingToBulkForm(false);
      } else {
        // Create new bulk form with items
        setBulkItems(items);
        setShowBulkForm(true);
      }
      
      setVoiceText('');
    } catch (err) {
      setError('Error processing voice input. Please try again.');
    }
  };

  const processTextInput = () => {
    if (!voiceText.trim()) {
      setError('No text input detected');
      return;
    }

    try {
      // Parse text input to extract inventory items
      const items = parseVoiceToInventory(voiceText);
      
      if (items.length === 0) {
        setError('Could not understand inventory items from text input. Please try again.');
        return;
      }

      if (addingToBulkForm) {
        // Add items to existing bulk form
        setBulkItems(prevItems => [...prevItems, ...items]);
        setShowBulkForm(true);
        setAddingToBulkForm(false);
      } else {
        // Create new bulk form with items
        setBulkItems(items);
        setShowBulkForm(true);
      }
      
      setVoiceText('');
    } catch (err) {
      setError('Error processing text input. Please try again.');
    }
  };

  const parseVoiceToInventory = (text) => {
    const items = [];
    console.log('Parsing voice text:', text); // Debug log
    
    // Convert Hindi numbers to English if present
    const hindiToEnglish = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
      'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4', 'पांच': '5', 'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9', 'दस': '10',
      'ग्यारह': '11', 'बारह': '12', 'तेरह': '13', 'चौदह': '14', 'पंद्रह': '15', 'सोलह': '16', 'सत्रह': '17', 'अठारह': '18', 'उन्नीस': '19', 'बीस': '20',
      'तीस': '30', 'चालीस': '40', 'पचास': '50', 'साठ': '60', 'सत्तर': '70', 'अस्सी': '80', 'नब्बे': '90', 'सौ': '100'
    };
    
    // Hindi to English unit mapping
    const hindiUnits = {
      'किलो': 'kg', 'किलोग्राम': 'kg', 'किलोस': 'kg',
      'पीस': 'pieces', 'टुकड़े': 'pieces', 'नग': 'pieces', 'यूनिट': 'pieces',
      'लीटर': 'liters', 'लिटर': 'liters', 'एल': 'liters',
      'ग्राम': 'gms', 'ग्राम्स': 'gms', 'जी': 'gms',
      'पैक': 'packs', 'पैकेट': 'packs', 'बंडल': 'packs',
      'मिलीलीटर': 'ml', 'एमएल': 'ml'
    };
    
    // Common Hindi food items
    const hindiFoodItems = {
      'टमाटर': 'tomatoes', 'आलू': 'potatoes', 'प्याज': 'onions', 'चावल': 'rice', 'दाल': 'lentils',
      'आटा': 'flour', 'चीनी': 'sugar', 'नमक': 'salt', 'तेल': 'oil', 'घी': 'ghee',
      'दूध': 'milk', 'दही': 'curd', 'पनीर': 'paneer', 'ब्रेड': 'bread', 'बिस्कुट': 'biscuits',
      'चाय': 'tea', 'कॉफी': 'coffee', 'मसाला': 'spices', 'मिर्च': 'chillies', 'अदरक': 'ginger',
      'लहसुन': 'garlic', 'हल्दी': 'turmeric', 'धनिया': 'coriander', 'जीरा': 'cumin'
    };
    
    // Convert Hindi numbers to English
    let processedText = text;
    Object.keys(hindiToEnglish).forEach(hindi => {
      processedText = processedText.replace(new RegExp(hindi, 'g'), hindiToEnglish[hindi]);
    });
    
    console.log('Processed text after number conversion:', processedText);
    
    // Special case: handle the exact format "50 kg tomatoes 100 pieces bread 5 l oil"
    const specialPattern = /(\d+)\s*(kg|kilos?|kilograms?|pieces?|pcs?|units?|l|liters?|litres?|grams?|gms?|g|ml|milliliters?|packs?|packets?)\s+([a-zA-Z\s]+?)(?=\s+\d+\s|$)/gi;
    let specialMatch;
    const specialMatches = [];
    
    console.log('Using special pattern on text:', processedText);
    
    while ((specialMatch = specialPattern.exec(processedText)) !== null) {
      console.log('Special match found:', specialMatch);
      specialMatches.push({
        quantity: parseInt(specialMatch[1]),
        unit: normalizeUnit(specialMatch[2]),
        name: specialMatch[3].trim()
      });
    }
    
    if (specialMatches.length > 0) {
      console.log('Special pattern matches:', specialMatches);
      specialMatches.forEach(match => {
        if (match.quantity > 0 && match.name) {
          items.push({
            name: match.name.charAt(0).toUpperCase() + match.name.slice(1),
            quantity: match.quantity.toString(),
            unit: match.unit
          });
        }
      });
      console.log('Final parsed items from special pattern:', items);
      return items;
    }
    
    // Hindi pattern: handle Hindi units and items
    console.log('Trying Hindi pattern matching');
    const hindiPattern = /(\d+)\s*(किलो|किलोग्राम|पीस|टुकड़े|लीटर|ग्राम|पैक|मिलीलीटर)\s+([\u0900-\u097F\s]+?)(?=\s+\d+\s|$)/gi;
    const hindiMatches = [];
    
    while ((specialMatch = hindiPattern.exec(text)) !== null) {
      console.log('Hindi match found:', specialMatch);
      const hindiUnit = specialMatch[2];
      const hindiName = specialMatch[3].trim();
      
      // Convert Hindi unit to English
      const englishUnit = hindiUnits[hindiUnit] || 'pieces';
      
      // Convert Hindi item name to English if possible
      let englishName = hindiName;
      Object.keys(hindiFoodItems).forEach(hindiItem => {
        if (hindiName.includes(hindiItem)) {
          englishName = hindiFoodItems[hindiItem];
        }
      });
      
      hindiMatches.push({
        quantity: parseInt(specialMatch[1]),
        unit: englishUnit,
        name: englishName
      });
    }
    
    if (hindiMatches.length > 0) {
      console.log('Hindi pattern matches:', hindiMatches);
      hindiMatches.forEach(match => {
        if (match.quantity > 0 && match.name) {
          items.push({
            name: match.name.charAt(0).toUpperCase() + match.name.slice(1),
            quantity: match.quantity.toString(),
            unit: match.unit
          });
        }
      });
      console.log('Final parsed items from Hindi pattern:', items);
      return items;
    }
    
    // If special pattern didn't work, try a more aggressive approach
    console.log('Special pattern failed, trying alternative approach');
    const alternativePattern = /(\d+)\s+([a-zA-Z]+)\s+([a-zA-Z\s]+?)(?=\s+\d+\s|$)/gi;
    const alternativeMatches = [];
    
    while ((specialMatch = alternativePattern.exec(processedText)) !== null) {
      console.log('Alternative match found:', specialMatch);
      const unit = normalizeUnit(specialMatch[2]);
      alternativeMatches.push({
        quantity: parseInt(specialMatch[1]),
        unit: unit,
        name: specialMatch[3].trim()
      });
    }
    
    if (alternativeMatches.length > 0) {
      console.log('Alternative pattern matches:', alternativeMatches);
      alternativeMatches.forEach(match => {
        if (match.quantity > 0 && match.name) {
          items.push({
            name: match.name.charAt(0).toUpperCase() + match.name.slice(1),
            quantity: match.quantity.toString(),
            unit: match.unit
          });
        }
      });
      console.log('Final parsed items from alternative pattern:', items);
      return items;
    }
    
    // Fallback to original parsing logic
    // First, try to split by common separators
    let lines = text.split(/[.,\n]+/).filter(line => line.trim());
    
    // If no separators found, try to split by numbers (each number starts a new item)
    if (lines.length <= 1) {
      lines = text.split(/(?=\d+)/).filter(line => line.trim());
    }
    
    console.log('Split lines:', lines); // Debug log
    
    lines.forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      console.log('Processing line:', trimmedLine); // Debug log
      
      // Common patterns for inventory items - more flexible matching
      const patterns = [
        // "50 kg tomatoes" or "tomatoes 50 kg"
        /(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?)/i,
        
        // "100 pieces bread" or "bread 100 pieces"
        /(\d+(?:\.\d+)?)\s*(pieces?|pcs?|units?)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(pieces?|pcs?|units?)/i,
        
        // "5 liters oil" or "oil 5 liters" - also handle "5 l oil"
        /(\d+(?:\.\d+)?)\s*(liters?|l|litres?)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(liters?|l|litres?)/i,
        
        // "500 grams sugar" or "sugar 500 grams"
        /(\d+(?:\.\d+)?)\s*(grams?|gms?|g)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(grams?|gms?|g)/i,
        
        // "2 packs noodles" or "noodles 2 packs"
        /(\d+(?:\.\d+)?)\s*(packs?|packets?)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(packs?|packets?)/i,
        
        // "1000 ml water" or "water 1000 ml"
        /(\d+(?:\.\d+)?)\s*(ml|milliliters?|millilitres?)\s+(.+)/i,
        /(.+)\s+(\d+(?:\.\d+)?)\s*(ml|milliliters?|millilitres?)/i
      ];

      let matched = false;
      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          console.log('Pattern matched:', match); // Debug log
          let quantity, unit, name;
          
          if (match[1] && !isNaN(match[1])) {
            // Pattern: quantity unit name
            quantity = parseFloat(match[1]);
            unit = normalizeUnit(match[2]);
            name = match[3].trim();
          } else {
            // Pattern: name quantity unit
            name = match[1].trim();
            quantity = parseFloat(match[2]);
            unit = normalizeUnit(match[3]);
          }
          
          if (quantity > 0 && name) {
            items.push({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              quantity: quantity.toString(),
              unit: unit
            });
            matched = true;
            break;
          }
        }
      }
      
      // If no pattern matched, try to extract basic number + word combinations
      if (!matched) {
        const basicMatch = trimmedLine.match(/(\d+(?:\.\d+)?)\s+(.+)/);
        if (basicMatch) {
          const quantity = parseFloat(basicMatch[1]);
          const name = basicMatch[2].trim();
          if (quantity > 0 && name) {
            items.push({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              quantity: quantity.toString(),
              unit: 'pieces' // Default unit
            });
            console.log('Basic pattern matched:', { quantity, name }); // Debug log
          }
        }
      }
    });
    
    console.log('Final parsed items:', items); // Debug log
    return items;
  };

  const normalizeUnit = (unit) => {
    console.log('Normalizing unit:', unit); // Debug log
    const unitMap = {
      'kg': 'kg', 'kilos': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
      'pieces': 'pieces', 'piece': 'pieces', 'pcs': 'pieces', 'pc': 'pieces', 'units': 'pieces', 'unit': 'pieces',
      'liters': 'liters', 'liter': 'liters', 'l': 'liters', 'litres': 'liters', 'litre': 'liters',
      'grams': 'gms', 'gram': 'gms', 'gms': 'gms', 'gm': 'gms', 'g': 'gms',
      'packs': 'packs', 'pack': 'packs', 'packets': 'packs', 'packet': 'packs',
      'ml': 'ml', 'milliliters': 'ml', 'milliliter': 'ml', 'millilitres': 'ml', 'millilitre': 'ml'
    };
    
    const normalized = unitMap[unit.toLowerCase()] || 'pieces';
    console.log('Normalized unit:', unit, '->', normalized); // Debug log
    return normalized;
  };

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${VITE_API_URL}/api/auth/me`, { headers });
      setUserRole(response.data.user?.role || '');
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const getInventory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${VITE_API_URL}/api/orders/inventory`, { headers });
      setInventory(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBulkInputChange = (index, field, value) => {
    const updatedItems = [...bulkItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setBulkItems(updatedItems);
  };

  const addBulkItem = () => {
    setBulkItems([...bulkItems, { name: '', quantity: '', unit: 'pieces' }]);
  };

  const removeBulkItem = (index) => {
    if (bulkItems.length > 1) {
      const updatedItems = bulkItems.filter((_, i) => i !== index);
      setBulkItems(updatedItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingItem) {
        // Update existing item
        await axios.put(
          `${VITE_API_URL}/api/orders/inventory/${editingItem._id}`,
          formData,
          { headers }
        );
        setEditingItem(null);
      } else {
        // Create new item
        await axios.post(
          `${VITE_API_URL}/api/orders/createin`,
          formData,
          { headers }
        );
      }

      setFormData({ name: '', quantity: '', unit: 'pieces' });
      setShowAddForm(false);
      getInventory();
    } catch (err) {
      console.error('Error saving inventory:', err);
      setError('Failed to save inventory item');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate that all items have required fields
      const validItems = bulkItems.filter(item => item.name.trim() && item.quantity > 0);
      
      if (validItems.length === 0) {
        setError('Please add at least one valid item');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `${VITE_API_URL}/api/orders/createinbulk`,
        validItems,
        { headers }
      );

      setBulkItems([{ name: '', quantity: '', unit: 'pieces' }]);
      setShowBulkForm(false);
      getInventory();
    } catch (err) {
      console.error('Error creating bulk inventory:', err);
      setError('Failed to create bulk inventory. Please check your input.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`${VITE_API_URL}/api/orders/inventory/${id}`, { headers });
      getInventory();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      setError('Failed to delete inventory item');
    }
  };

  const handleBack = () => {
    if (userRole === 'vendor') {
      navigate('/vendor/dashboard');
    } else if (userRole === 'manager') {
      navigate('/manager/dashboard');
    } else {
      navigate('/');
    }
  };

  // Helper for robust matching
  function matchesHighlight(name, highlights) {
    if (!name || !highlights || highlights.length === 0) return false;
    const n = name.trim().toLowerCase();
    return highlights.some(h => {
      if (!h) return false;
      const hL = h.trim().toLowerCase();
      return (
        n === hL ||
        n === hL + 's' ||
        n + 's' === hL ||
        n.includes(hL) ||
        hL.includes(n)
      );
    });
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #e9ecef', 
          borderTop: '3px solid #007bff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 15px auto'
        }}></div>
        <p>Loading inventory...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="inventory-responsive-wrapper"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#F9FAFB',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 60% 10%, #6366F133 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #10B98133 0%, transparent 70%)',
        animation: 'inv-bg-move 16s ease-in-out infinite',
        opacity: 0.18,
      }} />
      {/* Floating Artistic SVGs */}
      <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'180px',zIndex:1,opacity:0.22,filter:'blur(1.5px)'}} viewBox="0 0 1440 320"><path fill="#6366F1" fillOpacity="1" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path></svg>
      {/* Floating Chef Hat SVG */}
      <svg style={{position:'absolute',top:40,right:60,width:90,height:90,opacity:0.13,zIndex:2,filter:'blur(0.5px)'}} viewBox="0 0 64 64"><ellipse cx="32" cy="32" rx="28" ry="18" fill="#10B981"/><ellipse cx="32" cy="24" rx="20" ry="12" fill="#fff"/><ellipse cx="32" cy="20" rx="12" ry="7" fill="#6366F1"/><rect x="20" y="36" width="24" height="10" rx="5" fill="#fff" stroke="#6366F1" strokeWidth="2"/></svg>
      {/* Animated utensils accent */}
      <svg style={{position:'absolute',bottom:40,left:60,width:80,height:80,opacity:0.11,zIndex:2,filter:'blur(0.5px)',animation:'inv-utensil-float 7s ease-in-out infinite alternate'}} viewBox="0 0 64 64"><rect x="28" y="10" width="8" height="36" rx="4" fill="#10B981"/><rect x="20" y="46" width="24" height="8" rx="4" fill="#6366F1"/></svg>
      <div className="inv-card" style={{zIndex:3,marginTop:56,boxShadow:'0 8px 48px #818cf822, 0 1.5px 8px #fbbf2422', width:'100%'}}>
        <div className="inv-header">Inventory Management</div>
        <div className="inv-sub">“Good food is the foundation of genuine happiness.”</div>
        <div style={{marginBottom:'1.5em',fontFamily:'Montserrat',color:'#64748b',fontSize:'1.08rem'}}>Manage your product inventory and stock levels with style.</div>
      </div>
      <div style={{ padding: '20px', width: '100%', flex: 1, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#495057' }}>
              Inventory Management
            </h2>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
              Manage your product inventory and stock levels
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Back to Dashboard */}
            <button 
              onClick={handleBack}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', 
                background: 'linear-gradient(90deg,#e0e7ff,#c7d2fe)',
                color: '#232946', 
                border: 'none', 
                borderRadius: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, Sora, SF Pro Display',
                fontSize: '16px',
                boxShadow: '0 2px 12px #c7d2fe44',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <FiArrowLeftCircle size={22} style={{marginRight:4}} /> Back to Dashboard
            </button>
            {/* Bulk Import */}
            <button 
              onClick={() => setShowBulkForm(!showBulkForm)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', 
                background: 'linear-gradient(90deg,#fbbf24,#f472b6)',
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, Sora, SF Pro Display',
                fontSize: '16px',
                boxShadow: '0 2px 12px #fbbf2444',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <FiPackage size={22} style={{marginRight:4}} /> Bulk Import
            </button>
            {/* Add Item */}
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingItem(null);
                setFormData({ name: '', quantity: '', unit: 'pieces' });
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', 
                background: 'linear-gradient(90deg,#10b981,#6366f1)',
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, Sora, SF Pro Display',
                fontSize: '16px',
                boxShadow: '0 2px 12px #10b98144',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <FiPlusCircle size={22} style={{marginRight:4}} /> Add Item
            </button>
            {/* Voice Input */}
            <button 
              onClick={isListening ? stopListening : startListening}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', 
                background: isListening ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#6366f1,#818cf8)',
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, Sora, SF Pro Display',
                fontSize: '16px',
                boxShadow: isListening ? '0 2px 12px #dc262644' : '0 2px 12px #6366f144',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <FiMic size={22} style={{marginRight:4}} /> {isListening ? 'Stop Voice' : 'Voice Input'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{ 
                float: 'right', 
                background: 'none', 
                border: 'none', 
                fontSize: '18px',
                cursor: 'pointer',
                color: '#721c24'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#495057', fontSize: '14px' }}>
                    Item Name *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-300 text-black rounded pr-10"
                      placeholder="e.g., Tomatoes, Rice, Oil"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded hover:bg-slate-200"
                      onClick={() => setShowScanner(true)}
                      aria-label="Scan barcode or QR"
                    >
                      <QrCodeIcon className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#495057', fontSize: '14px' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      color:'black',
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#495057', fontSize: '14px' }}>
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: 'blue',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingItem(null);
                      setFormData({ name: '', quantity: '', unit: 'pieces' });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs flex flex-col items-center">
              <div className="mb-2 font-bold text-lg text-slate-700">Scan Barcode or QR</div>
              <BarcodeScanner
                onDetected={code => {
                  setFormData(prev => ({ ...prev, name: code }));
                  setShowScanner(false);
                }}
                onCancel={() => setShowScanner(false)}
              />
            </div>
          </div>
        )}

        {/* Bulk Import Form */}
        {showBulkForm && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>
              📦 Bulk Import Inventory
            </h3>
            <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
              Add multiple inventory items at once. Fill in the details for each item below.
            </p>
            <form onSubmit={handleBulkSubmit}>
              {bulkItems.map((item, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr auto', 
                  gap: '15px', 
                  alignItems: 'end',
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#856404', fontSize: '14px' }}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleBulkInputChange(index, 'name', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        color: 'black',
                        fontSize: '14px'
                      }}
                      placeholder="e.g., Tomatoes, Rice, Oil"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#856404', fontSize: '14px' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleBulkInputChange(index, 'quantity', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        color: 'black',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#856404', fontSize: '14px' }}>
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleBulkInputChange(index, 'unit', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ffeaa7',
                        color: 'black',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {bulkItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBulkItem(index)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={addBulkItem}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ➕ Add Another Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkForm(false);
                    setShowAddForm(false);
                    setAddingToBulkForm(true);
                    startListening();
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  🎤 Add by Voice
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Import {bulkItems.filter(item => item.name.trim() && item.quantity > 0).length} Items
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkForm(false);
                    setBulkItems([{ name: '', quantity: '', unit: 'pieces' }]);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Voice Input Interface */}
        {isListening && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #2196f3'
          }}>
            {/* Brave Browser Instructions */}
            {navigator.brave?.isBrave() && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '14px' }}>
                  🛡️ Brave Browser Detected
                </h4>
                <p style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '12px' }}>
                  If voice input doesn't work, follow these steps:
                </p>
                <ol style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '12px', paddingLeft: '20px' }}>
                  <li>Click the microphone icon in the address bar</li>
                  <li>Select "Allow" for microphone access</li>
                  <li>Or go to Settings {'>'} Privacy and security {'>'} Site and Shield settings {'>'} Microphone</li>
                  <li>Alternatively, use the "📝 Text" button below</li>
                </ol>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1976d2' }}>
                🎤 Voice Input - {voiceLanguage === 'en-US' ? 'English' : 'Hindi'}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #2196f3',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="en-US">English</option>
                  <option value="hi-IN">Hindi</option>
                </select>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#dc3545', 
                  borderRadius: '50%',
                  animation: isListening ? 'pulse 1s infinite' : 'none'
                }}></div>
              </div>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              border: '1px solid #2196f3',
              marginBottom: '15px',
              color:'black',
              minHeight: '80px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  <strong>{useTextInput ? 'Text Input' : 'Listening...'}</strong> Speak clearly and say items like:
                </p>
                <button
                  onClick={() => setUseTextInput(!useTextInput)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: useTextInput ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {useTextInput ? '🎤 Voice' : '📝 Text'}
                </button>
              </div>
              <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                {addingToBulkForm ? 
                  (voiceLanguage === 'hi-IN' ? 
                    '"Add 2 किलो आलू, 1 लीटर दूध"' :
                    '"Add 2 kg potatoes, 1 liter milk"'
                  ) :
                  (voiceLanguage === 'hi-IN' ? 
                    '"50 किलो टमाटर, 100 पीस ब्रेड, 5 लीटर तेल"' :
                    '"50 kg tomatoes, 100 pieces bread, 5 liters oil"'
                  )
                }
              </p>
              {useTextInput ? (
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder={addingToBulkForm ? 
                    (voiceLanguage === 'hi-IN' ? 
                      'Add 2 किलो आलू, 1 लीटर दूध' :
                      'Add 2 kg potatoes, 1 liter milk'
                    ) :
                    (voiceLanguage === 'hi-IN' ? 
                      '50 किलो टमाटर, 100 पीस ब्रेड, 5 लीटर तेल' :
                      '50 kg tomatoes, 100 pieces bread, 5 liters oil'
                    )
                  }
                  style={{
                    width: '100%',
                    height: '60px',
                    padding: '8px',
                    color: 'black',
                    border: '1px solid #2196f3',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  minHeight: '40px'
                }}>
                  {voiceText || 'Waiting for voice input...'}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={useTextInput ? processTextInput : processVoiceInput}
                disabled={!voiceText.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: voiceText.trim() ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: voiceText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                {addingToBulkForm ? 
                  (useTextInput ? '✅ Add Text to Bulk Form' : '✅ Add to Bulk Form') : 
                  (useTextInput ? '✅ Process Text Input' : '✅ Process Voice Input')
                }
              </button>
              <button
                onClick={() => setVoiceText('')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => {
                  setVoiceText('');
                  setAddingToBulkForm(false);
                  stopListening();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ Close
              </button>
            </div>
            
            <style>{`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* Inventory Table */}
        <div className="inv-card" style={{zIndex:1, width:'100%', flex: 1, display: 'flex', flexDirection: 'column'}}>
          <div style={{padding:'0 0 18px 0',borderBottom:'1px solid #e0e7ff',marginBottom:18}}>
            <h3 className="inv-header" style={{fontSize:'1.4rem',margin:0}}>Current Inventory <span style={{fontFamily:'Fira Mono',fontSize:'1.1rem',color:'#6366f1'}}>({inventory.length} items)</span></h3>
          </div>
          {/* Debug: Show highlightedItem */}
          {highlightedItems && highlightedItems.length > 0 && (
            <div style={{marginBottom:12, color:'#059669', fontWeight:700, fontSize:'1.1em'}}>
              Highlighting: {highlightedItems.join(', ')}
            </div>
          )}
          {inventory.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#64748b'}}>
              <div style={{fontSize:'48px',marginBottom:'15px'}}>📦</div>
              <h4 style={{margin:'0 0 10px 0',fontFamily:'Pacifico',color:'#6366f1'}}>No inventory items found</h4>
              <p style={{margin:0,fontSize:'14px',fontFamily:'Montserrat'}}>Start by adding your first inventory item using the "Add Item" button above.</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="inv-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'14px',background:'#f8fafc'}}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => {
                    let isHighlighted = false;
                    if (highlightedItems && highlightedItems.length > 0) {
                      isHighlighted = matchesHighlight(item.name, highlightedItems);
                    }
                    if (isHighlighted) console.log('Highlighting:', item.name, 'for', highlightedItems);
                    return (
                      <tr key={item._id || index} style={{
                        borderBottom:'1px solid #e0e7ff',
                        background: isHighlighted ? '#d4f8e8' : (index%2===0?'#fff':'#f1f5f9'),
                        border: isHighlighted ? '3px solid #34d399' : undefined,
                        animation: isHighlighted ? 'pulse 1.2s infinite' : undefined
                      }}>
                        <td style={isHighlighted ? { fontWeight: 700, color: '#059669', fontSize: '1.08em' } : {}}>{item.name}</td>
                        <td style={{textAlign:'center'}}>{item.quantity}</td>
                        <td style={{textAlign:'center',fontSize:'12px',textTransform:'uppercase'}}>{item.unit}</td>
                        <td style={{textAlign:'center',fontSize:'12px'}}>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                        <td style={{textAlign:'center'}}>
                          <button className="inv-btn" onClick={()=>handleEdit(item)} style={{padding:'4px 12px',fontSize:'12px'}}>✏️ Edit</button>
                          <button className="inv-btn" onClick={()=>handleDelete(item._id)} style={{padding:'4px 12px',fontSize:'12px',background:'linear-gradient(90deg,#dc2626,#f87171)'}}>🗑️ Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Fira+Mono:wght@400&family=Montserrat:wght@500;700&family=Pacifico&family=Inter:wght@400;600&family=Space+Grotesk:wght@400;700&display=swap');
        @keyframes inv-bg-move {
          0% { background-position: 0% 0%, 100% 100%; }
          50% { background-position: 100% 20%, 0% 80%; }
          100% { background-position: 0% 0%, 100% 100%; }
        }
        @keyframes inv-utensil-float {
          0% { transform: translateY(0) rotate(-8deg); }
          100% { transform: translateY(-18px) rotate(8deg); }
        }
        .inv-header { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; color: #1F2937; letter-spacing: 0.01em; margin-bottom: 0.2em; text-shadow: 0 2px 24px #6366F155; }
        .inv-sub { font-family: 'Pacifico', cursive; color: #6366F1; font-size: 1.18rem; margin-bottom: 2.2em; text-shadow: 0 2px 12px #10B98144; }
        .inv-table th { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.08rem; color: #1F2937; background: #F9FAFB; border-bottom: 2.5px solid #6366F1; }
        .inv-table td { font-family: 'Inter', sans-serif; font-size: 1.01rem; color: #1F2937; }
        .inv-form label { font-family: 'Montserrat', sans-serif; font-weight: 600; color: #1F2937; }
        .inv-form input, .inv-form select { font-family: 'Fira Mono', monospace; font-size: 1.01rem; }
        .inv-btn { font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: 0.03em; background: linear-gradient(90deg,#6366F1,#10B981); color: #fff; border: none; border-radius: 9px; padding: 10px 22px; margin-right: 8px; box-shadow: 0 2px 18px #6366F122; transition: background 0.18s, box-shadow 0.18s, transform 0.18s; cursor: pointer; }
        .inv-btn:hover { background: linear-gradient(90deg,#10B981,#6366F1); box-shadow: 0 4px 32px #10B98144; transform: translateY(-2px) scale(1.04); }
        .inv-card { background: #F9FAFB; border-radius: 22px; box-shadow: 0 4px 32px #6366F122, 0 1.5px 8px #10B98122; padding: 40px 32px 28px 32px; margin-bottom: 38px; border: 1.5px solid #6366F1; position: relative; z-index: 3; backdrop-filter: blur(12px); }
        .inv-card:after { content: ''; position: absolute; inset: 0; border-radius: 22px; pointer-events: none; box-shadow: 0 0 0 2.5px #10B98122; }
        @media (max-width: 900px) {
          .inv-card {
            margin-top: 24px !important;
            padding: 24px 8px 18px 8px !important;
          }
        }
        @media (max-width: 600px) {
          .inventory-responsive-wrapper {
            padding: 0 !important;
            min-height: 100vh !important;
          }
          .inv-card {
            margin-top: 8px !important;
            padding: 12px 2px 8px 2px !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .inv-table {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

export async function getInventoryAPI() {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get('http://localhost:5000/api/orders/inventory', { headers });
    return response.data;
  } catch (err) {
    console.error('Error fetching inventory:', err);
    return [];
  }
} 