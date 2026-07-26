const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getRestaurantFoods,
  assignFoodToRestaurant,
  updateRestaurantFoodSettings,
  removeFoodFromRestaurant,
  bulkUpdateRestaurantFoods,
  getFoodRestaurants,
} = require('../controllers/foodController');

// Global Catalogue routes
router.get('/', getAllFoods);
router.get('/:id', getFoodById);
router.get('/:foodId/restaurants', getFoodRestaurants);
router.post('/', authenticate, authorizeRoles('admin'), createFood);
router.put('/:id', authenticate, authorizeRoles('admin'), updateFood);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteFood);

// Restaurant specific links & settings
router.get('/restaurant/:restaurantId', getRestaurantFoods);
router.post('/assign', authenticate, authorizeRoles('admin'), assignFoodToRestaurant);
router.put('/restaurant/:restaurantId/:foodId', authenticate, authorizeRoles('admin', 'restaurant'), updateRestaurantFoodSettings);
router.delete('/restaurant/:restaurantId/:foodId', authenticate, authorizeRoles('admin'), removeFoodFromRestaurant);
router.post('/restaurant/:restaurantId/bulk', authenticate, authorizeRoles('admin', 'restaurant'), bulkUpdateRestaurantFoods);

module.exports = router;
