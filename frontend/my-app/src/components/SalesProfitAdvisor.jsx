import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function SalesProfitAdvisor({ restaurantId, userRole, orders = [] }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [realTimeData, setRealTimeData] = useState(true);

  // Calculate dynamic sales data from actual orders
  const calculateSalesData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todaySales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdaySales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= yesterday && orderDate < today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekSales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= lastWeek && orderDate < today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0) / 7;

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      lastWeekAvg: Math.round(lastWeekSales),
      comparison: todaySales > 0 && yesterdaySales > 0 ? 
        ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : 0
    };
  };

  const salesData = calculateSalesData();
  
  const getChartData = () => {
    switch(timeRange) {
      case 'week':
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = weekDays.map((day, index) => {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - (6 - index));
          const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          
          const daySales = orders
            .filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= dayStart && orderDate < dayEnd;
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
          return {
            name: day,
            Sales: daySales || 0,
            fill: index === 6 ? '#6366f1' : '#fbbf24'
          };
        });
        return weekData;

      case 'month':
        const monthData = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - i);
          
          const daySales = orders
            .filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate.getDate() === targetDate.getDate() && 
                     orderDate.getMonth() === targetDate.getMonth() &&
                     orderDate.getFullYear() === targetDate.getFullYear();
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
          monthData.push({
            name: targetDate.getDate().toString(),
            Sales: daySales,
            fill: i === 0 ? '#6366f1' : '#fbbf24'
          });
        }
        return monthData;

      default:
        return [
          { name: 'Yesterday', Sales: salesData.yesterday, fill: '#fbbf24' },
          { name: 'Today', Sales: salesData.today, fill: '#6366f1' },
        ];
    }
  };

  const chartData = getChartData();

  useEffect(() => {
    if (restaurantId || orders.length > 0) {
      fetchProfitAnalysis();
    } else {
      const calculatedAnalysis = calculateProfitFromOrders();
      setAnalysis(calculatedAnalysis);
      setLoading(false);
    }
  }, [restaurantId, orders.length, timeRange]);

  useEffect(() => {
    if (!realTimeData) return;
    
    const interval = setInterval(() => {
      if (orders.length > 0) {
        const updatedAnalysis = calculateProfitFromOrders();
        setAnalysis(prev => ({
          ...prev,
          ...updatedAnalysis
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeData, orders]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [loading]);

  const calculateProfitFromOrders = () => {
    const currentSalesData = calculateSalesData();
    let totalCost = 0;
    let totalRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders
      .filter(order => new Date(order.createdAt) >= today)
      .forEach(order => {
        totalRevenue += order.totalAmount || 0;
        totalCost += (order.totalAmount || 0) * 0.6;
      });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const tips = generateDynamicTips(currentSalesData, profitMargin, orders);

    return {
      profit: `₹${Math.max(0, profit).toLocaleString('en-IN')}`,
      totalSales: `₹${totalRevenue.toLocaleString('en-IN')}`,
      tip: tips,
      profitMargin: Math.round(profitMargin),
      comparison: currentSalesData.comparison
    };
  };

  const generateDynamicTips = (salesData, profitMargin, orders) => {
    const tips = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const avgOrderValue = todayOrders.length > 0 ? salesData.today / todayOrders.length : 0;

    if (salesData.comparison > 0) {
      tips.push(`Great! Sales are up ${salesData.comparison}% from yesterday - maintain this momentum`);
    } else if (salesData.comparison < 0) {
      tips.push(`Sales are down ${Math.abs(salesData.comparison)}% from yesterday - consider promotions`);
    }

    if (profitMargin < 20) {
      tips.push(`Low profit margin (${Math.round(profitMargin)}%) - focus on high-margin items and reduce waste`);
    } else if (profitMargin > 35) {
      tips.push(`Excellent profit margin (${Math.round(profitMargin)}%) - consider reinvesting in quality improvements`);
    }

    if (avgOrderValue < 500) {
      tips.push(`Low average order value (₹${Math.round(avgOrderValue)}) - train staff on upselling techniques`);
    }

    const currentHour = new Date().getHours();
    if (currentHour >= 14 && currentHour <= 17 && salesData.today < salesData.lastWeekAvg) {
      tips.push(`Slow afternoon hours - consider offering happy hour specials`);
    }

    if (todayOrders.length > 0) {
      const popularItems = {};
      todayOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            popularItems[item.name] = (popularItems[item.name] || 0) + (item.quantity || 1);
          });
        }
      });
      
      const mostPopular = Object.entries(popularItems).sort((a, b) => b[1] - a[1])[0];
      if (mostPopular) {
        tips.push(`"${mostPopular[0]}" is your bestseller today - ensure adequate stock`);
      }
    }

    return tips.length > 0 ? tips.join('. ') : 
      'Focus on customer experience and quality consistency to drive repeat business';
  };

  const fetchProfitAnalysis = async () => {
    setLoading(true);
    setProgress(0);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const recentOrders = orders
        .filter(order => new Date(order.createdAt) >= today)
        .slice(0, 100);

      // Fixed API endpoint
      const response = await axios.post(
        `${API_URL}/api/ai/sales-profit-advisor`, // Changed from /api/ai/salesprofit
        {
          voiceInput: `Analyze sales performance for ${timeRange} with ${recentOrders.length} orders`,
          restaurantId: restaurantId,
          orders: recentOrders,
          timeRange: timeRange,
          currentSales: salesData.today
        },
        { 
          headers,
          timeout: 15000
        }
      );

      if (response.data && (response.data.profit || response.data.totalSales)) {
        setAnalysis(response.data);
      } else {
        setAnalysis(calculateProfitFromOrders());
      }
      setLoading(false);
    } catch (err) {
      console.error('Profit analysis error:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Using calculated data.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Using calculated data.');
      } else {
        setError('AI analysis unavailable - using calculated data');
      }
      
      setAnalysis(calculateProfitFromOrders());
      setLoading(false);
    }
  };

  const calculateProfitPercentage = () => {
    if (!analysis) return 0;
    
    try {
      if (analysis.profitMargin !== undefined) {
        return analysis.profitMargin;
      }

      const salesText = analysis.totalSales || '0';
      const profitText = analysis.profit || '0';
      
      const sales = parseInt(salesText.toString().replace(/[₹,]/g, '')) || 0;
      const profit = parseInt(profitText.toString().replace(/[₹,]/g, '')) || 0;
      
      if (sales === 0) return 0;
      return Math.round((profit / sales) * 100);
    } catch (error) {
      console.error('Error calculating profit percentage:', error);
      return 0;
    }
  };

  const getProfitColor = (percentage) => {
    if (percentage >= 35) return '#22c55e';
    if (percentage >= 20) return '#fbbf24';
    return '#ef4444';
  };

  const formatCurrency = (amount) => {
    if (typeof amount === 'number') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return amount || '₹0';
  };

  if (error && !analysis) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '14px' }}>{error}</p>
        <button 
          onClick={fetchProfitAnalysis}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>
          Profit Advisor
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'white'
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">Last 30 Days</option>
          </select>

          <button
            onClick={() => setRealTimeData(!realTimeData)}
            style={{
              padding: '4px 8px',
              backgroundColor: realTimeData ? '#22c55e' : '#e2e8f0',
              color: realTimeData ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {realTimeData ? '🟢 Live' : '⚪ Paused'}
          </button>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        background: 'linear-gradient(135deg, #6366f1 0%, #fbbf24 100%)', 
        borderRadius: 12, 
        padding: 16, 
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
        position: 'relative'
      }}>
        {error && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#dc2626'
          }}>
            Calculated Data
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 8 
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
            Sales Performance
          </div>
          {salesData.comparison !== 0 && (
            <div style={{ 
              fontSize: '12px', 
              color: '#fff', 
              fontWeight: 600,
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {salesData.comparison > 0 ? '↗' : '↘'} {Math.abs(salesData.comparison)}%
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={timeRange === 'today' ? 40 : 24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#fff', fontWeight: 600, fontSize: 11 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fill: '#fff', fontWeight: 600, fontSize: 10 }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
              contentStyle={{ 
                background: '#fff', 
                borderRadius: 8, 
                color: '#232946', 
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} 
            />
            <Bar dataKey="Sales" radius={[4,4,0,0]} fill="#fff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px', 
        marginBottom: '16px'
      }}>
        <div style={{ 
          background: '#f8fafc', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            Today's Sales
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6366f1' }}>
            {formatCurrency(salesData.today)}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8fafc', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
            Daily Average
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
            {formatCurrency(salesData.lastWeekAvg)}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        gap: '8px'
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: getProfitColor(calculateProfitPercentage()),
            minHeight: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {loading ? `${progress}%` : (analysis?.profit || '₹0')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            {loading ? 'Analyzing...' : 'Profit'}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#6366f1',
            minHeight: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {analysis?.totalSales || '₹0'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Total Sales
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: getProfitColor(calculateProfitPercentage()),
            minHeight: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {calculateProfitPercentage()}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Margin
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {analysis?.tip && !loading && (
          <button 
            onClick={() => setShowTipModal(true)}
            style={{ 
              flex: 1,
              padding: '8px 12px', 
              background: 'linear-gradient(135deg, #6366f1, #fbbf24)',
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            💡 Smart Tips
          </button>
        )}

        <button 
          onClick={fetchProfitAnalysis}
          disabled={loading}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: loading ? '#e2e8f0' : '#6366f1', 
            color: loading ? '#64748b' : 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {loading ? `🔄 ${progress}%` : '🔍 Analyze'}
        </button>
      </div>

      {showTipModal && analysis?.tip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px',
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button 
              onClick={() => setShowTipModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#64748b',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ 
                margin: 0, 
                color: '#6366f1', 
                fontSize: 18, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 Smart Profit Tips
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 12 }}>
                Based on your current performance
              </p>
            </div>
            
            <div style={{ 
              flex: 1,
              maxHeight: 300, 
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {analysis.tip.split('.').filter(point => point.trim()).map((point, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  marginBottom: 12,
                  gap: 8,
                  padding: '8px',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginTop: 2, flexShrink: 0 }}>
                    •
                  </span>
                  <p style={{ margin: 0, color: '#232946', fontSize: 13, lineHeight: 1.4, fontWeight: 500 }}>
                    {point.trim()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}