const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [1, 'Amount must be at least 1 KES'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'timeout', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payoutType: {
      type: String,
      enum: ['automatic', 'manual_approved'],
      default: 'automatic',
    },
    originatorConversationId: {
      type: String,
      index: true,
    },
    conversationId: {
      type: String,
      index: true,
    },
    transactionReceipt: {
      type: String,
      index: true,
    },
    resultCode: {
      type: Number,
    },
    resultDesc: {
      type: String,
    },
    failureReason: {
      type: String,
    },
    b2cResponsePayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    b2cCallbackPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attempts: [
      {
        attemptNumber: { type: Number, required: true },
        initiatedAt: { type: Date, default: Date.now },
        conversationId: String,
        originatorConversationId: String,
        status: { type: String, enum: ['processing', 'completed', 'failed', 'timeout'] },
        resultCode: Number,
        resultDesc: String,
        failureReason: String,
        responsePayload: mongoose.Schema.Types.Mixed,
        callbackPayload: mongoose.Schema.Types.Mixed,
        initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

PayoutSchema.index({ riderId: 1, createdAt: -1 });
PayoutSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', PayoutSchema);
