const Order = require('../models/Order');
const { sendMpesaStkPush, queryMpesaStkStatus } = require('../utils/mpesaService');

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

const classifyMpesaResult = ({ resultCode, resultDesc, receipt }) => {
  const desc = String(resultDesc || '').toLowerCase();
  const hasReceipt = Boolean(receipt);

  const isSuccessful =
    resultCode === 0 ||
    hasReceipt ||
    desc.includes('success') ||
    desc.includes('processed successfully') ||
    desc.includes('completed');

  const isExplicitFailure =
    /cancel|canceled|failed|expired|rejected|denied|timed out/.test(desc) ||
    (resultCode === 1032 && desc.includes('cancel'));

  return { isSuccessful, isExplicitFailure };
};

exports.handleMpesaStkPush = async (req, res, next) => {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'phoneNumber and amount are required' });
    }

    const normalizedAmount = Number(amount);
    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const response = await sendMpesaStkPush({
      phoneNumber,
      amount: normalizedAmount,
      accountReference: `TEST-${Date.now()}`,
      transactionDesc: `Delivo test payment ${normalizedAmount}`,
    });

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('❌ STK push endpoint error:', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'STK push failed',
    });
  }
};

exports.handleMpesaCallback = async (req, res, next) => {
  try {
    console.log('📩 M-Pesa callback received:', JSON.stringify(req.body, null, 2));

    const body = req.body.Body?.stkCallback;
    if (!body) {
      console.warn('⚠️ Unexpected M-Pesa callback payload');
      return res.status(400).json({ success: false, message: 'Invalid callback payload' });
    }

    const checkoutRequestId = body.CheckoutRequestID;
    const merchantRequestId = body.MerchantRequestID;
    const resultCode = Number(body.ResultCode);
    const resultDesc = body.ResultDesc;
    const items = Array.isArray(body.CallbackMetadata?.Item) ? body.CallbackMetadata.Item : [];

    const amount = items.find((item) => item.Name === 'Amount')?.Value ?? null;
    const receipt = items.find((item) => item.Name === 'MpesaReceiptNumber')?.Value ?? null;
    const phone = items.find((item) => item.Name === 'PhoneNumber')?.Value ?? null;
    const transactionDate = items.find((item) => item.Name === 'TransactionDate')?.Value ?? null;

    const order = await Order.findOne({ checkoutRequestId });
    if (!order) {
      console.warn(`⚠️ No order found for checkoutRequestId=${checkoutRequestId}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const result = classifyMpesaResult({ resultCode, resultDesc, receipt });

    order.merchantRequestId = merchantRequestId || order.merchantRequestId;
    order.checkoutRequestId = checkoutRequestId;
    order.mpesaReceiptNumber = receipt || order.mpesaReceiptNumber;
    order.transactionDate = transactionDate || order.transactionDate;
    order.paymentCallbackPayload = req.body;

    if (result.isSuccessful) {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.failureReason = '';
    } else if (result.isExplicitFailure) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.failureReason = resultDesc || 'M-Pesa payment failed or was cancelled';
    } else {
      order.paymentStatus = order.paymentStatus === 'completed' ? 'completed' : 'pending';
      order.failureReason = '';
    }

    order.updatedAt = new Date();
    await order.save();

    console.log(`✅ M-Pesa callback processed. Order ${order._id} status=${order.status}`);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    next(error);
  }
};

exports.handleMpesaStatus = async (req, res, next) => {
  try {
    const { checkoutRequestId } = req.query;
    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, message: 'checkoutRequestId is required' });
    }

    const order = await Order.findOne({ checkoutRequestId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'completed' || order.paymentStatus === 'failed') {
      return res.json({ success: true, data: order });
    }

    try {
      const queryResponse = await queryMpesaStkStatus({ checkoutRequestId });
      const resultCode = Number(queryResponse?.ResultCode);
      const resultDesc = queryResponse?.ResultDesc || '';
      const receipt = queryResponse?.MpesaReceiptNumber || null;
      const transactionDate = queryResponse?.TransactionDate || null;
      const result = classifyMpesaResult({ resultCode, resultDesc, receipt });

      if (result.isSuccessful) {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.mpesaReceiptNumber = receipt || order.mpesaReceiptNumber;
        order.transactionDate = transactionDate || order.transactionDate;
        order.paymentCallbackPayload = queryResponse;
        order.failureReason = '';
      } else if (result.isExplicitFailure) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        order.failureReason = resultDesc || 'M-Pesa payment failed or was cancelled';
      }

      order.updatedAt = new Date();
      await order.save();
    } catch (queryErr) {
      console.warn('⚠️ M-Pesa STK query status notice:', queryErr.message || queryErr);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('❌ M-Pesa status check failed:', error.message || error);
    next(error);
  }
};

