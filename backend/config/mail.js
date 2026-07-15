const nodemailer = require('nodemailer');

const normalizeMailSecureOption = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined || value === '') return false;

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const normalizeMailPort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : 465;
};

const mailPort = normalizeMailPort(process.env.MAIL_PORT || 465);
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: mailPort,
  secure: normalizeMailSecureOption(process.env.MAIL_SECURE),
  auth: process.env.MAIL_USER && process.env.MAIL_PASS
    ? {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    : undefined,
  pool: true,
  maxConnections: 3,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  requireTLS: true,
});

const verifyTransporter = async () => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('⚠️ SMTP credentials are incomplete. Email delivery will be skipped until configured.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ SpaceMail SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SpaceMail SMTP verification failed:', {
      message: error.message,
      code: error.code,
      host: process.env.MAIL_HOST,
    });
    return false;
  }
};

transporter.verifyTransporter = verifyTransporter;
transporter.normalizeMailSecureOption = normalizeMailSecureOption;

module.exports = transporter;
module.exports.verifyTransporter = verifyTransporter;
module.exports.normalizeMailSecureOption = normalizeMailSecureOption;