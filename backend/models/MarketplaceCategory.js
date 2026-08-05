const mongoose = require('mongoose');

const MarketplaceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '🛍️',
  },
  banner: {
    type: String,
    default: '',
  },
  categoryType: {
    type: String,
    enum: ['supermarket', 'groceries', 'pharmacy', 'liquor', 'electronics', 'fashion', 'home', 'beauty'],
    default: 'supermarket',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceCategory', MarketplaceCategorySchema);
