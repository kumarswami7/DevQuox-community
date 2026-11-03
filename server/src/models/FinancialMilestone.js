import mongoose from 'mongoose';

const financialMilestoneSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract reference is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    deliverables: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Deliverable cannot exceed 200 characters'],
      },
    ],
    amountMinorUnits: {
      type: Number,
      required: [true, 'Amount in minor units is required'],
      min: [1, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'USD',
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    // Distinct separation: Work Progress vs Payment Progress
    workStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'revision_requested', 'approved'],
      default: 'pending',
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['not_funded', 'pending', 'paid', 'failed', 'refunded', 'disputed'],
      default: 'not_funded',
      required: true,
      index: true,
    },
    // Legacy status for backwards compatibility
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'paid', 'disputed'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    // Submission details from developer
    submissionDetails: {
      text: { type: String, trim: true, default: '' },
      links: [{ type: String, trim: true }],
      submittedAt: { type: Date },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    // Review details from client
    reviewDetails: {
      action: { type: String, enum: ['approve', 'request_revision'] },
      feedback: { type: String, trim: true, default: '' },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    // Legacy fields maintained
    submittedAt: { type: Date },
    submissionNote: { type: String },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    paymentReference: { type: String, trim: true },
    providerCheckoutId: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Decimal-safe amount virtual
financialMilestoneSchema.virtual('amount').get(function () {
  return this.amountMinorUnits ? this.amountMinorUnits / 100 : 0;
});

// Pre-save hook: keep legacy status in sync
financialMilestoneSchema.pre('save', function (next) {
  if (this.paymentStatus === 'paid') {
    this.status = 'paid';
  } else if (this.workStatus === 'approved') {
    this.status = 'approved';
  } else if (this.workStatus === 'submitted') {
    this.status = 'submitted';
  } else if (this.workStatus === 'in_progress') {
    this.status = 'in_progress';
  }
  next();
});

// Indexes
financialMilestoneSchema.index({ contractId: 1, order: 1 });
financialMilestoneSchema.index({ projectId: 1, paymentStatus: 1 });
financialMilestoneSchema.index({ projectId: 1, workStatus: 1 });

export const FinancialMilestone =
  mongoose.models.FinancialMilestone ||
  mongoose.model('FinancialMilestone', financialMilestoneSchema);

export default FinancialMilestone;
