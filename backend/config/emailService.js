const {
  sendVerificationOTP,
  sendPasswordResetOTP,
} = require('../utils/sendOTP');

exports.sendVerificationEmail = async (email, verificationCode) => {
  return sendVerificationOTP(email, verificationCode);
};

exports.sendPasswordResetEmail = async (email, resetCode) => {
  return sendPasswordResetOTP(email, resetCode);
};
