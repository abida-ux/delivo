const nodemailer = require('nodemailer');

let transporter;

// Initialize Gmail transporter with App Password
async function initializeGmail() {
  if (transporter) return transporter;
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'delivosite@gmail.com',
      pass: 'iqkh mxfg haex iair',
    },
  });

  console.log('✅ Gmail configured with App Password');
  
  return transporter;
}

// Send verification email
exports.sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = await initializeGmail();

    const mailOptions = {
      from: 'delivosite@gmail.com',
      to: email,
      subject: 'Delivo - Email Verification Code',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8555); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DELIVO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Food Delivery Platform</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for signing up for Delivo! To complete your registration, please enter the following verification code:
            </p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; border: 2px solid #ff6b35;">
              <p style="color: #999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase;">Verification Code</p>
              <p style="color: #ff6b35; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 4px;">
                ${verificationCode}
              </p>
            </div>

            <p style="color: #666; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
              <strong>This code expires in 10 minutes.</strong> If you didn't create this account, you can ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2026 Delivo. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error.message);
    throw error;
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = await initializeGmail();

    const mailOptions = {
      from: 'delivosite@gmail.com',
      to: email,
      subject: 'Welcome to Delivo!',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 40px 20px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8555); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DELIVO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Food Delivery Platform</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #333; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Welcome to Delivo, ${name}! 🎉</h2>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Your account has been successfully verified. You can now log in and start ordering delicious food from your favorite restaurants!
            </p>

            <div style="background: linear-gradient(135deg, #ff6b35, #ff8555); padding: 15px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: white; text-decoration: none; font-weight: 600; font-size: 14px;">Start Ordering Now</a>
            </div>

            <p style="color: #666; font-size: 13px; line-height: 1.6;">
              Happy ordering!<br>
              <strong>The Delivo Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${email}:`, error.message);
  }
};
