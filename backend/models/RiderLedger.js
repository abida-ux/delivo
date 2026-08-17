const mongoose = require('mongoose');

const RiderLedgerSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'delivery_earning',
        'withdrawal_reservation',
        'withdrawal_completed',
        'withdrawal_reversal',
        'adjustment',
        'refund',
        'bonus',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['Order', 'Payout', 'AdminAdjustment', 'SystemSync'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RiderLedgerSchema.index({ riderId: 1, createdAt: -1 });
RiderLedgerSchema.index({ riderId: 1, type: 1 });

module.exports = mongoose.model('RiderLedger', RiderLedgerSchema);
