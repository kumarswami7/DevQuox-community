import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follow relationships between the same pair
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema);
export default Follow;
