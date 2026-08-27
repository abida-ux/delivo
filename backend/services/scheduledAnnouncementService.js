const crypto = require('crypto');
const mongoose = require('mongoose');
const ScheduledAnnouncement = require('../models/ScheduledAnnouncement');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushToUser } = require('../utils/pushNotifications');

const TIME_ZONE = 'Africa/Nairobi';
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

const getNairobiParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour) % 24, minute: Number(parts.minute),
  };
};

const dateFromNairobi = (year, month, day, hour, minute) =>
  new Date(Date.UTC(year, month - 1, day, hour, minute) - NAIROBI_OFFSET_MS);

const parseOnceDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || '')) return null;
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const result = dateFromNairobi(year, month, day, hour, minute);
  return Number.isNaN(result.getTime()) ? null : result;
};

const getNextRecurringRun = (announcement, from = new Date()) => {
  const [hour, minute] = announcement.time.split(':').map(Number);
  const current = getNairobiParts(from);
  const start = new Date(Date.UTC(current.year, current.month - 1, current.day));
  const allowedDays = announcement.frequency === 'daily'
    ? [0, 1, 2, 3, 4, 5, 6]
    : announcement.frequency === 'weekday'
      ? [announcement.weekday]
      : announcement.weekdays;

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDay = new Date(start.getTime() + offset * 86400000);
    const day = candidateDay.getUTCDay();
    if (!allowedDays.includes(day)) continue;
    const candidate = dateFromNairobi(
      candidateDay.getUTCFullYear(), candidateDay.getUTCMonth() + 1,
      candidateDay.getUTCDate(), hour, minute
    );
    if (candidate > from) return candidate;
  }
  return null;
};

const calculateNextRunAt = (announcement, now = new Date()) => {
  if (announcement.frequency === 'once') return announcement.scheduledAt;
  return getNextRecurringRun(announcement, now);
};

const occurrenceKey = (date) => date.toISOString();

const processDueAnnouncements = async () => {
  if (mongoose.connection.readyState !== 1) return 0;
  const now = new Date();
  let processed = 0;

  while (true) {
    const token = crypto.randomUUID();
    const announcement = await ScheduledAnnouncement.findOneAndUpdate(
      {
        enabled: true,
        nextRunAt: { $lte: now },
        $or: [
          { processingUntil: { $exists: false } },
          { processingUntil: null },
          { processingUntil: { $lte: now } },
        ],
      },
      { $set: { processingToken: token, processingUntil: new Date(now.getTime() + 10 * 60 * 1000) } },
      { new: true }
    );
    if (!announcement) break;

    const dueAt = announcement.nextRunAt;
    const key = occurrenceKey(dueAt);
    try {
      if (announcement.lastSentOccurrenceKey !== key) {
        const users = await User.find({}, '_id');
        const payload = {
          title: announcement.title,
          message: announcement.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          url: '/notifications',
          data: { eventType: 'scheduled_announcement', announcementId: announcement._id.toString(), sentAt: now.toISOString() },
        };

        await Promise.all(users.map(async (user) => {
          try {
            const result = await Notification.updateOne(
              { userId: user._id, announcementId: announcement._id, announcementOccurrenceKey: key },
              { $setOnInsert: { userId: user._id, title: announcement.title, message: announcement.message, type: 'admin_broadcast', announcementId: announcement._id, announcementOccurrenceKey: key } },
              { upsert: true }
            );
            if (result.upsertedCount > 0) await sendPushToUser({ userId: user._id, payload });
          } catch (error) {
            console.error(`Scheduled announcement failed for user ${user._id}:`, error.message);
          }
        }));
      }

      const nextRunAt = announcement.frequency === 'once' ? null : calculateNextRunAt(announcement, new Date(now.getTime() + 1000));
      await ScheduledAnnouncement.updateOne(
        { _id: announcement._id, processingToken: token },
        {
          $set: {
            lastSentAt: now,
            lastSentOccurrenceKey: key,
            nextRunAt,
            enabled: announcement.frequency === 'once' ? false : announcement.enabled,
          },
          $unset: { processingToken: 1, processingUntil: 1 },
        }
      );
      processed += 1;
    } catch (error) {
      console.error(`Scheduled announcement ${announcement._id} failed:`, error.message);
      await ScheduledAnnouncement.updateOne(
        { _id: announcement._id, processingToken: token },
        { $unset: { processingToken: 1, processingUntil: 1 } }
      );
    }
  }
  return processed;
};

module.exports = { TIME_ZONE, parseOnceDate, calculateNextRunAt, processDueAnnouncements };
