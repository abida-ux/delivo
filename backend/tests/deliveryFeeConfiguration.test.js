const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateDeliveryFee, DEFAULT_DELIVERY_FEE_RULES } = require('../utils/deliveryFeeRules');

test('delivery fee rules evaluate subtotal boundaries consistently', () => {
  const rules = {
    ...DEFAULT_DELIVERY_FEE_RULES,
    below100: 120,
    above199: 80,
    above299: 50,
    above500: 25,
  };

  assert.equal(calculateDeliveryFee(99, rules), 120);
  assert.equal(calculateDeliveryFee(100, rules), 80);
  assert.equal(calculateDeliveryFee(199, rules), 80);
  assert.equal(calculateDeliveryFee(200, rules), 80);
  assert.equal(calculateDeliveryFee(299, rules), 50);
  assert.equal(calculateDeliveryFee(300, rules), 50);
  assert.equal(calculateDeliveryFee(500, rules), 25);
  assert.equal(calculateDeliveryFee(501, rules), 25);
});
