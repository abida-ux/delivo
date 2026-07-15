const nodemailer = require('nodemailer');
const { checkTcpPort } = require('../utils/smtpDiagnostic');

const requiredVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('\n❌ SMTP CONFIGURATION ERROR\n');
  console.error('Missing required environment variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error('\nSet these environment variables:');
  console.error('   SMTP_HOST=mail.spacemail.com');
  console.error('   SMTP_PORT=465');
  console.error('   SMTP_SECURE=true');
  console.error('   SMTP_FALLBACK_PORT=587');
  console.error('   SMTP_USER=info@delivo.buzz');
  console.error('   SMTP_PASS=your-email-password');
  console.error('   SMTP_FROM=Delivo <info@delivo.buzz>\n');
  process.exit(1);
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT);
const smtpFallbackPort = Number(process.env.SMTP_FALLBACK_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

const connectionTimeoutMs = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000);
const greetingTimeoutMs = Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000);
const socketTimeoutMs = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000);
const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

const getTransportLabel = (port, secure) => `${smtpHost}:${port} (${secure ? 'SSL' : 'STARTTLS'})`;

const buildTransportOptions = ({ port, secure }) => ({
  host: smtpHost,
  port,
  secure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: connectionTimeoutMs,
  greetingTimeout: greetingTimeoutMs,
  socketTimeout: socketTimeoutMs,
  requireTLS: !secure,
  tls: {
    rejectUnauthorized,
    minVersion: 'TLSv1.2',
  },
});

const createTransporter = ({ port, secure }) => {
  const transport = nodemailer.createTransport(buildTransportOptions({ port, secure }));
  transport._label = getTransportLabel(port, secure);
  return transport;
};

const primaryTransport = createTransporter({ port: smtpPort, secure: smtpSecure });
const fallbackTransport = smtpFallbackPort && smtpFallbackPort !== smtpPort
  ? createTransporter({ port: smtpFallbackPort, secure: false })
  : null;

const formatSmtpError = (error) => {
  const code = error.code || error.responseCode || 'UNKNOWN';
  return `[${code}] ${error.message || 'Unknown SMTP error'}`;
};

const isTransientError = (error) => {
  const transientCodes = [
    'ETIMEDOUT',
    'ESOCKET',
    'ECONNRESET',
    'EAI_AGAIN',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAUTH',
  ];
  return transientCodes.includes(error.code) || /timeout/i.test(error.message || '');
};

const verifyTransporter = async (transport, label) => {
  try {
    await transport.verify();
    console.log(`✅ SMTP verified: ${label} (${transport._label})`);
    return { ok: true };
  } catch (error) {
    console.warn(`⚠️ SMTP verify failed: ${label} (${transport._label}) - ${formatSmtpError(error)}`);
    return { ok: false, error };
  }
};

const sendMailWithRetry = async (transport, mailOptions) => {
  let attempt = 0;
  while (attempt < 2) {
    try {
      if (attempt > 0) {
        console.warn(`🔁 Retrying SMTP send (${attempt + 1}/2) for ${transport._label}`);
      }
      const result = await transport.sendMail({ ...mailOptions, from: smtpFrom });
      console.log(`✅ Email sent via ${transport._label} to ${mailOptions.to}`);
      return result;
    } catch (error) {
      attempt += 1;
      const formatted = formatSmtpError(error);
      console.warn(`⚠️ SMTP send failed on ${transport._label}: ${formatted}`);
      if (attempt >= 2 || !isTransientError(error)) {
        throw error;
      }
    }
  }
};

const sendMailWithFallback = async (mailOptions) => {
  const primaryLabel = 'primary';
  const fallbackLabel = 'fallback';

  const primaryVerify = await verifyTransporter(primaryTransport, primaryLabel);
  if (primaryVerify.ok) {
    try {
      return await sendMailWithRetry(primaryTransport, mailOptions);
    } catch (primaryError) {
      if (!fallbackTransport) {
        throw primaryError;
      }
      console.warn(`➡️ Primary SMTP failed, falling back to port ${smtpFallbackPort}`);
    }
  } else if (!fallbackTransport) {
    throw primaryVerify.error;
  } else {
    console.warn('➡️ Primary SMTP verification failed, attempting fallback transport');
  }

  const fallbackVerify = await verifyTransporter(fallbackTransport, fallbackLabel);
  if (!fallbackVerify.ok) {
    throw fallbackVerify.error;
  }

  return sendMailWithRetry(fallbackTransport, mailOptions);
};

const initializeMailer = async () => {
  console.log(`\n📤 SMTP startup check: ${smtpHost}:${smtpPort} secure=${smtpSecure}`);
  const primaryResult = await verifyTransporter(primaryTransport, 'primary');

  if (fallbackTransport) {
    console.log(`   fallback port is ${smtpFallbackPort}, secure=false`);
    const fallbackResult = await verifyTransporter(fallbackTransport, 'fallback');
    if (!primaryResult.ok && !fallbackResult.ok) {
      console.warn('⚠️ Both primary and fallback SMTP transports failed verification.');
      console.warn('   If this is a production runtime, verify outbound SMTP access from the host.');
    }
  } else if (!primaryResult.ok) {
    console.warn('⚠️ Primary SMTP transport failed verification and no fallback transport is configured.');
  }
};

const buildMailOptions = (to, subject, html) => ({
  from: smtpFrom,
  to,
  subject,
  html,
});

module.exports = {
  initializeMailer,
  sendMailWithFallback,
  verifyTransporter,
  formatSmtpError,
  buildMailOptions,
  checkTcpPort,
  smtpConfig: {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    fallbackPort: smtpFallbackPort,
    user: smtpUser,
    from: smtpFrom,
  },
};
