import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      index: true,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialMilestone',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Dispute description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    evidence: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['opened', 'under_review', 'resolved', 'dismissed'],
      default: 'opened',
      required: true,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionOutcome: {
      type: String,
      enum: ['refund_issued', 'milestone_released', 'compromise_reached', 'claim_rejected', 'pending'],
      default: 'pending',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

disputeSchema.index({ projectId: 1, status: 1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });

export const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
export default Dispute;
