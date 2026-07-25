const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');

router.get('/', getAllFoods);
router.get('/:id', getFoodById);
router.post('/', authenticate, authorizeRoles('admin', 'restaurant'), createFood);
router.put('/:id', authenticate, authorizeRoles('admin', 'restaurant'), updateFood);
router.delete('/:id', authenticate, authorizeRoles('admin', 'restaurant'), deleteFood);

module.exports = router;
