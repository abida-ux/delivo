const test = require('node:test');
const assert = require('node:assert/strict');

const { validateEmailConfig, buildEmailPayload } = require('../services/emailService');

const originalApiKey = process.env.BREVO_API_KEY;
const originalSenderEmail = process.env.SENDER_EMAIL;

process.env.BREVO_API_KEY = 'test-key';
process.env.SENDER_EMAIL = 'sender@example.com';

test('validateEmailConfig throws when Brevo credentials are missing', () => {
  const previousApiKey = process.env.BREVO_API_KEY;
  const previousSenderEmail = process.env.SENDER_EMAIL;

  delete process.env.BREVO_API_KEY;
  delete process.env.SENDER_EMAIL;

  assert.throws(() => validateEmailConfig(), /BREVO_API_KEY/);

  process.env.BREVO_API_KEY = 'test-key';
  assert.throws(() => validateEmailConfig(), /SENDER_EMAIL/);

  if (previousApiKey === undefined) {
    delete process.env.BREVO_API_KEY;
  } else {
    process.env.BREVO_API_KEY = previousApiKey;
  }

  if (previousSenderEmail === undefined) {
    delete process.env.SENDER_EMAIL;
  } else {
    process.env.SENDER_EMAIL = previousSenderEmail;
  }
});

test('buildEmailPayload includes sender and recipient details', () => {
  const payload = buildEmailPayload({
    to: 'user@example.com',
    subject: 'Hello',
    html: '<p>Hello</p>',
  });

  assert.equal(payload.sender.email, process.env.SENDER_EMAIL);
  assert.equal(payload.to[0].email, 'user@example.com');
  assert.equal(payload.subject, 'Hello');
  assert.equal(payload.htmlContent, '<p>Hello</p>');
});

process.env.BREVO_API_KEY = originalApiKey;
process.env.SENDER_EMAIL = originalSenderEmail;
