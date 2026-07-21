const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  endpoint: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: false,
    },
    auth: {
      type: String,
      required: false,
    },
  },
  fcmToken: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
  },
  platform: {
    type: String,
    enum: ['web', 'android', 'ios'],
    default: 'web',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PushSubscriptionSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
