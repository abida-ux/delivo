const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAdminAnalyticsSummary } = require('../controllers/userController');

test('builds analytics summary from real order and user totals without placeholder values', () => {
  const summary = buildAdminAnalyticsSummary({
    userCount: 120,
    restaurantCount: 25,
    foodCount: 180,
    totalOrders: 300,
    deliveredOrders: 220,
    cancelledOrders: 40,
    failedPayments: 15,
    paidOrdersCount: 220,
    totalRevenue: 25000,
    averageOrderValue: 83.33,
    customers: 90,
    riders: 12,
    riderEarnings: 1320,
    ordersChangePct: 12,
    revenueChangePct: 9,
    usersChangePct: 8,
    restaurantsChangePct: 5,
    ridersChangePct: 3,
  });

  assert.equal(summary.users, 120);
  assert.equal(summary.customers, 90);
  assert.equal(summary.riders, 12);
  assert.equal(summary.orders, 300);
  assert.equal(summary.deliveredOrders, 220);
  assert.equal(summary.cancelledOrders, 40);
  assert.equal(summary.failedPayments, 15);
  assert.equal(summary.revenue, 25000);
  assert.equal(summary.riderEarnings, 1320);
  assert.equal(summary.ordersChangePct, 12);
  assert.equal(summary.revenueChangePct, 9);
  assert.equal(summary.ridersChangePct, 3);
});
