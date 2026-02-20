import React, { useState, useRef, useEffect } from 'react';

// Gemini 1.5 Flash Free API call
async function getGeminiIntent(text, apiKey) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text }] }
        ]
      })
    });
    const data = await res.json();
    // Parse Gemini response for intent/command (simple for now)
    // You can improve this with a system prompt for structured output
    let botText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      botText = data.candidates[0].content.parts.map(p => p.text).join(' ');
    }
    return { botText };
  } catch (e) {
    return { botText: 'Sorry, I could not process that.' };
  }
}

const GEMINI_API_KEY = 'AIzaSyAt8rRekvOqmJU6bGkrev24aHiog6ewA0k'; // Replace with your key

export default function VoiceAssistant({ onCommand }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botSpeech, setBotSpeech] = useState('');
  const [showModal, setShowModal] = useState(false);
  const recognitionRef = useRef(null);
  const keepListeningRef = useRef(false);
  const lastCommandRef = useRef('');
  const cooldownRef = useRef(false);

  // Create recognition instance once
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
      keepListeningRef.current = false;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    setShowModal(true);
    console.log('VoiceAssistant: Starting listening...');
    const recognition = recognitionRef.current;
    recognition.lang = 'en-IN';
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      console.log('VoiceAssistant: Recognized text:', text);
      // Prevent repeated identical commands
      if (cooldownRef.current || text.trim().toLowerCase() === lastCommandRef.current) {
        console.log('VoiceAssistant: Ignoring repeated or cooldown command:', text);
        return;
      }
      lastCommandRef.current = text.trim().toLowerCase();
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 1000); // 1 second cooldown
      // NLU: simple keyword/intent extraction for demo
      let intent = '';
      let entity = '';
      let tab = '';
      let highlight = '';
      let botText = '';
      const lower = text.toLowerCase();
      let match;
      if ((match = lower.match(/delete (.+) from inventory/)) || (match = lower.match(/remove (.+) from inventory/))) {
        intent = 'delete_inventory';
        entity = match[1].trim();
        tab = 'inventory';
        highlight = entity;
        botText = `Deleting ${entity} from inventory.`;
      } else if (lower.includes('tomato') && lower.includes('inventory')) {
        intent = 'show_inventory';
        entity = 'tomato';
        tab = 'inventory';
        highlight = 'tomato';
        botText = 'Navigating to inventory. Tomatoes are highlighted.';
      } else if (lower.includes('chicken') && lower.includes('inventory')) {
        intent = 'show_inventory';
        entity = 'chicken';
        tab = 'inventory';
        highlight = 'chicken';
        botText = 'Navigating to inventory. Chicken is highlighted.';
      } else if (lower.includes('inventory')) {
        intent = 'show_inventory';
        tab = 'inventory';
        botText = 'Navigating to inventory.';
      } else if (lower.includes('traceability')) {
        intent = 'show_traceability';
        tab = 'traceability';
        botText = 'Navigating to traceability and safety.';
      } else if (lower.includes('dynamic pricing') || lower.includes('profit')) {
        intent = 'show_dynamic_pricing';
        tab = 'dynamicpricing';
        botText = 'Navigating to dynamic pricing.';
      } else if (lower.includes('food security') || lower.includes('donate')) {
        intent = 'show_food_security';
        tab = 'foodsecurity';
        botText = 'Navigating to food security grid.';
      } else {
        // Fallback to Gemini for more complex queries
        const gemini = await getGeminiIntent(text, GEMINI_API_KEY);
        botText = gemini.botText;
      }
      setBotSpeech(botText);
      speakBack(botText);
      if (onCommand) onCommand(text, { intent, entity, tab, highlight, botText });
      // Continue listening if not stopped
      if (keepListeningRef.current) {
        setTimeout(() => {
          setTranscript('');
          setBotSpeech('');
          console.log('VoiceAssistant: Restarting listening...');
          recognition.start();
        }, 500);
      }
    };
    recognition.onend = () => {
      setListening(false);
      if (keepListeningRef.current) {
        setTimeout(() => {
          setTranscript('');
          setBotSpeech('');
          console.log('VoiceAssistant: onend - Restarting listening...');
          recognition.start();
        }, 500);
      }
    };
    recognition.onerror = (e) => {
      setListening(false);
      console.log('VoiceAssistant: Recognition error', e);
      if (keepListeningRef.current) {
        setTimeout(() => {
          setTranscript('');
          setBotSpeech('');
          console.log('VoiceAssistant: onerror - Restarting listening...');
          recognition.start();
        }, 500);
      }
    };
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    keepListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    setListening(false);
    setShowModal(false);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      keepListeningRef.current = true;
      startListening();
    }
  };

  // Simple TTS
  const speakBack = (text, lang = 'en-IN') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = lang;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 3000 }}>
      <button
        aria-label={listening ? 'Stop voice assistant' : 'Start voice assistant'}
        aria-pressed={listening}
        onClick={toggleListening}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleListening(); }}
        style={{
          background: listening ? '#b91c1c' : '#343a40',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 64,
          height: 64,
          boxShadow: '0 4px 24px #b91c1c44',
          fontSize: 32,
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        tabIndex={0}
      >
        {listening ? '🎤' : '🗣️'}
      </button>
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'absolute',
            right: 80,
            bottom: 0,
            minWidth: 260,
            background: '#fff',
            border: '1.5px solid #b91c1c',
            borderRadius: 12,
            boxShadow: '0 4px 24px #b91c1c44',
            padding: 16,
            zIndex: 3100,
            color: '#18181b',
            fontSize: 15,
            maxWidth: 320,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#b91c1c' }}>Voice Assistant</div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#343a40', fontWeight: 600 }}>You:</span> <span>{transcript || <i>Say something...</i>}</span>
          </div>
          <div>
            <span style={{ color: '#343a40', fontWeight: 600 }}>Bot:</span> <span>{botSpeech || <i>Waiting...</i>}</span>
          </div>
          <button
            onClick={stopListening}
            style={{ marginTop: 12, background: '#b91c1c', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}
          >Stop</button>
        </div>
      )}
    </div>
  );
} 