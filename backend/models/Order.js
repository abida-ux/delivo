const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // ✅ Allow guest orders
  },
  guestEmail: {
    type: String,
    required: false,
  },
  guestPhone: {
    type: String,
    required: false,
  },
  customerName: {
    type: String,
    required: false,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false,
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  items: [{
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'on-delivery', 'out-for-delivery', 'assigned', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'card'],
    required: true,
    default: 'mpesa',
  },
  whatsappNumber: {
    type: String,
    required: true,
  },
  mpesaNumber: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  failureReason: {
    type: String,
    default: '',
  },
  checkoutRequestId: {
    type: String,
    required: false,
  },
  merchantRequestId: {
    type: String,
    required: false,
  },
  mpesaReceiptNumber: {
    type: String,
    required: false,
  },
  transactionDate: {
    type: String,
    required: false,
  },
  paymentCallbackPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 20,
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  specialInstructions: {
    type: String,
    default: '',
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  deliveryStartedAt: {
    type: Date,
    default: null,
  },
  deliveryCompletedAt: {
    type: Date,
    default: null,
  },
  currentRiderStatus: {
    type: String,
    enum: ['available', 'on-delivery', 'offline', 'assigned'],
    default: 'available',
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'assigned', 'out-for-delivery', 'delivered'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
  },
});

module.exports = mongoose.model('Order', OrderSchema);
