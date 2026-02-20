import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: null,
    longitude: null
  });
  const [editRestaurantLocation, setEditRestaurantLocation] = useState(false);
  const [restaurantLocationForm, setRestaurantLocationForm] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: null,
    longitude: null
  });
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/customer-login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${VITE_API_URL}/api/auth/${id}`, { headers });
        setUser(res.data);
        setForm({
          name: res.data.name || '',
          phone: res.data.phone || ''
        });
        
        // Set restaurant location if exists
        if (res.data.restaurant && res.data.restaurant.location) {
          setRestaurantLocationForm({
            address: res.data.restaurant.location.address || '',
            city: res.data.restaurant.location.city || '',
            state: res.data.restaurant.location.state || '',
            zipCode: res.data.restaurant.location.zipCode || '',
            country: res.data.restaurant.location.country || '',
            latitude: res.data.restaurant.location.latitude || null,
            longitude: res.data.restaurant.location.longitude || null
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Could not load user profile');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id, navigate, VITE_API_URL]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`${VITE_API_URL}/api/auth/${id}`, form, { headers });
      setUser(prev => ({
        ...prev,
        name: form.name,
        phone: form.phone
      }));
      localStorage.setItem('user', JSON.stringify({ ...user, name: form.name, phone: form.phone }));
      setEditMode(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const updatedAddresses = [...(user.addresses || []), newAddress];
      
      await axios.patch(`${VITE_API_URL}/api/auth/${id}`, 
        { addresses: updatedAddresses }, 
        { headers }
      );
      
      setUser(prev => ({
        ...prev,
        addresses: updatedAddresses
      }));
      
      setNewAddress({
        label: 'Home',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        latitude: null,
        longitude: null
      });
      setShowAddressForm(false);
    } catch (err) {
      alert('Failed to add address');
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const updatedAddresses = user.addresses.filter((_, i) => i !== index);
      
      await axios.patch(`${VITE_API_URL}/api/auth/${id}`, 
        { addresses: updatedAddresses }, 
        { headers }
      );
      
      setUser(prev => ({
        ...prev,
        addresses: updatedAddresses
      }));
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const handleUpdateRestaurantLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.patch(`${VITE_API_URL}/api/auth/${id}`, 
        { location: restaurantLocationForm }, 
        { headers }
      );
      
      setUser(prev => ({
        ...prev,
        restaurant: {
          ...prev.restaurant,
          location: restaurantLocationForm
        }
      }));
      setEditRestaurantLocation(false);
    } catch (err) {
      alert('Failed to update restaurant location');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/customer-login');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}>Loading profile...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!user || !user.name || !user.email) return <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}>User not found or incomplete data.</div>;

  const isStaff = ['manager', 'waiter', 'kitchen', 'vendor'].includes(user.role);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'DM Sans, Sora, sans-serif',
      background: theme === 'dark' ? 'linear-gradient(120deg, #18181b 0%, #232946 100%)' : 'linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      transition: 'background 0.3s',
      padding: '40px 20px'
    }}>
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 10000,
        background: theme === 'dark' ? '#232946' : '#fff',
        color: theme === 'dark' ? '#FFD600' : '#6366f1',
        border: 'none',
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px #23294622',
        cursor: 'pointer',
        fontSize: 26,
        transition: 'background 0.2s, color 0.2s',
      }}>
        {theme === 'dark' ? <LightModeIcon fontSize="medium" /> : <DarkModeIcon fontSize="medium" />}
      </button>

      {/* Profile Card */}
      <div style={{
        background: theme === 'dark' ? 'rgba(36,37,46,0.98)' : 'rgba(255,255,255,0.96)',
        borderRadius: 40,
        boxShadow: theme === 'dark' ? '0 8px 48px #18181b88' : '0 8px 48px #6366f122',
        width: '100%',
        maxWidth: 720,
        padding: '0 0 48px 0',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
        color: theme === 'dark' ? '#e0e7ff' : '#232946',
      }}>
        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(90deg,#6366f1,#818cf8)',
          padding: '48px 0 32px 0',
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#818cf8 60%,#fbbf24 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            fontWeight: 700,
            margin: '0 auto 18px auto',
            letterSpacing: 2,
          }}>
            {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: '1.18rem', color: '#e0e7ff', marginTop: 6 }}>
            {user.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '40px 48px 0 48px' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: 28, fontSize: 19 }}>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>Email:</span>
            <span style={{ color: '#64748b', marginLeft: 14 }}>{user.email || '--'}</span>
          </div>

          <div style={{ marginBottom: 28, fontSize: 19 }}>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>Name:</span>
            {editMode ? (
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ fontSize: 17, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginLeft: 14, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
              />
            ) : (
              <span style={{ color: '#64748b', marginLeft: 14 }}>{user.name || '--'}</span>
            )}
          </div>

          <div style={{ marginBottom: 28, fontSize: 19 }}>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>Phone:</span>
            {editMode ? (
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ fontSize: 17, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginLeft: 14, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
              />
            ) : (
              <span style={{ color: '#64748b', marginLeft: 14 }}>{user.phone || '--'}</span>
            )}
          </div>

          {/* Edit Buttons */}
          {editMode ? (
            <div style={{ marginBottom: 32 }}>
              <button onClick={handleSave} style={{ 
                marginRight: 8, 
                background: '#22c55e', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '10px 20px', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Save Changes
              </button>
              <button onClick={() => { 
                setEditMode(false); 
                setForm({ name: user.name || '', phone: user.phone || '' }); 
              }} style={{ 
                background: '#e5e7eb', 
                color: '#232946', 
                border: 'none', 
                borderRadius: 8, 
                padding: '10px 20px', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setEditMode(true)} style={{ 
              background: '#e0e7ff', 
              color: '#6366f1', 
              border: 'none', 
              borderRadius: 8, 
              padding: '10px 20px', 
              fontWeight: 700, 
              cursor: 'pointer',
              marginBottom: 32,
              fontSize: '1rem'
            }}>
              Edit Profile
            </button>
          )}

          {/* Restaurant Location Section (for staff/manager) */}
          {isStaff && user.restaurant && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.3rem', fontWeight: 700 }}>📍 Restaurant: {user.restaurant.name}</h3>
                {user.role === 'manager' && !editRestaurantLocation && (
                  <button
                    onClick={() => setEditRestaurantLocation(true)}
                    style={{
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Edit Location
                  </button>
                )}
              </div>

              {editRestaurantLocation ? (
                <div style={{
                  background: theme === 'dark' ? '#1f2937' : '#f8fafc',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={restaurantLocationForm.address}
                    onChange={e => setRestaurantLocationForm({...restaurantLocationForm, address: e.target.value})}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      marginBottom: 12,
                      fontSize: 15,
                      background: theme === 'dark' ? '#232946' : '#fff',
                      color: theme === 'dark' ? '#e0e7ff' : '#232946'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="City"
                      value={restaurantLocationForm.city}
                      onChange={e => setRestaurantLocationForm({...restaurantLocationForm, city: e.target.value})}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={restaurantLocationForm.state}
                      onChange={e => setRestaurantLocationForm({...restaurantLocationForm, state: e.target.value})}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={restaurantLocationForm.zipCode}
                      onChange={e => setRestaurantLocationForm({...restaurantLocationForm, zipCode: e.target.value})}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={restaurantLocationForm.country}
                      onChange={e => setRestaurantLocationForm({...restaurantLocationForm, country: e.target.value})}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleUpdateRestaurantLocation}
                      style={{
                        background: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 20px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flex: 1,
                        fontSize: '1rem'
                      }}
                    >
                      Save Location
                    </button>
                    <button
                      onClick={() => setEditRestaurantLocation(false)}
                      style={{
                        background: '#e5e7eb',
                        color: '#232946',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 20px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flex: 1,
                        fontSize: '1rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: theme === 'dark' ? '#1f2937' : '#f8fafc',
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                }}>
                  {user.restaurant.location ? (
                    <>
                      <div style={{ color: theme === 'dark' ? '#e5e7eb' : '#1f2937', fontSize: '1rem', marginBottom: 4 }}>
                        {user.restaurant.location.address || 'No street address'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {user.restaurant.location.city}{user.restaurant.location.city && user.restaurant.location.state ? ', ' : ''}{user.restaurant.location.state} {user.restaurant.location.zipCode}
                        {user.restaurant.location.country ? ` - ${user.restaurant.location.country}` : ''}
                      </div>
                      {user.restaurant.location.latitude && user.restaurant.location.longitude && (
                        <div style={{ color: '#6366f1', fontSize: '0.85rem', marginTop: 8 }}>
                          📍 Lat: {user.restaurant.location.latitude}, Lng: {user.restaurant.location.longitude}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                      No location information available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Addresses Section */}
          {user.role === 'customer' && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#6366f1', fontSize: '1.2rem', fontWeight: 700 }}>📍 Saved Addresses</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  style={{
                    background: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {showAddressForm ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              {showAddressForm && (
                <div style={{
                  background: theme === 'dark' ? '#1f2937' : '#f8fafc',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                  <select
                    value={newAddress.label}
                    onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      marginBottom: 12,
                      fontSize: 15,
                      background: theme === 'dark' ? '#232946' : '#fff',
                      color: theme === 'dark' ? '#e0e7ff' : '#232946'
                    }}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={newAddress.address}
                    onChange={e => setNewAddress({...newAddress, address: e.target.value})}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      marginBottom: 12,
                      fontSize: 15,
                      background: theme === 'dark' ? '#232946' : '#fff',
                      color: theme === 'dark' ? '#e0e7ff' : '#232946'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={newAddress.zipCode}
                      onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={newAddress.country}
                      onChange={e => setNewAddress({...newAddress, country: e.target.value})}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 15, background: theme === 'dark' ? '#232946' : '#fff', color: theme === 'dark' ? '#e0e7ff' : '#232946' }}
                    />
                  </div>
                  <button
                    onClick={handleAddAddress}
                    style={{
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '1rem'
                    }}
                  >
                    Save Address
                  </button>
                </div>
              )}

              {user.addresses && user.addresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {user.addresses.map((addr, index) => (
                    <div key={index} style={{
                      background: theme === 'dark' ? '#1f2937' : '#f8fafc',
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ 
                            display: 'inline-block',
                            background: '#6366f1',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            marginBottom: 8
                          }}>
                            {addr.label}
                          </div>
                          <div style={{ color: theme === 'dark' ? '#e5e7eb' : '#1f2937', fontSize: '1rem', marginBottom: 4 }}>
                            {addr.address}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {addr.city}{addr.city && addr.state ? ', ' : ''}{addr.state} {addr.zipCode}
                            {addr.country ? ` - ${addr.country}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(index)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
                  No saved addresses yet. Add one to get started!
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: 40, fontSize: 15, color: '#b0b4c0', textAlign: 'center', paddingTop: 24, borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
            <div style={{ marginBottom: 12 }}>
              <strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '--'}
            </div>
            <div>User ID: {user._id || '--'}</div>
          </div>

          <button onClick={handleLogout} style={{
            width: '100%',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 32,
            fontSize: '1rem'
          }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}