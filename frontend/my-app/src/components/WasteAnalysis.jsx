import { useState, useEffect } from 'react';
import axios from 'axios';

export default function WasteAnalysis({ restaurantId, userRole }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-load waste analysis on component mount
  useEffect(() => {
    if (restaurantId) {
      fetchWasteAnalysis();
    }
  }, [restaurantId]);

  const fetchWasteAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        'http://localhost:5000/api/orders/wasteanalyze', // Corrected endpoint
        {
          voiceInput: "Analyze food waste patterns and provide recommendations",
          weather: "sunny"
        },
        { 
          headers,
          timeout: 15000 // 15 second timeout
        }
      );

      if (response.data && (response.data.wastePrediction || response.data.doNotMake)) {
        setAnalysis(response.data);
      } else {
        throw new Error('Invalid response format from server');
      }
      setLoading(false);
    } catch (err) {
      console.error('Waste analysis error:', err);
      
      // Fallback data when API fails
      const fallbackAnalysis = {
        wastePrediction: [
          {
            item: "Fresh Vegetables",
            suggestedPrep: "Reduce by 30%",
            reason: "Historical data shows 30% waste rate for vegetables on sunny days"
          },
          {
            item: "Dairy Products",
            suggestedPrep: "Order 50% less",
            reason: "Short shelf life and low demand in current weather"
          }
        ],
        doNotMake: [
          {
            item: "Cream-based Desserts",
            reason: "High spoilage risk in current temperature"
          }
        ],
        generalTips: [
          "Implement FIFO (First In First Out) inventory system",
          "Monitor fridge temperatures regularly",
          "Train staff on proper food storage techniques"
        ]
      };
      
      setAnalysis(fallbackAnalysis);
      setError('AI analysis unavailable - showing fallback data');
      setLoading(false);
    }
  };

  const getNotificationCount = () => {
    if (!analysis) return 0;
    return (analysis.wastePrediction?.length || 0) + (analysis.doNotMake?.length || 0);
  };

  const getAllAlerts = () => {
    if (!analysis) return [];
    const alerts = [];
    
    if (analysis.wastePrediction) {
      analysis.wastePrediction.forEach(item => {
        alerts.push({ 
          ...item, 
          type: 'waste', 
          priority: 'high',
          name: item.item,
          description: item.reason,
          action: item.suggestedPrep
        });
      });
    }
    
    if (analysis.doNotMake) {
      analysis.doNotMake.forEach(item => {
        alerts.push({ 
          ...item, 
          type: 'avoid', 
          priority: 'medium',
          name: item.item,
          description: item.reason,
          action: 'Avoid preparation'
        });
      });
    }
    
    return alerts;
  };

  const handleAction = (action, item) => {
    console.log(`${action} for ${item.name || item.item}`);
    
    // Show confirmation for actions
    const actionMessages = {
      reduce: `Reduced preparation quantity for ${item.name}`,
      substitute: `Finding substitutes for ${item.name}`,
      ignore: `Ignored alert for ${item.name}`,
      implement: `Implementing suggestion for ${item.name}`
    };
    
    alert(actionMessages[action] || `Action taken for ${item.name}`);
    
    // Here you would implement the actual action logic
    // For example, update inventory, modify preparation plans, etc.
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'waste': return '🚨';
      case 'avoid': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'waste': return '#ef4444';
      case 'avoid': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const getAlertBackground = (type) => {
    switch(type) {
      case 'waste': return '#fef2f2';
      case 'avoid': return '#fffbeb';
      default: return '#f0f9ff';
    }
  };

  const getAlertBorder = (type) => {
    switch(type) {
      case 'waste': return '#fecaca';
      case 'avoid': return '#fde68a';
      default: return '#bae6fd';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        borderRadius: 12,
        textAlign: 'center',
        border: '1px solid rgba(224,231,255,0.6)'
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          border: '3px solid #e0e7ff', 
          borderTop: '3px solid #6366f1', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px auto'
        }}></div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
          Analyzing waste patterns...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fbbf24',
        borderRadius: 12,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
        <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '13px', fontWeight: 600 }}>{error}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            onClick={fetchWasteAnalysis}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#6366f1', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Retry AI Analysis
          </button>
          <button 
            onClick={() => {
              const fallbackAnalysis = {
                wastePrediction: [
                  {
                    item: "All perishable items",
                    suggestedPrep: "Reduce by 25%",
                    reason: "Conservative estimate while system recovers"
                  }
                ],
                doNotMake: [
                  {
                    item: "High-risk items",
                    reason: "Temporary system issue - proceed with caution"
                  }
                ]
              };
              setAnalysis(fallbackAnalysis);
              setError('');
            }}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#22c55e', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Use Fallback Data
          </button>
        </div>
      </div>
    );
  }

  const alerts = getAllAlerts();
  const totalAlerts = alerts.length;

  return (
    <div style={{ padding: '0' }}>
      {/* Summary Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #fbbf24'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '20px' }}>🚨</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>
              Smart Waste Analysis
            </div>
            <div style={{ fontSize: '11px', color: '#92400e', opacity: 0.8 }}>
              {totalAlerts > 0 ? `${totalAlerts} alerts detected` : 'No waste alerts'}
              {error && ' • Using fallback data'}
            </div>
          </div>
        </div>
        
        {totalAlerts > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              style={{ 
                padding: '4px 8px',
                background: currentSlide === 0 ? '#e2e8f0' : '#6366f1',
                color: currentSlide === 0 ? '#64748b' : 'white',
                border: 'none',
                borderRadius: 6,
                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentSlide(Math.min(totalAlerts - 1, currentSlide + 1))}
              disabled={currentSlide === totalAlerts - 1}
              style={{ 
                padding: '4px 8px',
                background: currentSlide === totalAlerts - 1 ? '#e2e8f0' : '#6366f1',
                color: currentSlide === totalAlerts - 1 ? '#64748b' : 'white',
                border: 'none',
                borderRadius: 6,
                cursor: currentSlide === totalAlerts - 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Alert Display */}
      {totalAlerts > 0 ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.9)', 
          borderRadius: 12, 
          padding: 16,
          border: '1px solid rgba(224,231,255,0.6)',
          marginBottom: '12px'
        }}>
          {alerts[currentSlide] && (
            <div>
              {/* Alert Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12 
              }}>
                <div style={{ 
                  fontSize: '16px',
                  color: getAlertColor(alerts[currentSlide].type)
                }}>
                  {getAlertIcon(alerts[currentSlide].type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#232946',
                    marginBottom: 2
                  }}>
                    {alerts[currentSlide].name}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#64748b',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {alerts[currentSlide].type === 'waste' ? 'High Waste Risk' : 'Avoid Preparation'}
                  </div>
                </div>
              </div>

              {/* Suggested Action */}
              {alerts[currentSlide].action && (
                <div style={{ 
                  background: '#f0f9ff',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 8,
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: '#0369a1',
                    marginBottom: 2
                  }}>
                    Recommended Action:
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#0369a1'
                  }}>
                    {alerts[currentSlide].action}
                  </div>
                </div>
              )}

              {/* Alert Content */}
              <div style={{ 
                background: getAlertBackground(alerts[currentSlide].type),
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                border: `1px solid ${getAlertBorder(alerts[currentSlide].type)}`
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: alerts[currentSlide].type === 'waste' ? '#991b1b' : '#92400e',
                  lineHeight: 1.4
                }}>
                  {alerts[currentSlide].description}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleAction('reduce', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  📉 Reduce Quantity
                </button>
                <button 
                  onClick={() => handleAction('substitute', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(251, 191, 36, 0.2)'
                  }}
                >
                  🔄 Find Substitute
                </button>
                <button 
                  onClick={() => handleAction('implement', alerts[currentSlide])}
                  style={{ 
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  ✅ Implement
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(255,255,255,0.8)', 
          borderRadius: 12, 
          padding: 16,
          border: '1px solid rgba(224,231,255,0.6)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e', marginBottom: 4 }}>
            No Waste Alerts
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            All items are within safe waste prediction limits
          </div>
        </div>
      )}

      {/* General Tips Section */}
      {analysis?.generalTips && analysis.generalTips.length > 0 && (
        <div style={{ 
          background: 'rgba(255,255,255,0.8)', 
          borderRadius: 12, 
          padding: 16,
          border: '1px solid rgba(224,231,255,0.6)',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 'bold', 
            color: '#6366f1',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            💡 General Waste Reduction Tips
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
            {analysis.generalTips.map((tip, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                • {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slider Indicators */}
      {totalAlerts > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 6,
          marginTop: 12
        }}>
          {alerts.map((_, index) => (
            <div 
              key={index}
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                background: index === currentSlide ? '#6366f1' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button 
          onClick={fetchWasteAnalysis}
          disabled={loading}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: loading ? '#e2e8f0' : '#6366f1', 
            color: loading ? '#64748b' : 'white', 
            border: 'none', 
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? '🔄 Analyzing...' : '🔄 Refresh Analysis'}
        </button>
      </div>
    </div>
  );
}