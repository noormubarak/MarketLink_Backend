import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaLeaf, FaBars, FaTimes, FaSignOutAlt, FaTachometerAlt,
  FaShoppingCart, FaHeart, FaUser, FaBell
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'farmer') return '/farmer';
    return '/customer';
  };

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  // Removed "Contact" — shortened "About Us" → "About"
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Markets', path: '/markets' },
    { name: 'Farmers', path: '/farmers' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
  ];

  const showCart = !user || user.role === 'customer';
  const showNotifications = !!user;
  const showFavorites = user?.role === 'customer';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LEFT: Logo */}
        <Link to="/" className="navbar-logo">
          <FaLeaf /> <span>MarketLink</span>
        </Link>

        {/* MIDDLE: Nav Links */}
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          {navLinks.map((link, index) => (
            <li key={index} className="nav-item">
              <Link
                to={link.path}
                className={location.pathname === link.path ? 'nav-links active-link' : 'nav-links'}
              >
                {link.name}
              </Link>
            </li>
          ))}

          {/* Mobile-only actions inside menu */}
          <div className="nav-auth-mobile">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="btn-dashboard-mobile">
                  <FaTachometerAlt /> Dashboard
                </Link>

                <Link to="/notifications" className="btn-dashboard-mobile">
                  <FaBell /> Notifications
                  {unreadCount > 0 && (
                    <span className="btn-mobile-badge">{unreadCount}</span>
                  )}
                </Link>

                {user.role === 'customer' && (
                  <>
                    <Link to="/profile" className="btn-dashboard-mobile">
                      <FaUser /> My Profile
                    </Link>
                    <Link to="/favorites" className="btn-dashboard-mobile">
                      <FaHeart /> My Favorites
                    </Link>
                  </>
                )}

                <div className="user-info-mobile">
                  <div className="user-avatar">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} />
                    ) : (
                      getUserInitial()
                    )}
                  </div>
                  <span>{user.name}</span>
                </div>

                <button onClick={handleLogout} className="btn-logout-mobile">
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </>
            )}
          </div>
        </ul>

        {/* RIGHT: Actions */}
        <div className="nav-auth">
          {/* Cart */}
          {showCart && (
            <Link to="/cart" className="nav-icon-btn" title="Cart">
              <FaShoppingCart />
              {cartCount > 0 && <span className="nav-icon-badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <>
              {showNotifications && (
                <Link to="/notifications" className="nav-icon-btn" title="Notifications">
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="nav-icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </Link>
              )}

              {showFavorites && (
                <Link to="/favorites" className="nav-icon-btn nav-icon-fav" title="My Favorites">
                  <FaHeart />
                </Link>
              )}

              <div className="user-menu">
                <Link
                  to={user.role === 'customer' ? '/profile' : getDashboardLink()}
                  className="user-info"
                >
                  <div className="user-avatar">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} />
                    ) : (
                      getUserInitial()
                    )}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                </Link>

                <button onClick={handleLogout} className="btn-logout" title="Logout">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="menu-icon" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;