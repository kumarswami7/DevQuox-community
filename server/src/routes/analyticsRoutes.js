import express from 'express';
import mongoose from 'mongoose';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import {
  getCreatorOverview,
  getCreatorContent,
  getCreatorPerformanceTrends,
  getCreatorAudienceInsights,
} from '../services/analyticsService.js';
import { recordEvent, batchRecordEvents } from '../services/telemetryService.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';

export const analyticsRouter = express.Router();

/**
 * GET /api/v1/analytics/creator/overview
 * Top-level 12 KPI overview with previous-period comparison metrics.
 */
analyticsRouter.get('/creator/overview', protect, async (req, res, next) => {
  try {
    const range = req.query.range || '30d';
    const data = await getCreatorOverview(req.user._id, range);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/creator/content
 * Unified, normalized creator content stream across ideas, projects, discussions, etc.
 */
analyticsRouter.get('/creator/content', protect, async (req, res, next) => {
  try {
    const { category, search, sort, page, limit } = req.query;
    const data = await getCreatorContent(req.user._id, {
      category,
      search,
      sort,
      page,
      limit,
    });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/creator/performance & /creator/trends
 * Day-by-day time-series telemetry trends for interactive charts.
 */
analyticsRouter.get(['/creator/performance', '/creator/trends'], protect, async (req, res, next) => {
  try {
    const range = req.query.range || '30d';
    const data = await getCreatorPerformanceTrends(req.user._id, range);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/creator/audience
 * Audience engineering profile insights and skills distribution.
 */
analyticsRouter.get('/creator/audience', protect, async (req, res, next) => {
  try {
    const data = await getCreatorAudienceInsights(req.user._id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/content/:id
 * Single content performance inspector deep dive.
 */
analyticsRouter.get('/content/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid content ID' });
    }

    const [post, project] = await Promise.all([
      Post.findById(req.params.id)
        .populate('convertedToProject', 'title category status budget owner')
        .lean(),
      Project.findById(req.params.id)
        .populate('originIdeaPost', 'title postType')
        .lean(),
    ]);

    const item = post || project;
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Security: Only author or admin can view deep creator analytics
    const authorId = post ? String(post.author) : String(project.owner);
    const isOwner = authorId === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view deep analytics for this content',
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/content/:id/comments
 * Inspect feedback reviews & comments left by developers on a piece of content.
 */
analyticsRouter.get('/content/:id/comments', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const comments = await Comment.find({
      $or: [{ post: req.params.id }, { project: req.params.id }],
      isDeleted: { $ne: true },
    })
      .populate('author', 'name username email avatar avatarUrl headline role')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/analytics/events/batch
 * High-throughput batch telemetry ingestion for visibility impressions, clicks, shares.
 */
analyticsRouter.post('/events/batch', optionalAuth, async (req, res, next) => {
  try {
    const { events } = req.body;
    const actorId = req.user?._id || null;
    const ipHash = req.ip || null;

    const result = await batchRecordEvents(events, actorId, ipHash);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/analytics/convert-idea
 * Converts an eligible idea pitch into a full project and permanently records the link.
 */
analyticsRouter.post('/convert-idea', protect, async (req, res, next) => {
  try {
    const { ideaId, projectId } = req.body;
    if (!ideaId || !projectId) {
      return res.status(400).json({ success: false, message: 'ideaId and projectId are required' });
    }

    const [idea, project] = await Promise.all([
      Post.findById(ideaId),
      Project.findById(projectId),
    ]);

    if (!idea || !project) {
      return res.status(404).json({ success: false, message: 'Idea or Project not found' });
    }

    if (String(idea.author) !== String(req.user._id) || String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only author can convert idea to project' });
    }

    idea.convertedToProject = project._id;
    if (idea.ideaDetails) {
      idea.ideaDetails.status = 'converted';
    }
    await idea.save();

    project.originIdeaPost = idea._id;
    await project.save();

    // Record conversion event in telemetry
    await recordEvent({
      eventType: 'conversion',
      targetType: 'post',
      targetId: idea._id,
      actorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Idea successfully converted to project',
      idea,
      project,
    });
  } catch (err) {
    next(err);
  }
});

export default analyticsRouter;

