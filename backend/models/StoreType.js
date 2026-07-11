const mongoose = require('mongoose');

const StoreTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a store type name'],
    trim: true,
    unique: true,
    maxlength: [50, 'Store type name cannot exceed 50 characters'],
  },
  icon: {
    type: String,
    required: [true, 'Please provide an icon URL'],
  },
  description: {
    type: String,
    required: false,
  },
  color: {
    type: String,
    default: '#FF6B35',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('StoreType', StoreTypeSchema);
