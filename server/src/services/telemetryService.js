import mongoose from 'mongoose';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { ContentAnalyticsDaily } from '../models/ContentAnalyticsDaily.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { computeRankingScore } from '../utils/rankingEngine.js';
import { emitToUser } from '../utils/socketEvents.js';

/**
 * Normalizes a date to UTC midnight for consistent daily rollups.
 */
export const getMidnightUTCDate = (d = new Date()) => {
  const dateObj = new Date(d);
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
};

/**
 * Ingests a validated interaction event into the telemetry pipeline.
 *
 * Enforces:
 * - Anti-fraud deduplication window (5 mins for impressions/views)
 * - Self-engagement filtering (creator viewing own content)
 * - Non-blocking atomic updates to ContentAnalyticsDaily
 * - Live ranking recalculation
 * - Optional WebSocket notification to creator
 */
export const recordEvent = async ({
  eventType,
  targetType,
  targetId,
  actorId = null,
  sessionId = null,
  metadata = {},
  ipHash = null,
}) => {
  if (!eventType || !targetType || !targetId) {
    return { success: false, reason: 'Missing required parameters' };
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return { success: false, reason: 'Invalid targetId format' };
  }

  const validEventTypes = [
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
  ];

  if (!validEventTypes.includes(eventType)) {
    return { success: false, reason: `Unsupported eventType: ${eventType}` };
  }

  // 1. Resolve Creator ID from Target Source
  let creatorId = null;
  let targetDoc = null;

  if (targetType === 'post') {
    targetDoc = await Post.findById(targetId).select('author impressionsCount viewsCount clicksCount upvotes commentsCount repostCount postType createdAt status isHidden');
    if (!targetDoc) return { success: false, reason: 'Target post not found' };
    creatorId = targetDoc.author;
  } else if (targetType === 'project') {
    targetDoc = await Project.findById(targetId).select('owner viewsCount uniqueViewsCount applicationsCount acceptedApplicantsCount createdAt status visibility');
    if (!targetDoc) return { success: false, reason: 'Target project not found' };
    creatorId = targetDoc.owner;
  } else {
    creatorId = targetId;
  }

  const isSelfEngagement = actorId && String(actorId) === String(creatorId);

  // 2. Anti-fraud Deduplication for Impressions & Views
  // We do not record multiple impressions/views for the same user or session within 5 minutes
  if (['impression', 'view'].includes(eventType)) {
    if (isSelfEngagement) {
      // Creator inspecting their own content should not artificially pump reach
      return { success: true, filtered: true, reason: 'Self-engagement ignored' };
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const dedupQuery = {
      targetId,
      eventType,
      createdAt: { $gte: fiveMinutesAgo },
    };

    if (actorId) {
      dedupQuery.actorId = actorId;
    } else if (sessionId) {
      dedupQuery.sessionId = sessionId;
    }

    const existingEvent = await AnalyticsEvent.findOne(dedupQuery).select('_id');
    if (existingEvent) {
      return { success: true, deduplicated: true };
    }
  }

  // 3. Persist Raw Event for Audit Trail
  const eventDoc = await AnalyticsEvent.create({
    eventType,
    targetType,
    targetId,
    creatorId,
    actorId,
    sessionId,
    metadata,
    ipHash,
  });

  // 4. Update Atomic Daily Rollup in ContentAnalyticsDaily
  const midnight = getMidnightUTCDate();
  const fieldMapping = {
    impression: 'impressions',
    view: 'views',
    click: 'clicks',
    repo_click: 'clicks',
    demo_click: 'clicks',
    reaction: 'reactions',
    comment: 'comments',
    share: 'shares',
    save: 'saves',
    apply: 'applications',
    conversion: 'conversions',
    profile_visit: 'profileVisits',
  };

  const incField = fieldMapping[eventType] || 'impressions';

  await ContentAnalyticsDaily.findOneAndUpdate(
    { targetType, targetId, date: midnight },
    {
      $setOnInsert: { creatorId },
      $inc: { [incField]: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 5. Update Target Document Lifetime Counters & Recalculate Live Ranking
  if (targetType === 'post' && targetDoc) {
    const updateOps = {};
    if (eventType === 'impression') updateOps.$inc = { impressionsCount: 1 };
    if (eventType === 'view') updateOps.$inc = { viewsCount: 1 };
    if (['click', 'repo_click', 'demo_click'].includes(eventType)) updateOps.$inc = { clicksCount: 1 };
    if (eventType === 'share') updateOps.$inc = { repostCount: 1 };

    // Increment and compute new trending score
    if (Object.keys(updateOps).length > 0) {
      const updatedPost = await Post.findByIdAndUpdate(targetId, updateOps, { new: true });
      if (updatedPost) {
        const newScore = computeRankingScore(updatedPost);
        await Post.updateOne({ _id: targetId }, { $set: { trendingScore: newScore } });
      }
    }
  } else if (targetType === 'project' && targetDoc) {
    const updateOps = {};
    if (['impression', 'view'].includes(eventType)) updateOps.$inc = { viewsCount: 1 };
    if (eventType === 'apply') updateOps.$inc = { applicationsCount: 1 };
    if (Object.keys(updateOps).length > 0) {
      await Project.findByIdAndUpdate(targetId, updateOps);
    }
  }

  // 6. Real-Time WebSocket Telemetry Dispatch to Creator
  if (creatorId && !isSelfEngagement) {
    emitToUser(creatorId, 'analytics:engagementUpdated', {
      targetId,
      targetType,
      eventType,
      timestamp: new Date().toISOString(),
    });
  }

  return { success: true, eventId: eventDoc._id };
};

/**
 * Ingests a batch of telemetry events submitted from client feeds or interaction listeners.
 */
export const batchRecordEvents = async (events = [], defaultActorId = null, ipHash = null) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { success: true, processedCount: 0 };
  }

  const bounded = events.slice(0, 100); // Max 100 events per batch
  let processedCount = 0;
  let rejectedCount = 0;

  const results = await Promise.allSettled(
    bounded.map((evt) =>
      recordEvent({
        ...evt,
        actorId: evt.actorId || defaultActorId,
        ipHash,
      })
    )
  );

  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value?.success) {
      processedCount++;
    } else {
      rejectedCount++;
    }
  });

  return { success: true, processedCount, rejectedCount };
};

export default {
  getMidnightUTCDate,
  recordEvent,
  batchRecordEvents,
};

