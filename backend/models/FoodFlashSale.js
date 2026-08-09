const mongoose = require('mongoose');

const FoodFlashSaleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a flash sale title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startAt: {
    type: Date,
    required: [true, 'Please provide a start date and time'],
  },
  endAt: {
    type: Date,
    required: [true, 'Please provide an end date and time'],
  },
  items: [{
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FoodFlashSale', FoodFlashSaleSchema);
