const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAdminAnalyticsSummary, getRollingWeekWindow } = require('../controllers/userController');

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
    totalDeliveryFees: 1250,
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
  assert.equal(summary.totalDeliveryFees, 1250);
  assert.equal(summary.deliveryFees, 1250);
  assert.equal(summary.ordersChangePct, 12);
  assert.equal(summary.revenueChangePct, 9);
  assert.equal(summary.ridersChangePct, 3);
});

test('calculates a Monday-to-Sunday rolling week window correctly', () => {
  const referenceDate = new Date('2026-08-31T12:00:00Z');
  const window = getRollingWeekWindow(referenceDate);

  assert.equal(window.currentStart.toISOString(), new Date('2026-08-30T21:00:00.000Z').toISOString());
  assert.equal(window.currentEnd.toISOString(), new Date('2026-09-06T21:00:00.000Z').toISOString());
  assert.equal(window.previousStart.toISOString(), new Date('2026-08-23T21:00:00.000Z').toISOString());
  assert.equal(window.previousEnd.toISOString(), new Date('2026-08-30T21:00:00.000Z').toISOString());
});
