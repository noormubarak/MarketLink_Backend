import React, { useState, useEffect } from 'react';
import { FaStar, FaQuoteLeft, FaLeaf, FaSpinner, FaReply } from 'react-icons/fa';
import api from '../api/axios';
import './ReviewsSection.css';

const ReviewsSection = ({ productId, farmerId, title = 'Customer Reviews' }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let url = '';
        if (productId) url = `/reviews/product/${productId}`;
        else if (farmerId) url = `/reviews/farmer/${farmerId}`;
        else return;

        const res = await api.get(url);
        setReviews(res.data.data || []);
      } catch (err) {
        console.error('Fetch reviews error:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId, farmerId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const renderStars = (rating) => (
    [...Array(5)].map((_, i) => (
      <FaStar key={i} className={i < rating ? 'star filled' : 'star'} />
    ))
  );

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const getInitials = (name) =>
    name
      ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
      : '?';

  if (loading) {
    return (
      <div className="reviews-section">
        <div className="reviews-loading">
          <FaSpinner className="spin" /> Loading reviews...
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-section">
        <h3 className="reviews-title">{title}</h3>
        <div className="reviews-empty">
          <FaStar className="reviews-empty-icon" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      {/* Header with average rating */}
      <div className="reviews-header">
        <h3 className="reviews-title">
          {title} <span className="reviews-count">({reviews.length})</span>
        </h3>
        <div className="reviews-average">
          <span className="reviews-average-number">{avgRating}</span>
          <div className="reviews-average-stars">{renderStars(Math.round(avgRating))}</div>
          <span className="reviews-average-label">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Reviews list */}
      <div className="reviews-list">
        {reviews.map((review) => (
          <div className="review-card" key={review._id}>
            <div className="review-header">
              <div className="review-author">
                <div className="review-avatar">
                  {review.customerId?.imageUrl ? (
                    <img src={review.customerId.imageUrl} alt={review.customerId.name || 'Customer'} />
                  ) : (
                    getInitials(review.customerId?.name)
                  )}
                </div>
                <div className="review-author-info">
                  <span className="review-author-name">
                    {review.customerId?.name || 'Anonymous'}
                  </span>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                </div>
              </div>
              <div className="review-stars">
                {renderStars(review.rating)}
              </div>
            </div>

            {review.comment && (
              <div className="review-comment">
                <FaQuoteLeft className="review-quote" />
                <p>{review.comment}</p>
              </div>
            )}

            {review.farmerResponse && (
              <div className="review-response">
                <div className="review-response-header">
                  <FaReply /> <strong>Farmer's Response</strong>
                </div>
                <p>{review.farmerResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;