const nodemailer = require('nodemailer');

const mailPort = Number(process.env.MAIL_PORT || 465);
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number.isFinite(mailPort) ? mailPort : 465,
  secure: process.env.MAIL_SECURE === 'true',
  auth: process.env.MAIL_USER && process.env.MAIL_PASS
    ? {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    : undefined,
  pool: true,
  maxConnections: 3,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
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
    console.error('❌ SpaceMail SMTP verification failed:', error.message);
    return false;
  }
};

transporter.verifyTransporter = verifyTransporter;

module.exports = transporter;