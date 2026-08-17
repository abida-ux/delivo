const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  requestRiderWithdrawal,
  getRiderEarningsSummary,
  getRiderPayouts,
  getRiderLedger,
  handleB2CResult,
  handleB2CTimeout,
  getAllPayoutsAdmin,
  adminRetryPayout,
  getAdminMpesaBalance,
  handleAccountBalanceResult,
} = require('../controllers/payoutController');

// Rider Payout Routes (Protected for Riders)
router.post('/withdraw', authenticate, authorizeRoles('rider'), requestRiderWithdrawal);
router.get('/my-summary', authenticate, authorizeRoles('rider'), getRiderEarningsSummary);
router.get('/my-payouts', authenticate, authorizeRoles('rider'), getRiderPayouts);
router.get('/my-ledger', authenticate, authorizeRoles('rider'), getRiderLedger);

// Public Safaricom Callbacks (Verified via callback secret token in query)
router.post('/b2c/result', handleB2CResult);
router.post('/b2c/timeout', handleB2CTimeout);
router.post('/b2c/balance-result', handleAccountBalanceResult);

// Admin Payout Management Routes (Protected for Admins)
router.get('/admin/all', authenticate, authorizeRoles('admin'), getAllPayoutsAdmin);
router.post('/admin/:id/retry', authenticate, authorizeRoles('admin'), adminRetryPayout);
router.get('/admin/mpesa-balance', authenticate, authorizeRoles('admin'), getAdminMpesaBalance);

module.exports = router;
