const express = require('express');
const router = express.Router();
const {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');

router.get('/', getAllFoods);
router.get('/:id', getFoodById);
router.post('/', createFood);
router.put('/:id', updateFood);
router.delete('/:id', deleteFood);

module.exports = router;
