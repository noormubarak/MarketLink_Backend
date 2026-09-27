import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  FaMapMarkerAlt, FaClock, FaSearch, FaStore,
  FaSpinner, FaLocationArrow, FaCalendarAlt, FaTimes,
  FaCompass, FaRegClock, FaDirections, FaSun, FaUndo
} from 'react-icons/fa';
import './Markets.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const Markets = () => {
  const [markets, setMarkets] = useState([]);
  const [allMarkets, setAllMarkets] = useState([]); // ← for stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedMarket, setSelectedMarket] = useState(null);

  // ============ HELPERS ============
  const getTodayName = () =>
    DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const isOpenToday = (market) => market.operatingDays?.includes(getTodayName());
  const isOpenOnDay = (market, day) => market.operatingDays?.includes(day);

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // ============ FETCH ALL MARKETS (for stats) ============
  const fetchAllMarkets = async () => {
    try {
      const res = await api.get('/markets');
      setAllMarkets(res.data.data || []);
    } catch (err) {
      console.error('Fetch all markets error:', err);
    }
  };

  // ============ FETCH FILTERED MARKETS ============
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedDay) params.day = selectedDay;
      if (searchQuery.trim()) params.city = searchQuery.trim();

      const res = await api.get('/markets', { params });
      setMarkets(res.data.data);
    } catch (err) {
      console.error('Fetch markets error:', err);
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDay, searchQuery]);

  useEffect(() => {
    fetchAllMarkets();
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // ============ NEARBY ============
  const findNearbyMarkets = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        try {
          const res = await api.get('/markets/near', {
            params: { lat: latitude, lng: longitude, radiusKm: 50 },
          });
          setMarkets(res.data.data);
          setNearbyMode(true);
        } catch (err) {
          setLocationError('Could not find nearby markets.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError('Location access denied.');
        setLocating(false);
      }
    );
  };

  const clearNearby = () => {
    setNearbyMode(false);
    setUserLocation(null);
    fetchMarkets();
  };

  const getDistance = (market) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = ((market.lat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((market.lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((market.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const openMap = (market) => {
    const url = `https://www.openstreetmap.org/?mlat=${market.lat}&mlon=${market.lng}#map=16/${market.lat}/${market.lng}`;
    window.open(url, '_blank');
  };

  const openDirections = (market) => {
    const url = `https://www.openstreetmap.org/directions?to=${market.lat},${market.lng}`;
    window.open(url, '_blank');
  };

  // ============ CLEAR FILTERS ============
  const clearFilters = () => {
    setSelectedDay('');
    setNearbyMode(false);
    setUserLocation(null);
    fetchMarkets();
  };

  const hasFilters = selectedDay || nearbyMode;

  // ============ STATS LOGIC (day-aware) ============
  const todayName = getTodayName();
  const isFilteredByDay = !!selectedDay;

  // Count markets open on the selected day, or today if no filter
  const openCount = isFilteredByDay
    ? allMarkets.filter((m) => isOpenOnDay(m, selectedDay)).length
    : allMarkets.filter((m) => isOpenToday(m)).length;

  const openLabel = isFilteredByDay
    ? `Open on ${selectedDay}`
    : 'Open Today';

  const openIcon = isFilteredByDay ? <FaCalendarAlt /> : <FaSun />;

  return (
    <div className="markets-page">

      {/* ============ HEADER ============ */}
      <div className="markets-header">
        <div className="markets-header-content">
          <h1 className="markets-title">
            <FaStore className="markets-title-icon" /> Local Farmers Markets
          </h1>
          <p className="markets-subtitle">
            Discover fresh markets near you and plan your next visit
          </p>

          <div className="markets-search-bar">
            <FaSearch className="markets-search-icon" />
            <input
              type="text"
              placeholder="Search by city (e.g., Karachi, Lahore)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="markets-search-clear" onClick={() => setSearchQuery('')}>
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ MAIN SPLIT ============ */}
      <div className="markets-split">

        {/* ============ LEFT SIDEBAR ============ */}
        <aside className="markets-sidebar">
          <div className="markets-sidebar-inner">

            {/* Find Markets */}
            <div className="sidebar-block">
              <span className="sidebar-block-label">Find Markets</span>
              <button
                className={nearbyMode ? 'sidebar-nearby active' : 'sidebar-nearby'}
                onClick={nearbyMode ? clearNearby : findNearbyMarkets}
                disabled={locating}
              >
                {locating ? (
                  <><FaSpinner className="spin" /> Locating...</>
                ) : nearbyMode ? (
                  <><FaTimes /> Clear Nearby</>
                ) : (
                  <><FaLocationArrow /> Show Near Me</>
                )}
              </button>

              {hasFilters && (
                <button className="sidebar-clear" onClick={clearFilters}>
                  <FaUndo /> Clear Filters
                </button>
              )}

              {locationError && (
                <div className="sidebar-error">{locationError}</div>
              )}
            </div>

            {/* Overview — day-aware */}
            <div className="sidebar-block">
              <span className="sidebar-block-label">Overview</span>
              <div className="sidebar-stats">
                <div className="sidebar-stat">
                  <div className="stat-icon green">
                    <FaStore />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{allMarkets.length}</span>
                    <span className="stat-label">Total Markets</span>
                  </div>
                </div>

                <div className="sidebar-stat">
                  <div className="stat-icon amber">
                    {openIcon}
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">{openCount}</span>
                    <span className="stat-label">{openLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter by Day */}
            <div className="sidebar-block">
              <span className="sidebar-block-label">Filter by Day</span>
              <div className="sidebar-days">
                <button
                  className={selectedDay === '' ? 'sidebar-day active' : 'sidebar-day'}
                  onClick={() => { setSelectedDay(''); setNearbyMode(false); }}
                >
                  <FaCalendarAlt />
                  <span>All Days</span>
                </button>

                {DAYS.map((day) => (
                  <button
                    key={day}
                    className={selectedDay === day ? 'sidebar-day active' : 'sidebar-day'}
                    onClick={() => { setSelectedDay(day); setNearbyMode(false); }}
                  >
                    <span className="sidebar-day-short">{day.charAt(0)}</span>
                    <span className="sidebar-day-full">{day}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="sidebar-tip">
              <div className="sidebar-tip-icon">
                <FaCompass />
              </div>
              <div className="sidebar-tip-text">
                <strong>Pro tip</strong>
                <p>Click "Show Near Me" to see markets within 50km of you.</p>
              </div>
            </div>

          </div>
        </aside>

        {/* ============ RIGHT: MARKET CARDS ============ */}
        <main className="markets-main">
          {loading ? (
            <div className="markets-grid">
              {[...Array(4)].map((_, i) => (
                <div className="market-card skeleton" key={i}>
                  <div className="skeleton-header" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="markets-empty">
              <FaStore className="empty-icon" />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchMarkets}>Try Again</button>
            </div>
          ) : markets.length === 0 ? (
            <div className="markets-empty">
              <FaStore className="empty-icon" />
              <h3>No markets found</h3>
              <p>
                {isFilteredByDay
                  ? `No markets are open on ${selectedDay}.`
                  : searchQuery
                  ? `No markets match "${searchQuery}".`
                  : 'No markets available right now.'}
              </p>
              {(hasFilters || searchQuery) && (
                <button
                  className="retry-btn"
                  onClick={() => { clearFilters(); setSearchQuery(''); }}
                >
                  <FaUndo /> Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="markets-grid">
              {markets.map((market) => {
                const distance = getDistance(market);
                const openToday = isOpenToday(market);
                const today = todayName;

                return (
                  <div
                    className="market-card"
                    key={market._id}
                    onClick={() => setSelectedMarket(market)}
                  >
                    <div className={`market-card-strip ${openToday ? 'open' : ''}`} />

                    <div className="market-card-badges">
                      {openToday && (
                        <span className="open-badge">
                          <FaSun /> Open Today
                        </span>
                      )}
                      {distance && (
                        <span className="distance-badge">
                          <FaCompass /> {distance} km
                        </span>
                      )}
                    </div>

                    <div className="market-card-header">
                      <div className="market-icon-badge">
                        <FaStore />
                      </div>
                    </div>

                    <h3 className="market-name">{market.name}</h3>

                    <div className="market-info-grid">
                      <div className="market-info-row">
                        <div className="market-info-icon-wrap">
                          <FaMapMarkerAlt />
                        </div>
                        <div className="market-info-text">
                          <span className="market-info-label">Address</span>
                          <span className="market-info-value">{market.address}</span>
                        </div>
                      </div>

                      <div className="market-info-row">
                        <div className="market-info-icon-wrap">
                          <FaRegClock />
                        </div>
                        <div className="market-info-text">
                          <span className="market-info-label">Hours</span>
                          <span className="market-info-value">
                            {formatTime(market.timings?.open)} — {formatTime(market.timings?.close)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="market-days-wrap">
                      <span className="market-days-label">Weekly Schedule</span>
                      <div className="market-days-row">
                        {DAYS.map((day, idx) => {
                          const active = market.operatingDays?.includes(day);
                          const isToday = day === today;
                          return (
                            <div
                              key={day}
                              className={
                                active
                                  ? isToday
                                    ? 'day-pill active today'
                                    : 'day-pill active'
                                  : 'day-pill'
                              }
                              title={day}
                            >
                              {DAY_SHORT[idx]}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="market-card-actions">
                      <button
                        className="market-view-btn"
                        onClick={(e) => { e.stopPropagation(); openMap(market); }}
                      >
                        <FaMapMarkerAlt /> View on Map
                      </button>
                      <button
                        className="market-directions-btn"
                        onClick={(e) => { e.stopPropagation(); openDirections(market); }}
                        title="Get directions"
                      >
                        <FaDirections />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ============ MODAL ============ */}
      {selectedMarket && (
        <div className="market-modal-overlay" onClick={() => setSelectedMarket(null)}>
          <div className="market-modal" onClick={(e) => e.stopPropagation()}>
            <button className="market-modal-close" onClick={() => setSelectedMarket(null)}>
              <FaTimes />
            </button>

            <div className="market-modal-header">
              <div className="market-modal-icon"><FaStore /></div>
              <div>
                <h2>{selectedMarket.name}</h2>
                <p className="market-modal-address">
                  <FaMapMarkerAlt /> {selectedMarket.address}
                </p>
              </div>
            </div>

            <div className="market-modal-body">
              <div className="market-detail-row">
                <div className="market-detail-icon"><FaClock /></div>
                <div>
                  <span className="market-detail-label">Operating Hours</span>
                  <span className="market-detail-value">
                    {formatTime(selectedMarket.timings?.open)} — {formatTime(selectedMarket.timings?.close)}
                  </span>
                </div>
              </div>

              <div className="market-detail-row">
                <div className="market-detail-icon"><FaCalendarAlt /></div>
                <div>
                  <span className="market-detail-label">Operating Days</span>
                  <span className="market-detail-value">
                    {selectedMarket.operatingDays?.length > 0
                      ? selectedMarket.operatingDays.join(', ')
                      : 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="market-detail-row">
                <div className="market-detail-icon"><FaMapMarkerAlt /></div>
                <div>
                  <span className="market-detail-label">Coordinates</span>
                  <span className="market-detail-value">
                    {selectedMarket.lat?.toFixed(4)}, {selectedMarket.lng?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="market-modal-actions">
              <button className="modal-btn-primary" onClick={() => openMap(selectedMarket)}>
                <FaMapMarkerAlt /> Open in Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Markets;