import { Notification } from '../models/Notification.js';

export const sendNotification = async ({
  recipient,
  sender,
  type = 'system',
  title = '',
  message,
  link = '',
  project,
  conversation,
  messageRef,
}) => {
  try {
    if (!recipient) return null;
    // Don't notify self
    if (sender && String(recipient) === String(sender)) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      project,
      conversation,
      messageRef,
      read: false,
    });

    const populated = await Notification.findById(notification._id).populate(
      'sender',
      'name email avatar avatarUrl role'
    );

    // Real-time dispatch via Socket.IO if available
    const io = global.io;
    if (io) {
      const recipientStr = String(recipient);
      // Emit to both user:<id> and <id> rooms for maximum client compatibility
      io.to(`user:${recipientStr}`).emit('notification:new', populated);
      io.to(recipientStr).emit('notification:new', populated);
      io.to(recipientStr).emit('notification', populated);

      // Also push new unread count
      Notification.countDocuments({ recipient, read: false }).then((unreadCount) => {
        io.to(`user:${recipientStr}`).emit('notification:unread_count', { count: unreadCount });
        io.to(recipientStr).emit('notification:unread_count', { count: unreadCount });
      }).catch(() => {});
    }

    return populated;
  } catch (err) {
    // Notifications should not interrupt primary transactional operations
    console.error('[Notification] Failed to create notification:', err.message);
    return null;
  }
};

export default sendNotification;
