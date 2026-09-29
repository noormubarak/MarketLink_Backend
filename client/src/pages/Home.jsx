import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSearch, FaRegClock, FaCheckCircle, FaUsers, FaSeedling, FaBoxOpen, FaStar,
  FaLeaf, FaMapMarkerAlt, FaArrowRight
} from 'react-icons/fa';
import './Home.css';

// Photos load from Unsplash; if one fails the green panel behind it shows instead.
const HERO_PHOTO = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80';

const quick = ['Vegetables', 'Fruits', 'Dairy', 'Bakery'];

const steps = [
  { icon: <FaSearch />, title: 'Discover Local Produce', text: 'Browse fresh vegetables, fruits, dairy, and baked goods from farmers near you.' },
  { icon: <FaRegClock />, title: 'Pre-Order with Ease', text: 'Reserve your items ahead of time. Skip the lines and guarantee your basket.' },
  { icon: <FaCheckCircle />, title: 'Pickup Fresh & Ready', text: 'Grab your prepared basket at the market on your chosen day.' },
];

// NEW: Replaced Categories with Featured Farms
const featuredFarms = [
  { 
    id: 1,
    name: 'Green Valley Organics', 
    location: 'Karachi, Sindh', 
    tag: 'Organic',
    img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'
  },
  { 
    id: 2,
    name: 'Sunny Side Dairy', 
    location: 'Lahore, Punjab', 
    tag: 'Dairy',
    img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80'
  },
  { 
    id: 3,
    name: 'The Bread Basket', 
    location: 'Islamabad', 
    tag: 'Bakery',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  },
  { 
    id: 4,
    name: 'Fresh Harvest Co.', 
    location: 'Multan', 
    tag: 'Produce',
    img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
  },
];

const stats = [
  { icon: <FaSeedling />, number: '150+', label: 'Local farmers' },
  { icon: <FaUsers />, number: '5,000+', label: 'Happy customers' },
  { icon: <FaBoxOpen />, number: '25K+', label: 'Orders picked up' },
  { icon: <FaStar />, number: '4.9/5', label: 'Average rating' },
];

const Home = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <div className="home-page">
      {/* ============ 1. HERO ============ */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge"><FaLeaf /> Farm fresh, every day</span>
            <h1 className="hero-title">Fresh food from farmers near you.</h1>
            <p className="hero-description">
              Order ahead, skip the queue, and pick up your basket
              at your local market.
            </p>

            <form className="hero-search" onSubmit={handleSearch} role="search">
              <FaSearch className="hero-search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to eat today?"
                aria-label="Search products"
              />
              <button type="submit">Search</button>
            </form>

            <div className="hero-chips">
              <span>Popular:</span>
              {quick.map((q) => (
                <Link key={q} to={`/products?category=${q}`} className="chip">{q}</Link>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-arch">
              <img src={HERO_PHOTO} alt="Fresh vegetables at a market stall"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="hero-float hero-float-top">
              <span className="float-icon"><FaSeedling /></span>
              <div><strong>Picked this morning</strong><small>Straight from the farm</small></div>
            </div>
            <div className="hero-float hero-float-bottom">
              <span className="float-icon float-orange"><FaStar /></span>
              <div><strong>4.9 / 5 rating</strong><small>5,000+ happy families</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. HOW IT WORKS ============ */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How MarketLink works</h2>
          <p className="section-subtitle">Three easy steps from the farm to your table.</p>
        </div>
        <div className="cards-container">
          {steps.map((s, i) => (
            <div className="how-card" key={s.title}>
              <span className="how-step">{i + 1}</span>
              <div className="card-icon-wrapper">{s.icon}</div>
              <h3 className="card-title">{s.title}</h3>
              <p className="card-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 3. FEATURED FARMS (NEW REDESIGN) ============ */}
      <section className="farms-section">
        <div className="farms-header-wrapper">
          <div className="farms-header-left">
            <h2 className="section-title">Meet Your Local Farmers</h2>
            <p className="section-subtitle">Support local businesses and get the freshest food possible.</p>
          </div>
          <Link to="/farmers" className="view-all-link">Explore All Farms <FaArrowRight /></Link>
        </div>
        <div className="farms-grid">
          {featuredFarms.map((farm) => (
            <Link to={`/farmers/${farm.id}`} className="farm-card" key={farm.id}>
              <div className="farm-image-wrapper">
                <img src={farm.img} alt={farm.name} />
                <span className="farm-tag">{farm.tag}</span>
              </div>
              <div className="farm-info">
                <h3>{farm.name}</h3>
                <p><FaMapMarkerAlt /> {farm.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ 4. STATS ============ */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon-wrapper">{s.icon}</div>
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 5. CTA ============ */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to taste the freshest local produce?</h2>
          <p className="cta-subtitle">Join hundreds of families supporting local farmers and eating healthier.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-cta-primary">Create an account</Link>
            <Link to="/about" className="btn-cta-secondary">Learn more</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;