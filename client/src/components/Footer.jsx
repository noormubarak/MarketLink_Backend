import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLeaf, 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaMapMarkerAlt,
  FaArrowRight
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* TOP SECTION */}
        <div className="footer-top">
          
          {/* Column 1: Brand */}
          <div className="footer-col footer-brand">
            <Link to="/" className="footer-logo">
              <FaLeaf /> <span>MarketLink</span>
            </Link>
            <p className="footer-brand-text">
              Connecting local farmers with families for fresher, 
              healthier, and more sustainable food. Farm fresh, just a click away.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-icon" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" className="social-icon" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" className="social-icon" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" className="social-icon" aria-label="LinkedIn"><FaLinkedinIn /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/markets">Markets</Link></li>
              <li><Link to="/farmers">Farmers</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">Categories</h4>
            <ul className="footer-links">
              <li><Link to="/products?category=Vegetables">Vegetables</Link></li>
              <li><Link to="/products?category=Fruits">Fruits</Link></li>
              <li><Link to="/products?category=Dairy">Dairy</Link></li>
              <li><Link to="/products?category=Bakery">Bakery</Link></li>
              <li><Link to="/products">All Products</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact - UPDATED WITH WHATSAPP & EMAIL LINKS */}
          <div className="footer-col">
            <h4 className="footer-heading">Get in Touch</h4>
            <ul className="footer-contact">
              <li><FaMapMarkerAlt /> Saddar, Karachi, Pakistan</li>
              <li>
                <FaPhoneAlt /> 
                <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
                  +92 300 1234567
                </a>
              </li>
              <li>
                <FaEnvelope /> 
                <a href="mailto:hello@marketlink.com">
                  hello@marketlink.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* NEWSLETTER BAR */}
        <div className="footer-newsletter">
          <div className="newsletter-text">
            <h4>Subscribe to our newsletter</h4>
            <p>Get the latest updates on fresh arrivals and local markets.</p>
          </div>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-btn">
              Subscribe <FaArrowRight />
            </button>
          </form>
        </div>

        {/* BOTTOM BAR */}
        <div className="footer-bottom">
          <p>© {currentYear} <span className="footer-highlight">MarketLink</span>. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="divider">|</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;