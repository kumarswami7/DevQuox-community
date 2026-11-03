import mongoose from 'mongoose';

const projectViewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    ipHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

projectViewSchema.index({ project: 1, viewer: 1, createdAt: -1 });
projectViewSchema.index({ project: 1, sessionId: 1, createdAt: -1 });

export const ProjectView =
  mongoose.models.ProjectView || mongoose.model('ProjectView', projectViewSchema);
export default ProjectView;

