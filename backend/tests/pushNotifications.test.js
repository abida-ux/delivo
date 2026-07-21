const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNotificationPayload } = require('../utils/pushNotifications');

test('buildNotificationPayload includes order details for the restaurant recipient', () => {
  const order = {
    _id: '507f1f77bcf86cd799439011',
    customerName: 'Jane Doe',
    totalPrice: 1250,
    restaurantId: { name: 'Pizza Palace' },
  };

  const payload = buildNotificationPayload({
    eventType: 'order_created',
    order,
    recipientRole: 'restaurant',
  });

  assert.equal(payload.title, 'New order received');
  assert.match(payload.message, /Pizza Palace/i);
  assert.match(payload.message, /Jane Doe/i);
  assert.equal(payload.data.eventType, 'order_created');
});

test('buildNotificationPayload creates a rider assignment message', () => {
  const order = {
    _id: '507f1f77bcf86cd799439012',
    customerName: 'John Smith',
    totalPrice: 900,
  };

  const payload = buildNotificationPayload({
    eventType: 'order_assigned_rider',
    order,
    recipientRole: 'rider',
  });

  assert.equal(payload.title, 'New delivery assignment');
  assert.match(payload.message, /John Smith/i);
  assert.equal(payload.data.eventType, 'order_assigned_rider');
});
