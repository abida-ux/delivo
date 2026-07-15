const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const generateOTP = require('../utils/generateOTP');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../config/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const isOTPValid = (hashedCode, otp) => !!hashedCode && hashOTP(otp) === hashedCode;

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESEND_PER_HOUR = 5;
const MIN_RESEND_INTERVAL_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_RESET_ATTEMPTS = 5;
const VERIFICATION_LOCK_MS = 15 * 60 * 1000;
const RESET_LOCK_MS = 15 * 60 * 1000;

const resetVerificationResendWindow = (user) => {
  const now = Date.now();
  if (!user.verificationResendWindowStart || now - new Date(user.verificationResendWindowStart).getTime() > RESEND_WINDOW_MS) {
    user.verificationResendWindowStart = new Date();
    user.verificationResendCount = 0;
  }
};

const resetPasswordRequestWindow = (user) => {
  const now = Date.now();
  if (!user.passwordResetWindowStart || now - new Date(user.passwordResetWindowStart).getTime() > RESEND_WINDOW_MS) {
    user.passwordResetWindowStart = new Date();
    user.passwordResetRequestCount = 0;
  }
};

const applyVerificationOTP = async (user, otp, isResend = false) => {
  const now = new Date();
  if (isResend) {
    resetVerificationResendWindow(user);
    user.verificationResendCount = (user.verificationResendCount || 0) + 1;
  }

  user.verificationCode = hashOTP(otp);
  user.verificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  user.verificationCodeUsed = false;
  user.verificationAttempts = 0;
  user.verificationLockedUntil = undefined;
  user.lastVerificationResend = now;

  if (!user.verificationResendWindowStart) {
    user.verificationResendWindowStart = now;
  }

  await user.save({ validateBeforeSave: false });
};

const applyPasswordResetOTP = async (user, otp) => {
  resetPasswordRequestWindow(user);
  user.passwordResetRequestCount = (user.passwordResetRequestCount || 0) + 1;

  user.resetPasswordCode = hashOTP(otp);
  user.resetPasswordExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  user.resetPasswordUsed = false;
  user.resetPasswordAttempts = 0;
  user.resetPasswordLockedUntil = undefined;
  user.lastPasswordResetRequestedAt = new Date();

  await user.save({ validateBeforeSave: false });
};

const createVerificationCode = async (user) => {
  const otp = generateOTP();
  await applyVerificationOTP(user, otp, false);

  try {
    await sendVerificationEmail(user.email, otp);
  } catch (error) {
    console.error(`⚠️ Verification email could not be sent to ${user.email}:`, error.message);
  }
};

const createPasswordResetCode = async (user) => {
  const otp = generateOTP();
  await applyPasswordResetOTP(user, otp);
  await sendPasswordResetEmail(user.email, otp);
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      isVerified: false,
      verificationResendCount: 0,
      verificationResendWindowStart: new Date(),
      verificationAttempts: 0,
    });

    await createVerificationCode(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. A verification code has been sent to your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
        verification: {
          required: true,
          resendEndpoint: '/api/users/resend-verification-code',
          instructions: 'POST your email to the resend endpoint to receive a new code',
        },
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    const user = await User.findOne({ email }).select(
      '+verificationCode +verificationCodeExpires +verificationCodeUsed +verificationAttempts +verificationLockedUntil'
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or email',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Account already verified',
      });
    }

    const now = Date.now();
    if (user.verificationLockedUntil && user.verificationLockedUntil.getTime() > now) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again later.',
      });
    }

    if (!user.verificationCode || !isOTPValid(user.verificationCode, code)) {
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        user.verificationLockedUntil = new Date(now + VERIFICATION_LOCK_MS);
      }
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires.getTime() < now) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired',
      });
    }

    user.isVerified = true;
    user.verificationCodeUsed = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationAttempts = 0;
    user.verificationLockedUntil = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email }).select(
      '+isVerified +verificationCodeExpires +verificationCodeUsed +verificationResendCount +verificationResendWindowStart +lastVerificationResend'
    );

    if (user && !user.isVerified) {
      const now = Date.now();
      if (user.lastVerificationResend && now - new Date(user.lastVerificationResend).getTime() < MIN_RESEND_INTERVAL_MS) {
        return res.status(429).json({
          success: false,
          message: 'Please wait at least 60 seconds before requesting a new code.',
        });
      }

      resetVerificationResendWindow(user);
      if ((user.verificationResendCount || 0) >= MAX_RESEND_PER_HOUR) {
        return res.status(429).json({
          success: false,
          message: 'You have reached the maximum resend limit for this hour. Please try again later.',
        });
      }

      const otp = generateOTP();
      await applyVerificationOTP(user, otp, true);
      await sendVerificationEmail(user.email, otp);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists, a new verification code has been sent',
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email }).select(
      '+passwordResetRequestCount +passwordResetWindowStart +lastPasswordResetRequestedAt +resetPasswordLockedUntil'
    );

    if (user) {
      const now = Date.now();
      if (user.resetPasswordLockedUntil && user.resetPasswordLockedUntil.getTime() > now) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists, a password reset code has been sent',
        });
      }

      if (user.lastPasswordResetRequestedAt && now - new Date(user.lastPasswordResetRequestedAt).getTime() < MIN_RESEND_INTERVAL_MS) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists, a password reset code has been sent',
        });
      }

      resetPasswordRequestWindow(user);
      if ((user.passwordResetRequestCount || 0) >= MAX_RESEND_PER_HOUR) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists, a password reset code has been sent',
        });
      }

      await createPasswordResetCode(user);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset code has been sent',
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required',
      });
    }

    const user = await User.findOne({ email }).select(
      '+resetPasswordCode +resetPasswordExpires +resetPasswordUsed +resetPasswordAttempts +resetPasswordLockedUntil +password'
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code or email',
      });
    }

    const now = Date.now();
    if (user.resetPasswordLockedUntil && user.resetPasswordLockedUntil.getTime() > now) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset attempts. Please try again later.',
      });
    }

    if (user.resetPasswordUsed || !isOTPValid(user.resetPasswordCode, code)) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      if (user.resetPasswordAttempts >= MAX_RESET_ATTEMPTS) {
        user.resetPasswordLockedUntil = new Date(now + RESET_LOCK_MS);
      }
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: 'Invalid reset code',
      });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < now) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired',
      });
    }

    user.password = password;
    user.resetPasswordUsed = true;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    user.resetPasswordLockedUntil = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    console.log('📝 Creating user with data:', req.body);

    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    console.error('❌ User creation error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
};
