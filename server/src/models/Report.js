import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user', 'project'],
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'hate_speech', 'inappropriate', 'misleading', 'other'],
      required: [true, 'Report reason is required'],
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [500, 'Explanation cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
      default: 'pending',
      required: true,
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'hidden', 'deleted', 'warned'],
      default: 'none',
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    moderatorNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Moderator notes cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

reportSchema.index(
  { reporterId: 1, targetType: 1, targetId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetId: 1, targetType: 1 });

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
