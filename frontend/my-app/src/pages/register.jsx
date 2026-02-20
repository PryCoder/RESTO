import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'manager', restaurantName: '', phone: '' });
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const cardRef = useRef();
  const navigate = useNavigate();

  // API URL from environment or default
  const API_URL = 'http://localhost:4000';

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register/initiate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStep('otp');
        setLoading(false);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Email OTP Error:', err);
      setError(err.message || 'Failed to send OTP email. Please try again.');
      setShowError(true);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          otp: otp
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('User created successfully:', data);
        navigate('/login');
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'OTP verification failed. Please check your code and try again.');
      setShowError(true);
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-bg-2028">
        <div className="register-floating-shape shape1" />
        <div className="register-floating-shape shape2" />
        <div className="register-accent-orb" />
        
        <div
          className="register-card-2028 register-card-art"
          ref={cardRef}
          style={cardStyle}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="register-logo-2028 logo-shimmer">
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
          
          {step === 'register' && (
            <>
              <h2 className="register-title-2028">Create Your Account</h2>
              <form className="register-form-2028" onSubmit={handleRegister}>
                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM4 18a6 6 0 0112 0" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="register-input-2028 register-float-input"
                  />
                  <label className={`register-float-label ${form.name ? 'active' : ''}`}>Name</label>
                </div>

                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M2.5 6.5l7.5 5 7.5-5" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="#06B6D4" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="register-input-2028 register-float-input"
                  />
                  <label className={`register-float-label ${form.email ? 'active' : ''}`}>Email</label>
                </div>

                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <rect x="4" y="9" width="12" height="8" rx="2" stroke="#06B6D4" strokeWidth="1.5"/>
                      <path d="M7 9V6a3 3 0 016 0v3" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="register-input-2028 register-float-input"
                  />
                  <label className={`register-float-label ${form.phone ? 'active' : ''}`}>Phone Number</label>
                </div>

                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <rect x="4" y="8" width="12" height="8" rx="2" stroke="#ff5fcb" strokeWidth="1.5"/>
                      <path d="M10 12v2" stroke="#ff5fcb" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="10" cy="10" r="3" stroke="#ff5fcb" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="register-input-2028 register-float-input"
                  />
                  <label className={`register-float-label ${form.password ? 'active' : ''}`}>Password</label>
                </div>

                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <rect x="3" y="7" width="14" height="10" rx="2" stroke="#8B5CF6" strokeWidth="1.5"/>
                      <path d="M7 7V5a3 3 0 016 0v2" stroke="#8B5CF6" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="register-select-2028"
                  >
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                    <option value="vendor">Vendor</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>

                {form.role === 'manager' && (
                  <div className="register-input-group">
                    <span className="register-input-icon">
                      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                        <path d="M4 8h12M4 12h12M6 16h8" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="3" y="4" width="14" height="13" rx="2" stroke="#06B6D4" strokeWidth="1.5"/>
                      </svg>
                    </span>
                    <input
                      name="restaurantName"
                      type="text"
                      value={form.restaurantName}
                      onChange={handleChange}
                      required
                      className="register-input-2028 register-float-input"
                    />
                    <label className={`register-float-label ${form.restaurantName ? 'active' : ''}`}>Restaurant Name</label>
                  </div>
                )}

                <button type="submit" disabled={loading} className="register-btn-2028">
                  <span>{loading ? 'Sending OTP...' : 'Register & Get OTP'}</span>
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="register-otp-header">
                <span className="register-otp-icon">📧</span>
                <h3 className="register-otp-title">Check Your Email</h3>
                <p className="register-otp-text">
                  We sent a 6-digit OTP to <strong>{form.email}</strong>
                </p>
              </div>
              
              <form className="register-form-2028" onSubmit={handleVerifyOtp}>
                <div className="register-input-group">
                  <span className="register-input-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M10 2v4M10 14v4M18 10h-4M6 10H2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="10" cy="10" r="3" stroke="#10b981" strokeWidth="1.5"/>
                    </svg>
                  </span>
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    className="register-input-2028 register-float-input"
                    style={{ letterSpacing: '0.3em', textAlign: 'center' }}
                  />
                  <label className={`register-float-label ${otp ? 'active' : ''}`}>Enter OTP</label>
                </div>
                <p className="register-helper-text">Enter the 6-digit code sent to your email</p>

                <button type="submit" disabled={loading} className="register-btn-2028">
                  <span>{loading ? 'Verifying...' : 'Verify OTP & Create Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(''); setShowError(false); }}
                  className="register-btn-2028 register-btn-secondary"
                >
                  ← Back to Registration
                </button>
              </form>
            </>
          )}

          {showError && (
            <div className={`register-alert-2028 show`}>
              <span className="register-alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="register-bottom-2028">
            <span>Already have an account?</span>
            <a href="/login" className="register-link-2028">Login here</a>
          </div>
        </div>
      </div>
    </div>
  );
}