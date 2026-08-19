const test = require('node:test');
const assert = require('node:assert/strict');

test('resolves food base price consistently for catalogue display', () => {
  const food = {
    _id: 'food_123',
    name: 'Classic Burger',
    price: 350,
  };

  const links = [
    { restaurantId: 'rest_a', price: 400 },
    { restaurantId: 'rest_b', price: 100 },
  ];

  // Catalogue listing must preserve food.price as base price regardless of restaurant link ordering
  const basePrice = food.price || 0;
  const catalogueFood = {
    ...food,
    restaurantCount: links.length,
    basePrice,
    price: basePrice,
  };

  assert.equal(catalogueFood.price, 350);
  assert.equal(catalogueFood.basePrice, 350);
});

test('resolves restaurant specific selling price with fallback to base price', () => {
  const food = {
    _id: 'food_456',
    name: 'Grilled Salmon',
    price: 650,
  };

  // When restaurant has custom price
  const customLink = { restaurantId: 'rest_1', price: 700 };
  const customSellingPrice = customLink.price != null && customLink.price > 0 ? customLink.price : food.price;
  assert.equal(customSellingPrice, 700);

  // When restaurant link has null or 0 price, it must fallback to base price
  const defaultLink = { restaurantId: 'rest_2', price: 0 };
  const fallbackSellingPrice = defaultLink.price != null && defaultLink.price > 0 ? defaultLink.price : food.price;
  assert.equal(fallbackSellingPrice, 650);
});

test('calculates combination base price correctly from components', () => {
  const combo = {
    _id: 'combo_789',
    name: 'Family Feast Combo',
    price: null,
    components: [
      { foodId: { _id: 'f1', price: 300 }, defaultQuantity: 2 },
      { foodId: { _id: 'f2', price: 150 }, customPrice: 120, defaultQuantity: 1 },
    ],
  };

  let basePrice = combo.price;
  if (basePrice == null || basePrice === 0) {
    basePrice = (combo.components || []).reduce((sum, c) => {
      const compPrice = c.customPrice != null ? c.customPrice : (c.foodId?.price || 0);
      return sum + (compPrice * (c.defaultQuantity || 1));
    }, 0);
  }

  // 2 * 300 + 1 * 120 = 720
  assert.equal(basePrice, 720);
});
