const mongoose = require('mongoose');

const MarketplaceOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerName: {
    type: String,
    default: 'Customer',
  },
  customerEmail: {
    type: String,
    default: '',
  },
  customerPhone: {
    type: String,
    default: '',
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceProduct',
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    store: String,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    default: 'mpesa',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending',
  },
  deliveryAddress: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MarketplaceOrder', MarketplaceOrderSchema);
