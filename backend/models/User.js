const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'rider', 'admin'],
    default: 'customer',
  },
  phone: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeExpires: {
    type: Date,
    select: false,
  },
  verificationCodeUsed: {
    type: Boolean,
    default: false,
    select: false,
  },
  verificationAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  verificationLockedUntil: {
    type: Date,
    select: false,
  },
  verificationResendCount: {
    type: Number,
    default: 0,
    select: false,
  },
  verificationResendWindowStart: {
    type: Date,
    select: false,
  },
  lastVerificationResend: {
    type: Date,
    select: false,
  },
  resetPasswordCode: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  resetPasswordUsed: {
    type: Boolean,
    default: false,
    select: false,
  },
  resetPasswordAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  resetPasswordLockedUntil: {
    type: Date,
    select: false,
  },
  passwordResetRequestCount: {
    type: Number,
    default: 0,
    select: false,
  },
  passwordResetWindowStart: {
    type: Date,
    select: false,
  },
  lastPasswordResetRequestedAt: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
