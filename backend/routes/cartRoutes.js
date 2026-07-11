const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', getCart);

// Add item to cart
router.post('/add', addToCart);

// Update item quantity
router.put('/update/:foodId', updateCartItem);

// Remove item from cart
router.delete('/remove/:foodId', removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

module.exports = router;
