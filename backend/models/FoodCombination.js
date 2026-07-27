const mongoose = require('mongoose');

const FoodCombinationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: 'Combo Meal',
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=Combo+Meal',
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
    customPrice: {
      type: Number,
      min: 0,
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
