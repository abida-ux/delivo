const transporter = require('../config/mail');
const { validatePayload } = require('../utils/validation');

const buildBaseTemplate = (title, preview, content, ctaText, ctaUrl) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#fff7ed;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(90deg,#f97316,#fb923c);padding:24px;text-align:center;color:#fff;">
                <h1 style="margin:0;font-size:28px;">Delivo</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">${preview}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px;">
                ${content}
                ${ctaText ? `<p style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;">${ctaText}</a></p>` : ''}
                <p style="margin-top:24px;color:#6b7280;font-size:13px;">If you did not request this email, you can ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const sendEmail = async ({ to, subject, html, label }) => {
  const errors = validatePayload({ email: to }, ['email']);
  if (errors.length) {
    const error = new Error(errors[0]);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (String(process.env.EMAIL_MOCK_MODE || '').toLowerCase() === 'true') {
    console.log(`[email-service] mock mode enabled for ${label} email to ${to}`);
    return { success: true, messageId: `mock-${label}-${Date.now()}` };
  }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'Delivo'} <${process.env.EMAIL_FROM_ADDRESS || 'noreply@delivo.app'}>`,
    to,
    subject,
    html,
  };

  console.log(`[email-service] sending ${label} email to ${to}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[email-service] smtp success ${label}`, { to, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email-service] smtp failure ${label}`, { to, message: error.message });
    const wrapped = new Error(`Unable to send ${label} email`);
    wrapped.code = 'SMTP_ERROR';
    throw wrapped;
  }
};

const sendVerificationEmail = async ({ email, token }) => {
  const errors = validatePayload({ email, token }, ['email', 'token']);
  if (errors.length) {
    const error = new Error(errors[0]);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const html = buildBaseTemplate(
    'Verify your email',
    'Secure account verification',
    `<h2 style="margin-top:0;">Verify your email address</h2><p>Hello,</p><p>Use the code below to verify your Delivo account.</p><div style="margin:24px 0;padding:16px 24px;background:#fef3c7;border-radius:12px;font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;">${token}</div>`,
    'Verify Account',
    'https://delivo.app/verify'
  );

  return sendEmail({ to: email, subject: 'Verify your Delivo account', html, label: 'verification' });
};

const sendPasswordResetEmail = async ({ email, token }) => {
  const errors = validatePayload({ email, token }, ['email', 'token']);
  if (errors.length) {
    const error = new Error(errors[0]);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const html = buildBaseTemplate(
    'Reset your password',
    'Secure password recovery',
    `<h2 style="margin-top:0;">Reset your password</h2><p>Hello,</p><p>Use the code below to reset your password.</p><div style="margin:24px 0;padding:16px 24px;background:#fef3c7;border-radius:12px;font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;">${token}</div>`,
    'Reset Password',
    'https://delivo.app/reset-password'
  );

  return sendEmail({ to: email, subject: 'Reset your Delivo password', html, label: 'password reset' });
};

const sendWelcomeEmail = async ({ email, name }) => {
  const errors = validatePayload({ email }, ['email']);
  const nameValue = typeof name === 'string' && name.trim() ? name.trim() : 'there';
  if (errors.length) {
    const error = new Error(errors[0]);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const html = buildBaseTemplate(
    'Welcome to Delivo',
    'Welcome aboard',
    `<h2 style="margin-top:0;">Welcome to Delivo, ${nameValue}!</h2><p>Your account is ready. You can now explore restaurants, place orders, and track everything in one place.</p>`,
    'Get Started',
    'https://delivo.app'
  );

  return sendEmail({ to: email, subject: 'Welcome to Delivo', html, label: 'welcome' });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
