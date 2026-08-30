const User = require('../models/User');
const Order = require('../models/Order');
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

const clearVerificationOTP = async (user) => {
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeUsed = false;
  user.verificationAttempts = 0;
  user.verificationLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });
};

const clearPasswordResetOTP = async (user) => {
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  user.resetPasswordUsed = false;
  user.resetPasswordAttempts = 0;
  user.resetPasswordLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });
};

const createVerificationCode = async (user) => {
  const otp = generateOTP();
  console.log('[auth] generating verification OTP');
  await applyVerificationOTP(user, otp, false);

  try {
    console.log('[auth] backend -> sending verification email', { email: user.email });
    await sendVerificationEmail(user.email, otp);
    console.log('[auth] backend <- verification email delivered', { email: user.email });
    return { delivered: true };
  } catch (error) {
    console.error('[auth] verification email delivery failed', {
      email: user.email,
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    await clearVerificationOTP(user);
    throw error;
  }
};

const createPasswordResetCode = async (user) => {
  const otp = generateOTP();
  console.log('[auth] generating password reset OTP');
  await applyPasswordResetOTP(user, otp);
  try {
    await sendPasswordResetEmail(user.email, otp);
    console.log('[auth] password reset email delivered');
  } catch (error) {
    console.error('[auth] password reset email delivery failed', {
      email: user.email,
      error: error.message,
      code: error.code,
    });
    await clearPasswordResetOTP(user);
    throw error;
  }
};

const EMAIL_VERIFICATION = false; // Disabled per user request (will use it later)

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    let finalRole = role || 'customer';
    
    // Strict role validation to prevent privilege escalation:
    // If attempting to register as any role other than customer, verify the caller is an authenticated admin.
    if (finalRole !== 'customer') {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Cannot register with a privileged role.',
        });
      }

      const requester = await User.findById(req.user.id);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only administrators can register privileged roles.',
        });
      }
    }

    console.log('[auth] registration request received', {
      email,
      phone: phone ? 'provided' : 'missing',
      role: finalRole,
      location: location ? 'provided' : 'missing',
    });

    if (!name || !email || !password || !phone) {
      console.warn('[auth] registration validation failed: missing required fields', { email });
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.warn('[auth] registration validation failed: invalid email', { email });
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      console.warn('[auth] registration validation failed: password too short', { email });
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    console.log('[auth] registration input validation passed', { email });

    const existingUser = await User.findOne({ email });
    console.log('[auth] registration user lookup completed', { email, existingUser: !!existingUser });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    console.log('[auth] backend <- registration request', {
      name,
      email,
      phone,
      role: finalRole,
      location,
    });

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      phone,
      location,
      isVerified: EMAIL_VERIFICATION ? false : true,
      verificationResendCount: 0,
      verificationResendWindowStart: new Date(),
      verificationAttempts: 0,
    });

    console.log('[auth] user saved to database', { userId: user._id, email: user.email });

    // Send Welcome Notification (In-App & Push) when account is created
    try {
      const { createInAppNotification, sendPushToUser } = require('../utils/pushNotifications');
      const welcomePayload = {
        title: 'Welcome to Delivo',
        message: `Welcome, ${user.name}! Your account has been created successfully. Explore our top restaurants and order delicious food.`,
        url: '/',
        tag: 'delivo-welcome',
      };
      await createInAppNotification({
        userId: user._id,
        title: welcomePayload.title,
        message: welcomePayload.message,
        type: 'system',
      });
      await sendPushToUser({ userId: user._id, payload: welcomePayload });
    } catch (welcomeErr) {
      console.warn('⚠️ Welcome notification warning:', welcomeErr.message);
    }


    // If email verification is enabled, attempt to create and send verification code
    let emailDelivered = false;
    if (EMAIL_VERIFICATION) {
      try {
        console.log('[auth] backend -> creating verification code', { userId: user._id, email: user.email });
        await createVerificationCode(user);
        console.log('[auth] backend <- verification code created and email flow completed', { userId: user._id, email: user.email });
        emailDelivered = true;
      } catch (error) {
        console.error('[auth] registration email flow failed', {
          userId: user._id,
          email: user.email,
          message: error.message,
          stack: error.stack,
          code: error.code,
          command: error.command,
          response: error.response,
        });

        try {
          await User.findByIdAndDelete(user._id);
          console.log('[auth] registration cleanup completed', { userId: user._id, email: user.email });
        } catch (cleanupError) {
          console.error('[auth] registration cleanup failed', {
            userId: user._id,
            email: user.email,
            message: cleanupError.message,
          });
        }

        return res.status(503).json({
          success: false,
          message: 'We could not send the verification email right now. Please try again shortly.',
        });
      }
    }

    console.log('[auth] registration completed', {
      userId: user._id,
      email: user.email,
      emailDelivered,
    });

    const response = {
      success: true,
      message: EMAIL_VERIFICATION
        ? 'User registered successfully. A verification code has been sent to your email.'
        : 'User registered successfully. Email verification is disabled in this environment.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    if (EMAIL_VERIFICATION) {
      response.verification = {
        required: true,
        emailDelivered,
        resendEndpoint: '/api/users/resend-verification-code',
      };
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error('[auth] registration controller crashed', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
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

    if (EMAIL_VERIFICATION && !user.isVerified) {
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

    console.log('[auth] verification attempt received');

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

    // Auto-link previous guest orders using email or phone matching
    try {
      const Order = require('../models/Order');
      const orConditions = [{ guestEmail: user.email.toLowerCase() }];
      if (user.phone) {
        orConditions.push({ guestPhone: user.phone });
        orConditions.push({ mpesaNumber: user.phone });
      }

      const updateResult = await Order.updateMany(
        {
          $or: orConditions,
          userId: null
        },
        {
          userId: user._id
        }
      );
      console.log(`🔗 Auto-linked ${updateResult.modifiedCount} previous guest orders to verified user ID: ${user._id}`);
    } catch (err) {
      console.error('❌ Failed to link guest orders on email verification:', err);
    }

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
      console.log('[auth] resending verification OTP');
      await applyVerificationOTP(user, otp, true);

      try {
        console.log('[auth] backend -> resending verification email', { email: user.email });
        await sendVerificationEmail(user.email, otp);
        console.log('[auth] backend <- verification resend email delivered', { email: user.email });
      } catch (error) {
        console.error('[auth] verification resend email delivery failed', {
          email: user.email,
          error: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
        });
        await clearVerificationOTP(user);
        return res.status(503).json({
          success: false,
          message: 'We couldn\'t send your verification email at the moment. Please try again in a few moments.',
        });
      }
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

      try {
        await createPasswordResetCode(user);
      } catch (error) {
        return res.status(503).json({
          success: false,
          message: 'We couldn\'t send your password reset email at the moment. Please try again in a few moments.',
        });
      }
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
    // Only the profile owner or an admin can access this profile
    if (req.user.id !== req.params.id) {
      const reqUser = await User.findById(req.user.id);
      if (!reqUser || reqUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own profile.',
        });
      }
    }

    const user = await User.findById(req.params.id).select('-password');

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

exports.getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateRiderStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'rider') {
      return res.status(403).json({ success: false, message: 'Riders only' });
    }

    const nextStatus = String(req.body.riderStatus || '').toLowerCase();
    const allowedStatuses = ['available', 'on-delivery', 'offline'];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid rider status' });
    }

    const previousStatus = user.riderStatus;

    // Check if rider currently has an active delivery
    const hasActiveDelivery = await Order.exists({
      riderId: user._id,
      status: { $in: ['assigned', 'out-for-delivery', 'on-delivery'] },
    });

    if (hasActiveDelivery && nextStatus === 'offline') {
      return res.status(400).json({
        success: false,
        message: 'Cannot go offline while you have an active delivery in progress.',
      });
    }

    if (hasActiveDelivery && nextStatus === 'available') {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark as available while on an active delivery. Please complete your current order first.',
      });
    }

    user.riderStatus = nextStatus;
    user.isOnline = nextStatus !== 'offline';
    user.lastSeenAt = new Date();
    if (nextStatus === 'offline' && !hasActiveDelivery) {
      user.currentOrderId = null;
    }
    await user.save();

    if (previousStatus !== nextStatus) {
      try {
        const { createInAppNotification, sendPushToUser } = require('../utils/pushNotifications');
        const adminUsers = await User.find({ role: 'admin' });
        const title = 'Rider Status Update';
        const displayStatus = nextStatus === 'available' ? 'online' : nextStatus;
        const message = `Rider ${user.name || 'A rider'} is now ${displayStatus}.`;

        for (const adminUser of adminUsers) {
          await createInAppNotification({
            userId: adminUser._id,
            title,
            message,
            type: 'system',
          });

          await sendPushToUser({
            userId: adminUser._id,
            payload: {
              title,
              message,
              url: '/admin/riders',
              tag: `rider-status-${user._id}`,
            },
          });
        }
      } catch (notifErr) {
        console.error('⚠️ Rider status notification error:', notifErr.message || notifErr);
      }
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    // Only the profile owner or an admin can update this profile
    if (req.user.id !== req.params.id) {
      const reqUser = await User.findById(req.user.id);
      if (!reqUser || reqUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own profile.',
        });
      }
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { password, restaurantId, ...updateFields } = req.body;

    // Prevent privilege escalation: only admins can update roles and verification status
    const reqUser = await User.findById(req.user.id);
    const isAdmin = reqUser && reqUser.role === 'admin';
    if (!isAdmin) {
      delete updateFields.role;
      delete updateFields.isVerified;
    }

    const Restaurant = require('../models/Restaurant');

    // Handle linking / unlinking restaurant when updated by Admin
    if (isAdmin) {
      if (restaurantId !== undefined) {
        if (restaurantId && restaurantId !== 'none' && restaurantId !== '') {
          // Unlink user from any previous restaurant
          await Restaurant.updateMany({ ownerId: user._id }, { ownerId: null });
          // Link selected restaurant to this user
          await Restaurant.findByIdAndUpdate(restaurantId, { ownerId: user._id });
          updateFields.role = 'restaurant';
        } else {
          // Unlink user from any restaurant
          await Restaurant.updateMany({ ownerId: user._id }, { ownerId: null });
        }
      } else if (updateFields.role && updateFields.role !== 'restaurant') {
        // If role was explicitly changed away from restaurant, unlink any restaurant
        await Restaurant.updateMany({ ownerId: user._id }, { ownerId: null });
      }
    }

    Object.assign(user, updateFields);
    if (password) {
      user.password = password;
    }

    await user.save();

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
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    const Restaurant = require('../models/Restaurant');
    const restaurants = await Restaurant.find({}, '_id name ownerId').lean();

    const restMap = {};
    restaurants.forEach((r) => {
      if (r.ownerId) {
        restMap[r.ownerId.toString()] = { _id: r._id, name: r.name };
      }
    });

    const data = users.map((u) => ({
      ...u,
      restaurant: restMap[u._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
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

    const { name, email, password, role, phone, restaurantId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    let finalRole = role || 'customer';
    if (restaurantId && restaurantId !== 'none' && restaurantId !== '') {
      finalRole = 'restaurant';
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      phone,
    });

    if (restaurantId && restaurantId !== 'none' && restaurantId !== '') {
      const Restaurant = require('../models/Restaurant');
      await Restaurant.findByIdAndUpdate(restaurantId, { ownerId: user._id });
    }

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

const buildAdminAnalyticsSummary = ({
  userCount = 0,
  restaurantCount = 0,
  foodCount = 0,
  totalOrders = 0,
  deliveredOrders = 0,
  cancelledOrders = 0,
  failedPayments = 0,
  paidOrdersCount = 0,
  totalRevenue = 0,
  averageOrderValue = 0,
  customers = 0,
  riders = 0,
  riderEarnings = 0,
  ordersChangePct = 0,
  revenueChangePct = 0,
  usersChangePct = 0,
  restaurantsChangePct = 0,
  ridersChangePct = 0,
} = {}) => ({
  users: userCount,
  customers,
  riders,
  restaurants: restaurantCount,
  foods: foodCount,
  orders: totalOrders,
  deliveredOrders,
  cancelledOrders,
  failedPayments,
  paidOrdersCount,
  revenue: totalRevenue,
  totalRevenue,
  averageOrderValue,
  riderEarnings,
  ordersChangePct,
  revenueChangePct,
  usersChangePct,
  restaurantsChangePct,
  ridersChangePct,
});

exports.buildAdminAnalyticsSummary = buildAdminAnalyticsSummary;

// @desc Get fast aggregated admin stats
// @route GET /api/users/admin/stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const Food = require('../models/Food');
    const Order = require('../models/Order');
    const Restaurant = require('../models/Restaurant');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      userMetrics,
      restaurantCount,
      foodCount,
      orderMetrics,
      riderEarningsAgg,
      thisMonthOrders,
      previousMonthOrders,
      thisMonthRevenueAgg,
      previousMonthRevenueAgg,
      thisMonthUserGrowth,
      previousMonthUserGrowth,
      thisMonthRestaurantGrowth,
      previousMonthRestaurantGrowth,
      thisMonthRiderGrowth,
      previousMonthRiderGrowth,
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            userCount: { $sum: 1 },
            customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
            riders: { $sum: { $cond: [{ $eq: ['$role', 'rider'] }, 1, 0] } },
          },
        },
      ]),
      Restaurant.countDocuments(),
      Food.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            failedPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } },
            paidOrdersCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] } },
            totalRevenue: {
              $sum: { $cond: [{ $ne: ['$paymentStatus', 'failed'] }, '$totalPrice', 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { riderEarningAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$riderEarningAmount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: monthStart } }),
      Order.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: monthStart } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, paymentStatus: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: previousMonthStart, $lt: monthStart }, paymentStatus: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: monthStart } }),
      Restaurant.countDocuments({ createdAt: { $gte: monthStart } }),
      Restaurant.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: monthStart } }),
      User.countDocuments({ role: 'rider', createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: 'rider', createdAt: { $gte: previousMonthStart, $lt: monthStart } }),
    ]);

    const userSummary = userMetrics[0] || {};
    const orderSummary = orderMetrics[0] || {};
    const totalOrders = Number(orderSummary.totalOrders || 0);
    const totalRevenue = Number(orderSummary.totalRevenue || 0);
    const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;
    const riderEarnings = Number(riderEarningsAgg[0]?.total || 0);

    const percentChange = (current, previous) => {
      if (!previous && current > 0) return 100;
      if (!previous) return 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    const summary = buildAdminAnalyticsSummary({
      userCount: Number(userSummary.userCount || 0),
      restaurantCount,
      foodCount,
      totalOrders,
      deliveredOrders: Number(orderSummary.deliveredOrders || 0),
      cancelledOrders: Number(orderSummary.cancelledOrders || 0),
      failedPayments: Number(orderSummary.failedPayments || 0),
      paidOrdersCount: Number(orderSummary.paidOrdersCount || 0),
      totalRevenue,
      averageOrderValue,
      customers: Number(userSummary.customers || 0),
      riders: Number(userSummary.riders || 0),
      riderEarnings,
      ordersChangePct: percentChange(thisMonthOrders, previousMonthOrders),
      revenueChangePct: percentChange(Number(thisMonthRevenueAgg[0]?.total || 0), Number(previousMonthRevenueAgg[0]?.total || 0)),
      usersChangePct: percentChange(thisMonthUserGrowth, previousMonthUserGrowth),
      restaurantsChangePct: percentChange(thisMonthRestaurantGrowth, previousMonthRestaurantGrowth),
      ridersChangePct: percentChange(thisMonthRiderGrowth, previousMonthRiderGrowth),
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.lastLatitude = parseFloat(latitude);
    user.lastLongitude = parseFloat(longitude);
    user.lastAddress = address;
    user.location = address;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Location coordinates updated successfully',
      data: {
        lastLatitude: user.lastLatitude,
        lastLongitude: user.lastLongitude,
        lastAddress: user.lastAddress,
      }
    });
  } catch (error) {
    next(error);
  }
};

