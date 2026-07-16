const express = require('express');
const {
  sendVerificationHandler,
  sendPasswordResetHandler,
  sendWelcomeHandler,
} = require('../controllers/emailController');

const router = express.Router();

router.post('/send-verification', sendVerificationHandler);
router.post('/send-password-reset', sendPasswordResetHandler);
router.post('/send-welcome', sendWelcomeHandler);

module.exports = router;
