const crypto = require('crypto');

const generateOTP = () => {
  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  return otp;
};

module.exports = generateOTP;
