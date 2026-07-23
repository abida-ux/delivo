const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  updateRiderStatus,
  getAllUsers,
  deleteUser,
  createUser,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/', createUser);
router.get('/me', authenticate, getCurrentUserProfile);
router.put('/me/status', authenticate, updateRiderStatus);
router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.delete('/:id', deleteUser);

module.exports = router;
