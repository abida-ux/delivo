const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  command: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

AdminLogSchema.index({ admin: 1, timestamp: -1 });

module.exports = mongoose.model('AdminLog', AdminLogSchema);

