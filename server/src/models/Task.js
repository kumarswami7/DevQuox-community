import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Task title must be at least 2 characters'],
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [3000, 'Task description cannot exceed 3000 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator reference is required'],
      index: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'completed', 'blocked'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
      index: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedEffort: {
      type: Number,
      min: [0, 'Estimated effort cannot be negative'],
      max: [1000, 'Estimated effort cannot exceed 1000 hours'],
    },
    labels: [
      {
        type: String,
        trim: true,
        maxlength: [30, 'Label cannot exceed 30 characters'],
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters'],
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for single assignee compatibility
taskSchema.virtual('assignee').get(function () {
  return this.assignees && this.assignees.length > 0 ? this.assignees[0] : null;
});

// Normalize assignees, dates, and completion status
taskSchema.pre('validate', function (next) {
  // Deduplicate assignees and limit to 10
  if (this.assignees && Array.isArray(this.assignees)) {
    const seen = new Set();
    const unique = [];
    for (const a of this.assignees) {
      if (!a) continue;
      const str = String(a._id || a);
      if (!seen.has(str)) {
        seen.add(str);
        unique.push(a);
      }
    }
    this.assignees = unique.slice(0, 10);
  }

  // Validate dates
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate('dueDate', 'Due date cannot be earlier than start date');
  }

  // Handle completion timestamp
  if (this.status === 'completed') {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.completedAt = null;
    this.completedBy = null;
  }

  next();
});

// Compound indexes for performant query patterns
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, milestone: 1 });
taskSchema.index({ project: 1, isDeleted: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
taskSchema.index({ assignees: 1 });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;
