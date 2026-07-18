const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a restaurant name'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters'],
  },
  bannerImage: {
    type: String,
    required: [true, 'Please provide a banner image URL'],
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
    required: true,
  }],
  isOpen: {
    type: Boolean,
    default: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'approved',
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  pendingBalance: {
    type: Number,
    default: 0,
  },
  withdrawnBalance: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  openingHours: {
    type: String,
    default: '08:00',
  },
  closingHours: {
    type: String,
    default: '22:00',
  },
  deliveryRadius: {
    type: Number,
    default: 5,
  },
  location: {
    type: String,
    default: '',
  },
  bankName: {
    type: String,
    default: '',
  },
  accountNumber: {
    type: String,
    default: '',
  },
  mpesaNumber: {
    type: String,
    default: '',
  },
  foods: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
