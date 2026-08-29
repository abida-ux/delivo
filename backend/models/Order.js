const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // ✅ Allow guest orders
    index: true,
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
    index: true,
  },
  restaurants: [{
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
  }],
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
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
      required: false,
      index: true,
    },
    restaurantName: {
      type: String,
      default: '',
    },
    restaurantStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    categoryType: {
      type: String,
      default: 'meal',
    },
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
    },
    portionName: {
      type: String,
      default: null,
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
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'on-delivery', 'out-for-delivery', 'assigned', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
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
    index: true,
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
    default: 5,
  },
  vat: {
    type: Number,
    required: true,
    min: 0,
    default: 5,
  },
  riderTip: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  deliveryLatitude: {
    type: Number,
    required: [true, 'Please provide delivery latitude coordinates'],
  },
  deliveryLongitude: {
    type: Number,
    required: [true, 'Please provide delivery longitude coordinates'],
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
    index: true,
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
