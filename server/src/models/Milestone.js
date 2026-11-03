import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      minlength: [2, 'Milestone title must be at least 2 characters'],
      maxlength: [120, 'Milestone title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Milestone description cannot exceed 2000 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Milestone creator reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled', 'pending', 'paid'],
      default: 'upcoming',
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
    deliverables: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Deliverable title cannot exceed 200 characters'],
      },
    ],
    order: {
      type: Number,
      default: 1,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Compatibility fields with financial milestones
    amount: {
      type: Number,
      default: 0,
    },
    financialMilestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialMilestone',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual indicating overdue derived state
milestoneSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'completed' && this.status !== 'cancelled';
});

milestoneSchema.pre('validate', function (next) {
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate('dueDate', 'Milestone due date cannot be earlier than start date');
  }

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

milestoneSchema.index({ project: 1, status: 1 });
milestoneSchema.index({ project: 1, isDeleted: 1 });
milestoneSchema.index({ project: 1, dueDate: 1 });
milestoneSchema.index({ project: 1, order: 1 });

export const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
export default Milestone;
