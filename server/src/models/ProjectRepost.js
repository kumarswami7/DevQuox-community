import mongoose from 'mongoose';

const projectRepostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    commentary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Commentary cannot exceed 2000 characters'],
      default: '',
    },
    isQuote: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

projectRepostSchema.index({ user: 1, project: 1 }, { unique: true });
projectRepostSchema.index({ project: 1, createdAt: -1 });

export const ProjectRepost =
  mongoose.models.ProjectRepost || mongoose.model('ProjectRepost', projectRepostSchema);
export default ProjectRepost;

