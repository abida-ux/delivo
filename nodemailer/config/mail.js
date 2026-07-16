const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const envFiles = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', 'backend', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

envFiles.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});

const mailHost = process.env.MAIL_HOST || process.env.SMTP_HOST;
const mailPort = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
const mailSecure = (process.env.MAIL_SECURE || process.env.SMTP_SECURE || 'false').toString().trim().toLowerCase() === 'true';
const mailUser = process.env.MAIL_USER || process.env.SMTP_USER;
const mailPass = process.env.MAIL_PASS || process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || process.env.SMTP_FROM || 'Delivo <info@delivo.buzz>';

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: Number.isFinite(mailPort) && mailPort > 0 ? mailPort : 587,
  secure: mailSecure,
  auth: mailUser && mailPass ? { user: mailUser, pass: mailPass } : undefined,
  requireTLS: false,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    console.error('Mail transporter verification failed', error.message);
    return { ok: false, error };
  }
};

const sendMail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    html,
    text,
  });

  return info;
};

module.exports = {
  verifyTransporter,
  sendMail,
};
