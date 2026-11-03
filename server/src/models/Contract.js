import mongoose from 'mongoose';

const contractVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    scope: { type: String, required: true, trim: true },
    deliverables: { type: String, required: true, trim: true },
    totalAmountMinorUnits: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    paymentTerms: { type: String, trim: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposedAt: { type: Date, default: Date.now },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
    changeNote: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const acceptanceRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['client', 'developer', 'owner', 'member'], required: true },
    acceptedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client reference is required'],
      index: true,
    },
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Developer reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Contract title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    scope: {
      type: String,
      required: [true, 'Contract scope is required'],
      trim: true,
      maxlength: [4000, 'Scope description cannot exceed 4000 characters'],
    },
    deliverables: {
      type: String,
      required: [true, 'Deliverables description is required'],
      trim: true,
      maxlength: [4000, 'Deliverables cannot exceed 4000 characters'],
    },
    totalAmountMinorUnits: {
      type: Number,
      required: [true, 'Total amount in minor units is required'],
      min: [1, 'Total amount must be greater than zero'],
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'USD',
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Milestone-based release upon deliverable approval',
    },
    startDate: {
      type: Date,
    },
    expectedCompletionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_acceptance', 'active', 'completed', 'cancelled', 'disputed'],
      default: 'draft',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acceptedAt: {
      type: Date,
    },
    effectiveAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    acceptanceRecords: [acceptanceRecordSchema],
    versionHistory: [contractVersionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for convenience and backwards-compatibility
contractSchema.virtual('project').get(function () {
  return this.projectId;
});
contractSchema.virtual('client').get(function () {
  return this.clientId;
});
contractSchema.virtual('developer').get(function () {
  return this.developerId;
});
contractSchema.virtual('totalAmount').get(function () {
  return this.totalAmountMinorUnits ? this.totalAmountMinorUnits / 100 : 0;
});

// Indexes for fast project-level contract queries
contractSchema.index({ projectId: 1, status: 1 });
contractSchema.index({ clientId: 1, createdAt: -1 });
contractSchema.index({ developerId: 1, createdAt: -1 });

export const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
export default Contract;
