const mongoose = require('mongoose');

const MarketplaceProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    default: '',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceCategory',
    required: true,
    index: true,
  },
  categoryType: {
    type: String,
    enum: ['supermarket', 'groceries', 'pharmacy', 'liquor'],
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  images: [{ type: String }],
  image: {
    type: String,
    default: '',
  },
  weightOrSize: {
    type: String,
    default: '',
  },
  sku: {
    type: String,
    default: '',
  },
  barcode: {
    type: String,
    default: '',
  },
  availability: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{ type: String }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  prescriptionRequired: {
    type: Boolean,
    default: false,
  },
  requiresAgeVerification: {
    type: Boolean,
    default: false,
  },
  expiryDate: {
    type: String,
    default: '',
  },
  manufacturer: {
    type: String,
    default: '',
  },
  dosage: {
    type: String,
    default: '',
  },
  bottleSize: {
    type: String,
    default: '',
  },
  alcoholPercentage: {
    type: String,
    default: '',
  },
  freshnessIndicator: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceProduct', MarketplaceProductSchema);
