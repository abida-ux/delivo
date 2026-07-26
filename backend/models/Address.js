const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  label: {
    type: String,
    required: [true, 'Please provide an address label (e.g. Home, Office)'],
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, 'Please provide latitude coordinates'],
  },
  longitude: {
    type: Number,
    required: [true, 'Please provide longitude coordinates'],
  },
  formattedAddress: {
    type: String,
    required: [true, 'Please provide a formatted address string'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Address', AddressSchema);
