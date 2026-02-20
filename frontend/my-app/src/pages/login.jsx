import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const cardRef = useRef();
  const navigate = useNavigate();

  const API_URL =  'http://localhost:4000';

  // Card parallax tilt
  const handleCardMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * -8;
    setCardStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.012)`
    });
  };
  const handleCardMouseLeave = () => {
    setCardStyle({ transform: 'rotateX(0deg) rotateY(0deg) scale(1)' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (data.user.role === 'manager') {
          navigate(`/dashboard/manager/${data.user.restaurant || 'new'}`);
        } else if (data.user.role === 'vendor') {
          navigate('/dashboard/vendor');
        } else if (data.user.role === 'kitchen') {
          navigate('/dashboard/kitchen');
        } else if (data.user.role === 'customer') {
          navigate('/restaurants'); // Redirect customers to the new homepage
        } else {
          navigate('/dashboard/waiter');
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      setShowError(true);
    }
  };

  return (
    <div className="login-bg-2028">
      <div className="login-floating-shape shape1" />
      <div className="login-floating-shape shape2" />
      {/* Artistic animated accent orb */}
      <div className="login-accent-orb" />
      <div
        className="login-card-2028 login-card-art"
        ref={cardRef}
        style={cardStyle}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className="login-logo-2028 logo-shimmer">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="27" cy="27" r="26" stroke="#06B6D4" strokeWidth="2.5" fill="url(#grad)" />
            <path d="M18 32C18 26 36 26 36 32" stroke="#ff5fcb" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="23" r="2.5" fill="#06B6D4" />
            <circle cx="32" cy="23" r="2.5" fill="#ff5fcb" />
            <defs>
              <radialGradient id="grad" cx="0.5" cy="0.5" r="0.7">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#e0f7fa" />
              </radialGradient>
            </defs>
          </svg>
          <span>Resto AI</span>
          <div className="logo-shimmer-anim" />
        </div>
        <h2 className="login-title-2028">Sign in to your account</h2>
        <form className="login-form-2028" onSubmit={handleSubmit} autoComplete="on">
          <div className="login-input-group">
            <span className="login-input-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 6.5l7.5 5 7.5-5" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="#06B6D4" strokeWidth="1.5"/></svg>
            </span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="login-input-2028 login-float-input"
              autoFocus
            />
            <label className={`login-float-label ${form.email ? 'active' : ''}`}>Email</label>
          </div>
          <div className="login-input-group">
            <span className="login-input-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#ff5fcb" strokeWidth="1.5"/><path d="M10 12v2" stroke="#ff5fcb" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="#ff5fcb" strokeWidth="1.5"/></svg>
            </span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="login-input-2028 login-float-input"
            />
            <label className={`login-float-label ${form.password ? 'active' : ''}`}>Password</label>
          </div>
          <button type="submit" className="login-btn-2028 login-btn-art">
            <span>Login</span>
          </button>
        </form>
        {showError && (
          <div className={`login-alert-2028 show login-alert-art`}>
            <span className="login-alert-icon">⚠️</span>
            {error}
          </div>
        )}
        <div className="login-bottom-2028">
          <span>Don't have an account?</span>
          <a href="/register" className="login-link-2028">Register here</a>
        </div>
      </div>
    </div>
  );
}