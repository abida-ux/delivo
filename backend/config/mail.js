const nodemailer = require('nodemailer');

<<<<<<< HEAD
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
=======
// ==================== VALIDATE REQUIRED ENV VARS ====================
const requiredVars = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('\n❌ SMTP CONFIGURATION ERROR\n');
  console.error('Missing required environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\nAdd these to your .env file:');
  console.error('   MAIL_HOST=your_smtp_host (e.g., smtp.spacemail.com)');
  console.error('   MAIL_PORT=587 (or 465 for SSL)');
  console.error('   MAIL_USER=your_email@example.com');
  console.error('   MAIL_PASS=your_password');
  console.error('   MAIL_FROM=Delivo <noreply@delivo.app>\n');
  process.exit(1);
}

// ==================== CREATE TRANSPORTER ====================
// Determine secure based on port: 465 = true, 587/other = false
const mailPort = Number(process.env.MAIL_PORT);
const isSecure = mailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: mailPort,
  secure: isSecure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ==================== VERIFY SMTP CONNECTION ====================
transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ SMTP CONNECTION FAILED');
    console.error(`   Host: ${process.env.MAIL_HOST}:${mailPort} (secure: ${isSecure})`);
    console.error(`   User: ${process.env.MAIL_USER}`);
    console.error(`   Error: ${error.message}\n`);
    console.error('Verify your credentials and SMTP settings.\n');
  } else if (success) {
    console.log('\n✅ SMTP Connected Successfully');
    console.log(`   Host: ${process.env.MAIL_HOST}:${mailPort} (secure: ${isSecure})`);
    console.log(`   From: ${process.env.MAIL_FROM}\n`);
  }
>>>>>>> 745c3f51e46feacea2dbabdbc04695b633a497a5
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