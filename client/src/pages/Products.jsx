import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import {
  FaSearch, FaFilter, FaTimes, FaLeaf, FaBoxOpen,
  FaChevronLeft, FaChevronRight, FaSortAmountDown,
  FaShoppingBasket, FaSpinner, FaCheckCircle, FaArrowRight,
  FaStar, FaUndo
} from 'react-icons/fa';
import './Products.css';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Bakery'];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [productRatings, setProductRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '' });

  // Search with instant feedback + suggestions
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('marketlink_recent_searches') || '[]'); }
    catch { return []; }
  });

  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchTimer = useRef(null);
  const blurTimer = useRef(null);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    availableOnly: false,
  });

  const [sort, setSort] = useState('-createdAt');

  // ============ FETCH REVIEWS FOR PRODUCTS ============
  const fetchRatingsForProducts = async (productList) => {
    if (!productList || productList.length === 0) return {};
    const ratingsMap = {};

    await Promise.all(
      productList.map(async (p) => {
        try {
          const res = await api.get(`/reviews/product/${p._id}`);
          const revs = res.data.data || [];
          if (revs.length > 0) {
            const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
            ratingsMap[p._id] = {
              avg: Number(avg.toFixed(1)),
              count: revs.length,
            };
          }
        } catch (err) {
          // silent fail — product just won't show rating
        }
      })
    );

    return ratingsMap;
  };

  // ============ DEBOUNCE SEARCH INPUT ============
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  // ============ FETCH SUGGESTIONS WHILE TYPING ============
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/products', {
          params: { search: searchInput, limit: 6, page: 1 }
        });
        setSuggestions(res.data.data.items || []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ============ CLOSE SUGGESTIONS ON OUTSIDE CLICK ============
  useEffect(() => {
    const handleClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ============ MAIN FETCH ============
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.availableOnly) params.availableOnly = 'true';

      const res = await api.get('/products', { params });
      const items = res.data.data.items || [];
      setProducts(items);
      setTotalPages(res.data.data.pages);
      setTotal(res.data.data.total);

      // Fetch ratings for the currently displayed products
      const ratingsMap = await fetchRatingsForProducts(items);
      setProductRatings(ratingsMap);
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, filters, debouncedSearch, limit]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ============ SAVE RECENT SEARCH ============
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('marketlink_recent_searches', JSON.stringify(updated));
  };

  // ============ SUGGESTION ACTIONS ============
  const handleSuggestionClick = (product) => {
    setSearchInput(product.name);
    setDebouncedSearch(product.name);
    saveRecentSearch(product.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleRecentClick = (term) => {
    setSearchInput(term);
    setDebouncedSearch(term);
    setShowSuggestions(false);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('marketlink_recent_searches');
  };

  // ============ KEYBOARD NAVIGATION ============
  const handleKeyDown = (e) => {
    const totalItems = suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      setShowSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else {
        saveRecentSearch(searchInput);
        setDebouncedSearch(searchInput);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
      searchRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      searchRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = () => {
    saveRecentSearch(searchInput);
    setDebouncedSearch(searchInput);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // ============ FILTERS ============
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleCategory = (cat) => {
    const newCat = filters.category === cat ? '' : cat;
    setFilters((prev) => ({ ...prev, category: newCat }));
    const newParams = new URLSearchParams(searchParams);
    if (newCat) newParams.set('category', newCat);
    else newParams.delete('category');
    setSearchParams(newParams);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', availableOnly: false });
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams({});
    setSort('-createdAt');
    setPage(1);
  };

  const hasActiveFilters =
    filters.category || filters.minPrice ||
    filters.maxPrice || filters.availableOnly;

  // ============ ORDER (Add to Cart + Redirect) ============
  const handleOrder = (product) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/products' } } });
      return;
    }

    if (user.role !== 'customer') {
      setToast({ show: true, text: 'Only customers can place orders.' });
      setTimeout(() => setToast({ show: false, text: '' }), 2500);
      return;
    }

    addToCart(product, 1);
    setToast({ show: true, text: `"${product.name}" added to your cart!` });
    setTimeout(() => setToast({ show: false, text: '' }), 1500);
    setTimeout(() => navigate('/cart'), 1200);
  };

  // ============ PAGINATION ============
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const shouldShowDropdown =
    showSuggestions &&
    (searchInput ? suggestions.length > 0 : recentSearches.length > 0);

  // ============ STAR RENDERER ============
  const renderCardStars = (avg) => {
    const full = Math.floor(avg);
    const hasHalf = avg - full >= 0.5;
    return [1, 2, 3, 4, 5].map((i) => {
      if (i <= full) return <FaStar key={i} className="pcard-star full" />;
      if (i === full + 1 && hasHalf) return <FaStar key={i} className="pcard-star half" />;
      return <FaStar key={i} className="pcard-star empty" />;
    });
  };

  return (
    <div className="products-page">
      {/* ============ HEADER ============ */}
      <div className="products-header">
        <div className="products-header-content">
          <h1 className="products-title">
            <FaLeaf className="products-title-icon" /> Fresh From Local Farms
          </h1>
          <p className="products-subtitle">
            Browse {total > 0 ? total : 'hundreds of'} fresh products from verified local farmers
          </p>

          <div className="products-search-wrapper" ref={searchContainerRef}>
            <div className={`products-search-bar ${shouldShowDropdown ? 'has-dropdown' : ''}`}>
              <FaSearch className="search-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search vegetables, fruits, dairy..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {searchInput ? (
                <button className="search-clear" onClick={handleClearSearch} title="Clear">
                  <FaTimes />
                </button>
              ) : (
                <button className="search-go" onClick={handleSearchSubmit} title="Search">
                  <FaArrowRight />
                </button>
              )}
            </div>

            {shouldShowDropdown && (
              <div className="search-dropdown" key="search-dropdown">
                {!searchInput && recentSearches.length > 0 && (
                  <>
                    <div className="search-dropdown-header">
                      <span>Recent Searches</span>
                      <button onClick={handleClearRecent}>Clear</button>
                    </div>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        className="search-recent-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleRecentClick(term)}
                      >
                        <FaSearch className="suggestion-icon" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </>
                )}

                {searchInput && suggestions.length > 0 && (
                  <>
                    <div className="search-dropdown-header">
                      <span>Products</span>
                      <span className="suggestion-count">{suggestions.length} found</span>
                    </div>
                    {suggestions.map((product, i) => (
                      <button
                        key={product._id}
                        className={i === highlightedIndex ? 'search-suggestion highlighted' : 'search-suggestion'}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionClick(product)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                      >
                        <div className="suggestion-image">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} />
                          ) : (
                            <FaLeaf />
                          )}
                        </div>
                        <div className="suggestion-info">
                          <span className="suggestion-name">{product.name}</span>
                          <span className="suggestion-meta">
                            {product.category} · Rs. {product.price}/{product.unit}
                          </span>
                        </div>
                        <FaArrowRight className="suggestion-arrow" />
                      </button>
                    ))}
                    <button
                      className="search-view-all"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSearchSubmit}
                    >
                      <FaSearch /> View all results for "{searchInput}"
                    </button>
                  </>
                )}

                {searchInput && suggestions.length === 0 && (
                  <div className="search-no-results">
                    <FaSearch className="no-results-icon" />
                    <p>No products match "<strong>{searchInput}</strong>"</p>
                    <span>Try a different keyword</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ CATEGORY CHIPS ============ */}
      <div className="products-categories">
        <button className={filters.category === '' ? 'cat-chip active' : 'cat-chip'} onClick={() => toggleCategory('')}>
          All Products
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} className={filters.category === cat ? 'cat-chip active' : 'cat-chip'} onClick={() => toggleCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="products-toolbar">
        <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> Filters {hasActiveFilters && <span className="filter-dot" />}
        </button>

        <div className="products-count">
          {loading ? 'Searching...' : <>Showing <strong>{products.length}</strong> of <strong>{total}</strong> products</>}
          {debouncedSearch && <span className="search-tag"> for "{debouncedSearch}"</span>}
        </div>

        <div className="products-sort">
          <FaSortAmountDown className="sort-icon" />
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ============ LAYOUT ============ */}
      <div className="products-layout">
        <aside className={showFilters ? 'products-sidebar open' : 'products-sidebar'}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="sidebar-close" onClick={() => setShowFilters(false)}>
              <FaTimes />
            </button>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <FaUndo /> Clear All Filters
            </button>
          )}

          <div className="filter-group">
            <h4>Price Range (Rs.)</h4>
            <div className="price-inputs">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} min="0" />
              <span>—</span>
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} min="0" />
            </div>
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <label className="checkbox-label">
              <input type="checkbox" checked={filters.availableOnly} onChange={(e) => updateFilter('availableOnly', e.target.checked)} />
              <span>In stock only</span>
            </label>
          </div>

          <div className="filter-group">
            <h4>Categories</h4>
            <div className="filter-cat-list">
              {CATEGORIES.map((cat) => (
                <button key={cat} className={filters.category === cat ? 'filter-cat active' : 'filter-cat'} onClick={() => toggleCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {showFilters && <div className="sidebar-overlay" onClick={() => setShowFilters(false)} />}

        <main className="products-main">
          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <div className="product-card skeleton" key={i}>
                  <div className="skeleton-image" />
                  <div className="skeleton-text" />
                  <div className="skeleton-text short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="products-empty">
              <FaBoxOpen className="empty-icon" />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchProducts}>Try Again</button>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <FaBoxOpen className="empty-icon" />
              <h3>No products found</h3>
              <p>{debouncedSearch ? `No results for "${debouncedSearch}". Try a different keyword.` : 'Try adjusting your filters.'}</p>
              {hasActiveFilters && (
                <button className="retry-btn" onClick={clearFilters}>
                  <FaUndo /> Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => {
                  const ratingInfo = productRatings[product._id];
                  return (
                    <div className="product-card" key={product._id}>
                      <div className="product-image-wrapper">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="product-image" />
                        ) : (
                          <div className="product-image-placeholder"><FaLeaf /></div>
                        )}
                        <span className="product-category-badge">{product.category}</span>
                        {!product.isAvailable && <span className="product-out-badge">Out of Stock</span>}
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>

                        {/* ✨ RATING BADGE */}
                        {ratingInfo && (
                          <div className="product-rating">
                            <div className="product-rating-stars">
                              {renderCardStars(ratingInfo.avg)}
                            </div>
                            <span className="product-rating-text">
                              {ratingInfo.avg.toFixed(1)}
                              <span className="product-rating-count">
                                ({ratingInfo.count})
                              </span>
                            </span>
                          </div>
                        )}

                        {product.description && (
                          <p className="product-desc">{product.description}</p>
                        )}

                        <div className="product-price-row">
                          <div>
                            <span className="product-price">Rs. {product.price}</span>
                            <span className="product-unit"> / {product.unit}</span>
                          </div>
                          <span className="product-stock">
                            {product.stockQuantity > 0 ? `${product.stockQuantity} left` : 'Sold out'}
                          </span>
                        </div>

                        <button
                          className="product-order-btn"
                          onClick={() => handleOrder(product)}
                          disabled={!product.isAvailable || product.stockQuantity <= 0}
                        >
                          <FaShoppingBasket />
                          {product.isAvailable && product.stockQuantity > 0 ? 'Order Now' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="products-pagination">
                  <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <FaChevronLeft />
                  </button>
                  {getPageNumbers().map((p) => (
                    <button key={p} className={p === page ? 'page-num active' : 'page-num'} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {toast.show && (
        <div className="products-toast">
          <FaCheckCircle /> {toast.text}
        </div>
      )}
    </div>
  );
};

export default Products;