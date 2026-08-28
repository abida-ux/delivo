const ScheduledAnnouncement = require('../models/ScheduledAnnouncement');
const { parseOnceDate, calculateNextRunAt, TIME_ZONE } = require('../services/scheduledAnnouncementService');

const normalizeSchedule = (body) => {
  const frequency = body.frequency;
  const time = String(body.time || '');
  const weekdays = Array.isArray(body.weekdays) ? [...new Set(body.weekdays.map(Number))].sort() : [];
  const schedule = { frequency, time, weekdays };

  if (!['once', 'daily', 'weekday', 'custom'].includes(frequency) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('A valid frequency and time are required.');
  }

  if (frequency === 'once') {
    const scheduledAt = parseOnceDate(body.scheduledAtLocal);
    if (!scheduledAt) throw new Error('A valid one-time date and time is required.');
    schedule.scheduledAt = scheduledAt;
  } else if (frequency === 'weekday') {
    const weekday = Number(body.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('A valid weekday is required.');
    schedule.weekday = weekday;
  } else if (frequency === 'custom') {
    if (!weekdays.length || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
      throw new Error('Select at least one valid custom day.');
    }
  }

  return schedule;
};

exports.list = async (req, res, next) => {
  try {
    const announcements = await ScheduledAnnouncement.find().sort({ nextRunAt: 1, createdAt: -1 });
    res.json({ success: true, timezone: TIME_ZONE, announcements });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, message } = req.body || {};
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ success: false, message: 'Title and message are required.' });
    const schedule = normalizeSchedule(req.body);
    const announcement = await ScheduledAnnouncement.create({
      title: title.trim(), message: message.trim(), ...schedule,
      enabled: req.body.enabled !== false,
      nextRunAt: req.body.enabled === false ? null : calculateNextRunAt(schedule),
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('valid') || error.message.includes('Select')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const announcement = await ScheduledAnnouncement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Scheduled announcement not found.' });
    const { title, message } = req.body || {};
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ success: false, message: 'Title and message are required.' });
    const schedule = normalizeSchedule(req.body);
    Object.assign(announcement, { title: title.trim(), message: message.trim(), ...schedule });
    announcement.enabled = req.body.enabled !== false;
    announcement.nextRunAt = announcement.enabled ? calculateNextRunAt(announcement) : null;
    announcement.processingToken = undefined;
    announcement.processingUntil = undefined;
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('valid') || error.message.includes('Select')) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

exports.toggle = async (req, res, next) => {
  try {
    const announcement = await ScheduledAnnouncement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Scheduled announcement not found.' });
    announcement.enabled = !announcement.enabled;
    announcement.nextRunAt = announcement.enabled ? calculateNextRunAt(announcement) : null;
    announcement.processingToken = undefined;
    announcement.processingUntil = undefined;
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await ScheduledAnnouncement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Scheduled announcement not found.' });
    res.json({ success: true });
  } catch (error) { next(error); }
};

module.exports = exports;
