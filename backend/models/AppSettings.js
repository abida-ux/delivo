const mongoose = require('mongoose');

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
