import mongoose from 'mongoose';

const VALID_APPLICATION_STATUS_TRANSITIONS = {
  pending: ['under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
  under_review: ['shortlisted', 'accepted', 'rejected', 'withdrawn'],
  shortlisted: ['accepted', 'rejected', 'withdrawn'],
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
    rateType: {
      type: String,
      enum: ['fixed', 'hourly', 'per_milestone'],
      default: 'fixed',
    },
    estimatedDuration: {
      type: String,
      trim: true,
      default: '',
    },
    relevantRole: {
      type: String,
      trim: true,
      default: 'Developer',
    },
    relevantSkills: {
      type: [String],
      default: [],
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    relevantExperience: {
      type: String,
      trim: true,
      maxlength: [2000, 'Experience summary cannot exceed 2000 characters'],
      default: '',
    },
    availability: {
      type: String,
      trim: true,
      default: 'immediate',
    },
    proposalAttachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        size: { type: Number, default: 0 },
        type: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    decisionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Decision notes cannot exceed 1000 characters'],
      default: '',
    },
    underReviewAt: {
      type: Date,
    },
    shortlistedAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    withdrawnAt: {
      type: Date,
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
