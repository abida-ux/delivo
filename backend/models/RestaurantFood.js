const mongoose = require('mongoose');

const RestaurantFoodSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a selling price'],
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
  prepTime: {
    type: Number,
    default: 15,
  },
  stockStatus: {
    type: String,
    enum: ['in-stock', 'out-of-stock'],
    default: 'in-stock',
  },
  specialNotes: {
    type: String,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  todaySpecial: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a restaurant cannot have duplicate links to the same food item
RestaurantFoodSchema.index({ restaurantId: 1, foodId: 1 }, { unique: true });

module.exports = mongoose.model('RestaurantFood', RestaurantFoodSchema);
