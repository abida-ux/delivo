const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const mailConfigPath = path.join(__dirname, '..', 'config', 'mail.js');
const { normalizeMailSecureOption } = require('../config/mail');

test('normalizeMailSecureOption parses common truthy and falsy values', () => {
  assert.equal(normalizeMailSecureOption('true'), true);
  assert.equal(normalizeMailSecureOption('TRUE'), true);
  assert.equal(normalizeMailSecureOption('1'), true);
  assert.equal(normalizeMailSecureOption('false'), false);
  assert.equal(normalizeMailSecureOption(''), false);
  assert.equal(normalizeMailSecureOption(undefined), false);
});

test('getMailTransportCandidates adds a STARTTLS fallback for SSL mail', () => {
  const originalPort = process.env.MAIL_PORT;
  const originalSecure = process.env.MAIL_SECURE;

  process.env.MAIL_PORT = '465';
  process.env.MAIL_SECURE = 'true';

  delete require.cache[require.resolve(mailConfigPath)];
  const { getMailTransportCandidates } = require('../config/mail');
  const candidates = getMailTransportCandidates();

  assert.ok(candidates.some((candidate) => candidate.port === 587 && candidate.secure === false));

  if (originalPort === undefined) {
    delete process.env.MAIL_PORT;
  } else {
    process.env.MAIL_PORT = originalPort;
  }

  if (originalSecure === undefined) {
    delete process.env.MAIL_SECURE;
  } else {
    process.env.MAIL_SECURE = originalSecure;
  }

  delete require.cache[require.resolve(mailConfigPath)];
});
