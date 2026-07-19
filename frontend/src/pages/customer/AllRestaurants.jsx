import {useState, useEffect} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Clock, Search } from 'lucide-react';
import { getAllRestaurants } from '../../services/api';
import { resolveImageUrl, handleImageError } from '../../utils/placeholderImage';
import './AllRestaurants.css';

const AllRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await getAllRestaurants();
      let data = response.data || response || [];
      
      // Apply filter based on URL parameter
      if (filterParam) {
        switch (filterParam) {
          case 'popular':
            data = data.filter(r => r.rating >= 4.5);
            break;
          case 'fast':
            data = data.filter(r => (r.deliveryTime || 30) <= 30);
            break;
          case 'offers':
            data = data.filter(r => r.hasOffer);
            break;
          case 'vegetarian':
            data = data.filter(r => r.isVegetarian);
            break;
          case 'all':
          default:
            // Show all
            break;
        }
      }
      
      setRestaurants(data);
      setFilteredRestaurants(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [filterParam]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = restaurants.filter(
      (restaurant) =>
        restaurant.name?.toLowerCase().includes(term) ||
        restaurant.cuisineType?.toLowerCase().includes(term) ||
        restaurant.city?.toLowerCase().includes(term)
    );
    setFilteredRestaurants(filtered);
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}`);
  };

  const getFilterTitle = () => {
    const titles = {
      all: 'All Restaurants',
      popular: 'Top Rated Restaurants',
      fast: 'Fast Delivery Restaurants',
      offers: 'Restaurants with Offers',
      vegetarian: 'Vegetarian Restaurants'
    };
    return titles[filterParam] || 'All Restaurants';
  };

  if (loading) {
    return (
      <div className="all-restaurants-container">
        <div className="loading">Loading restaurants...</div>
      </div>
    );
  }

  return (
    <div className="all-restaurants-container">
      <div className="restaurants-header">
        <h1>{getFilterTitle()}</h1>
        <p>Explore and order from amazing restaurants</p>

        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search restaurants, cuisines, locations..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredRestaurants.length === 0 ? (
        <div className="no-restaurants">
          <p>No restaurants found. Try a different search.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className="restaurant-card"
              onClick={() => handleRestaurantClick(restaurant._id)}
            >
              <div className="restaurant-image">
                <img
                  src={resolveImageUrl(restaurant.image)}
                  alt={restaurant.name}
                  onError={handleImageError}
                />
                <div className="restaurant-badge">
                  <Star size={16} fill="currentColor" />
                  <span>{restaurant.rating || 4.5}</span>
                </div>
              </div>

              <div className="restaurant-info">
                <h3>{restaurant.name}</h3>
                <p className="cuisine">{restaurant.cuisine || 'Multicuisine'}</p>

                <div className="restaurant-meta">
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>{restaurant.deliveryTime || '30'} mins</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={14} />
                    <span>{restaurant.city || 'City'}</span>
                  </div>
                </div>

                <div className="restaurant-footer">
                  <span className={`delivery-fee ${restaurant.isOpen === false ? 'status-closed' : 'status-open'}`}>
                    {restaurant.isOpen === false ? 'Closed' : 'Open now'}
                  </span>
                  <span className="items-count">
                    {restaurant.foods?.length || 50}+ items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllRestaurants;
