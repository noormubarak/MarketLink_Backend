import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShoppingBasket, FaTrash, FaPlus, FaMinus, FaArrowLeft,
  FaLeaf, FaStore, FaArrowRight, FaShoppingCart, FaSpinner,
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import './Cart.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount,
  } = useCart();

  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [pickupDate, setPickupDate] = useState('');
  const [pickupDay, setPickupDay] = useState('');
  const [pickupWindows, setPickupWindows] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const getAvailablePickupDates = () => {
    const windowsByDay = new Map(pickupWindows.map((window) => [window.day, window]));
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + index + 1);
      const day = DAYS[date.getDay()];
      const pickupWindow = windowsByDay.get(day);
      if (!pickupWindow) return null;

      const pad = (value) => String(value).padStart(2, '0');
      return {
        value: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        day,
        label: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        pickupWindow,
      };
    }).filter(Boolean);
  };

  const availablePickupDates = getAvailablePickupDates();

  const handleCheckout = async () => {
    const farmerId = cartItems[0]?.farmerId;
    if (!farmerId) {
      setAvailabilityError('Pickup availability is not available for this cart.');
      setPickupWindows([]);
      setStep('checkout');
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError('');
    setPickupDate('');
    setPickupDay('');
    try {
      const res = await api.get(`/farmers/${farmerId}`);
      const farmer = res.data.data || {};
      const savedWindows = farmer.pickupWindows || [];
      const windowsByDay = new Map(savedWindows.map((window) => [window.day, window]));
      const operatingDays = farmer.operatingDays?.length
        ? farmer.operatingDays
        : savedWindows.map((window) => window.day);
      const fallbackWindow = savedWindows[0];

      setPickupWindows(operatingDays.map((day) => windowsByDay.get(day) || ({
        day,
        startTime: fallbackWindow?.startTime || '',
        endTime: fallbackWindow?.endTime || '',
      })));
      setStep('checkout');
    } catch {
      setAvailabilityError('Could not load this farmer’s pickup dates. Please try again.');
      setPickupWindows([]);
      setStep('checkout');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setPickupDate(date);
    setPickupDay(availablePickupDates.find((option) => option.value === date)?.day || '');
  };

  // ============ PLACE ORDER ============
  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }
    if (!pickupDate) {
      setError('Please select a pickup date.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setError('');
    setPlacing(true);

    try {
      // Group items by farmer (backend expects a single farmer per order)
      // For simplicity, we'll send the first farmer's ID and all items
      // In production, you'd split into multiple orders
      const payload = {
        farmerId: cartItems[0].farmerId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        pickupDate: new Date(pickupDate).toISOString(),
        notes: notes.trim(),
      };

      const res = await api.post('/orders', payload);
      setPlacedOrder(res.data.data);
      clearCart();
      setStep('success');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to place order. Please try again.'
      );
    } finally {
      setPlacing(false);
    }
  };

  // ============ EMPTY CART ============
  if (cartItems.length === 0 && step !== 'success') {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <FaShoppingBasket className="cart-empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add some fresh products from local farmers to get started.</p>
          <Link to="/products" className="cart-empty-btn">
            <FaLeaf /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ============ SUCCESS ============
  if (step === 'success') {
    return (
      <div className="cart-page">
        <div className="order-success">
          <div className="success-icon-wrapper">
            <FaCheckCircle className="success-icon" />
          </div>
          <h2>Order Placed Successfully!</h2>
          <p>Your order has been sent to the farmer for review.</p>

          {placedOrder && (
            <div className="success-details">
              <div className="success-row">
                <span>Order ID</span>
                <strong>#{placedOrder._id?.slice(-8).toUpperCase()}</strong>
              </div>
              <div className="success-row">
                <span>Total Amount</span>
                <strong>Rs. {placedOrder.totalAmount}</strong>
              </div>
              <div className="success-row">
                <span>Pickup Date</span>
                <strong>
                  {new Date(placedOrder.pickupDate).toDateString()}
                </strong>
              </div>
              <div className="success-row">
                <span>Status</span>
                <strong className="status-badge">{placedOrder.status}</strong>
              </div>
            </div>
          )}

          <div className="success-actions">
            <Link to="/products" className="success-btn primary">
              <FaLeaf /> Continue Shopping
            </Link>
            <Link to="/customer" className="success-btn secondary">
              <FaShoppingCart /> My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ CHECKOUT STEP ============
  if (step === 'checkout') {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <button className="back-btn" onClick={() => setStep('cart')}>
            <FaArrowLeft /> Back to Cart
          </button>

          <h1 className="cart-title">Complete Your Order</h1>

          {error && <div className="cart-error">{error}</div>}

          <div className="checkout-grid">
            {/* LEFT: Order Summary */}
            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <div className="summary-items">
                {cartItems.map((item) => (
                  <div className="summary-item" key={item.productId}>
                    <div className="summary-item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <FaLeaf />
                      )}
                    </div>
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.name}</span>
                      <span className="summary-item-meta">
                        {item.quantity} × Rs. {item.price} / {item.unit}
                      </span>
                    </div>
                    <span className="summary-item-total">
                      Rs. {item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>Rs. {cartTotal}</strong>
              </div>
            </div>

            {/* RIGHT: Pickup Details */}
            <div className="checkout-form">
              <h2>Pickup Details</h2>

              <div className="form-group">
                <label>
                  <FaCalendarAlt /> Pickup Date
                </label>
                <select
                  className="pickup-date-select"
                  value={pickupDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={availabilityLoading || availablePickupDates.length === 0}
                  required
                >
                  <option value="">Choose an available date</option>
                  {availablePickupDates.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}{option.pickupWindow.startTime && option.pickupWindow.endTime
                        ? ` · ${option.pickupWindow.startTime}–${option.pickupWindow.endTime}`
                        : ''}
                    </option>
                  ))}
                </select>
                {availabilityLoading && <span className="pickup-day-hint">Loading available dates…</span>}
                {availabilityError && <span className="pickup-availability-message">{availabilityError}</span>}
                {!availabilityLoading && !availabilityError && availablePickupDates.length === 0 && (
                  <span className="pickup-availability-message">This farmer has no pickup dates available in the next 30 days.</span>
                )}
                {pickupDay && (
                  <span className="pickup-day-hint">
                    Selected day: <strong>{pickupDay}</strong>
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FaClock /> Notes (optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Any special instructions for the farmer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="checkout-info-box">
                <FaMapMarkerAlt />
                <span>
                  Payment is settled in person at the market during pickup.
                </span>
              </div>

              <button
                className="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={placing || !pickupDate}
              >
                {placing ? (
                  <>
                    <FaSpinner className="spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    Place Order — Rs. {cartTotal}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CART STEP ============
  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1 className="cart-title">
            <FaShoppingCart /> Your Cart
          </h1>
          <span className="cart-count">
            {cartCount} item{cartCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="cart-layout">
          {/* LEFT: Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="cart-item-placeholder">
                      <FaLeaf />
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  {item.farmerName && (
                    <span className="cart-item-farmer">
                      <FaStore /> {item.farmerName}
                    </span>
                  )}
                  <span className="cart-item-price">
                    Rs. {item.price} / {item.unit}
                  </span>
                </div>

                <div className="cart-item-controls">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    <FaMinus />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stockQuantity}
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="cart-item-total">
                  Rs. {item.price * item.quantity}
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.productId)}
                  title="Remove"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT: Cart Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {cartTotal}</span>
            </div>
            <div className="summary-row">
              <span>Items</span>
              <span>{cartCount}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total</span>
              <strong>Rs. {cartTotal}</strong>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={availabilityLoading}
            >
              {availabilityLoading ? <><FaSpinner className="spin" /> Loading Dates...</> : <>Proceed to Checkout <FaArrowRight /></>}
            </button>

            <Link to="/products" className="continue-shopping-link">
              <FaArrowLeft /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;