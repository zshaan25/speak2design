import Notification from '../models/Notification.js';

// Reusable helper — call from any controller to record an activity notification.
// Never throws into the caller; a failed notification must not break the action.
export const createNotification = async (userId, { type = 'info', title, message = '' }) => {
  try {
    if (!userId || !title) return null;
    return await Notification.create({ user: userId, type, title, message });
  } catch (err) {
    console.warn('>>> createNotification failed:', err.message);
    return null;
  }
};

// GET /api/notifications — latest 30 for the logged-in user + unread count.
export const listNotifications = async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    return res.status(200).json({ success: true, notifications: items, unread });
  } catch (err) {
    console.error('>>> listNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

// PATCH /api/notifications/read-all — mark every notification read.
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('>>> markAllRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};

// DELETE /api/notifications — clear all for the user.
export const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('>>> clearNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to clear notifications.' });
  }
};
