import React, { useState } from 'react';
import { FaTimes, FaStar, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import api from '../api/axios';
import './WriteReviewModal.css';

const WriteReviewModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/reviews', {
        orderId: order._id,
        rating,
        comment: comment.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrm-overlay" onClick={onClose}>
      <div className="wrm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wrm-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="wrm-header">
          <div className="wrm-icon">
            <FaStar />
          </div>
          <h2>Write a Review</h2>
          <p>
            Order <strong>#{order._id?.slice(-6).toUpperCase()}</strong>
          </p>
        </div>

        {error && <div className="wrm-error">{error}</div>}

        <form onSubmit={handleSubmit} className="wrm-form">
          {/* Item preview */}
          <div className="wrm-item">
            <div className="wrm-item-image">
              {order.items?.[0]?.imageUrl ? (
                <img src={order.items[0].imageUrl} alt={order.items[0].name} />
              ) : (
                <FaStar />
              )}
            </div>
            <div className="wrm-item-info">
              <span className="wrm-item-name">{order.items?.[0]?.name}</span>
              {order.items?.length > 1 && (
                <span className="wrm-item-more">
                  +{order.items.length - 1} more item{order.items.length - 1 !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Star rating */}
          <div className="wrm-form-group">
            <label>Your Rating</label>
            <div className="wrm-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="wrm-star-btn"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <FaStar
                    className={
                      star <= (hoverRating || rating)
                        ? 'wrm-star active'
                        : 'wrm-star'
                    }
                  />
                </button>
              ))}
              <span className="wrm-rating-text">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="wrm-form-group">
            <label>Your Review (optional)</label>
            <textarea
              rows="4"
              placeholder="Tell others about the quality, freshness, and your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <span className="wrm-char-count">{comment.length}/500</span>
          </div>

          <div className="wrm-actions">
            <button
              type="button"
              className="wrm-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wrm-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><FaSpinner className="spin" /> Submitting...</>
              ) : (
                <><FaCheckCircle /> Submit Review</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;