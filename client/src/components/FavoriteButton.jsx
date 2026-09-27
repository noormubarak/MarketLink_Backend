import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './FavoriteButton.css';

const FavoriteButton = ({ farmerId, isFavorited: initialFavorited, onToggle }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited || false);
  const [loading, setLoading] = useState(false);

  // Sync with prop changes (e.g., when the farmer card re-renders)
  useEffect(() => {
    setIsFavorited(initialFavorited || false);
  }, [initialFavorited]);

  const handleToggle = async (e) => {
    e.stopPropagation(); // Prevent triggering parent card clicks

    // 1. Check login
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/farmers' } } });
      return;
    }

    // 2. Only customers can favorite farmers
    if (user.role !== 'customer') {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/favorites/${farmerId}`);
      const { favorited } = res.data.data;

      // Update local state
      setIsFavorited(favorited);

      // Update the user's favorites array in context
      // (The backend returns only { favorited }, so we update manually)
      if (updateUser && user) {
        const updatedFavorites = favorited
          ? [...(user.favorites || []), farmerId]
          : (user.favorites || []).filter((id) => id.toString() !== farmerId.toString());
        updateUser({ ...user, favorites: updatedFavorites });
      }

      // Notify parent component (optional)
      if (onToggle) onToggle(favorited);
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show the button for non-logged-in users on the card (optional)
  // For the modal, we might still show it but prompt login.
  // We'll show it always, but the click handles login redirect.
  if (user && user.role !== 'customer') {
    return null; // Hide for farmers and admins
  }

  return (
    <button
      className={`fav-btn ${isFavorited ? 'active' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <FaSpinner className="fav-spinner" />
      ) : isFavorited ? (
        <FaHeart />
      ) : (
        <FaRegHeart />
      )}
    </button>
  );
};

export default FavoriteButton;