const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateOrderTotals } = require('../utils/orderTotals');

test('adds fixed VAT and rider tip to final total', () => {
  const breakdown = calculateOrderTotals({
    subtotal: 300,
    deliveryFee: 50,
    discountAmount: 0,
    riderTip: 20,
    vat: 5,
  });

  assert.equal(breakdown.vat, 5);
  assert.equal(breakdown.riderTip, 20);
  assert.equal(breakdown.finalTotal, 375);
});

test('keeps zero tip when no rider tip is selected', () => {
  const breakdown = calculateOrderTotals({
    subtotal: 300,
    deliveryFee: 50,
    discountAmount: 0,
    riderTip: 0,
    vat: 5,
  });

  assert.equal(breakdown.riderTip, 0);
  assert.equal(breakdown.finalTotal, 355);
});

test('applies discount before final total calculation', () => {
  const breakdown = calculateOrderTotals({
    subtotal: 300,
    deliveryFee: 50,
    discountAmount: 25,
    riderTip: 10,
    vat: 5,
  });

  assert.equal(breakdown.finalTotal, 340);
});

test('keeps the full checkout total intact with VAT and rider tip included', () => {
  const breakdown = calculateOrderTotals({
    subtotal: 520,
    deliveryFee: 70,
    discountAmount: 30,
    riderTip: 25,
    vat: 5,
  });

  assert.equal(breakdown.finalTotal, 590);
  assert.equal(breakdown.vat, 5);
  assert.equal(breakdown.riderTip, 25);
});
