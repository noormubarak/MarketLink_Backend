import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaLeaf, FaSeedling, FaUsers, FaHandshake, FaStar,
  FaHeart, FaArrowRight
} from 'react-icons/fa';
import './About.css';

const About = () => {
  const values = [
    {
      icon: <FaSeedling />,
      title: 'Support Local Farmers',
      desc: 'Every purchase directly supports small-scale farmers in your community, keeping money within the local economy.',
    },
    {
      icon: <FaLeaf />,
      title: 'Fresh & Seasonal',
      desc: 'Products are harvested at peak ripeness and delivered fresh — no long supply chains, no cold storage weeks.',
    },
    {
      icon: <FaHandshake />,
      title: 'Fair & Transparent',
      desc: 'Farmers set their own prices. Customers see exactly where their food comes from and who grew it.',
    },
    {
      icon: <FaHeart />,
      title: 'Community First',
      desc: 'We build tools that strengthen the relationship between farmers, markets, and the families they feed.',
    },
  ];

  return (
    <div className="about-page">
      {/* ============ HERO ============ */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-hero-badge">
            <FaLeaf /> Our Story
          </span>
          <h1 className="about-hero-title">
            Bridging the Gap Between{' '}
            <span className="about-highlight">Farmers</span> and{' '}
            <span className="about-highlight">Families</span>
          </h1>
          <p className="about-hero-subtitle">
            MarketLink was born from a simple idea: everyone deserves access to
            fresh, locally-grown food — and every farmer deserves a fair shot at
            reaching the people who need it most.
          </p>
          <div className="about-hero-buttons">
            <Link to="/products" className="about-btn-primary">
              Browse Products <FaArrowRight />
            </Link>
            <Link to="/farmers" className="about-btn-secondary">
              Meet Our Farmers
            </Link>
          </div>
        </div>
        <div className="about-hero-decoration">
          <div className="about-hero-circle about-hero-circle-1" />
          <div className="about-hero-circle about-hero-circle-2" />
          <div className="about-hero-circle about-hero-circle-3" />
        </div>
      </section>

      {/* ============ MISSION ============ */}
      <section className="about-mission">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-section-subtitle">
              To build a transparent, sustainable, and community-driven food
              system where local farmers thrive and families eat better.
            </p>
          </div>
          <div className="about-mission-grid">
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <FaSeedling />
              </div>
              <h3>Empower Farmers</h3>
              <p>
                Give small-scale farmers the digital tools they need to reach
                more customers, manage orders efficiently, and grow their
                business without middlemen.
              </p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <FaUsers />
              </div>
              <h3>Feed Communities</h3>
              <p>
                Make it effortless for families to access fresh, affordable,
                seasonal produce grown by people they know and trust.
              </p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <FaStar />
              </div>
              <h3>Build Trust</h3>
              <p>
                Every review, every order, every interaction is transparent.
                Customers know exactly where their food comes from — and farmers
                know exactly who they're feeding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUES ============ */}
      <section className="about-values">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2 className="about-section-title">What We Stand For</h2>
            <p className="about-section-subtitle">
              These principles guide every decision we make.
            </p>
          </div>
          <div className="about-values-grid">
            {values.map((value, index) => (
              <div className="about-value-card" key={index}>
                <div className="about-value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;