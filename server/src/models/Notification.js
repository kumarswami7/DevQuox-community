import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'message',
        'application',
        'project',
        'comment',
        'mention',
        'system',
        'team',
        'task',
        'milestone',
        'reaction',
        'repost',
      ],
      default: 'system',
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    messageRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications quickly
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
