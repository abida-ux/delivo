const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Payout = require('../models/Payout');
const RiderLedger = require('../models/RiderLedger');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const payoutController = require('../controllers/payoutController');

test('Rider Duty: Cannot switch to offline during active delivery', async () => {
  const originalFindById = User.findById;
  const originalOrderExists = Order.exists;

  User.findById = async (id) => ({
    _id: id,
    role: 'rider',
    riderStatus: 'on-delivery',
    isOnline: true,
    save: async () => {},
  });

  Order.exists = async () => true; // Simulating active delivery exists

  try {
    const req = {
      user: { id: 'rider123', role: 'rider' },
      body: { riderStatus: 'offline' },
    };

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

    await userController.updateRiderStatus(req, res, () => {});
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.message.includes('active delivery'));
  } finally {
    User.findById = originalFindById;
    Order.exists = originalOrderExists;
  }
});

test('Order Claiming: Offline rider cannot claim orders', async () => {
  const originalFindById = User.findById;
  User.findById = async (id) => ({
    _id: id,
    role: 'rider',
    riderStatus: 'offline',
    isOnline: false,
  });

  try {
    const req = {
      user: { id: 'rider123', role: 'rider' },
      params: { id: 'order123' },
    };

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

    await orderController.claimOrder(req, res, () => {});
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.message.includes('currently offline'));
  } finally {
    User.findById = originalFindById;
  }
});

test('Order Claiming: Busy rider cannot claim a second order', async () => {
  const originalFindById = User.findById;
  const originalOrderExists = Order.exists;

  User.findById = async (id) => ({
    _id: id,
    role: 'rider',
    riderStatus: 'on-delivery',
    isOnline: true,
    currentOrderId: 'existingOrder123',
  });
  Order.exists = async () => true;

  try {
    const req = {
      user: { id: 'rider123', role: 'rider' },
      params: { id: 'order456' },
    };

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

    await orderController.claimOrder(req, res, () => {});
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.message.includes('already have an active delivery'));
  } finally {
    User.findById = originalFindById;
    Order.exists = originalOrderExists;
  }
});

test('Order Delivery: Double delivered calls do not credit rider earnings twice', async () => {
  const originalFindById = User.findById;
  const originalFind = User.find;
  const originalOrderFindById = Order.findById;
  const originalRestaurantFindById = Restaurant.findById;
  const originalLedgerCreate = RiderLedger.create;

  let ledgerEntriesCount = 0;
  RiderLedger.create = async () => {
    ledgerEntriesCount += 1;
    return {};
  };

  User.find = async () => [];
  Restaurant.findById = async () => null;

  const mockRider = {
    _id: 'rider123',
    role: 'rider',
    totalDeliveries: 5,
    totalEarnings: 500,
    availableBalance: 500,
    save: async () => {},
  };

  User.findById = async () => mockRider;

  // Simulate an order that is ALREADY delivered
  const mockOrder = {
    _id: 'order123',
    status: 'delivered',
    deliveryStatus: 'delivered',
    riderId: 'rider123',
    deliveryFee: 50,
    totalPrice: 400,
    save: async () => {},
    populate: async () => mockOrder,
  };

  Order.findById = async () => mockOrder;

  try {
    const req = {
      user: { id: 'rider123', role: 'rider' },
      params: { id: 'order123' },
      body: { status: 'delivered' },
    };

    const res = {
      status: () => ({
        json: (data) => data,
      }),
    };

    await orderController.updateOrderStatus(req, res, () => {});

    // Earnings should NOT have incremented
    assert.equal(mockRider.totalEarnings, 500);
    assert.equal(mockRider.availableBalance, 500);
    assert.equal(mockRider.totalDeliveries, 5);
    assert.equal(ledgerEntriesCount, 0);
  } finally {
    User.findById = originalFindById;
    User.find = originalFind;
    Order.findById = originalOrderFindById;
    Restaurant.findById = originalRestaurantFindById;
    RiderLedger.create = originalLedgerCreate;
  }
});

test('Order Delivery: Legitimate first delivery credits fee and writes RiderLedger entry', async () => {
  const originalFindById = User.findById;
  const originalFind = User.find;
  const originalOrderFindById = Order.findById;
  const originalRestaurantFindById = Restaurant.findById;
  const originalLedgerCreate = RiderLedger.create;

  let createdLedger = null;
  RiderLedger.create = async (doc) => {
    createdLedger = doc;
    return doc;
  };

  User.find = async () => [];
  Restaurant.findById = async () => null;

  const mockRider = {
    _id: 'rider123',
    role: 'rider',
    totalDeliveries: 2,
    totalEarnings: 200,
    availableBalance: 200,
    save: async () => {},
  };

  User.findById = async () => mockRider;

  // Order in out-for-delivery status transitioning to delivered
  const mockOrder = {
    _id: 'order789',
    status: 'out-for-delivery',
    deliveryStatus: 'out-for-delivery',
    riderId: 'rider123',
    deliveryFee: 60,
    totalPrice: 500,
    save: async () => {},
    populate: async () => mockOrder,
  };

  Order.findById = async () => mockOrder;

  try {
    const req = {
      user: { id: 'rider123', role: 'rider' },
      params: { id: 'order789' },
      body: { status: 'delivered' },
    };

    const res = {
      status: () => ({
        json: (data) => data,
      }),
    };

    await orderController.updateOrderStatus(req, res, () => {});

    assert.equal(mockRider.totalEarnings, 260);
    assert.equal(mockRider.availableBalance, 260);
    assert.equal(mockRider.totalDeliveries, 3);
    assert.equal(createdLedger.type, 'delivery_earning');
    assert.equal(createdLedger.amount, 60);
    assert.equal(createdLedger.balanceAfter, 260);
  } finally {
    User.findById = originalFindById;
    User.find = originalFind;
    Order.findById = originalOrderFindById;
    Restaurant.findById = originalRestaurantFindById;
    RiderLedger.create = originalLedgerCreate;
  }
});
