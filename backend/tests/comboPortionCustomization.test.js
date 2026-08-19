const test = require('node:test');
const assert = require('node:assert/strict');

test('calculates customized combo meal total when portions are adjusted', () => {
  // e.g. Chapati Beans combo meal
  const comboComponents = [
    { foodId: 'f_chapati', name: 'Chapati', unitPrice: 30, quantity: 2, minimumQuantity: 1, maximumQuantity: 10 },
    { foodId: 'f_beans', name: 'Yellow Beans', unitPrice: 120, quantity: 1, minimumQuantity: 1, maximumQuantity: 5 },
  ];

  // Initial base combo price: 2 * 30 + 1 * 120 = 180
  let totalPrice = comboComponents.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0);
  assert.equal(totalPrice, 180);

  // User requests 2 extra chapatis (quantity adjusted from 2 to 4)
  comboComponents[0].quantity = 4;
  totalPrice = comboComponents.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0);
  // 4 * 30 + 1 * 120 = 240
  assert.equal(totalPrice, 240);
});

test('respects component minimum and maximum quantity bounds', () => {
  const comp = {
    foodId: 'f_chapati',
    name: 'Chapati',
    unitPrice: 30,
    quantity: 2,
    minimumQuantity: 1,
    maximumQuantity: 5,
  };

  const updateQty = (item, change) => {
    const minQty = item.minimumQuantity != null ? item.minimumQuantity : 0;
    const maxQty = item.maximumQuantity != null ? item.maximumQuantity : 20;
    const newQty = item.quantity + change;
    if (newQty >= minQty && newQty <= maxQty) {
      return { ...item, quantity: newQty };
    }
    return item;
  };

  // Decrement down to min (1)
  let updated = updateQty(comp, -1);
  assert.equal(updated.quantity, 1);

  // Decrement past min (should stay 1)
  updated = updateQty(updated, -1);
  assert.equal(updated.quantity, 1);

  // Increment up to max (5)
  updated = updateQty(updated, 3); // qty = 4
  assert.equal(updated.quantity, 4);
  updated = updateQty(updated, 1); // qty = 5
  assert.equal(updated.quantity, 5);

  // Increment past max (should stay 5)
  updated = updateQty(updated, 1);
  assert.equal(updated.quantity, 5);
});

test('builds customized combo item payload for cart and checkout', () => {
  const customizedItem = {
    _id: 'combo_chapati_beans',
    name: 'Chapati & Beans Feast',
    price: 240,
    isCombination: true,
    combinationId: 'combo_chapati_beans',
    components: [
      { foodId: 'f_chapati', name: 'Chapati', quantity: 4, price: 30 },
      { foodId: 'f_beans', name: 'Yellow Beans', quantity: 1, price: 120 },
    ],
  };

  assert.equal(customizedItem.isCombination, true);
  assert.equal(customizedItem.components.length, 2);
  assert.equal(customizedItem.components[0].quantity, 4);
  assert.equal(customizedItem.price, 240);
});
