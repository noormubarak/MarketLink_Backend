import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell, FaCheck, FaCheckDouble, FaShoppingBag, FaCheckCircle,
  FaTruck, FaTimesCircle, FaLeaf, FaSpinner
} from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Get icon + color based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return { icon: <FaShoppingBag />, color: 'orange' };
      case 'order_accepted':
        return { icon: <FaCheck />, color: 'blue' };
      case 'order_ready':
        return { icon: <FaTruck />, color: 'purple' };
      case 'order_completed':
        return { icon: <FaCheckCircle />, color: 'green' };
      case 'order_declined':
      case 'order_cancelled':
        return { icon: <FaTimesCircle />, color: 'red' };
      default:
        return { icon: <FaLeaf />, color: 'green' };
    }
  };

  // Relative time formatting
  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.link) navigate(notif.link);
    setIsOpen(false);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notif-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllAsRead}>
                <FaCheckDouble /> Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="notif-dropdown-body">
            {loading && notifications.length === 0 ? (
              <div className="notif-loading">
                <FaSpinner className="notif-spin" /> Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="notif-empty">
                <FaBell className="notif-empty-icon" />
                <p>No notifications yet</p>
                <span>You'll see updates here</span>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const { icon, color } = getNotificationIcon(notif.type);
                return (
                  <button
                    key={notif._id}
                    className={notif.isRead ? 'notif-item' : 'notif-item unread'}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`notif-item-icon notif-icon-${color}`}>
                      {icon}
                    </div>
                    <div className="notif-item-body">
                      <p className="notif-item-message">{notif.message}</p>
                      <span className="notif-item-time">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {!notif.isRead && <span className="notif-item-dot" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="notif-dropdown-footer">
              <button onClick={handleViewAll}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;