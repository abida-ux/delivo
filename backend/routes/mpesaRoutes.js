const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { handleMpesaStkPush, handleMpesaCallback, handleMpesaStatus } = require('../controllers/mpesaController');

router.post('/stk-push', authenticate, authorizeRoles('admin'), handleMpesaStkPush);
router.post('/callback', handleMpesaCallback); // Secured internally in controller via callback secret query
router.get('/status', optionalAuthenticate, handleMpesaStatus);

module.exports = router;
