import express from 'express';
import { Notification } from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

export const notificationRouter = express.Router();

/**
 * GET /api/v1/notifications/unread-count
 * Returns total count of unread notifications for authenticated caller.
 */
notificationRouter.get('/unread-count', protect, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/notifications
 * Paginated notifications list for the logged-in user.
 */
notificationRouter.get('/', protect, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name username email avatar avatarUrl role')
        .populate('project', 'title category status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      data: notifications, // backwards compatibility
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Reusable handler for marking single notification as read
 */
const handleMarkRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    ).populate('sender', 'name username email avatar avatarUrl role');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

notificationRouter.patch('/:id/read', protect, handleMarkRead);
notificationRouter.put('/:id/read', protect, handleMarkRead);

/**
 * PATCH /read-all
 * Mark all notifications as read for current user
 */
const handleMarkAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
};

notificationRouter.patch('/read-all', protect, handleMarkAllRead);
notificationRouter.put('/read-all', protect, handleMarkAllRead);

export default notificationRouter;
