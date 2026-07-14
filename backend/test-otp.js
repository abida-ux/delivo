require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

const apiUrl = 'http://localhost:5000/api';

const apiFetch = async (path, method, body) => {
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || `Request failed: ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }

  return data;
};

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const bruteForceOTP = async (hash) => {
  for (let i = 100000; i <= 999999; i += 1) {
    const code = i.toString();
    if (hashOTP(code) === hash) {
      return code;
    }
  }
  throw new Error('OTP not found by brute force');
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const email = `otp-test-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  const name = 'OTP Test User';
  const phone = '1234567890';

  console.log('1) Registering test user:', email);
  const registerRes = await apiFetch('/users/register', 'POST', { name, email, password, phone });
  console.log('   Register response:', registerRes.message);

  const user = await User.findOne({ email }).select('+verificationCode +verificationCodeExpires +verificationCodeUsed');
  if (!user) throw new Error('Registered user not found in DB');

  console.log('   User created. Verified?', user.isVerified, 'Expires:', user.verificationCodeExpires);
  if (!user.verificationCode || !user.verificationCodeExpires) {
    throw new Error('Verification OTP metadata not stored');
  }

  const verificationCode = await bruteForceOTP(user.verificationCode);
  console.log('2) Recovered verification code:', verificationCode);

  console.log('3) Verifying email with code');
  const verifyRes = await apiFetch('/users/verify-email', 'POST', { email, code: verificationCode });
  console.log('   Verify response:', verifyRes.message);

  console.log('4) Confirm reuse is rejected');
  try {
    await apiFetch('/users/verify-email', 'POST', { email, code: verificationCode });
    throw new Error('Reused code should have failed');
  } catch (error) {
    console.log('   Reuse result:', error.response?.data?.message || error.message);
  }

  const loginRes = await apiFetch('/users/login', 'POST', { email, password });
  console.log('5) Login after verification succeeded. Token length:', loginRes.token?.length || 0);

  console.log('6) Requesting password reset');
  await apiFetch('/users/request-password-reset', 'POST', { email });
  const updatedUser = await User.findOne({ email }).select('+resetPasswordCode +resetPasswordExpires +resetPasswordUsed');
  const resetCode = await bruteForceOTP(updatedUser.resetPasswordCode);
  console.log('   Recovered reset code:', resetCode);

  const newPassword = 'NewPass123!';
  const resetRes = await apiFetch('/users/reset-password', 'POST', { email, code: resetCode, password: newPassword });
  console.log('   Reset response:', resetRes.message);

  const loginRes2 = await apiFetch('/users/login', 'POST', { email, password: newPassword });
  console.log('7) Login with new password succeeded. Token length:', loginRes2.token?.length || 0);

  console.log('✅ OTP flow confirmed successfully.');
  process.exit(0);
};

run().catch((error) => {
  console.error('❌ OTP test failed:', error.message);
  process.exit(1);
});