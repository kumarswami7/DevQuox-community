import mongoose from 'mongoose';

/**
 * ContentAnalyticsDaily Schema
 *
 * Daily aggregated rollup of performance telemetry per content item and creator.
 * Enables instantaneous date-range analytics (7d, 30d, 90d, 6m, 12m) without
 * computing expensive aggregations over millions of raw events on every dashboard render.
 */
const contentAnalyticsDailySchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      required: true,
      enum: ['post', 'project'],
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
    date: {
      type: Date,
      required: true,
      index: true, // Normalized UTC midnight timestamp: new Date(Date.UTC(y, m, d))
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViewers: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    reactions: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
    saves: {
      type: Number,
      default: 0,
      min: 0,
    },
    applications: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0,
    },
    profileVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique rollup per target per calendar day
contentAnalyticsDailySchema.index({ targetType: 1, targetId: 1, date: 1 }, { unique: true });

// High-speed index for creator time-series trends and date-range slicing
contentAnalyticsDailySchema.index({ creatorId: 1, date: 1 });

export const ContentAnalyticsDaily =
  mongoose.models.ContentAnalyticsDaily ||
  mongoose.model('ContentAnalyticsDaily', contentAnalyticsDailySchema);

export default ContentAnalyticsDaily;

