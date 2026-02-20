import React, { useEffect, useState } from 'react';
import './HomePage.css';
import PizzaHero3D from '../components/PizzaHero3D';

// Premium Icons Import (using Lucide React for professional icons)
import { 
  Brain, 
  Bot, 
  TrendingUp, 
  Mic, 
  AlertCircle, 
  Users, 
  BarChart3, 
  Clock,
  CheckCircle,
  DollarSign,
  Shield,
  Zap,
  Sparkles,
  ChefHat,
  ShoppingCart,
  Bell,
  MessageSquare,
  LogIn,
  UserPlus
} from 'lucide-react';

const HomePage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const parallaxStyle = {
    transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
  };

  return (
    <div className="chefmind-premium">
      {/* Advanced Background Elements */}
      <div className="premium-bg-gradient" />
      <div className="particle-field" />
      
      {/* Animated Grid Background */}
      <div className="grid-bg" style={parallaxStyle}>
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
      </div>
      
      {/* Floating Geometric Shapes */}
      <div className="floating-shape shape-1" />
      <div className="floating-shape shape-2" />
      <div className="floating-shape shape-3" />
      <div className="floating-shape shape-4" />
      
      {/* Glowing Orbs */}
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <div className="glow-orb orb-3" />

      {/* Premium Navigation */}
      <nav className="premium-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">
              <ChefHat size={28} />
            </div>
            <span className="logo-text">Resto<span className="logo-accent">AI</span></span>
            <div className="logo-badge">PRO</div>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link">
              <Zap size={16} />
              <span>Features</span>
            </a>
            <a href="#how-it-works" className="nav-link">
              <BarChart3 size={16} />
              <span>How It Works</span>
            </a>
            <a href="#pricing" className="nav-link">
              <DollarSign size={16} />
              <span>Pricing</span>
            </a>
            <a href="#testimonials" className="nav-link">
              <Users size={16} />
              <span>Testimonials</span>
            </a>
          </div>
          
          <div className="nav-actions">
            <a href="/login" className="nav-btn secondary">
              <MessageSquare size={16} />
              <span>Business Sign In</span>
            </a>
            <a href="/register" className="nav-btn primary">
              <Sparkles size={16} />
              <span>Get Started Free</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <section className="premium-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              <span className="badge-text">For Restaurant Owners</span>
            </div>
            
            <h1 className="hero-title">
              <span className="title-line">The Future of</span>
              <span className="title-line gradient-text">Restaurant Intelligence</span>
              <span className="title-line">Is Here</span>
            </h1>
            
            <p className="hero-subtitle">
              AI-powered insights that predict demand, prevent waste, and maximize profits 
              in real-time. Transform your kitchen with predictive analytics.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">40%</div>
                <div className="stat-label">Waste Reduction</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-value">25%</div>
                <div className="stat-label">Profit Increase</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-value">98%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
            </div>
            
            <div className="hero-actions">
              <a href="/register" className="hero-btn primary">
                <Sparkles size={20} />
                <span>Start Free Trial</span>
                <div className="btn-glow" />
              </a>
              <a href="#demo" className="hero-btn secondary">
                <Bot size={20} />
                <span>Watch Demo</span>
              </a>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="visual-container">
              <div className="visual-card">
                <div className="card-glass">
                  <div className="dashboard-preview">
                    {/* Dashboard Visualization */}
                    <div className="dashboard-header">
                      <div className="dashboard-title">Live Analytics</div>
                      <div className="dashboard-badge realtime">
                        <div className="pulse-dot" />
                        LIVE
                      </div>
                    </div>
                    
                    <div className="dashboard-metrics">
                      <div className="metric-card">
                        <div className="metric-icon">
                          <TrendingUp size={20} />
                        </div>
                        <div className="metric-content">
                          <div className="metric-value">$12,450</div>
                          <div className="metric-label">Today's Revenue</div>
                        </div>
                      </div>
                      
                      <div className="metric-card">
                        <div className="metric-icon">
                          <ShoppingCart size={20} />
                        </div>
                        <div className="metric-content">
                          <div className="metric-value">-23%</div>
                          <div className="metric-label">Waste Reduced</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="dashboard-chart">
                      <div className="chart-line" style={{ height: '60%' }} />
                      <div className="chart-line" style={{ height: '40%' }} />
                      <div className="chart-line" style={{ height: '80%' }} />
                      <div className="chart-line" style={{ height: '30%' }} />
                      <div className="chart-line" style={{ height: '70%' }} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="floating-notification">
                <Bell size={16} />
                <span>Low stock alert: Tomatoes</span>
              </div>
              
              <div className="floating-notification success">
                <CheckCircle size={16} />
                <span>Prediction: +15% sales tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Callout Section */}
      <section className="premium-customer-cta">
        <div className="customer-cta-container">
          <div className="customer-cta-content">
            <h2 className="customer-cta-title">Looking for Food?</h2>
            <p className="customer-cta-description">
              Browse local restaurants, discover new dishes, and order your next meal with ease.
            </p>
            <div className="customer-cta-actions">
              <a href="/restaurants" className="customer-cta-btn">Browse Restaurants</a>
              <a href="/customer-login" className="customer-cta-btn secondary">
                <LogIn size={16} /> Customer Login
              </a>
              <a href="/customer-register" className="customer-cta-btn secondary">
                <UserPlus size={16} /> Customer Sign Up
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium */}
      <section id="features" className="premium-features">
        <div className="section-header">
          <div className="section-badge">POWERFUL FEATURES</div>
          <h2 className="section-title">Intelligent Kitchen Management</h2>
          <p className="section-description">
            Advanced AI capabilities designed specifically for the modern restaurant
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon-bg">
                <Brain size={24} />
              </div>
            </div>
            <h3 className="feature-title">Predictive Analytics</h3>
            <p className="feature-description">
              AI-powered demand forecasting that analyzes historical data, weather, 
              and events to predict exactly what you'll need.
            </p>
            <div className="feature-tags">
              <span className="tag">ML Algorithms</span>
              <span className="tag">Real-time</span>
            </div>
          </div>
          
          <div className="feature-card highlighted">
            <div className="feature-icon-container">
              <div className="feature-icon-bg">
                <Bot size={24} />
              </div>
            </div>
            <h3 className="feature-title">Auto Inventory</h3>
            <p className="feature-description">
              Smart inventory tracking with automated ordering and waste alerts. 
              Never run out or overstock again.
            </p>
            <div className="feature-tags">
              <span className="tag">Automation</span>
              <span className="tag">Smart Alerts</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon-bg">
                <Mic size={24} />
              </div>
            </div>
            <h3 className="feature-title">Voice Control</h3>
            <p className="feature-description">
              Hands-free operation with natural language processing. Update sales, 
              check inventory, and get insights by just speaking.
            </p>
            <div className="feature-tags">
              <span className="tag">NLP</span>
              <span className="tag">Hands-free</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon-bg">
                <AlertCircle size={24} />
              </div>
            </div>
            <h3 className="feature-title">Risk Alerts</h3>
            <p className="feature-description">
              Proactive notifications for potential issues before they affect 
              your business. Stay ahead of problems.
            </p>
            <div className="feature-tags">
              <span className="tag">Predictive</span>
              <span className="tag">Proactive</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Premium */}
      <section id="how-it-works" className="premium-workflow">
        <div className="section-header">
          <div className="section-badge">SIMPLE WORKFLOW</div>
          <h2 className="section-title">From Chaos to Control in 4 Steps</h2>
        </div>
        
        <div className="workflow-steps">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">
              <ShoppingCart size={24} />
            </div>
            <h3 className="step-title">Connect Inventory</h3>
            <p className="step-description">
              Sync your current inventory or start fresh with our smart tracking
            </p>
          </div>
          
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-arrow">→</div>
          </div>
          
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">
              <Mic size={24} />
            </div>
            <h3 className="step-title">Voice Input</h3>
            <p className="step-description">
              Speak your sales and updates naturally—no typing needed
            </p>
          </div>
          
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-arrow">→</div>
          </div>
          
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">
              <Brain size={24} />
            </div>
            <h3 className="step-title">AI Analysis</h3>
            <p className="step-description">
              Our algorithms process data and generate actionable insights
            </p>
          </div>
          
          <div className="step-connector">
            <div className="connector-line" />
            <div className="connector-arrow">→</div>
          </div>
          
          <div className="step-card">
            <div className="step-number">04</div>
            <div className="step-icon">
              <Bell size={24} />
            </div>
            <h3 className="step-title">Smart Decisions</h3>
            <p className="step-description">
              Receive precise recommendations for ordering and preparation
            </p>
          </div>
        </div>
      </section>

      {/* 3D Pizza Visualization */}
      <section className="premium-visualization">
        <div className="visualization-container">
          <PizzaHero3D />
          <div className="visualization-content">
            <h2 className="visualization-title">See Your Data Come Alive</h2>
            <p className="visualization-description">
              Interactive 3D visualizations of your restaurant's performance metrics. 
              Watch as patterns emerge and opportunities reveal themselves.
            </p>
            <div className="visualization-stats">
              <div className="viz-stat">
                <div className="viz-stat-value">360°</div>
                <div className="viz-stat-label">Data View</div>
              </div>
              <div className="viz-stat">
                <div className="viz-stat-value">Real-time</div>
                <div className="viz-stat-label">Updates</div>
              </div>
              <div className="viz-stat">
                <div className="viz-stat-value">Interactive</div>
                <div className="viz-stat-label">Exploration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Premium */}
      <section id="testimonials" className="premium-testimonials">
        <div className="section-header">
          <div className="section-badge">TRUSTED BY INDUSTRY LEADERS</div>
          <h2 className="section-title">Success Stories</h2>
        </div>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-quote">"</div>
            <p className="testimonial-text">
              RestoAI transformed how we manage inventory. We reduced food waste by 
              42% in the first month alone. The predictive analytics are incredibly accurate.
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">RC</div>
              <div className="author-info">
                <div className="author-name">Rajesh Chopra</div>
                <div className="author-role">Owner, Spice Route Mumbai</div>
              </div>
            </div>
            <div className="testimonial-rating">★★★★★</div>
          </div>
          
          <div className="testimonial-card highlighted">
            <div className="testimonial-quote">"</div>
            <p className="testimonial-text">
              The voice input feature is revolutionary. Our kitchen staff can update 
              sales without leaving their stations. Efficiency has improved dramatically.
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">SP</div>
              <div className="author-info">
                <div className="author-name">Shweta Patel</div>
                <div className="author-role">Head Chef, Urban Kitchen Delhi</div>
              </div>
            </div>
            <div className="testimonial-rating">★★★★★</div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">"</div>
            <p className="testimonial-text">
              As a multi-location operator, the centralized dashboard gives me 
              real-time visibility across all restaurants. Decision-making has never been easier.
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">AK</div>
              <div className="author-info">
                <div className="author-name">Amit Kumar</div>
                <div className="author-role">CEO, FoodChain India</div>
              </div>
            </div>
            <div className="testimonial-rating">★★★★★</div>
          </div>
        </div>
      </section>

      {/* Pricing - Premium */}
      <section id="pricing" className="premium-pricing">
        <div className="section-header">
          <div className="section-badge">FLEXIBLE PLANS</div>
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-description">
            Start with our free plan and upgrade as you grow
          </p>
        </div>
        
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="plan-badge">STARTER</div>
            <div className="plan-price">
              <span className="price-currency">$</span>
              <span className="price-amount">0</span>
              <span className="price-period">/month</span>
            </div>
            <p className="plan-description">Perfect for small restaurants getting started</p>
            
            <div className="plan-features">
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Basic inventory tracking</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Weekly waste reports</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Email support</span>
              </div>
            </div>
            
            <a href="/register" className="plan-btn">Get Started Free</a>
          </div>
          
          <div className="pricing-card popular">
            <div className="popular-badge">MOST POPULAR</div>
            <div className="plan-badge">PROFESSIONAL</div>
            <div className="plan-price">
              <span className="price-currency">$</span>
              <span className="price-amount">49</span>
              <span className="price-period">/month</span>
            </div>
            <p className="plan-description">For growing restaurants that need advanced features</p>
            
            <div className="plan-features">
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>AI demand forecasting</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Voice input & control</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Multi-location support</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Priority support</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Advanced analytics</span>
              </div>
            </div>
            
            <a href="/register" className="plan-btn primary">Start 14-Day Trial</a>
          </div>
          
          <div className="pricing-card">
            <div className="plan-badge">ENTERPRISE</div>
            <div className="plan-price">
              <span className="price-currency">$</span>
              <span className="price-amount">199</span>
              <span className="price-period">/month</span>
            </div>
            <p className="plan-description">For large restaurant chains and franchises</p>
            
            <div className="plan-features">
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Everything in Professional</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Custom integrations</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Dedicated account manager</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>API access</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>On-premise deployment</span>
              </div>
            </div>
            
            <a href="#contact" className="plan-btn">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="premium-cta">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Restaurant?</h2>
            <p className="cta-description">
              Join thousands of restaurants already using RestoAI to reduce waste, 
              increase profits, and make smarter decisions every day.
            </p>
            
            <div className="cta-actions">
              <a href="/register" className="cta-btn primary">
                <Sparkles size={20} />
                <span>Start Your Free Trial</span>
                <div className="btn-glow" />
              </a>
              <a href="#demo" className="cta-btn secondary">
                <span>Schedule a Demo</span>
              </a>
            </div>
            
            <div className="cta-assurance">
              <div className="assurance-item">
                <Shield size={16} />
                <span>No credit card required</span>
              </div>
              <div className="assurance-item">
                <Clock size={16} />
                <span>14-day free trial</span>
              </div>
              <div className="assurance-item">
                <Users size={16} />
                <span>24/7 support included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer className="premium-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <ChefHat size={24} />
                <span>Resto<span className="logo-accent">AI</span></span>
              </div>
              <p className="footer-tagline">
                Intelligent restaurant management powered by AI
              </p>
              <div className="footer-social">
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">LinkedIn</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">GitHub</a>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="link-group">
                <h4 className="link-title">Product</h4>
                <a href="#features" className="link-item">Features</a>
                <a href="#how-it-works" className="link-item">How It Works</a>
                <a href="#pricing" className="link-item">Pricing</a>
                <a href="#demo" className="link-item">Demo</a>
              </div>
              
              <div className="link-group">
                <h4 className="link-title">Company</h4>
                <a href="#about" className="link-item">About Us</a>
                <a href="#careers" className="link-item">Careers</a>
                <a href="#blog" className="link-item">Blog</a>
                <a href="#press" className="link-item">Press</a>
              </div>
              
              <div className="link-group">
                <h4 className="link-title">Resources</h4>
                <a href="#docs" className="link-item">Documentation</a>
                <a href="#help" className="link-item">Help Center</a>
                <a href="#community" className="link-item">Community</a>
                <a href="#contact" className="link-item">Contact</a>
              </div>
              
              <div className="link-group">
                <h4 className="link-title">Legal</h4>
                <a href="#privacy" className="link-item">Privacy Policy</a>
                <a href="#terms" className="link-item">Terms of Service</a>
                <a href="#cookies" className="link-item">Cookie Policy</a>
                <a href="#compliance" className="link-item">Compliance</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="copyright">
              © {new Date().getFullYear()} RestoAI. All rights reserved.
            </div>
            <div className="footer-extra">
              <span>Made with ❤️ for restaurateurs worldwide</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;