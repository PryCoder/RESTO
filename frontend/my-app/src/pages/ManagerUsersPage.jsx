import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ManagerUsersPage() {
  const [users, setUsers] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Get user info and all users for the restaurant
        const [userRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/me', { headers }),
          axios.get('http://localhost:5000/api/auth/', { headers }),
        ]);

        setRestaurantName(userRes.data.user?.restaurant?.name || 'Restaurant');
        
        // Filter users to only show those from the same restaurant
        const currentUser = userRes.data.user;
        const allUsers = usersRes.data;
        const restaurantUsers = allUsers.filter(user => 
          user.restaurant && 
          user.restaurant._id === currentUser.restaurant._id
        );
        
        setUsers(restaurantUsers);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Could not load users data');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard/manager/new');
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/me', { headers }),
        axios.get('http://localhost:5000/api/auth/', { headers }),
      ]);

      const currentUser = userRes.data.user;
      const allUsers = usersRes.data;
      const restaurantUsers = allUsers.filter(user => 
        user.restaurant && 
        user.restaurant._id === currentUser.restaurant._id
      );
      
      setUsers(restaurantUsers);
    } catch (err) {
      console.error('Failed to refresh users:', err);
      setError('Could not refresh users data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(user => user.role === filterRole);

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return '#dc3545';
      case 'waiter': return '#007bff';
      case 'kitchen': return '#fd7e14';
      case 'vendor': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'waiter': return 'Waiter';
      case 'kitchen': return 'Kitchen Staff';
      case 'vendor': return 'Vendor';
      default: return role;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>User Management - {restaurantName}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleRefresh}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
          <button 
            onClick={handleBackToDashboard}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#495057' }}>Connected Users ({filteredUsers.length})</h3>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #dee2e6', 
              borderRadius: '5px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Roles</option>
            <option value="manager">Managers</option>
            <option value="waiter">Waiters</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            <p>No users found with the selected role.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredUsers.map((user) => (
              <div 
                key={user._id}
                style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>{user.name}</h4>
                  <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>{user.email}</p>
                  <span 
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: getRoleColor(user.role), 
                      color: 'white', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: '#6c757d', fontSize: '14px' }}>
                  <p style={{ margin: 0 }}>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  {user.table && <p style={{ margin: '5px 0 0 0' }}>Table: {user.table}</p>}
                  <button
                    style={{
                      marginTop: '10px',
                      padding: '6px 14px',
                      backgroundColor: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '10px'
      }}>
        <h4 style={{ marginBottom: '15px', color: '#495057' }}>User Management Tips</h4>
        <ul style={{ textAlign: 'left', color: '#6c757d' }}>
          <li>All users connected to your restaurant are listed above</li>
          <li>Use the role filter to view specific types of users</li>
          <li>Users can join your restaurant by scanning the QR code</li>
          <li>New users will appear here once they successfully join</li>
        </ul>
      </div>
    </div>
  );
} 