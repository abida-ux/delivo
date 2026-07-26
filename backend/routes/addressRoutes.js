const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');

router.route('/')
  .get(authenticate, getAddresses)
  .post(authenticate, createAddress);

router.route('/:id')
  .put(authenticate, updateAddress)
  .delete(authenticate, deleteAddress);

module.exports = router;
