const transporter = require('../config/mail');

const buildMailOptions = (to, subject, html) => ({
  from: process.env.MAIL_FROM || 'Delivo <info@delivo.buzz>',
  to,
  subject,
  html,
});

const buildEmailTemplate = (title, body, otp) => `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background: #fff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: #111;">Delivo</h1>
        <p style="margin: 6px 0 0; color: #666;">Secure OTP verification</p>
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

const sendVerificationOTP = async (email, otp) => {
  const subject = 'Verify Your Email Address';
  const body = `Your verification code is:`;
  const html = buildEmailTemplate('Verify Your Email Address', body, otp);

  return transporter.sendMail(buildMailOptions(email, subject, html));
};

const sendPasswordResetOTP = async (email, otp) => {
  const subject = 'Password Reset Code';
  const body = `Your password reset code is:`;
  const html = buildEmailTemplate('Password Reset Code', body, otp);

  return transporter.sendMail(buildMailOptions(email, subject, html));
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetOTP,
};
