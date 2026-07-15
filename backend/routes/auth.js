const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('../config/emailService');
const { runSmtpDiagnostics } = require('../utils/smtpDiagnostic');

router.post('/verify-email-test', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email and code are required',
    });
  }

  try {
    const result = await sendVerificationEmail(email, code);
    return res.status(200).json({
      success: true,
      message: 'Verification email sent',
      messageId: result.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    });
  }
});

router.get('/smtp-diagnostics', async (req, res) => {
  try {
    const diagnostics = await runSmtpDiagnostics();
    return res.status(200).json({
      success: true,
      diagnostics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'SMTP diagnostics failed',
      error: error.message,
    });
  }
});

module.exports = router;
