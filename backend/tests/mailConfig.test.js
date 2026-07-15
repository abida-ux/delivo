const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeMailSecureOption } = require('../config/mail');

test('normalizeMailSecureOption parses common truthy and falsy values', () => {
  assert.equal(normalizeMailSecureOption('true'), true);
  assert.equal(normalizeMailSecureOption('TRUE'), true);
  assert.equal(normalizeMailSecureOption('1'), true);
  assert.equal(normalizeMailSecureOption('false'), false);
  assert.equal(normalizeMailSecureOption(''), false);
  assert.equal(normalizeMailSecureOption(undefined), false);
});
