import mongoose from 'mongoose';

const developerBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

developerBookmarkSchema.index({ user: 1, developer: 1 }, { unique: true });

export const DeveloperBookmark =
  mongoose.models.DeveloperBookmark || mongoose.model('DeveloperBookmark', developerBookmarkSchema);
export default DeveloperBookmark;
