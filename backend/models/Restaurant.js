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
