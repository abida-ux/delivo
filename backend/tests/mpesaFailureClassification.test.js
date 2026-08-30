const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyMpesaResult } = require('../controllers/mpesaController');

test('marks user-cancelled M-Pesa result as failed immediately', () => {
  const result = classifyMpesaResult({ resultCode: 1032, resultDesc: 'Request cancelled by user', receipt: null });

  assert.equal(result.isSuccessful, false);
  assert.equal(result.isExplicitFailure, true);
});

test('marks insufficient-balance M-Pesa result as failed immediately', () => {
  const result = classifyMpesaResult({ resultCode: 2001, resultDesc: 'Insufficient account balance', receipt: null });

  assert.equal(result.isSuccessful, false);
  assert.equal(result.isExplicitFailure, true);
});
