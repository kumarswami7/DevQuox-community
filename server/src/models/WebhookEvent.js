import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'stripe',
      required: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const WebhookEvent =
  mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;
