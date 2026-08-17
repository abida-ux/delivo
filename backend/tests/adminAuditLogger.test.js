const test = require('node:test');
const assert = require('node:assert/strict');
const adminAuditLogger = require('../middleware/adminAuditLogger');
const AdminLog = require('../models/AdminLog');

test('adminAuditLogger ignores non-mutating HTTP methods like GET', async () => {
  let nextCalled = false;
  const req = { method: 'GET', path: '/api/admin-logs' };
  const res = {};
  await adminAuditLogger(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('adminAuditLogger redacts direct and nested sensitive fields properly', async () => {
  let createdLog = null;
  const originalCreate = AdminLog.create;
  AdminLog.create = async (doc) => {
    createdLog = doc;
    return doc;
  };

  try {
    const req = {
      method: 'POST',
      baseUrl: '/api',
      path: '/restaurants',
      params: { id: 'rest123' },
      body: {
        name: 'Burger Palace',
        email: 'owner@burgerpalace.ke',
        password: 'SuperSecretPassword123!',
        newPassword: 'AnotherSecretPassword456!',
        mpesaPin: '1234',
        securityCredential: 'EncryptedCredentialString',
        metadata: {
          consumerSecret: 'SecretMpesaKey',
          apiKey: 'key_12345',
          safeField: 'SafeValue',
        },
        tokenArray: [
          { token: 'xyz_token_123', label: 'Device1' }
        ],
        jwtString: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.c2lnbmF0dXJl',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
        price: 500,
      },
      user: { id: 'admin123', role: 'admin' },
      dbUser: { _id: 'admin123', name: 'Super Admin', email: 'admin@delivo.co.ke', role: 'admin' },
      ip: '192.168.1.1',
      headers: { 'user-agent': 'Delivo-Admin-Client/1.0' },
    };

    let sendCallback;
    const res = {
      statusCode: 201,
      json: (data) => {
        return data;
      },
      send: (data) => {
        return data;
      },
    };

    await adminAuditLogger(req, res, () => {});
    
    // Simulate sending response to trigger logAction
    res.json({ success: true });

    // Allow microtask resolution
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(createdLog, 'Admin log should have been created');
    assert.equal(createdLog.adminName, 'Super Admin');
    assert.equal(createdLog.adminEmail, 'admin@delivo.co.ke');
    assert.equal(createdLog.action, 'POST /api/restaurants');
    
    // Command string checks
    const cmd = createdLog.command;
    assert.ok(cmd.includes('create-restaurant'), 'Command should be create-restaurant');
    assert.ok(cmd.includes('--name "Burger Palace"'), 'Should preserve safe name field');
    assert.ok(cmd.includes('--password "[REDACTED]"'), 'Should redact password');
    assert.ok(cmd.includes('--newPassword "[REDACTED]"'), 'Should redact newPassword');
    assert.ok(cmd.includes('--mpesaPin "[REDACTED]"'), 'Should redact mpesaPin');
    assert.ok(cmd.includes('--securityCredential "[REDACTED]"'), 'Should redact securityCredential');
    assert.ok(!cmd.includes('SuperSecretPassword123!'), 'Plaintext password must NOT appear in log');
    assert.ok(!cmd.includes('SecretMpesaKey'), 'Plaintext consumerSecret must NOT appear in log');
    assert.ok(cmd.includes('[REDACTED_JWT]'), 'JWT token should be redacted');
    assert.ok(cmd.includes('[BASE64_IMAGE]'), 'Base64 image should be truncated/replaced');
    assert.ok(cmd.includes('SafeValue'), 'Safe nested field should be preserved');
  } finally {
    AdminLog.create = originalCreate;
  }
});

test('adminAuditLogger ignores non-admin users', async () => {
  let createdLog = null;
  const originalCreate = AdminLog.create;
  AdminLog.create = async (doc) => {
    createdLog = doc;
    return doc;
  };

  try {
    const req = {
      method: 'POST',
      baseUrl: '/api',
      path: '/orders',
      body: { totalPrice: 1500 },
      user: { id: 'customer123', role: 'customer' },
      dbUser: { _id: 'customer123', name: 'Jane Doe', email: 'jane@example.com', role: 'customer' },
    };

    const res = {
      statusCode: 200,
      json: (data) => data,
      send: (data) => data,
    };

    await adminAuditLogger(req, res, () => {});
    res.json({ success: true });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(createdLog, null, 'No log should be created for non-admin user');
  } finally {
    AdminLog.create = originalCreate;
  }
});
