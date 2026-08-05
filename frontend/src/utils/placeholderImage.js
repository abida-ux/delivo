const BEAUTIFUL_FOOD_FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80';
const BEAUTIFUL_RESTAURANT_FALLBACK = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

const BLOCKED_IMAGE_HOSTS = ['via.placeholder.com', 'placehold.co', 'placehold.it', 'placeholder.com'];

export const resolveImageUrl = (image) => {
  if (typeof image !== 'string') {
    return BEAUTIFUL_FOOD_FALLBACK;
  }

  const value = image.trim();
  if (!value) {
    return BEAUTIFUL_FOOD_FALLBACK;
  }

  const normalized = value.toLowerCase();
  if (BLOCKED_IMAGE_HOSTS.some((host) => normalized.includes(host))) {
    return BEAUTIFUL_FOOD_FALLBACK;
  }

  return value;
};

export const resolveRestaurantImageUrl = (restaurant) => {
  if (!restaurant || typeof restaurant !== 'object') {
    return BEAUTIFUL_RESTAURANT_FALLBACK;
  }

  const img = restaurant.bannerImage || restaurant.image || restaurant.coverImage || '';
  if (!img || typeof img !== 'string' || !img.trim()) {
    return BEAUTIFUL_RESTAURANT_FALLBACK;
  }

  return resolveImageUrl(img);
};

export const handleImageError = (event) => {
  if (event?.currentTarget) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = BEAUTIFUL_FOOD_FALLBACK;
  }
};

export default BEAUTIFUL_FOOD_FALLBACK;
