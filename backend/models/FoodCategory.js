const mongoose = require('mongoose');

const FoodCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
    trim: true,
  },
  icon: {
    type: String,
    required: [true, 'Please provide an icon name'],
  },
  image: {
    type: String,
    required: [true, 'Please provide a category image URL'],
  },
  order: {
    type: Number,
    default: 0,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FoodCategory', FoodCategorySchema);
