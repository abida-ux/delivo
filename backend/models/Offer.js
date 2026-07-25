const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  discount: {
    type: String,
    required: true,
    trim: true,
  },
  minOrder: {
    type: String,
    required: true,
    trim: true,
    default: 'KSh 0',
  },
  expiry: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Offer', OfferSchema);
