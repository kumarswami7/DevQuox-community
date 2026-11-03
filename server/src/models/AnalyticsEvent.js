import mongoose from 'mongoose';

/**
 * AnalyticsEvent Schema
 *
 * Records granular interaction events across community content, projects, and creator profiles.
 * Includes automated TTL expiry (90 days) to prevent unbounded database growth, while rollups
 * are persisted in ContentAnalyticsDaily.
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'impression',
        'view',
        'click',
        'reaction',
        'comment',
        'share',
        'save',
        'apply',
        'conversion',
        'profile_visit',
        'repo_click',
        'demo_click',
      ],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'project', 'profile'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    metadata: {
      source: { type: String, default: 'feed' }, // 'feed', 'search', 'direct', 'profile', 'related'
      referrer: { type: String, default: '' },
      sharePlatform: { type: String, default: '' }, // 'linkedin', 'whatsapp', 'twitter', 'copy'
      reactionType: { type: String, default: '' },
      device: { type: String, default: 'desktop' },
      skillTags: { type: [String], default: [] },
    },
    ipHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput aggregation & deduplication
analyticsEventSchema.index({ targetId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ creatorId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ targetId: 1, actorId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ targetId: 1, sessionId: 1, eventType: 1, createdAt: -1 });

// TTL index to automatically purge raw events after 90 days (daily rollups are retained forever)
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;

