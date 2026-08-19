import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Coffee,
  Utensils,
  UtensilsCrossed,
  Flame,
  MapPin,
  Snail,
  Wine,
  Cake,
  Apple,
  Croissant,
  Pizza,
  ChevronDown,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import api, { getFoodsCatalog, getPopularFoods } from '../services/api';
import { seededShuffle, getOrCreateSessionSeed } from '../utils/seededRandom';
import FoodCard from '../components/FoodCard';
import SEO from '../components/SEO';
import './Menu.css';

const iconMap = {
  Coffee,
  Utensils,
  UtensilsCrossed,
  Flame,
  MapPin,
  Snail,
  Wine,
  Cake,
  Apple,
  Croissant,
  Pizza,
};

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Stable session-level random seed that persists across client-side navigation
  // and only randomizes when the browser is refreshed
  const sessionSeedRef = useRef(getOrCreateSessionSeed());

  // State
  const [dbCategories, setDbCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Search & Category
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Sentinel for infinite scrolling
  const sentinelRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const moreDropdownRef = useRef(null);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Database Categories on Mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        const list = res.data.data || [];
        setDbCategories(list);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch Dynamic Popular Section Foods once on mount
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const res = await getPopularFoods({ limit: 6 });
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setPopularFoods(list.slice(0, 6));
        } else {
          const fallbackRes = await getFoodsCatalog({ limit: 6, sortBy: 'popular' });
          const fallbackList = fallbackRes?.data || [];
          setPopularFoods(fallbackList.slice(0, 4));
        }
      } catch (err) {
        console.warn('Failed to load popular foods from endpoint:', err);
        try {
          const fallbackRes = await getFoodsCatalog({ limit: 6, sortBy: 'popular' });
          setPopularFoods((fallbackRes?.data || []).slice(0, 4));
        } catch {}
      }
    };
    loadPopular();
  }, []);

  // Build Primary and Secondary Category Structures from Database
  const { primaryCategories, secondaryCategories } = useMemo(() => {
    const primary = [
      { id: 'all', name: 'All', icon: null },
      { id: 'breakfast', name: 'Breakfast', icon: 'Coffee' },
      { id: 'meals', name: 'Meals', icon: 'UtensilsCrossed' },
      { id: 'fast-food', name: 'Fast Food', icon: 'Flame' },
      { id: 'street-food', name: 'Street Food', icon: 'MapPin' },
      { id: 'snacks', name: 'Snacks', icon: 'Snail' },
      { id: 'drinks-desserts', name: 'Drinks & Desserts', icon: 'Wine' },
    ];

    // Secondary categories from database that aren't already primary categories
    const primaryNamesNormalized = new Set([
      'all',
      'breakfast',
      'meals',
      'lunch',
      'dinner',
      'fast food',
      'street food',
      'snacks',
      'drinks',
      'desserts',
      'drinks & desserts',
      'drinks and desserts',
    ]);

    const secondary = dbCategories
      .filter((cat) => !primaryNamesNormalized.has(cat.name?.toLowerCase().trim()))
      .map((cat) => ({
        id: cat._id,
        name: cat.name,
        icon: cat.icon || 'Utensils',
      }));

    // Always ensure Combinations is available in secondary
    if (!secondary.some((s) => s.name.toLowerCase() === 'combinations')) {
      secondary.push({ id: 'combinations', name: 'Combinations', icon: 'Pizza' });
    }

    return { primaryCategories: primary, secondaryCategories: secondary };
  }, [dbCategories]);

  // Check if active category is a secondary category
  const activeSecondaryCategory = useMemo(() => {
    const isPrimary = primaryCategories.some(
      (p) => p.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!isPrimary) {
      return (
        secondaryCategories.find(
          (s) => s.name.toLowerCase() === selectedCategory.toLowerCase()
        ) || { name: selectedCategory }
      );
    }
    return null;
  }, [selectedCategory, primaryCategories, secondaryCategories]);

  // Synchronize with URL searchParams
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    const s = searchParams.get('search') || '';
    setSelectedCategory(cat);
    setSearchTerm(s);
    setSearchInput(s);
  }, [searchParams]);

  // Helper to update URL cleanly
  const updateUrlParams = useCallback((newCat, newSearch) => {
    const params = new URLSearchParams();
    if (newCat && newCat !== 'All') {
      params.set('category', newCat);
    }
    if (newSearch && newSearch.trim()) {
      params.set('search', newSearch.trim());
    }
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Fetch foods with deterministic seeded ordering
  const fetchFoodsData = useCallback(async (targetPage = 1, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const isCombosCategory = selectedCategory.toLowerCase() === 'combinations';
      let fetchedFoods = [];
      let total = 0;
      let hasMorePages = false;

      if (isCombosCategory) {
        // Fetch combinations
        const combosRes = await api.get('/combinations').then((res) => res.data.data || []).catch(() => []);
        const combosData = combosRes.map((c) => {
          let price = c.price;
          if (price == null || price === 0) {
            price = (c.components || []).reduce((sum, comp) => {
              const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
              return sum + unitPrice * (comp.defaultQuantity || 1);
            }, 0);
          }
          return {
            ...c,
            price,
            isCombination: true,
            category: 'Combinations',
          };
        });

        // Filter combinations by search term if active
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          fetchedFoods = combosData.filter(
            (c) => (c.name || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s)
          );
        } else {
          fetchedFoods = combosData;
        }

        total = fetchedFoods.length;
        hasMorePages = false;
      } else {
        // Query paginated and deterministically seeded backend catalog
        const params = {
          page: targetPage,
          limit: 24,
          seed: sessionSeedRef.current,
        };

        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }

        if (searchTerm && searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const res = await getFoodsCatalog(params);
        fetchedFoods = res.data || [];
        total = res.count || fetchedFoods.length;
        hasMorePages = res.hasMore ?? (targetPage < (res.totalPages || Math.ceil(total / 24)));

        const isAll = !selectedCategory || selectedCategory.toLowerCase() === 'all';

        // On initial page 1 of 'All' with no search, include top combinations
        if (isAll && !searchTerm && targetPage === 1) {
          try {
            const combosRes = await api.get('/combinations').then((r) => r.data.data || []).catch(() => []);
            const formattedCombos = combosRes.slice(0, 3).map((c) => {
              let price = c.price;
              if (price == null || price === 0) {
                price = (c.components || []).reduce((sum, comp) => {
                  const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
                  return sum + unitPrice * (comp.defaultQuantity || 1);
                }, 0);
              }
              return {
                ...c,
                price,
                isCombination: true,
                category: 'Combinations',
              };
            });
            fetchedFoods = [...formattedCombos, ...fetchedFoods];
          } catch {
            // Ignore combos error on main page
          }
        }

        // Apply deterministic seeded shuffle if remote backend returned un-seeded data
        // or to blend combinations seamlessly into page 1
        if (!res.seed || (isAll && targetPage === 1)) {
          fetchedFoods = seededShuffle(
            fetchedFoods,
            `${sessionSeedRef.current}_${selectedCategory || 'All'}_p${targetPage}`
          );
        }
      }

      setTotalCount(total);
      setHasMore(hasMorePages);
      setPage(targetPage);

      if (isAppend) {
        setFoods((prev) => {
          const existingIds = new Set(prev.map((item) => item._id));
          const freshItems = fetchedFoods.filter((item) => !existingIds.has(item._id));
          return [...prev, ...freshItems];
        });
      } else {
        setFoods(fetchedFoods);
      }
    } catch (err) {
      console.error('Error fetching foods catalog:', err);
      setError('Unable to load meals. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchTerm]);

  // Re-fetch page 1 whenever category or searchTerm changes
  useEffect(() => {
    fetchFoodsData(1, false);
  }, [fetchFoodsData]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchFoodsData(page + 1, true);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchFoodsData]);

  // Handlers
  const handleCategorySelect = (categoryName) => {
    setIsMoreOpen(false);
    if (selectedCategory === categoryName) return;
    setSelectedCategory(categoryName);
    updateUrlParams(categoryName, searchTerm);
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(val);
      updateUrlParams(selectedCategory, val);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    updateUrlParams(selectedCategory, '');
  };

  // SEO Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://delivo.co.ke',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: selectedCategory !== 'All' ? `Meals - ${selectedCategory}` : 'Meals Catalog',
        item: `https://delivo.co.ke/menu${
          selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : ''
        }`,
      },
    ],
  };

  const isAllCategory = !selectedCategory || selectedCategory.toLowerCase() === 'all';
  const displayedPopular = popularFoods.length > 0 ? popularFoods : (isAllCategory && foods.length > 0 ? foods.slice(0, 4) : []);
  const showPopularSection = isAllCategory && !searchTerm && displayedPopular.length > 0;

  return (
    <div className="menu-container">
      <SEO
        title={selectedCategory !== 'All' ? `${selectedCategory} Meals` : 'Delivo Meals | Explore Our Menu'}
        description={
          selectedCategory !== 'All'
            ? `Order delicious ${selectedCategory} dishes on Delivo with fast, direct delivery.`
            : 'Explore fresh gourmet meals, street foods, fast foods, and chef specials on Delivo. Fast local delivery.'
        }
        schema={breadcrumbSchema}
      />

      {/* Header Section */}
      <div className="menu-hero-header">
        <div className="menu-hero-content">
          <h1 className="menu-title">Meals</h1>
          <p className="menu-subtitle">Discover something delicious from top local kitchens</p>

          <div className="menu-search-wrapper">
            <div className="menu-search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search meals, ingredients, descriptions..."
                value={searchInput}
                onChange={handleSearchInputChange}
                aria-label="Search foods"
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Compact Category Navigation Bar */}
      <div className="menu-category-sticky-bar">
        <div className="menu-category-scroll-container">
          {primaryCategories.map((cat) => {
            const IconComponent = cat.icon ? iconMap[cat.icon] : null;
            const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.name)}
              >
                {IconComponent && <IconComponent size={14} className="pill-icon" />}
                <span>{cat.name}</span>
              </button>
            );
          })}

          {/* Secondary Categories "More" Dropdown Popover */}
          {secondaryCategories.length > 0 && (
            <div className="more-category-wrapper" ref={moreDropdownRef}>
              <button
                type="button"
                className={`category-pill more-pill ${activeSecondaryCategory ? 'active' : ''}`}
                onClick={() => setIsMoreOpen((prev) => !prev)}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
              >
                <span>{activeSecondaryCategory ? activeSecondaryCategory.name : 'More'}</span>
                <ChevronDown size={14} className={`chevron-icon ${isMoreOpen ? 'rotate' : ''}`} />
              </button>

              {isMoreOpen && (
                <div className="secondary-categories-popover">
                  <div className="popover-header">More Categories</div>
                  <div className="popover-list">
                    {secondaryCategories.map((secCat) => {
                      const isSecActive = selectedCategory.toLowerCase() === secCat.name.toLowerCase();
                      const SecIcon = secCat.icon ? iconMap[secCat.icon] || Utensils : Utensils;

                      return (
                        <button
                          key={secCat.id || secCat.name}
                          type="button"
                          className={`popover-item ${isSecActive ? 'selected' : ''}`}
                          onClick={() => handleCategorySelect(secCat.name)}
                        >
                          <div className="popover-item-left">
                            <SecIcon size={15} className="popover-icon" />
                            <span>{secCat.name}</span>
                          </div>
                          {isSecActive && <Check size={14} className="check-icon" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="menu-main-content">
        {/* Popular on Delivo Section (if rated/featured foods exist) */}
        {showPopularSection && (
          <section className="menu-popular-section">
            <div className="section-header">
              <div className="section-title-group">
                <Sparkles size={18} className="sparkle-icon" />
                <h2 className="section-title">Popular on Delivo</h2>
              </div>
              <span className="section-subtitle">Customer favorites</span>
            </div>

            <div className="popular-foods-row">
              {displayedPopular.map((food) => (
                <FoodCard key={`pop_${food._id}`} food={food} showVendor={true} />
              ))}
            </div>
          </section>
        )}

        {/* Catalog Section Header */}
        <div className="catalog-header">
          <div className="catalog-title-group">
            <h2 className="catalog-title">
              {isAllCategory ? 'All Meals' : selectedCategory}
            </h2>
            {!loading && !isAllCategory && (
              <span className="catalog-count-badge">
                {totalCount} {totalCount === 1 ? 'meal' : 'meals'}
              </span>
            )}
          </div>

          {searchTerm && (
            <div className="search-active-pill">
              <span>Matching &ldquo;{searchTerm}&rdquo;</span>
              <button type="button" onClick={handleClearSearch} title="Clear search">
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && <div className="menu-error-banner">{error}</div>}

        {/* Initial Loading Skeleton / State */}
        {loading ? (
          <div className="menu-loading-grid">
            <div className="menu-loader-box">
              <Loader2 size={28} className="spinner-icon" />
              <span>Loading delicious meals...</span>
            </div>
          </div>
        ) : foods.length === 0 ? (
          <div className="menu-empty-state">
            <div className="empty-icon-circle">
              <Utensils size={32} />
            </div>
            <h3>No meals found</h3>
            <p>
              {searchTerm
                ? `No meals matched "${searchTerm}" in ${selectedCategory}. Try another keyword or browse All.`
                : `There are currently no items listed under ${selectedCategory}.`}
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchTerm('');
                  setSearchInput('');
                  updateUrlParams('All', '');
                }}
              >
                Browse All Meals
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Foods Grid (Using Frozen FoodCard unmodified) */}
            <div className="foods-grid">
              {foods.map((food) => (
                <FoodCard key={food._id} food={food} showVendor={false} />
              ))}
            </div>

            {/* Bottom Infinite Scroll Sentinel & Loader */}
            <div ref={sentinelRef} className="infinite-scroll-sentinel">
              {loadingMore && (
                <div className="loading-more-pill">
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Loading more meals...</span>
                </div>
              )}
              {!hasMore && foods.length > 12 && (
                <div className="end-of-catalog-pill">
                  <span>You&rsquo;ve reached the end of the menu</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;
