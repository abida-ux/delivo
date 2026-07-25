const express = require('express');
const router = express.Router();
const { getOffers, createOffer, deleteOffer } = require('../controllers/offerController');
const { authenticate } = require('../middleware/authMiddleware');

// Get offers - public route so users can browse active coupons
router.get('/', getOffers);

// Write routes - restricted to authenticated admin users
router.post('/', authenticate, createOffer);
router.delete('/:id', authenticate, deleteOffer);

module.exports = router;
