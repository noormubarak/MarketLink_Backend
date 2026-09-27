import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell, FaCheck, FaCheckDouble, FaShoppingBag, FaCheckCircle,
  FaTruck, FaTimesCircle, FaLeaf, FaSpinner, FaFilter, FaArrowLeft
} from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread | read

  const getIcon = (type) => {
    switch (type) {
      case 'order_placed': return { icon: <FaShoppingBag />, color: 'orange' };
      case 'order_accepted': return { icon: <FaCheck />, color: 'blue' };
      case 'order_ready': return { icon: <FaTruck />, color: 'purple' };
      case 'order_completed': return { icon: <FaCheckCircle />, color: 'green' };
      case 'order_declined':
      case 'order_cancelled': return { icon: <FaTimesCircle />, color: 'red' };
      default: return { icon: <FaLeaf />, color: 'green' };
    }
  };

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="notif-page">
      <div className="notif-page-container">
        {/* Header */}
        <div className="notif-page-header">
          <button className="notif-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <div className="notif-page-title">
            <FaBell className="notif-page-icon" />
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="notif-page-badge">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="notif-page-mark-all" onClick={markAllAsRead}>
              <FaCheckDouble /> Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="notif-filters">
          <button
            className={filter === 'all' ? 'notif-filter active' : 'notif-filter'}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={filter === 'unread' ? 'notif-filter active' : 'notif-filter'}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={filter === 'read' ? 'notif-filter active' : 'notif-filter'}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* List */}
        {loading && notifications.length === 0 ? (
          <div className="notif-page-loading">
            <FaSpinner className="notif-page-spinner" />
            <p>Loading your notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-page-empty">
            <FaBell className="notif-page-empty-icon" />
            <h3>No notifications</h3>
            <p>
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? 'No read notifications yet.'
                : 'You will see updates about your orders here.'}
            </p>
          </div>
        ) : (
          <div className="notif-page-list">
            {filtered.map((notif) => {
              const { icon, color } = getIcon(notif.type);
              return (
                <button
                  key={notif._id}
                  className={notif.isRead ? 'notif-page-item' : 'notif-page-item unread'}
                  onClick={() => handleClick(notif)}
                >
                  <div className={`notif-page-item-icon notif-icon-${color}`}>
                    {icon}
                  </div>
                  <div className="notif-page-item-body">
                    <p className="notif-page-item-message">{notif.message}</p>
                    <span className="notif-page-item-time">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.isRead && <span className="notif-page-item-dot" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;