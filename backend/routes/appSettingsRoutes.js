const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/appSettingsController');

// Public access is allowed for app settings reads so the customer checkout flow
// can use delivery fee and free delivery values without requiring login.
router.get('/', getSettings);
router.put('/', authenticate, updateSettings);

module.exports = router;
