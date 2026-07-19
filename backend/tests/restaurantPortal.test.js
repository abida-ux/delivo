const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRestaurantEarnings, buildRestaurantFilter, buildRestaurantDashboardData, getAvailabilityStatus } = require('../utils/restaurantPortal');

test('calculateRestaurantEarnings returns expected commission and net value', () => {
  const result = calculateRestaurantEarnings(950, 100);
  assert.equal(result.restaurantEarnings, 850);
  assert.equal(result.platformCommission, 100);
  assert.equal(result.netEarnings, 850);
});

test('buildRestaurantFilter returns a safe owner-scoped filter', () => {
  const filter = buildRestaurantFilter('64f0b3f0a111b222c333d444');
  assert.deepEqual(filter, { ownerId: '64f0b3f0a111b222c333d444' });
});

test('buildRestaurantDashboardData exposes the restaurant availability status', () => {
  const dashboardData = buildRestaurantDashboardData({
    _id: 'restaurant-1',
    name: 'Taste Hub',
    status: 'approved',
    availableBalance: 1250,
    pendingBalance: 300,
    withdrawnBalance: 100,
    isOpen: false,
  });

  assert.equal(dashboardData.isOpen, false);
  assert.equal(dashboardData.name, 'Taste Hub');
  assert.equal(dashboardData.availableBalance, 1250);
});

test('getAvailabilityStatus returns a clear open or closed label', () => {
  assert.deepEqual(getAvailabilityStatus({ isOpen: true }), { isOpen: true, label: 'Open now' });
  assert.deepEqual(getAvailabilityStatus({ isOpen: false }), { isOpen: false, label: 'Closed' });
});
