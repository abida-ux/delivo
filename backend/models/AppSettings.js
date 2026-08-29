const mongoose = require('mongoose');

const deliveryFeeRulesSchema = new mongoose.Schema({
  below100: { type: Number, default: 120, min: 0 },
  above199: { type: Number, default: 80, min: 0 },
  above299: { type: Number, default: 50, min: 0 },
  above500: { type: Number, default: 20, min: 0 },
}, { _id: false });

const AppSettingsSchema = new mongoose.Schema({
  deliveryFeeEnabled: {
    type: Boolean,
    default: true,
  },
  deliveryFeeAmount: {
    type: Number,
    default: 20,
    min: 0,
  },
  deliveryFeeRules: {
    type: deliveryFeeRulesSchema,
    default: () => ({
      below100: 120,
      above199: 80,
      above299: 50,
      above500: 20,
    }),
  },
  freeDeliveryEnabled: {
    type: Boolean,
    default: false,
  },
  freeDeliveryMinimum: {
    type: Number,
    default: 2500,
    min: 0,
  },
  promoNotifications: {
    type: Boolean,
    default: true,
  },
  notificationMessage: {
    type: String,
    default: 'Free delivery for orders above KES 2,500!',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
