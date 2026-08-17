const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeKenyanPhone } = require('../services/mpesaB2CService');
const Payout = require('../models/Payout');
const User = require('../models/User');
const payoutController = require('../controllers/payoutController');

test('normalizeKenyanPhone correctly formats valid Kenyan numbers', () => {
  assert.equal(normalizeKenyanPhone('0712345678'), '254712345678');
  assert.equal(normalizeKenyanPhone('0112345678'), '254112345678');
  assert.equal(normalizeKenyanPhone('+254712345678'), '254712345678');
  assert.equal(normalizeKenyanPhone('+254112345678'), '254112345678');
  assert.equal(normalizeKenyanPhone('254712345678'), '254712345678');
  assert.equal(normalizeKenyanPhone('254112345678'), '254112345678');
  assert.equal(normalizeKenyanPhone('0712 345 678'), '254712345678');
  assert.equal(normalizeKenyanPhone('00254712345678'), '254712345678');
});

test('normalizeKenyanPhone rejects invalid phone numbers', () => {
  assert.throws(() => normalizeKenyanPhone(''), /Phone number is required/);
  assert.throws(() => normalizeKenyanPhone('12345'), /Invalid Kenyan M-Pesa phone number/);
  assert.throws(() => normalizeKenyanPhone('0201234567'), /Invalid Kenyan M-Pesa phone number/);
  assert.throws(() => normalizeKenyanPhone('+14155552671'), /Invalid Kenyan M-Pesa phone number/);
  assert.throws(() => normalizeKenyanPhone('abcdefghij'), /Invalid Kenyan M-Pesa phone number/);
});

test('payoutController.requestRiderWithdrawal validates minimum amount and balance', async () => {
  const req = {
    user: { id: 'mockRiderId', role: 'rider' },
    body: { amount: 5, phone: '0712345678' },
  };

  const originalFindById = User.findById;
  User.findById = async (id) => ({
    _id: id,
    role: 'rider',
    phone: '0712345678',
    availableBalance: 1000,
  });

  try {
    let statusCode;
    let jsonResponse;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
            return data;
          },
        };
      },
    };

    await payoutController.requestRiderWithdrawal(req, res, () => {});
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.message.includes('Minimum withdrawal'));
  } finally {
    User.findById = originalFindById;
  }
});

test('payoutController.handleB2CResult idempotently processes successful callback and updates ledger', async () => {
  let updatedUser = null;
  let savedPayout = null;

  const mockPayout = {
    _id: 'payout123',
    riderId: 'rider123',
    amount: 500,
    phone: '254712345678',
    status: 'processing',
    conversationId: 'AG_20260817_12345',
    save: async function () {
      savedPayout = this;
      return this;
    },
  };

  const originalFindOne = Payout.findOne;
  Payout.findOne = async (query) => {
    if (query.conversationId === 'AG_20260817_12345') {
      return mockPayout;
    }
    return null;
  };

  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  User.findByIdAndUpdate = async (id, update) => {
    updatedUser = { id, update };
    return { _id: id };
  };

  try {
    const req = {
      query: { secret: process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026' },
      body: {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          OriginatorConversationID: 'ORIG_12345',
          ConversationID: 'AG_20260817_12345',
          TransactionID: 'LK12345678',
          ResultParameters: {
            ResultParameter: [
              { Key: 'TransactionReceipt', Value: 'LK12345678' },
              { Key: 'TransactionAmount', Value: 500 },
            ],
          },
        },
      },
    };

    let jsonResponse;
    const res = {
      json: (data) => {
        jsonResponse = data;
        return data;
      },
    };

    await payoutController.handleB2CResult(req, res, () => {});

    assert.equal(jsonResponse.ResultCode, 0);
    assert.equal(savedPayout.status, 'completed');
    assert.equal(savedPayout.transactionReceipt, 'LK12345678');
    assert.equal(updatedUser.id, 'rider123');
    assert.deepEqual(updatedUser.update, {
      $inc: {
        pendingPayoutBalance: -500,
        totalWithdrawn: 500,
      },
    });

    // Test Idempotency: Calling callback again should not double process
    let secondJson;
    const secondRes = {
      json: (data) => {
        secondJson = data;
        return data;
      },
    };
    await payoutController.handleB2CResult(req, secondRes, () => {});
    assert.equal(secondJson.ResultCode, 0);
  } finally {
    Payout.findOne = originalFindOne;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test('payoutController.handleB2CResult safely rolls back reserved balance on Safaricom failure', async () => {
  let updatedUser = null;
  let savedPayout = null;

  const mockPayout = {
    _id: 'payout456',
    riderId: 'rider123',
    amount: 300,
    phone: '254712345678',
    status: 'processing',
    conversationId: 'AG_FAIL_12345',
    save: async function () {
      savedPayout = this;
      return this;
    },
  };

  const originalFindOne = Payout.findOne;
  Payout.findOne = async (query) => {
    if (query.conversationId === 'AG_FAIL_12345') {
      return mockPayout;
    }
    return null;
  };

  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  User.findByIdAndUpdate = async (id, update) => {
    updatedUser = { id, update };
    return { _id: id };
  };

  try {
    const req = {
      query: { secret: process.env.MPESA_CALLBACK_SECRET || 'delivo_secure_fallback_secret_2026' },
      body: {
        Result: {
          ResultType: 0,
          ResultCode: 2001,
          ResultDesc: 'The initiator information is invalid.',
          OriginatorConversationID: 'ORIG_FAIL_123',
          ConversationID: 'AG_FAIL_12345',
        },
      },
    };

    let jsonResponse;
    const res = {
      json: (data) => {
        jsonResponse = data;
        return data;
      },
    };

    await payoutController.handleB2CResult(req, res, () => {});

    assert.equal(jsonResponse.ResultCode, 0);
    assert.equal(savedPayout.status, 'failed');
    assert.ok(savedPayout.failureReason.includes('invalid'));
    // Rolled back funds: deducted from pending and credited back to available balance!
    assert.deepEqual(updatedUser.update, {
      $inc: {
        pendingPayoutBalance: -300,
        availableBalance: 300,
      },
    });
  } finally {
    Payout.findOne = originalFindOne;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});
