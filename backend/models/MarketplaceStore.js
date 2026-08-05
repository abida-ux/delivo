const mongoose = require('mongoose');

const MarketplaceStoreSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Please provide store name'],
    trim: true,
  },
  logo: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Nairobi, Kenya',
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  owner: {
    type: String,
    default: 'Delivo Admin',
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'unverified', 'pending'],
    default: 'verified',
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceStore', MarketplaceStoreSchema);
