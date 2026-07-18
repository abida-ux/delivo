import {useState, useEffect} from 'react';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../pages.css';
import './Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // Mock favorites data
    const mockFavorites = [
      {
        id: 1,
        name: 'Pizza Palace',
        rating: 4.8,
        reviews: 1250,
        location: '2.5 km away',
        cuisines: 'Italian, Pizza',
        deliveryTime: '25-35 min',
        deliveryFee: 'KES 2.99',
        image: 'https://placehold.co/300x200?text=Pizza+Palace'
      },
      {
        id: 2,
        name: 'Burger House',
        rating: 4.6,
        reviews: 890,
        location: '1.8 km away',
        cuisines: 'American, Burgers',
        deliveryTime: '20-30 min',
        deliveryFee: 'KES 1.99',
        image: 'https://placehold.co/300x200?text=Burger+House'
      },
      {
        id: 3,
        name: 'Sushi Delight',
        rating: 4.9,
        reviews: 2100,
        location: '3.2 km away',
        cuisines: 'Japanese, Sushi',
        deliveryTime: '30-40 min',
        deliveryFee: 'KES 3.99',
        image: 'https://placehold.co/300x200?text=Sushi+Delight'
      }
    ];
    setFavorites(mockFavorites);
  }, []);

  const handleRemoveFavorite = (id) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  const handleViewRestaurant = (id) => {
    navigate(`/restaurants/${id}`);
  };

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>My Favorites</h1>
        <p>Your saved restaurants and favorite meals</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} />
          <h2>No Favorites Yet</h2>
          <p>Save restaurants you love to quick access them later</p>
          <button className="explore-btn" onClick={() => navigate('/')}>
            Explore Restaurants
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((restaurant) => (
            <div key={restaurant.id} className="favorite-card">
              <div className="card-image-container">
                <img src={restaurant.image} alt={restaurant.name} className="card-image" />
                <button 
                  className="remove-favorite-btn"
                  onClick={() => handleRemoveFavorite(restaurant.id)}
                >
                  <Heart size={20} fill="currentColor" />
                </button>
              </div>

              <div className="card-content">
                <h3 className="restaurant-name">{restaurant.name}</h3>
                <p className="cuisines">{restaurant.cuisines}</p>

                <div className="rating-row">
                  <div className="rating">
                    <Star size={16} fill="currentColor" />
                    <span>{restaurant.rating}</span>
                    <span className="reviews">({restaurant.reviews})</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-item">
                    <MapPin size={14} />
                    <span>{restaurant.location}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-item">
                    <span>⏱ {restaurant.deliveryTime}</span>
                  </div>
                  <div className="info-item">
                    <span>{restaurant.deliveryFee}</span>
                  </div>
                </div>

                <button 
                  className="view-btn"
                  onClick={() => handleViewRestaurant(restaurant.id)}
                >
                  View Menu
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
