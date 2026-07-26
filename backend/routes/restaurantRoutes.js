const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMatchingRestaurants,
} = require('../controllers/restaurantController');

router.get('/match', getMatchingRestaurants);
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', authenticate, authorizeRoles('admin'), createRestaurant);
router.put('/:id', authenticate, updateRestaurant);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteRestaurant);

module.exports = router;
