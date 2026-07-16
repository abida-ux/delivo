const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

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

const resolvedSecure = mailPort === 465 ? true : mailSecure;
const resolvedPort = mailPort || (resolvedSecure ? 465 : 587);

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: resolvedPort,
  secure: resolvedSecure,
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
  requireTLS: false,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
});

const describeTransport = () => ({
  host: mailHost,
  port: resolvedPort,
  secure: resolvedSecure,
  user: mailUser ? '[configured]' : '[missing]',
  from: mailFrom,
});

const verifyTransporter = async () => {
  if (!mailHost || !mailUser || !mailPass) {
    const error = new Error('SMTP credentials are incomplete: SMTP_HOST, SMTP_USER, and SMTP_PASS must be set.');
    console.warn('⚠️ SMTP credentials are incomplete. Email delivery will be skipped until configured.', error.message);
    return { ok: false, error };
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified', describeTransport());
    return { ok: true, transport: transporter };
  } catch (error) {
    console.error('❌ SMTP verification failed', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      transport: describeTransport(),
    });
    return { ok: false, error };
  }
};

const sendMailWithDiagnostics = async (mailOptions) => {
  const verification = await verifyTransporter();
  if (!verification.ok) {
    throw verification.error;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email delivered', {
      to: mailOptions.to,
      messageId: info.messageId,
      transport: describeTransport(),
    });
    return info;
  } catch (error) {
    console.error('❌ Email delivery failed', {
      to: mailOptions.to,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      transport: describeTransport(),
    });
    throw error;
  }
};

transporter.verifyTransporter = verifyTransporter;
transporter.normalizeMailSecureOption = normalizeMailSecureOption;
transporter.sendMailWithDiagnostics = sendMailWithDiagnostics;

module.exports = transporter;
module.exports.verifyTransporter = verifyTransporter;
module.exports.normalizeMailSecureOption = normalizeMailSecureOption;
module.exports.sendMailWithDiagnostics = sendMailWithDiagnostics;