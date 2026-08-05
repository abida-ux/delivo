const mongoose = require('mongoose');

const MarketplaceFlashSaleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceProduct',
  }],
  discountPercentage: {
    type: Number,
    default: 20,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceFlashSale', MarketplaceFlashSaleSchema);
