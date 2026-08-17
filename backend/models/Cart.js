const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [{
    productType: {
      type: String,
      enum: ['meal', 'marketplace'],
      default: 'meal',
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: false,
    },
    marketplaceProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceProduct',
      required: false,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    restaurantName: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    categoryType: {
      type: String,
      default: 'meal',
    },
    isCombination: {
      type: Boolean,
      default: false,
    },
    combinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodCombination',
    },
    components: [{
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
      },
      name: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      price: {
        type: Number,
      },
    }],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
CartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', CartSchema);
