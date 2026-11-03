import mongoose from 'mongoose';

const projectActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor user reference is required'],
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    targetMilestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      enum: [
        'project_created',
        'application_submitted',
        'application_accepted',
        'application_rejected',
        'application_withdrawn',
        'member_joined',
        'member_left',
        'member_removed',
        'role_updated',
        'status_changed',
        'project_settings_updated',
        'task_created',
        'task_updated',
        'task_assigned',
        'task_reassigned',
        'task_unassigned',
        'task_status_changed',
        'task_moved_milestone',
        'task_deleted',
        'task_reopened',
        'milestone_created',
        'milestone_updated',
        'milestone_status_changed',
        'milestone_completed',
        'milestone_deleted',
      ],
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

projectActivitySchema.index({ project: 1, createdAt: -1 });

export const ProjectActivity =
  mongoose.models.ProjectActivity || mongoose.model('ProjectActivity', projectActivitySchema);
export default ProjectActivity;
