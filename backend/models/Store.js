const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a store name'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters'],
  },
  bannerImage: {
    type: String,
    required: [true, 'Please provide a banner image URL'],
  },
  storeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreType',
    required: [true, 'Please provide a store type'],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.0,
  },
  deliveryTime: {
    type: String,
    required: [true, 'Please provide delivery time'],
    default: '30 mins',
  },
  cuisine: [{
    type: String,
    required: false,
  }],
  isOpen: {
    type: Boolean,
    default: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Store', StoreSchema);
