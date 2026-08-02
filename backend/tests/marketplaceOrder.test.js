const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPopulatedOrderItems } = require('../utils/orderItems');
const { normalizeMarketplaceProductPayload } = require('../utils/marketplacePayload');

test('buildPopulatedOrderItems resolves marketplace products for mixed checkout orders', async () => {
  const marketplaceProduct = {
    _id: 'prod123',
    name: 'Fresh Milk',
    price: 180,
    discount: 20,
    categoryType: 'groceries',
    availability: true,
    isActive: true,
    stock: 5,
  };

  const items = await buildPopulatedOrderItems(
    [{ productType: 'marketplace', marketplaceProductId: 'prod123', quantity: 2, categoryType: 'groceries' }],
    {
      getMarketplaceProductById: async (id) => (id === 'prod123' ? marketplaceProduct : null),
    }
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].productType, 'marketplace');
  assert.equal(items[0].marketplaceProductId.toString(), 'prod123');
  assert.equal(items[0].categoryType, 'groceries');
  assert.equal(items[0].price, 160);
  assert.equal(items[0].quantity, 2);
});

test('normalizeMarketplaceProductPayload preserves a category reference when provided', () => {
  const payload = normalizeMarketplaceProductPayload({
    name: 'Laundry Detergent',
    category: { _id: 'cat123' },
    categoryType: 'supermarket',
  });

  assert.equal(payload.category.toString(), 'cat123');
  assert.equal(payload.categoryType, 'supermarket');
});
