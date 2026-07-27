const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getRiderAvailabilityStatus,
  isRiderAssignable,
} = require('../utils/riderWorkflow');

test('treats riders as available when they are not on a delivery', () => {
  const rider = { role: 'rider', riderStatus: 'offline', currentOrderId: null };
  assert.equal(getRiderAvailabilityStatus(rider), 'available');
  assert.equal(isRiderAssignable(rider, 0), true);
});

test('keeps riders unavailable while they are on a delivery', () => {
  const rider = { role: 'rider', riderStatus: 'on-delivery', currentOrderId: 'order123' };
  assert.equal(getRiderAvailabilityStatus(rider), 'on-delivery');
  assert.equal(isRiderAssignable(rider, 0), false);
});
