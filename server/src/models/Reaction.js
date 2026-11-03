import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'project'],
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    reactionType: {
      type: String,
      enum: ['like', 'celebrate', 'support', 'insightful', 'curious'],
      default: 'like',
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.index(
  { userId: 1, targetType: 1, targetId: 1, reactionType: 1 },
  { unique: true }
);

reactionSchema.index({ targetId: 1, targetType: 1 });

export const Reaction = mongoose.models.Reaction || mongoose.model('Reaction', reactionSchema);
export default Reaction;
