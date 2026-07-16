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

<<<<<<< HEAD
const createTransportOptions = ({ host, port, secure }) => ({
  host,
  port,
  secure,
=======
const resolvedSecure = mailPort === 465 ? true : mailSecure;
const resolvedPort = mailPort || (resolvedSecure ? 465 : 587);

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: resolvedPort,
  secure: resolvedSecure,
>>>>>>> 1427c5bc4e5fa7f8907cf1e66e6d2f46342a916a
  auth: mailUser && mailPass
    ? {
        user: mailUser,
        pass: mailPass,
      }
    : undefined,
<<<<<<< HEAD
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
=======
  pool: false,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  dnsTimeout: 10000,
  requireTLS: resolvedSecure,
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2',
  },
  family: 4,
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
>>>>>>> 1427c5bc4e5fa7f8907cf1e66e6d2f46342a916a
  }

  if (!mailSecure && mailPort !== 465) {
    addCandidate(465, true, 'ssl');
  }

  return candidates;
};

<<<<<<< HEAD
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
=======
transporter.verifyTransporter = verifyTransporter;
transporter.normalizeMailSecureOption = normalizeMailSecureOption;
transporter.sendMailWithDiagnostics = sendMailWithDiagnostics;

module.exports = transporter;
module.exports.verifyTransporter = verifyTransporter;
module.exports.normalizeMailSecureOption = normalizeMailSecureOption;
module.exports.sendMailWithDiagnostics = sendMailWithDiagnostics;
>>>>>>> 1427c5bc4e5fa7f8907cf1e66e6d2f46342a916a
