const mongoose = require('mongoose');

const FoodCombinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a combination name'],
    trim: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: [true, 'Please provide a combination image URL'],
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodCategory',
    index: true,
  }],
  components: [{
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    defaultQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    minimumQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumQuantity: {
      type: Number,
      default: 10,
      min: 1,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  }],
  isEnabled: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FoodCombination', FoodCombinationSchema);
