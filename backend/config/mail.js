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

const createTransportOptions = ({ host, port, secure }) => ({
  host,
  port,
  secure,
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

const getMailTransportCandidates = () => {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (port, secure, label) => {
    const key = `${port}:${secure}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({
      label,
      host: mailHost,
      port,
      secure,
    });
  };

  addCandidate(mailPort, mailSecure, 'primary');

  const fallbackPort = normalizeMailPort(getEnv('MAIL_PORT_FALLBACK', 'SMTP_FALLBACK_PORT'));
  const fallbackSecure = normalizeMailSecureOption(getEnv('MAIL_SECURE_FALLBACK', 'SMTP_SECURE_FALLBACK'));
  if (fallbackPort && fallbackPort !== mailPort) {
    addCandidate(fallbackPort, fallbackSecure, 'fallback');
  }

  if (mailSecure && mailPort !== 587) {
    addCandidate(587, false, 'starttls');
  }

  if (!mailSecure && mailPort !== 465) {
    addCandidate(465, true, 'ssl');
  }

  return candidates;
};

const createTransporter = (candidate) => nodemailer.createTransport(createTransportOptions(candidate));
const transportCandidates = getMailTransportCandidates().map((candidate) => ({
  ...candidate,
  transporter: createTransporter(candidate),
}));

const transportImplementation = {
  sendMail: async (mailOptions) => {
    let lastError;

    for (const candidate of transportCandidates) {
      try {
        const info = await candidate.transporter.sendMail({
          ...mailOptions,
          from: mailOptions.from || mailFrom,
        });
        console.log(`📧 Email delivered via ${candidate.label} (${candidate.host}:${candidate.port})`);
        return info;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Email delivery failed for ${candidate.label} (${candidate.host}:${candidate.port})`, {
          message: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
        });
      }
    }

    throw lastError;
  },
  verifyTransporter: async () => {
    if (!mailHost || !mailUser || !mailPass) {
      console.warn('⚠️ SMTP credentials are incomplete. Email delivery will be skipped until configured.');
      return false;
    }

    let lastError;
    for (const candidate of transportCandidates) {
      try {
        await candidate.transporter.verify();
        console.log(`✅ SMTP connection verified via ${candidate.label} (${candidate.host}:${candidate.port})`);
        return true;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ SMTP verification failed for ${candidate.label} (${candidate.host}:${candidate.port})`, {
          message: error.message,
          code: error.code,
          host: candidate.host,
          port: candidate.port,
        });
      }
    }

    console.error('❌ SMTP verification failed:', {
      message: lastError?.message,
      code: lastError?.code,
      host: mailHost,
      port: mailPort,
    });
    return false;
  },
};

const transporter = {
  sendMail: async (mailOptions) => transportImplementation.sendMail(mailOptions),
  verifyTransporter: async () => transportImplementation.verifyTransporter(),
  normalizeMailSecureOption,
  getMailTransportCandidates,
};

module.exports = transporter;
module.exports.verifyTransporter = transporter.verifyTransporter;
module.exports.normalizeMailSecureOption = normalizeMailSecureOption;
module.exports.getMailTransportCandidates = getMailTransportCandidates;