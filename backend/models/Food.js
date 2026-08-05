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
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
    required: [true, 'Please provide a food image URL'],
  },
  category: {
    type: String,
    index: true,
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodCategory',
    index: true,
  }],
  tags: [{
    type: String,
  }],
  keywords: [{
    type: String,
  }],
  defaultPrepTime: {
    type: Number,
    default: 15,
  },
  defaultAvailability: {
    type: Boolean,
    default: true,
  },
  nutritionalInfo: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  ingredients: [{
    type: String,
  }],
  allergens: [{
    type: String,
  }],

  featured: {
    type: Boolean,
    default: false,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null,
    index: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
  },
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: [],
    index: true,
  }],
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
