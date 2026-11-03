import mongoose from 'mongoose';

const VALID_APPLICATION_STATUS_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['withdrawn'],
  rejected: [],
  withdrawn: [],
};

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
      default: '',
    },
    proposedRate: {
      type: String,
      trim: true,
      maxlength: [100, 'Proposed rate cannot exceed 100 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    decisionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Decision notes cannot exceed 1000 characters'],
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicantSnapshot: {
      name: { type: String, default: '' },
      username: { type: String, default: '' },
      headline: { type: String, default: '' },
      avatar: { type: String, default: '' },
      skills: { type: [String], default: [] },
    },
    resumeUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Sync legacy fields
applicationSchema.pre('validate', function (next) {
  if (this.project && !this.projectId) this.projectId = this.project;
  if (this.applicant && !this.applicantId) this.applicantId = this.applicant;
  next();
});

// Compound unique index ensuring one application per user per project
applicationSchema.index({ project: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ project: 1, status: 1 });

// Method to validate status transitions
applicationSchema.methods.canTransitionTo = function (nextStatus) {
  if (this.status === nextStatus) return true;
  const allowed = VALID_APPLICATION_STATUS_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

export { VALID_APPLICATION_STATUS_TRANSITIONS };
export const Application =
  mongoose.models.Application || mongoose.model('Application', applicationSchema);
export default Application;
