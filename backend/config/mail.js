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

const getEnv = (primary, fallback) => process.env[primary] || process.env[fallback];
const mailHost = getEnv('MAIL_HOST', 'SMTP_HOST');
const mailPort = normalizeMailPort(getEnv('MAIL_PORT', 'SMTP_PORT') || 465);
const mailSecure = normalizeMailSecureOption(getEnv('MAIL_SECURE', 'SMTP_SECURE'));
const mailUser = getEnv('MAIL_USER', 'SMTP_USER');
const mailPass = getEnv('MAIL_PASS', 'SMTP_PASS');
const mailFrom = getEnv('MAIL_FROM', 'SMTP_FROM') || 'Delivo <info@delivo.buzz>';

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailSecure,
  auth: mailUser && mailPass
    ? {
        user: mailUser,
        pass: mailPass,
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
  if (!mailHost || !mailUser || !mailPass) {
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
      host: mailHost,
    });
    return false;
  }
};

transporter.verifyTransporter = verifyTransporter;
transporter.normalizeMailSecureOption = normalizeMailSecureOption;

module.exports = transporter;
module.exports.verifyTransporter = verifyTransporter;
module.exports.normalizeMailSecureOption = normalizeMailSecureOption;