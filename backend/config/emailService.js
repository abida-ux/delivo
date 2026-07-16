const { sendVerification, sendPasswordReset } = require('../services/emailClient');

exports.sendVerificationEmail = async (email, verificationCode) => {
  return sendVerification({ email, token: verificationCode });
};

exports.sendPasswordResetEmail = async (email, resetCode) => {
  return sendPasswordReset({ email, token: resetCode });
};
