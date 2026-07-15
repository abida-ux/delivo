const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedOrigin } = require('../config/cors');

test('allows localhost and Vite dev origins', () => {
  assert.equal(isAllowedOrigin('http://localhost:3000'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:3000'), true);
  assert.equal(isAllowedOrigin('http://localhost:5173'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:5174'), true);
});

test('allows configured vercel-style origins', () => {
  assert.equal(isAllowedOrigin('https://delivo.vercel.app'), true);
  assert.equal(isAllowedOrigin('https://my-app.netlify.app'), true);
});

test('rejects unexpected origins', () => {
  assert.equal(isAllowedOrigin('https://malicious.example'), false);
});
