import mongoose from 'mongoose';
import { Conversation } from './Conversation.js';

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
      default: 'attachment',
    },
    fileType: {
      type: String,
      trim: true,
      default: 'file',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [4000, 'Message content cannot exceed 4000 characters'],
      default: '',
    },
    attachments: [attachmentSchema],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedForMe: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    read: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validation: Require content unless valid attachments are attached
messageSchema.pre('validate', function (next) {
  const hasText = this.content && this.content.trim().length > 0;
  const hasAttachments = Array.isArray(this.attachments) && this.attachments.length > 0;

  if (!hasText && !hasAttachments && !this.isDeleted) {
    this.invalidate('content', 'Message must contain either text content or an attachment');
  }
  next();
});

// Compound indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export { Conversation };
export default Message;
