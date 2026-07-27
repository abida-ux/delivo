const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeCategorySelection,
  normalizeRestaurantSelection,
  getPrimaryCategoryName,
} = require('../utils/foodAssignment');

test('normalizes category selections and preserves a readable primary category', () => {
  const categories = [
    { _id: 'cat1', name: 'Breakfast' },
    'Lunch',
    { _id: 'cat2', name: 'Dinner' },
  ];

  const normalized = normalizeCategorySelection(categories);
  assert.deepStrictEqual(normalized.ids, ['cat1', 'cat2']);
  assert.strictEqual(getPrimaryCategoryName(categories), 'Breakfast');
});

test('normalizes restaurant selections from mixed values', () => {
  const restaurants = [
    { _id: 'rest1', name: 'Pizza Place' },
    'rest2',
    { _id: 'rest3', name: 'Tacos House' },
  ];

  const normalized = normalizeRestaurantSelection(restaurants);
  assert.deepStrictEqual(normalized.ids, ['rest1', 'rest2', 'rest3']);
  assert.strictEqual(normalized.primaryId, 'rest1');
});
