const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');

const sendVerificationHandler = async (req, res) => {
  try {
    console.log(`[email-service] verification request recipient=${req.body?.email || 'unknown'}`);
    const result = await sendVerificationEmail(req.body);
    res.status(200).json({ success: true, message: 'Verification email sent', data: result });
  } catch (error) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 502;
    res.status(status).json({ success: false, message: error.message, errorCode: error.code || 'EMAIL_SEND_FAILED' });
  }
};

const sendPasswordResetHandler = async (req, res) => {
  try {
    console.log(`[email-service] password-reset request recipient=${req.body?.email || 'unknown'}`);
    const result = await sendPasswordResetEmail(req.body);
    res.status(200).json({ success: true, message: 'Password reset email sent', data: result });
  } catch (error) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 502;
    res.status(status).json({ success: false, message: error.message, errorCode: error.code || 'EMAIL_SEND_FAILED' });
  }
};

const sendWelcomeHandler = async (req, res) => {
  try {
    console.log(`[email-service] welcome request recipient=${req.body?.email || 'unknown'}`);
    const result = await sendWelcomeEmail(req.body);
    res.status(200).json({ success: true, message: 'Welcome email sent', data: result });
  } catch (error) {
    const status = error.code === 'VALIDATION_ERROR' ? 400 : 502;
    res.status(status).json({ success: false, message: error.message, errorCode: error.code || 'EMAIL_SEND_FAILED' });
  }
};

module.exports = {
  sendVerificationHandler,
  sendPasswordResetHandler,
  sendWelcomeHandler,
};
