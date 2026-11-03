import mongoose from 'mongoose';

const projectBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectBookmarkSchema.index({ user: 1, project: 1 }, { unique: true });
projectBookmarkSchema.index({ user: 1, createdAt: -1 });

export const ProjectBookmark =
  mongoose.models.ProjectBookmark || mongoose.model('ProjectBookmark', projectBookmarkSchema);
export default ProjectBookmark;

