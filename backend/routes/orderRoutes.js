const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id', updateOrderStatus);
router.get('/', getAllOrders);

module.exports = router;
