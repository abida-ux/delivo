const Order = require('../models/Order');
const { sendMpesaStkPush } = require('../utils/mpesaService');

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

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

    order.merchantRequestId = merchantRequestId || order.merchantRequestId;
    order.checkoutRequestId = checkoutRequestId;
    order.mpesaReceiptNumber = receipt || order.mpesaReceiptNumber;
    order.transactionDate = transactionDate || order.transactionDate;
    order.paymentCallbackPayload = req.body;
    order.failureReason = resultCode !== 0 ? resultDesc : '';

    if (resultCode === 0) {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
    } else {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
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

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
