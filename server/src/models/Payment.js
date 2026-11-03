import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
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
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer reference is required'],
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    provider: {
      type: String,
      default: 'stripe',
      required: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    providerCheckoutId: {
      type: String,
      sparse: true,
      index: true,
    },
    // Authoritative integer cents/paise to avoid floating-point errors
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      uppercase: true,
      default: 'USD',
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'disputed'],
      default: 'created',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    paymentMethodType: {
      type: String,
      default: 'card',
    },
    failureCode: {
      type: String,
    },
    failureMessage: {
      type: String,
    },
    succeededAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundId: {
      type: String,
    },
    refundAmountMinorUnits: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases
paymentSchema.virtual('payer').get(function () {
  return this.payerId;
});
paymentSchema.virtual('recipient').get(function () {
  return this.recipientId;
});
paymentSchema.virtual('project').get(function () {
  return this.projectId;
});
paymentSchema.virtual('milestone').get(function () {
  return this.milestoneId;
});
paymentSchema.virtual('providerSessionId').get(function () {
  return this.providerCheckoutId || this.providerPaymentId;
});

// Compound indexes
paymentSchema.index({ projectId: 1, status: 1 });
paymentSchema.index({ payerId: 1, createdAt: -1 });
paymentSchema.index({ recipientId: 1, createdAt: -1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
