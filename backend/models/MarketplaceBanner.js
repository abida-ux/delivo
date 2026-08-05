const mongoose = require('mongoose');

const MarketplaceBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  desktopBanner: {
    type: String,
    default: '',
  },
  mobileBanner: {
    type: String,
    default: '',
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
  },
  buttonLink: {
    type: String,
    default: '/marketplace/categories',
  },
  displayOrder: {
    type: Number,
    default: 1,
  },
  enable: {
    type: Boolean,
    default: true,
  },
  scheduleStart: {
    type: Date,
    default: Date.now,
  },
  scheduleEnd: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceBanner', MarketplaceBannerSchema);
