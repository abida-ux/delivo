const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getCombinations,
  createCombination,
  updateCombination,
  deleteCombination,
  assignCombinationToRestaurant,
  updateRestaurantCombinationSettings,
  removeCombinationFromRestaurant,
} = require('../controllers/combinationController');

router.get('/', getCombinations);
router.post('/', authenticate, authorizeRoles('admin'), createCombination);
router.put('/:id', authenticate, authorizeRoles('admin'), updateCombination);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCombination);

// Restaurant specific links & settings for combinations
router.post('/assign', authenticate, authorizeRoles('admin'), assignCombinationToRestaurant);
router.put('/restaurant/:restaurantId/:combinationId', authenticate, authorizeRoles('admin', 'restaurant'), updateRestaurantCombinationSettings);
router.delete('/restaurant/:restaurantId/:combinationId', authenticate, authorizeRoles('admin'), removeCombinationFromRestaurant);

module.exports = router;
