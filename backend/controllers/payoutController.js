const Payout = require('../models/Payout');
const User = require('../models/User');
const Order = require('../models/Order');
const RiderLedger = require('../models/RiderLedger');
const AdminLog = require('../models/AdminLog');
const { sendMpesaB2CPayment, normalizeKenyanPhone } = require('../services/mpesaB2CService');
const { queryMpesaAccountBalance } = require('../services/mpesaAccountBalanceService');
const { createInAppNotification, sendPushToUser } = require('../utils/pushNotifications');

// In-memory cache for live M-Pesa account balance
let cachedMpesaBalance = {
  accountBalance: null,
  workingBalance: null,
  utilityBalance: null,
  lastChecked: null,
  status: 'Not Checked',
};

/**
 * @desc Request rider withdrawal / payout via M-Pesa B2C
 * @route POST /api/payouts/withdraw
 * @access Private (Rider only)
 */
exports.requestRiderWithdrawal = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { amount, phone, remarks } = req.body;

    // 1. Verify user exists and is a rider
    const user = await User.findById(riderId);
    if (!user || user.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Only registered riders can request payouts' });
    }

    // 2. Validate Amount
    const amountVal = Math.floor(Number(amount));
    if (!amountVal || Number.isNaN(amountVal) || amountVal <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid withdrawal amount' });
    }

    if (amountVal < 10) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is KSh 10' });
    }

    if (amountVal > 150000) {
      return res.status(400).json({ success: false, message: 'Maximum withdrawal amount is KSh 150,000 per transaction' });
    }

    // 3. Validate & Normalize Kenyan Phone Number
    const targetPhone = phone || user.phone;
    let normalizedPhone;
    try {
      normalizedPhone = normalizeKenyanPhone(targetPhone);
    } catch (phoneErr) {
      return res.status(400).json({ success: false, message: phoneErr.message });
    }

    // 4. Check for conflicting in-progress payouts to prevent double submission
    const existingProcessingPayout = await Payout.findOne({
      riderId: user._id,
      status: 'processing',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // within last 60 seconds
    });

    if (existingProcessingPayout) {
      return res.status(409).json({
        success: false,
        message: 'A withdrawal is already currently processing for your account. Please wait a moment before trying again.',
      });
    }

    // 5. ATOMIC BALANCE RESERVATION: Check available balance and lock funds
    // Ensures availableBalance >= amountVal atomically without race conditions
    const updatedRider = await User.findOneAndUpdate(
      {
        _id: user._id,
        role: 'rider',
        availableBalance: { $gte: amountVal },
      },
      {
        $inc: {
          availableBalance: -amountVal,
          pendingPayoutBalance: amountVal,
        },
      },
      { new: true }
    );

    if (!updatedRider) {
      return res.status(400).json({
        success: false,
        message: `Insufficient withdrawable balance. Your available balance is KSh ${user.availableBalance || 0}.`,
      });
    }

    // 6. Create Payout record with initial attempt
    const payout = await Payout.create({
      riderId: user._id,
      amount: amountVal,
      phone: normalizedPhone,
      status: 'processing',
      payoutType: 'automatic',
      initiatedBy: user._id,
      requestedAt: new Date(),
      attempts: [
        {
          attemptNumber: 1,
          initiatedAt: new Date(),
          status: 'processing',
          initiatedBy: user._id,
        },
      ],
    });

    // 7. Write to Rider Financial Ledger (Reservation)
    try {
      await RiderLedger.create({
        riderId: user._id,
        type: 'withdrawal_reservation',
        amount: -amountVal,
        balanceAfter: updatedRider.availableBalance,
        referenceId: payout._id,
        referenceType: 'Payout',
        description: `M-Pesa B2C withdrawal request #${payout._id.toString().slice(-6)} to ${normalizedPhone}`,
        metadata: { payoutId: payout._id, phone: normalizedPhone, amount: amountVal },
      });
    } catch (ledgerErr) {
      console.error('⚠️ Rider ledger creation error on withdrawal:', ledgerErr);
    }

    // 8. Dispatch B2C Payment Request to Safaricom Daraja
    try {
      const b2cResponse = await sendMpesaB2CPayment({
        phone: normalizedPhone,
        amount: amountVal,
        remarks: remarks || `Delivo Payout #${payout._id.toString().slice(-6)}`,
        occasion: 'Rider Payout',
        payoutId: payout._id.toString(),
      });

      payout.originatorConversationId = b2cResponse.OriginatorConversationID;
      payout.conversationId = b2cResponse.ConversationID;
      payout.resultCode = b2cResponse.ResponseCode !== undefined ? Number(b2cResponse.ResponseCode) : undefined;
      payout.resultDesc = b2cResponse.ResponseDescription;
      payout.b2cResponsePayload = b2cResponse;

      if (payout.attempts && payout.attempts.length > 0) {
        payout.attempts[0].conversationId = b2cResponse.ConversationID;
        payout.attempts[0].originatorConversationId = b2cResponse.OriginatorConversationID;
        payout.attempts[0].responsePayload = b2cResponse;
      }

      await payout.save();

      console.log(`✅ M-Pesa B2C request accepted by Safaricom for Payout ${payout._id}, ConvID=${payout.conversationId}`);

      return res.status(200).json({
        success: true,
        message: 'Withdrawal request submitted successfully. Funds are on their way to your M-Pesa.',
        payout: {
          id: payout._id,
          amount: payout.amount,
          phone: payout.phone,
          status: payout.status,
          requestedAt: payout.requestedAt,
        },
        wallet: {
          availableBalance: updatedRider.availableBalance,
          pendingPayoutBalance: updatedRider.pendingPayoutBalance,
        },
      });
    } catch (b2cError) {
      console.error(`❌ M-Pesa B2C dispatch failed for Payout ${payout._id}:`, b2cError.message);

      // ROLLBACK BALANCE RESERVATION: Return locked funds immediately on network/dispatch rejection
      const restoredRider = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: {
            availableBalance: amountVal,
            pendingPayoutBalance: -amountVal,
          },
        },
        { new: true }
      );

      payout.status = 'failed';
      payout.failureReason = b2cError.message || 'M-Pesa API rejected disbursement request';
      if (payout.attempts && payout.attempts.length > 0) {
        payout.attempts[0].status = 'failed';
        payout.attempts[0].failureReason = payout.failureReason;
      }
      await payout.save();

      // Record Reversal in Ledger
      try {
        await RiderLedger.create({
          riderId: user._id,
          type: 'withdrawal_reversal',
          amount: amountVal,
          balanceAfter: restoredRider?.availableBalance || (user.availableBalance + amountVal),
          referenceId: payout._id,
          referenceType: 'Payout',
          description: `Disbursement dispatch failed: ${b2cError.message}. Funds restored to wallet.`,
          metadata: { payoutId: payout._id, reason: b2cError.message },
        });
      } catch (ledgerErr) {
        console.error('⚠️ Rider ledger reversal log error:', ledgerErr);
      }

      return res.status(502).json({
        success: false,
        message: `M-Pesa withdrawal could not be processed: ${b2cError.message}`,
        payout: {
          id: payout._id,
          status: 'failed',
          failureReason: payout.failureReason,
        },
      });
    }
  } catch (error) {
    console.error('❌ Withdrawal controller error:', error);
    next(error);
  }
};

/**
 * @desc Get rider earnings summary and wallet balances
 * @route GET /api/payouts/my-summary
 * @access Private (Rider only)
 */
exports.getRiderEarningsSummary = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const rider = await User.findById(riderId);

    if (!rider || rider.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Rider account required' });
    }

    // Automatic balance synchronization for existing deliveries
    let availableBalance = Number(rider.availableBalance || 0);
    const pendingPayoutBalance = Number(rider.pendingPayoutBalance || 0);
    let totalWithdrawn = Number(rider.totalWithdrawn || 0);
    let totalEarnings = Number(rider.totalEarnings || 0);

    // If availableBalance has never been set and rider has delivered orders, compute & sync
    if (availableBalance === 0 && totalWithdrawn === 0 && pendingPayoutBalance === 0) {
      const deliveredOrders = await Order.find({ riderId: rider._id, status: 'delivered' });
      const calculatedEarnings = deliveredOrders.reduce((sum, ord) => sum + (Number(ord.deliveryFee) || 20), 0);

      const completedPayouts = await Payout.find({ riderId: rider._id, status: 'completed' });
      const calculatedWithdrawn = completedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      if (calculatedEarnings > 0 || calculatedWithdrawn > 0) {
        totalEarnings = Math.max(totalEarnings, calculatedEarnings);
        totalWithdrawn = calculatedWithdrawn;
        availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

        rider.totalEarnings = totalEarnings;
        rider.totalWithdrawn = totalWithdrawn;
        rider.availableBalance = availableBalance;
        await rider.save();
      }
    }

    const completedDeliveriesCount = await Order.countDocuments({ riderId: rider._id, status: 'delivered' });

    res.status(200).json({
      success: true,
      data: {
        availableBalance,
        pendingPayoutBalance,
        totalWithdrawn,
        totalEarnings,
        totalDeliveries: completedDeliveriesCount || rider.totalDeliveries || 0,
        riderName: rider.name,
        phone: rider.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get logged-in rider's withdrawal history
 * @route GET /api/payouts/my-payouts
 * @access Private (Rider only)
 */
exports.getRiderPayouts = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Payout.countDocuments({ riderId });
    const payouts = await Payout.find({ riderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: payouts.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      data: payouts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get logged-in rider's financial ledger history
 * @route GET /api/payouts/my-ledger
 * @access Private (Rider only)
 */
exports.getRiderLedger = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const total = await RiderLedger.countDocuments({ riderId });
    const ledgerEntries = await RiderLedger.find({ riderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: ledgerEntries.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      data: ledgerEntries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Handle Safaricom B2C Result callback
 * @route POST /api/payouts/b2c/result
 * @access Public (Protected via callback secret token)
 */
exports.handleB2CResult = async (req, res, next) => {
  try {
    console.log('📩 M-Pesa B2C Result callback received:', JSON.stringify(req.body, null, 2));

    // 1. Verify Callback Secret Token
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026';
    if (req.query.secret && req.query.secret !== callbackSecret) {
      console.warn('❌ Unauthorized B2C callback rejected - invalid secret');
      return res.status(401).json({ success: false, message: 'Unauthorized callback' });
    }

    const result = req.body?.Result;
    if (!result) {
      console.warn('⚠️ Unexpected B2C callback structure');
      return res.status(400).json({ success: false, message: 'Invalid result payload' });
    }

    const conversationId = result.ConversationID;
    const originatorConversationId = result.OriginatorConversationID;
    const resultCode = Number(result.ResultCode);
    const resultDesc = result.ResultDesc || '';
    const transactionReceipt = result.TransactionID || null;

    // Parse ResultParameters array from Safaricom
    const params = Array.isArray(result.ResultParameters?.ResultParameter)
      ? result.ResultParameters.ResultParameter
      : [];

    const receiptFromParams = params.find((p) => p.Key === 'TransactionReceipt')?.Value || transactionReceipt;

    // 2. Locate Payout record
    let payout = null;
    if (conversationId) {
      payout = await Payout.findOne({ conversationId });
    }
    if (!payout && originatorConversationId) {
      payout = await Payout.findOne({ originatorConversationId });
    }

    if (!payout) {
      console.warn(`⚠️ No payout found matching ConvID=${conversationId}, OriginatorConvID=${originatorConversationId}`);
      return res.status(404).json({ ResultCode: 0, ResultDesc: 'Payout not found' });
    }

    // 3. Idempotency Guard: Do not process completed or failed payouts twice
    if (payout.status === 'completed' || (payout.status === 'failed' && payout.resultCode !== undefined)) {
      console.log(`ℹ️ Payout ${payout._id} already finalized with status=${payout.status}. Skipping duplicate callback.`);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    payout.resultCode = resultCode;
    payout.resultDesc = resultDesc;
    payout.transactionReceipt = receiptFromParams || payout.transactionReceipt;
    payout.b2cCallbackPayload = req.body;

    if (payout.attempts && payout.attempts.length > 0) {
      const lastAttempt = payout.attempts[payout.attempts.length - 1];
      lastAttempt.status = resultCode === 0 ? 'completed' : 'failed';
      lastAttempt.resultCode = resultCode;
      lastAttempt.resultDesc = resultDesc;
      lastAttempt.callbackPayload = req.body;
    }

    if (resultCode === 0) {
      // SUCCESSFUL B2C PAYOUT
      payout.status = 'completed';
      payout.completedAt = new Date();
      payout.failureReason = '';
      await payout.save();

      // Finalize wallet balances: Deduct from pending, credit totalWithdrawn
      const updatedUser = await User.findByIdAndUpdate(
        payout.riderId,
        {
          $inc: {
            pendingPayoutBalance: -payout.amount,
            totalWithdrawn: payout.amount,
          },
        },
        { new: true }
      );

      // Record Completed entry in Ledger
      try {
        await RiderLedger.create({
          riderId: payout.riderId,
          type: 'withdrawal_completed',
          amount: 0,
          balanceAfter: updatedUser?.availableBalance || 0,
          referenceId: payout._id,
          referenceType: 'Payout',
          description: `Withdrawal #${payout._id.toString().slice(-6)} completed on M-Pesa. Receipt: ${payout.transactionReceipt}`,
          metadata: {
            payoutId: payout._id,
            receipt: payout.transactionReceipt,
            amount: payout.amount,
          },
        });
      } catch (ledgerErr) {
        console.error('⚠️ Rider ledger completed log error:', ledgerErr);
      }

      console.log(`✅ Payout ${payout._id} COMPLETED. Receipt: ${payout.transactionReceipt}`);

      // Notify Rider
      try {
        const notifPayload = {
          title: 'Withdrawal Successful! 💸',
          message: `Your M-Pesa payout of KSh ${payout.amount} has been completed. Receipt: ${payout.transactionReceipt || 'M-Pesa'}`,
          url: '/rider/earnings',
          tag: 'delivo-payout-success',
        };
        await createInAppNotification({
          userId: payout.riderId,
          title: notifPayload.title,
          message: notifPayload.message,
          type: 'system',
        });
        await sendPushToUser({ userId: payout.riderId, payload: notifPayload });
      } catch (notifErr) {
        console.error('⚠️ Payout success notification error:', notifErr.message);
      }
    } else {
      // FAILED B2C PAYOUT
      payout.status = 'failed';
      payout.failureReason = resultDesc || 'M-Pesa B2C payout declined by Safaricom';
      await payout.save();

      // ROLLBACK: Release pending funds back to available balance
      const restoredUser = await User.findByIdAndUpdate(
        payout.riderId,
        {
          $inc: {
            pendingPayoutBalance: -payout.amount,
            availableBalance: payout.amount,
          },
        },
        { new: true }
      );

      // Record Reversal in Ledger
      try {
        await RiderLedger.create({
          riderId: payout.riderId,
          type: 'withdrawal_reversal',
          amount: payout.amount,
          balanceAfter: restoredUser?.availableBalance || payout.amount,
          referenceId: payout._id,
          referenceType: 'Payout',
          description: `M-Pesa payout declined (${resultDesc}). KSh ${payout.amount} returned to available balance.`,
          metadata: { payoutId: payout._id, reason: resultDesc, resultCode },
        });
      } catch (ledgerErr) {
        console.error('⚠️ Rider ledger rollback log error:', ledgerErr);
      }

      console.log(`❌ Payout ${payout._id} FAILED. Reason: ${payout.failureReason}`);

      // Notify Rider of failure & fund restoration
      try {
        const notifPayload = {
          title: 'Withdrawal Failed',
          message: `Your withdrawal of KSh ${payout.amount} could not be completed (${resultDesc}). The funds have been returned to your available balance.`,
          url: '/rider/earnings',
          tag: 'delivo-payout-failed',
        };
        await createInAppNotification({
          userId: payout.riderId,
          title: notifPayload.title,
          message: notifPayload.message,
          type: 'system',
        });
        await sendPushToUser({ userId: payout.riderId, payload: notifPayload });
      } catch (notifErr) {
        console.error('⚠️ Payout failure notification error:', notifErr.message);
      }
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('❌ B2C callback processing error:', error);
    next(error);
  }
};

/**
 * @desc Handle Safaricom B2C Queue Timeout callback
 * @route POST /api/payouts/b2c/timeout
 * @access Public (Protected via callback secret token)
 */
exports.handleB2CTimeout = async (req, res, next) => {
  try {
    console.warn('⏱️ M-Pesa B2C Timeout callback received:', JSON.stringify(req.body, null, 2));

    const callbackSecret = process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026';
    if (req.query.secret && req.query.secret !== callbackSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized callback' });
    }

    const result = req.body?.Result;
    const conversationId = result?.ConversationID;
    const originatorConversationId = result?.OriginatorConversationID;

    if (conversationId || originatorConversationId) {
      const payout = await Payout.findOne({
        $or: [{ conversationId }, { originatorConversationId }],
      });

      if (payout && payout.status === 'processing') {
        payout.status = 'timeout';
        payout.failureReason = result?.ResultDesc || 'Transaction timed out in Safaricom queue';
        payout.b2cCallbackPayload = req.body;
        if (payout.attempts && payout.attempts.length > 0) {
          payout.attempts[payout.attempts.length - 1].status = 'timeout';
          payout.attempts[payout.attempts.length - 1].failureReason = payout.failureReason;
        }
        await payout.save();
        console.log(`⏱️ Payout ${payout._id} marked as timeout`);
      }
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('❌ B2C timeout handler error:', error);
    next(error);
  }
};

/**
 * @desc Get all platform payouts for Admin view
 * @route GET /api/payouts/admin/all
 * @access Private (Admin only)
 */
exports.getAllPayoutsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const matchingRiders = await User.find({
        role: 'rider',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const riderIds = matchingRiders.map((r) => r._id);
      query.$or = [
        { riderId: { $in: riderIds } },
        { phone: { $regex: search, $options: 'i' } },
        { transactionReceipt: { $regex: search, $options: 'i' } },
        { conversationId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Payout.countDocuments(query);
    const payouts = await Payout.find(query)
      .populate('riderId', 'name email phone availableBalance totalEarnings totalWithdrawn')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate aggregated payout statistics for admin
    const stats = {
      totalDisbursed: (
        await Payout.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
      )[0]?.total || 0,
      totalPending: (
        await Payout.aggregate([
          { $match: { status: 'processing' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
      )[0]?.total || 0,
      completedCount: await Payout.countDocuments({ status: 'completed' }),
      failedCount: await Payout.countDocuments({ status: 'failed' }),
    };

    res.status(200).json({
      success: true,
      count: payouts.length,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      data: payouts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin manually retries a failed payout
 * @route POST /api/payouts/admin/:id/retry
 * @access Private (Admin only)
 */
exports.adminRetryPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findById(id);

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (payout.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot retry a completed payout' });
    }

    if (payout.status === 'processing') {
      return res.status(400).json({ success: false, message: 'This payout is already processing' });
    }

    const rider = await User.findById(payout.riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    // If payout previously failed, rider's funds were refunded to availableBalance.
    // Atomically re-reserve the funds before retrying.
    if (payout.status === 'failed') {
      const updatedRider = await User.findOneAndUpdate(
        { _id: rider._id, availableBalance: { $gte: payout.amount } },
        { $inc: { availableBalance: -payout.amount, pendingPayoutBalance: payout.amount } },
        { new: true }
      );

      if (!updatedRider) {
        return res.status(400).json({
          success: false,
          message: `Rider currently has insufficient balance (KSh ${rider.availableBalance}) to retry this KSh ${payout.amount} payout.`,
        });
      }
    }

    // Record new Attempt
    const attemptNumber = (payout.attempts?.length || 0) + 1;
    payout.attempts.push({
      attemptNumber,
      initiatedAt: new Date(),
      status: 'processing',
      initiatedBy: req.user.id,
    });

    payout.status = 'processing';
    payout.failureReason = '';
    await payout.save();

    // Log admin audit action
    try {
      await AdminLog.create({
        admin: req.user.id,
        action: 'RETRY_RIDER_PAYOUT',
        resourceType: 'Payout',
        resourceId: payout._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: { payoutId: payout._id, amount: payout.amount, phone: payout.phone, attemptNumber },
      });
    } catch (auditErr) {
      console.warn('⚠️ Admin audit logging error on payout retry:', auditErr.message);
    }

    try {
      const b2cResponse = await sendMpesaB2CPayment({
        phone: payout.phone,
        amount: payout.amount,
        remarks: `Delivo Admin Retry #${payout._id.toString().slice(-6)}`,
        occasion: 'Rider Payout Retry',
        payoutId: payout._id.toString(),
      });

      payout.originatorConversationId = b2cResponse.OriginatorConversationID;
      payout.conversationId = b2cResponse.ConversationID;
      payout.b2cResponsePayload = b2cResponse;

      const currentAttempt = payout.attempts[payout.attempts.length - 1];
      currentAttempt.conversationId = b2cResponse.ConversationID;
      currentAttempt.originatorConversationId = b2cResponse.OriginatorConversationID;
      currentAttempt.responsePayload = b2cResponse;

      await payout.save();

      res.status(200).json({
        success: true,
        message: 'Payout retry submitted to M-Pesa successfully.',
        payout,
      });
    } catch (b2cErr) {
      // Rollback on immediate failure
      await User.findByIdAndUpdate(rider._id, {
        $inc: { availableBalance: payout.amount, pendingPayoutBalance: -payout.amount },
      });

      payout.status = 'failed';
      payout.failureReason = b2cErr.message;
      const currentAttempt = payout.attempts[payout.attempts.length - 1];
      currentAttempt.status = 'failed';
      currentAttempt.failureReason = b2cErr.message;

      await payout.save();

      res.status(502).json({
        success: false,
        message: `M-Pesa B2C retry failed: ${b2cErr.message}`,
        payout,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get real-time M-Pesa Account Balance for Admin
 * @route GET /api/payouts/admin/mpesa-balance
 * @access Private (Admin only)
 */
exports.getAdminMpesaBalance = async (req, res, next) => {
  try {
    const { refresh } = req.query;

    if (refresh === 'true') {
      try {
        const queryRes = await queryMpesaAccountBalance({ remarks: 'Admin Dashboard Query' });
        return res.status(200).json({
          success: true,
          message: 'Balance query request dispatched to Safaricom Daraja.',
          data: cachedMpesaBalance,
          queryResponse: queryRes,
        });
      } catch (err) {
        return res.status(502).json({
          success: false,
          message: `Failed to query Safaricom Account Balance: ${err.message}`,
          data: cachedMpesaBalance,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: cachedMpesaBalance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Handle Safaricom Account Balance Result callback
 * @route POST /api/payouts/b2c/balance-result
 * @access Public (Protected via callback secret token)
 */
exports.handleAccountBalanceResult = async (req, res, next) => {
  try {
    console.log('📩 Safaricom Account Balance Result Callback:', JSON.stringify(req.body, null, 2));

    const callbackSecret = process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026';
    if (req.query.secret && req.query.secret !== callbackSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized callback' });
    }

    const result = req.body?.Result;
    if (result && result.ResultCode === 0) {
      const params = result.ResultParameters?.ResultParameter || [];
      const balanceStr = params.find((p) => p.Key === 'AccountBalance')?.Value || '';

      cachedMpesaBalance = {
        accountBalance: balanceStr,
        rawParameters: params,
        lastChecked: new Date(),
        status: 'Connected',
      };
      console.log('✅ Updated cached M-Pesa Account Balance:', balanceStr);
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('❌ Account Balance callback error:', error);
    next(error);
  }
};
