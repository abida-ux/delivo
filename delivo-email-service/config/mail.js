const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createTransportOptions = (port, secure) => ({
  host: process.env.EMAIL_HOST,
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 3,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  requireTLS: false,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
});

const createTransporter = () => {
  const configuredPort = Number(process.env.EMAIL_PORT || 587);
  const configuredSecure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true';

  const variants = [];
  if (configuredPort === 465 || configuredSecure) {
    variants.push(createTransportOptions(465, true));
  }
  variants.push(createTransportOptions(587, false));
  if (configuredPort === 587 && !configuredSecure) {
    variants.push(createTransportOptions(465, true));
  }

  return {
    sendMail: async (mailOptions) => {
      let lastError;
      for (const transportConfig of variants) {
        const transport = nodemailer.createTransport(transportConfig);
        try {
          const info = await transport.sendMail(mailOptions);
          return info;
        } catch (error) {
          lastError = error;
          console.warn('[email-service] smtp variant failed', { port: transportConfig.port, secure: transportConfig.secure, message: error.message });
        }
      }
      throw lastError || new Error('Unable to send email');
    },
  };
};

const transporter = createTransporter();

module.exports = transporter;
