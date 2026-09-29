import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import About from './pages/About';
import AIChatWidget from './components/AIChatWidget';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import Markets from './pages/Markets';
import Farmers from './pages/Farmers';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import CustomerProfile from './pages/CustomerProfile';
import Notifications from './pages/Notifications';
import CustomerDashboard from './pages/CustomerDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import './App.css';

const Placeholder = ({ name }) => (
  <div style={{ padding: '80px 40px', textAlign: 'center', minHeight: '60vh' }}>
    <h1 style={{ color: '#1b5e20' }}>{name} Page</h1>
  </div>
);

function App() {
  const location = useLocation();
  const { user } = useAuth();

  if (user?.role === 'farmer' && location.pathname !== '/farmer') {
    return <Navigate to="/farmer" replace />;
  }

  // ✅ FIXED: exact paths + nested prefixes (NOT prefix-match on /farmer)
  // This ensures /farmers (public page) keeps navbar/footer,
  // but /farmer (dashboard) and /farmer/* hide them.
  const hideExact = ['/login', '/signup', '/admin', '/farmer', '/customer', '/notifications'];
  const hidePrefixes = ['/admin/', '/farmer/', '/customer/'];

  const shouldHideLayout =
    hideExact.includes(location.pathname) ||
    hidePrefixes.some((p) => location.pathname.startsWith(p));
  const showNavbar = !shouldHideLayout;

  const showAIWidget = !shouldHideLayout;

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<Placeholder name="About Us" />} />
        <Route path="/contact" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Contact />
          </ProtectedRoute>
        } />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/favorites" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Favorites />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerProfile />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={['customer', 'farmer', 'admin']}>
            <Notifications />
          </ProtectedRoute>
        } />

        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/farmer" element={
          <ProtectedRoute allowedRoles={['farmer']}>
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <div style={{ padding: '100px 40px', textAlign: 'center', minHeight: '60vh' }}>
            <h1 style={{ color: '#1b5e20', fontSize: '3rem' }}>404</h1>
            <p style={{ color: '#64748b', marginTop: 12 }}>Page not found</p>
          </div>
        } />
      </Routes>
      {!shouldHideLayout && <Footer />}

      {showAIWidget && <AIChatWidget />}
    </>
  );
}

export default App;