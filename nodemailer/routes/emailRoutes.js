const express = require('express');
const router = express.Router();
const { sendVerificationOTP, sendPasswordResetOTP } = require('../services/emailService');

router.post('/send-verification', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and otp are required',
    });
  }

  try {
    const info = await sendVerificationOTP(email, otp);
    return res.status(200).json({
      success: true,
      message: 'Verification email sent',
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    });
  }
});

router.post('/send-password-reset', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and otp are required',
    });
  }

  try {
    const info = await sendPasswordResetOTP(email, otp);
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message,
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Nodemailer service is running' });
});

module.exports = router;
