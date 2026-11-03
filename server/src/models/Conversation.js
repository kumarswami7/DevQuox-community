import mongoose from 'mongoose';

const readStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['project', 'direct'],
      default: 'direct',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Conversation title cannot exceed 150 characters'],
      default: '',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      text: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    // Backwards-compatible legacy fields
    lastMessageDate: {
      type: Date,
      default: Date.now,
    },
    readState: [readStateSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
// Prevent duplicate conversations for the same project
conversationSchema.index({ project: 1 }, { unique: true, sparse: true });
// Fast query for user's conversations
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
