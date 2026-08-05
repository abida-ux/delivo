const mongoose = require('mongoose');

const FoodRatingSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only rate a food item once (upsert on duplicate)
FoodRatingSchema.index({ food: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('FoodRating', FoodRatingSchema);
