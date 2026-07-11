const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a food name'],
    trim: true,
    maxlength: [100, 'Food name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a food description'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
    required: [true, 'Please provide a food image URL'],
  },
  category: {
    type: String,
    enum: ['Burgers', 'Pizza', 'Drinks', 'Desserts', 'Salads', 'Asian', 'Other'],
    required: [true, 'Please provide a category'],
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  // Keep restaurant for backward compatibility
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Food', FoodSchema);
