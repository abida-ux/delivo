const mongoose = require('mongoose');

const RestaurantCombinationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  },
  combinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodCombination',
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a combination selling price'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
  },
  availability: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a restaurant cannot have duplicate links to the same combination item
RestaurantCombinationSchema.index({ restaurantId: 1, combinationId: 1 }, { unique: true });

module.exports = mongoose.model('RestaurantCombination', RestaurantCombinationSchema);
