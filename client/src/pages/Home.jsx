import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaRegClock, FaCheckCircle, FaUsers, FaSeedling, FaBoxOpen, FaStar } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const stats = [
    { icon: <FaSeedling />, number: '150+', label: 'Local Farmers', desc: 'Growing fresh produce in your community' },
    { icon: <FaUsers />, number: '5,000+', label: 'Happy Customers', desc: 'Families shopping fresh every week' },
    { icon: <FaBoxOpen />, number: '25K+', label: 'Orders Delivered', desc: 'Fresh baskets picked up with a smile' },
    { icon: <FaStar />, number: '4.9/5', label: 'Average Rating', desc: 'Loved by farmers and customers alike' },
  ];

  return (
    <div className="home-page">
      
      {/* ============ SECTION 1: HERO ============ */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text-wrapper">
            <span className="hero-badge">🌱 100% Farm Fresh</span>
            <h1 className="hero-title">
              Fresh From Local Farms, <br />
              <span className="highlight">Just a Click Away.</span>
            </h1>
            <p className="hero-description">
              Skip the market lines. Pre-order the freshest seasonal produce, 
              dairy, and baked goods directly from local farmers.
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn-primary">Browse Products</Link>
              <Link to="/markets" className="btn-secondary">Explore Markets</Link>
            </div>
          </div>
        </div>
        <div className="hero-image-container">
          <img 
            src="https://img.freepik.com/free-vector/flat-design-farmers-market-illustration_23-2149261729.jpg" 
            alt="Farmers market illustration" 
            className="hero-image"
          />
        </div>
      </section>

      {/* ============ SECTION 2: HOW IT WORKS ============ */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How MarketLink Works</h2>
          <p className="section-subtitle">Getting fresh, local food has never been easier.</p>
        </div>
        <div className="cards-container">
          <div className="card">
            <div className="card-icon-wrapper"><FaSearch className="card-icon" /></div>
            <h3 className="card-title">Discover Local Produce</h3>
            <p className="card-text">Browse fresh vegetables, fruits, dairy, and baked goods from farmers near you.</p>
          </div>
          <div className="card">
            <div className="card-icon-wrapper"><FaRegClock className="card-icon" /></div>
            <h3 className="card-title">Pre-Order with Ease</h3>
            <p className="card-text">Reserve your items ahead of time. Skip the lines and guarantee your basket.</p>
          </div>
          <div className="card">
            <div className="card-icon-wrapper"><FaCheckCircle className="card-icon" /></div>
            <h3 className="card-title">Pickup Fresh & Ready</h3>
            <p className="card-text">Grab your prepared basket at the market on your chosen day.</p>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: STATS (NEW LIGHT DESIGN) ============ */}
      <section className="stats-section">
        <div className="stats-header">
          <h2 className="stats-title">MarketLink in Numbers</h2>
          <p className="stats-subtitle">
            A growing community of farmers and families building a fresher, healthier tomorrow.
          </p>
        </div>

        <div className="stats-container">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-icon-wrapper">
                {stat.icon}
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-desc">{stat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SECTION 4: CTA ============ */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Taste the Freshest Local Produce?</h2>
          <p className="cta-subtitle">Join hundreds of families supporting local farmers and eating healthier.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-cta-primary">Create an Account</Link>
            <Link to="/about" className="btn-cta-secondary">Learn More</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;