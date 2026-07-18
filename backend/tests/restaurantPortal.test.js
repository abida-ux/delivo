const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRestaurantEarnings, buildRestaurantFilter } = require('../utils/restaurantPortal');

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
