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
  shortDescription: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    default: '',
  },
  store: {
    type: String,
    default: 'Delivo Official Store',
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceStore',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceCategory',
    required: false,
    index: true,
  },
  subcategory: {
    type: String,
    default: '',
  },
  categoryType: {
    type: String,
    enum: ['supermarket', 'groceries', 'pharmacy', 'liquor', 'electronics', 'fashion', 'home', 'beauty'],
    default: 'supermarket',
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: {
    type: Number,
    default: 10,
    min: 0,
  },
  images: [{ type: String }],
  image: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  video: {
    type: String,
    default: '',
  },
  weightOrSize: {
    type: String,
    default: '',
  },
  dimensions: {
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
  specifications: [{
    key: String,
    value: String,
  }],
  features: [{ type: String }],
  warranty: {
    type: String,
    default: '1 Year Warranty',
  },
  condition: {
    type: String,
    enum: ['Brand New', 'Refurbished', 'Used'],
    default: 'Brand New',
  },
  deliveryFee: {
    type: Number,
    default: 150,
  },
  estimatedDeliveryTime: {
    type: String,
    default: '1–2 Business Days',
  },
  availability: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  flashSale: {
    type: Boolean,
    default: false,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  newArrival: {
    type: Boolean,
    default: true,
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceProduct', MarketplaceProductSchema);
