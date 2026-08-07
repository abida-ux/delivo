const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const SibApiV3Sdk = require('@getbrevo/brevo');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim() : '');

const validateEmailConfig = () => {
  const apiKey = normalizeEmail(process.env.BREVO_API_KEY);
  const senderEmail = normalizeEmail(process.env.SENDER_EMAIL);

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is required. Set it in your environment before starting the server.');
  }

  if (!senderEmail) {
    throw new Error('SENDER_EMAIL is required. Set it in your environment before starting the server.');
  }

  return {
    apiKey,
    senderEmail,
    senderName: normalizeEmail(process.env.SENDER_NAME) || 'Delivo',
  };
};

const buildEmailPayload = ({ to, subject, html }) => {
  const config = validateEmailConfig();
  return {
    sender: {
      name: config.senderName,
      email: config.senderEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };
};

const buildEmailTemplate = (title, body, otp) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background: #fff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: #111;">Delivo</h1>
        <p style="margin: 6px 0 0; color: #666;">${title}</p>
      </div>
      <div style="padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <p style="margin: 0 0 16px;">Hello,</p>
        <p style="margin: 0 0 14px;">${body}</p>
        <div style="margin: 20px 0; text-align: center;">
          <span style="display: inline-block; padding: 16px 24px; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111; background: #fff; border: 1px dashed #ccc; border-radius: 8px;">${otp}</span>
        </div>
        <p style="margin: 0 0 12px; color: #555;">This code expires in 10 minutes.</p>
        <p style="margin: 0 0 16px; color: #555;">If you did not request this, you can safely ignore this email.</p>
        <p style="margin: 0; color: #333;">Thank you,<br/>Delivo Team</p>
      </div>
    </div>
  </div>
`;

const sendEmailViaBrevo = async ({ to, subject, html, label }) => {
  const config = validateEmailConfig();

  console.log(`📧 Sending ${label} email via Brevo...`, { to });

  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, config.apiKey);

    const payload = buildEmailPayload({ to, subject, html });
    const result = await apiInstance.sendTransacEmail(payload);

    console.log(`✅ ${label} email sent`, {
      to,
      messageId: result?.messageId || result?.body?.messageId || 'n/a',
    });

    return {
      messageId: result?.messageId || result?.body?.messageId || 'n/a',
      response: result,
    };
  } catch (error) {
    console.error(`❌ Brevo Error (${label}):`, {
      to,
      subject,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      responseBody: error.response?.body,
      responseHeaders: error.response?.headers,
    });

    throw new Error(`Unable to send ${label} email right now. Please try again shortly.`);
  }
};

const sendEmail = async ({ to, subject, html, label = 'email' }) => {
  return sendEmailViaBrevo({
    to,
    subject,
    html,
    label,
  });
};

const runEmailDiagnostics = async () => {
  try {
    const config = validateEmailConfig();
    return {
      ok: true,
      provider: 'Brevo HTTPS',
      senderEmail: config.senderEmail,
      senderName: config.senderName,
      apiKeyConfigured: Boolean(config.apiKey),
    };
  } catch (error) {
    return {
      ok: false,
      provider: 'Brevo HTTPS',
      error: error.message,
    };
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  const subject = 'Verify Your Email Address';
  const body = 'Your verification code is:';
  const html = buildEmailTemplate('Verify Your Email Address', body, verificationCode);

  return sendEmail({
    to: email,
    subject,
    html,
    label: 'verification',
  });
};

const sendPasswordResetEmail = async (email, resetCode) => {
  const subject = 'Password Reset Code';
  const body = 'Your password reset code is:';
  const html = buildEmailTemplate('Password Reset Code', body, resetCode);

  return sendEmailViaBrevo({
    to: email,
    subject,
    html,
    label: 'password reset',
  });
};

const sendWelcomeEmail = async (email) => {
  const subject = 'Welcome to Delivo';
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background: #fff;">
        <h1 style="margin-bottom: 12px;">Welcome to Delivo</h1>
        <p>Your account is ready. Start exploring local favorites and place your first order.</p>
      </div>
    </div>
  `;

  return sendEmailViaBrevo({
    to: email,
    subject,
    html,
    label: 'welcome',
  });
};

module.exports = {
  validateEmailConfig,
  buildEmailPayload,
  sendEmail,
  runEmailDiagnostics,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
