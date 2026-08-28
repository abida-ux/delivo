const mongoose = require('mongoose');

const ScheduledAnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  frequency: {
    type: String,
    enum: ['once', 'daily', 'weekday', 'custom'],
    required: true,
  },
  weekday: { type: Number, min: 0, max: 6 },
  weekdays: [{ type: Number, min: 0, max: 6 }],
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  scheduledAt: { type: Date },
  enabled: { type: Boolean, default: true, index: true },
  nextRunAt: { type: Date, index: true },
  lastSentAt: { type: Date },
  lastSentOccurrenceKey: { type: String },
  processingToken: { type: String },
  processingUntil: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

ScheduledAnnouncementSchema.index({ enabled: 1, nextRunAt: 1 });

module.exports = mongoose.model('ScheduledAnnouncement', ScheduledAnnouncementSchema);
