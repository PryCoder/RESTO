import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

export default function MonthlySalesGraph({ orders = [] }) {
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Generate monthly sales data for the last 6 months
    const generateMonthlyData = () => {
      const data = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Calculate sales for this month from orders
        const monthSales = orders
          .filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === targetDate.getMonth() && 
                   orderDate.getFullYear() === targetDate.getFullYear();
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        data.push({
          month: monthName,
          sales: monthSales,
          target: Math.floor(Math.random() * 50000) + 20000 // Mock target for demo
        });
      }
      
      setMonthlyData(data);
    };

    generateMonthlyData();
  }, [orders]);

  const totalSales = monthlyData.reduce((sum, item) => sum + item.sales, 0);
  const avgSales = totalSales / monthlyData.length;

  return (
    <div style={{ padding: '0' }}>
      {/* Summary Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        borderRadius: 12,
        padding: 12
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6366f1' }}>
            ₹{totalSales.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Total Sales
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>
            ₹{avgSales.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Avg/Month
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
            {monthlyData.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Months
          </div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div style={{ 
        background: 'linear-gradient(135deg, #6366f1 0%, #fbbf24 100%)', 
        borderRadius: 12, 
        padding: 16, 
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
        marginBottom: '12px'
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
          Monthly Sales Trend
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#fff', fontWeight: 600, fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fill: '#fff', fontWeight: 600, fontSize: 11 }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={v => `₹${v.toLocaleString()}`} 
              contentStyle={{ 
                background: '#fff', 
                borderRadius: 8, 
                color: '#232946', 
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#fff" 
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ fill: '#fff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Insights */}
      <div style={{ 
        background: 'rgba(255,255,255,0.8)', 
        borderRadius: 10, 
        padding: 12,
        border: '1px solid rgba(224,231,255,0.6)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 6 }}>
          📈 Quick Insights
        </div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
          {monthlyData.length > 0 && (
            <>
              {monthlyData[monthlyData.length - 1].sales > monthlyData[monthlyData.length - 2].sales ? 
                'Sales are trending upward this month' : 
                'Consider promotional strategies to boost sales'
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
} 