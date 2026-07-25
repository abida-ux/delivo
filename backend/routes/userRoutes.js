const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/authMiddleware');
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
  getAdminStats,
} = require('../controllers/userController');


router.post('/register', optionalAuthenticate, registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Secured user endpoints
router.post('/', authenticate, authorizeRoles('admin'), createUser);
router.get('/admin/stats', authenticate, authorizeRoles('admin'), getAdminStats);
router.get('/me', authenticate, getCurrentUserProfile);
router.put('/me/status', authenticate, updateRiderStatus);

router.get('/', authenticate, authorizeRoles('admin'), getAllUsers);
router.get('/:id', authenticate, getUserProfile);
router.put('/:id', authenticate, updateUserProfile);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteUser);

module.exports = router;
