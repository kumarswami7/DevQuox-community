import mongoose from 'mongoose';

const projectAuditLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const ProjectAuditLog =
  mongoose.models.ProjectAuditLog || mongoose.model('ProjectAuditLog', projectAuditLogSchema);
export default ProjectAuditLog;
