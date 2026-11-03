import express from 'express';
import mongoose from 'mongoose';
import { Community } from '../models/Community.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

export const communityRouter = express.Router();
export const moderationRouter = express.Router();

// ── Helper: Safe Regex Escaping ─────────────────────────────────────────────
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ── Helper: Enrich Post with User-Specific Reactions & Permissions ──────────
const enrichPost = (postDoc, currentUser) => {
  const post = postDoc.toObject ? postDoc.toObject() : { ...postDoc };
  const currentUserId = currentUser?._id ? String(currentUser._id) : null;

  const hasLiked = currentUserId && Array.isArray(post.likes)
    ? post.likes.some((id) => String(id?._id || id) === currentUserId)
    : false;

  const isSaved = currentUserId && Array.isArray(post.savedBy)
    ? post.savedBy.some((id) => String(id?._id || id) === currentUserId)
    : false;

  const isReposted = currentUserId && Array.isArray(post.repostedBy)
    ? post.repostedBy.some((id) => String(id?._id || id) === currentUserId)
    : false;

  const likeCount = Array.isArray(post.likes) ? post.likes.length : (post.upvotes || 0);
  const commentCount = typeof post.commentsCount === 'number' ? post.commentsCount : 0;
  const isHidden = Boolean(post.isHidden || post.status === 'hidden');

  return {
    ...post,
    hasLiked,
    hasReacted: hasLiked,
    userReaction: hasLiked ? 'like' : null,
    isSaved,
    isReposted,
    likeCount,
    upvotes: likeCount,
    commentCount,
    commentsCount: commentCount,
    reactionCounts: {
      like: likeCount,
    },
    isPinned: Boolean(post.isPinned),
    isHidden,
    status: isHidden ? 'hidden' : (post.status || 'active'),
    impressionsCount: typeof post.impressionsCount === 'number' ? post.impressionsCount : 0,
    viewsCount: typeof post.viewsCount === 'number' ? post.viewsCount : 0,
    clicksCount: typeof post.clicksCount === 'number' ? post.clicksCount : 0,
    trendingScore: typeof post.trendingScore === 'number' ? post.trendingScore : 0,
  };
};

// ── Helper: Recursively Collect Descendant Comment IDs ─────────────────────
const getDescendantCommentIds = async (parentCommentId) => {
  const allIds = [parentCommentId];
  const queue = [parentCommentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await Comment.find({ parentComment: currentId }).select('_id');
    for (const child of children) {
      allIds.push(child._id);
      queue.push(child._id);
    }
  }

  return allIds;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMMUNITIES / ENGINEERING CIRCLES ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities - List all technology circles
communityRouter.get(['/', '/hubs', '/guilds'], async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const filter = {};

    if (category && category !== 'All Hubs') {
      const catRegex = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
      filter.$or = [{ category: catRegex }, { categories: catRegex }];
    }

    if (q && q.trim()) {
      const qRegex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = filter.$or || [];
      filter.$or.push({ name: qRegex }, { description: qRegex });
    }

    const communities = await Community.find(filter)
      .populate('createdBy', 'name username avatar avatarUrl role')
      .sort({ membersCount: -1, createdAt: -1 });

    return res.status(200).json(communities);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/communities - Create a new community circle
communityRouter.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, category, categories, icon, banner } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    const cleanName = name.trim();
    if (cleanName.length < 3) {
      return res.status(400).json({ success: false, message: 'Community name must be at least 3 characters' });
    }

    const resolvedCategory = category || (Array.isArray(categories) && categories[0]) || 'General';
    const resolvedCategories = Array.isArray(categories) && categories.length > 0 ? categories : [resolvedCategory];

    const community = await Community.create({
      name: cleanName,
      description: description ? description.trim() : 'Community hub for developers and creators.',
      category: resolvedCategory,
      categories: resolvedCategories,
      icon: icon || '',
      banner: banner || '',
      createdBy: req.user._id,
      members: [req.user._id],
      membersCount: 1,
    });

    return res.status(201).json({ success: true, data: community });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A community with this name already exists' });
    }
    next(err);
  }
});

// POST /api/v1/communities/:id/join - Join or leave community circle atomically
communityRouter.post(['/:id/join', '/hubs/:id/join', '/guilds/:id/join'], protect, async (req, res, next) => {
  try {
    const communityId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ success: false, message: 'Invalid community ID' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const userId = req.user._id;
    const isMember = community.members.some((m) => String(m) === String(userId));

    let updated;
    if (isMember) {
      updated = await Community.findByIdAndUpdate(
        communityId,
        { $pull: { members: userId } },
        { new: true }
      );
    } else {
      updated = await Community.findByIdAndUpdate(
        communityId,
        { $addToSet: { members: userId } },
        { new: true }
      );
    }

    updated.membersCount = updated.members.length;
    await updated.save();

    return res.status(200).json({
      success: true,
      joined: !isMember,
      membersCount: updated.membersCount,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DISCUSSIONS & FEED POSTS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/community/posts or /api/v1/communities/posts
communityRouter.get(['/posts', '/feed'], optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { sort, postType, tag, q, author, user, userId } = req.query;

    const filter = {};

    // Filter by author / creator if provided
    const authorParam = author || user || userId;
    if (authorParam && mongoose.Types.ObjectId.isValid(authorParam)) {
      filter.author = new mongoose.Types.ObjectId(authorParam);
    }

    // 1. Policy: Exclude hidden content from public feed unless requester is an admin/moderator
    const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'moderator');
    if (!isStaff) {
      filter.status = { $ne: 'hidden' };
      filter.isHidden = { $ne: true };
    }

    // 2. Post Type filter
    if (postType && postType !== 'all') {
      const typeLower = postType.toLowerCase().trim();
      if (typeLower === 'tutorial') {
        filter.postType = { $in: ['tutorial', 'knowledge', 'article'] };
      } else if (typeLower === 'knowledge') {
        filter.postType = { $in: ['knowledge', 'tutorial', 'article'] };
      } else {
        filter.postType = typeLower;
      }
    }

    // 3. Tag filter
    if (tag && tag.trim()) {
      const cleanTag = tag.trim().replace(/^#/, '');
      filter.tags = new RegExp(`^${escapeRegex(cleanTag)}$`, 'i');
    }

    // 4. Safe full-text search
    if (q && q.trim()) {
      const qRegex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [
        { title: qRegex },
        { content: qRegex },
        { tags: qRegex },
      ];
    }

    // 5. Clearly Defined Sorting Semantics
    let sortCriteria = { isPinned: -1, createdAt: -1 };

    if (sort === 'popular') {
      // Popular: Total engagement metric = commentsCount * 2 + upvotes
      sortCriteria = { isPinned: -1, commentsCount: -1, upvotes: -1, createdAt: -1 };
    } else if (sort === 'trending' || sort === 'algorithm') {
      // Trending (LinkedIn Algorithm): High engagement velocity + impressions + upvotes
      sortCriteria = { isPinned: -1, trendingScore: -1, commentsCount: -1, upvotes: -1, impressionsCount: -1, createdAt: -1 };
    } else if (sort === 'unanswered') {
      // Unanswered: Zero comments with newest first
      filter.commentsCount = 0;
      sortCriteria = { isPinned: -1, createdAt: -1 };
    } else {
      // Default: Latest (newest posts first)
      sortCriteria = { isPinned: -1, createdAt: -1 };
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner')
      .populate('originalPost', 'title content author')
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit);

    const enriched = posts.map((p) => enrichPost(p, req.user));

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/community/posts/saved - List saved posts for authenticated user
communityRouter.get(['/posts/saved', '/saved'], protect, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {
      savedBy: req.user._id,
      status: { $ne: 'hidden' },
      isHidden: { $ne: true },
    };

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const enriched = posts.map((p) => enrichPost(p, req.user));

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/community/posts/my-history - List author's pitched ideas and posts with LinkedIn-style impressions analytics
communityRouter.get(['/posts/my-history', '/my-posts'], protect, async (req, res, next) => {
  try {
    const filter = {
      author: req.user._id,
      status: { $ne: 'hidden' },
    };

    const posts = await Post.find(filter)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner')
      .sort({ createdAt: -1 });

    const enriched = posts.map((p) => enrichPost(p, req.user));

    const totalImpressions = enriched.reduce((acc, p) => acc + (p.impressionsCount || 0), 0);
    const totalViews = enriched.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalClicks = enriched.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
    const totalUpvotes = enriched.reduce((acc, p) => acc + (p.upvotes || 0), 0);
    const totalComments = enriched.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        posts: enriched,
        stats: {
          totalPosts: enriched.length,
          ideasCount: enriched.filter((p) => p.postType === 'idea' || p.ideaDetails).length,
          convertedCount: enriched.filter((p) => p.convertedToProject).length,
          totalImpressions,
          totalViews,
          totalClicks,
          totalUpvotes,
          totalComments,
          averageEngagementRate:
            totalImpressions > 0
              ? (((totalUpvotes + totalComments + totalClicks) / totalImpressions) * 100).toFixed(1) + '%'
              : '0%',
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/community/posts/:id - Single post retrieval
communityRouter.get('/posts/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner')
      .populate('originalPost', 'title content author');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Hide protection
    const isAuthor = req.user && String(post.author?._id || post.author) === String(req.user._id);
    const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'moderator');
    if ((post.isHidden || post.status === 'hidden') && !isAuthor && !isStaff) {
      return res.status(404).json({ success: false, message: 'This post is no longer available' });
    }

    return res.status(200).json({
      success: true,
      data: enrichPost(post, req.user),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/impression - Record impression / view (LinkedIn algorithm telemetry)
communityRouter.post('/posts/:id/impression', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.impressionsCount = (post.impressionsCount || 0) + 1;

    if (req.user && req.user._id) {
      const uid = String(req.user._id);
      post.uniqueViewers = post.uniqueViewers || [];
      const already = post.uniqueViewers.some((v) => String(v) === uid);
      if (!already) {
        post.uniqueViewers.push(req.user._id);
        post.viewsCount = (post.viewsCount || 0) + 1;
      }
    } else {
      post.viewsCount = (post.viewsCount || 0) + 1;
    }

    // LinkedIn Algorithm Score calculation
    const upvotes = post.upvotes || 0;
    const comments = post.commentsCount || 0;
    const clicks = post.clicksCount || 0;
    const impressions = post.impressionsCount || 0;
    const hoursSince = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    const recencyBoost = Math.max(0, 50 - hoursSince * 0.5);

    post.trendingScore = impressions * 0.2 + upvotes * 4.0 + comments * 6.0 + clicks * 2.0 + recencyBoost;

    await post.save();

    return res.status(200).json({
      success: true,
      impressionsCount: post.impressionsCount,
      viewsCount: post.viewsCount,
      trendingScore: post.trendingScore,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/click - Record engagement link / action click
communityRouter.post('/posts/:id/click', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.clicksCount = (post.clicksCount || 0) + 1;

    // Recalculate algorithm score
    const upvotes = post.upvotes || 0;
    const comments = post.commentsCount || 0;
    const clicks = post.clicksCount || 0;
    const impressions = post.impressionsCount || 0;
    const hoursSince = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    const recencyBoost = Math.max(0, 50 - hoursSince * 0.5);

    post.trendingScore = impressions * 0.2 + upvotes * 4.0 + comments * 6.0 + clicks * 2.0 + recencyBoost;

    await post.save();

    return res.status(200).json({
      success: true,
      clicksCount: post.clicksCount,
      trendingScore: post.trendingScore,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts - Create post
communityRouter.post('/posts', protect, async (req, res, next) => {
  try {
    const { title, content, postType, tags, mediaUrls, links, projectRef, ideaDetails, convertedToProject } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 10000) {
      return res.status(400).json({ success: false, message: 'Content exceeds 10,000 characters limit' });
    }

    const cleanTitle = title ? title.trim().slice(0, 200) : '';

    // Normalize tags: deduplicate, lowercase, strip '#', limit to 10
    let cleanTags = [];
    if (Array.isArray(tags)) {
      cleanTags = [...new Set(tags.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean))].slice(0, 10);
    }

    // Validate media URLs
    const cleanMedia = Array.isArray(mediaUrls)
      ? mediaUrls.filter((u) => typeof u === 'string' && u.trim().startsWith('http')).slice(0, 5)
      : [];

    // Validate links
    const cleanLinks = Array.isArray(links)
      ? links.filter((l) => l && typeof l.url === 'string' && l.url.trim().startsWith('http')).slice(0, 5)
      : [];

    const allowedTypes = [
      'discussion',
      'showcase',
      'question',
      'article',
      'general',
      'knowledge',
      'collaboration',
      'career',
      'tutorial',
      'idea',
    ];
    const resolvedPostType = allowedTypes.includes(postType) ? postType : 'discussion';

    const rawAttachments = Array.isArray(ideaDetails?.attachments)
      ? ideaDetails.attachments
      : Array.isArray(req.body.attachments)
      ? req.body.attachments
      : [];

    const cleanAttachments = rawAttachments
      .filter((a) => a && (typeof a.url === 'string' || typeof a.dataUrl === 'string'))
      .slice(0, 5)
      .map((a) => ({
        name: typeof a.name === 'string' ? a.name.slice(0, 100) : 'attachment',
        url: a.url || a.dataUrl || '',
        fileType: a.fileType || 'document',
        size: typeof a.size === 'number' ? a.size : 0,
      }));

    const cleanIdeaDetails = ideaDetails && typeof ideaDetails === 'object'
      ? {
          targetAudience: typeof ideaDetails.targetAudience === 'string' ? ideaDetails.targetAudience.trim() : '',
          estimatedBudget: typeof ideaDetails.estimatedBudget === 'string' ? ideaDetails.estimatedBudget.trim() : '',
          rolesNeeded: Array.isArray(ideaDetails.rolesNeeded)
            ? ideaDetails.rolesNeeded.map((r) => String(r).trim()).filter(Boolean)
            : [],
          feedbackQuestions: Array.isArray(ideaDetails.feedbackQuestions)
            ? ideaDetails.feedbackQuestions.map((q) => String(q).trim()).filter(Boolean)
            : [],
          attachments: cleanAttachments,
          status: ideaDetails.status || 'seeking_feedback',
        }
      : undefined;

    const post = await Post.create({
      author: req.user._id,
      title: cleanTitle,
      content: cleanContent,
      postType: resolvedPostType,
      tags: cleanTags,
      mediaUrls: cleanMedia,
      links: cleanLinks,
      attachments: cleanAttachments,
      projectRef: projectRef && mongoose.Types.ObjectId.isValid(projectRef) ? projectRef : undefined,
      ideaDetails: cleanIdeaDetails,
      convertedToProject: convertedToProject && mongoose.Types.ObjectId.isValid(convertedToProject) ? convertedToProject : undefined,
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner');

    return res.status(201).json({
      success: true,
      data: enrichPost(populated, req.user),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/community/posts/:id or PUT /api/v1/community/posts/:id - Update post
const updatePostHandler = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAuthor = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update this post' });
    }

    const { title, content, postType, tags, mediaUrls, links, ideaDetails, convertedToProject } = req.body;

    if (content !== undefined) {
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
      }
      post.content = content.trim();
    }

    if (title !== undefined) {
      post.title = title.trim().slice(0, 200);
    }

    if (postType !== undefined) {
      post.postType = postType;
    }

    if (ideaDetails !== undefined && typeof ideaDetails === 'object') {
      post.ideaDetails = {
        ...(post.ideaDetails?.toObject ? post.ideaDetails.toObject() : post.ideaDetails || {}),
        ...ideaDetails,
      };
    }

    if (convertedToProject !== undefined) {
      post.convertedToProject = convertedToProject && mongoose.Types.ObjectId.isValid(convertedToProject)
        ? convertedToProject
        : null;
    }

    if (Array.isArray(tags)) {
      post.tags = [...new Set(tags.map((t) => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean))].slice(0, 10);
    }

    if (Array.isArray(mediaUrls)) {
      post.mediaUrls = mediaUrls.filter((u) => typeof u === 'string' && u.trim().startsWith('http')).slice(0, 5);
    }

    if (Array.isArray(links)) {
      post.links = links.filter((l) => l && typeof l.url === 'string' && l.url.trim().startsWith('http')).slice(0, 5);
    }

    post.isEdited = true;
    await post.save();

    const updated = await Post.findById(post._id)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner');

    return res.status(200).json({
      success: true,
      data: enrichPost(updated, req.user),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/community/posts/:id/convert-to-project - Link idea post to an official project
communityRouter.post('/posts/:id/convert-to-project', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { projectId } = req.body;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    post.convertedToProject = project._id;
    post.projectRef = project._id;
    if (!post.ideaDetails) post.ideaDetails = {};
    post.ideaDetails.status = 'converted';
    await post.save();

    // Link project back to origin idea post
    project.originIdeaPost = post._id;
    await project.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .populate('projectRef', 'title category')
      .populate('convertedToProject', 'title category status budget owner');

    return res.status(200).json({
      success: true,
      message: 'Idea successfully converted into official project!',
      data: enrichPost(populated, req.user),
    });
  } catch (err) {
    next(err);
  }
});

communityRouter.patch('/posts/:id', protect, updatePostHandler);
communityRouter.put('/posts/:id', protect, updatePostHandler);

// DELETE /api/v1/community/posts/:id - Delete post and cascade delete attached comments and reports
communityRouter.delete('/posts/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAuthor = String(post.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    await Report.deleteMany({ targetType: 'post', targetId: req.params.id });

    return res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully',
      deletedPostId: req.params.id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/reactions - Toggle like reaction atomically
communityRouter.post('/posts/:id/reactions', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    if (!Array.isArray(post.likes)) post.likes = [];

    const hasLiked = post.likes.some((l) => String(l) === String(userId));

    if (hasLiked) {
      post.likes = post.likes.filter((l) => String(l) !== String(userId));
    } else {
      post.likes.push(userId);
    }

    post.upvotes = post.likes.length;
    await post.save();

    const isNowLiked = !hasLiked;

    return res.status(200).json({
      success: true,
      data: {
        upvotes: post.upvotes,
        likesCount: post.likes.length,
        hasLiked: isNowLiked,
        hasReacted: isNowLiked,
        userReaction: isNowLiked ? 'like' : null,
        reactionCounts: {
          like: post.likes.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/bookmark - Toggle bookmark/save post
communityRouter.post('/posts/:id/bookmark', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    if (!Array.isArray(post.savedBy)) post.savedBy = [];

    const isSaved = post.savedBy.some((id) => String(id) === String(userId));

    if (isSaved) {
      post.savedBy = post.savedBy.filter((id) => String(id) !== String(userId));
    } else {
      post.savedBy.push(userId);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      data: {
        isSaved: !isSaved,
        postId: post._id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/pin - Toggle pin status (Admin/Moderator only)
communityRouter.post('/posts/:id/pin', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only moderators and admins can pin posts' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { isPinned } = req.body;
    post.isPinned = isPinned !== undefined ? Boolean(isPinned) : !post.isPinned;
    await post.save();

    return res.status(200).json({
      success: true,
      data: {
        isPinned: post.isPinned,
        postId: post._id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/repost - Toggle reposting
communityRouter.post('/posts/:id/repost', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Target the root post to prevent deep recursive repost chains
    const targetPostId = post.originalPost || post._id;
    const targetPost = await Post.findById(targetPostId);
    if (!targetPost) {
      return res.status(404).json({ success: false, message: 'Original post not found' });
    }

    const userId = req.user._id;
    if (!Array.isArray(targetPost.repostedBy)) targetPost.repostedBy = [];

    const isReposted = targetPost.repostedBy.some((id) => String(id) === String(userId));

    if (isReposted) {
      targetPost.repostedBy = targetPost.repostedBy.filter((id) => String(id) !== String(userId));
    } else {
      targetPost.repostedBy.push(userId);
    }

    targetPost.repostCount = targetPost.repostedBy.length;
    await targetPost.save();

    return res.status(200).json({
      success: true,
      data: {
        isReposted: !isReposted,
        repostCount: targetPost.repostCount,
        postId: targetPost._id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMENTS & NESTED THREADING ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/community/posts/:id/comments - Retrieve threaded discussion tree
communityRouter.get('/posts/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const rawComments = await Comment.find({ post: req.params.id })
      .populate('author', 'name username email avatar avatarUrl headline role')
      .sort({ createdAt: 1 })
      .lean();

    const currentUserId = req.user?._id ? String(req.user._id) : null;

    // Build comment map with reaction stats
    const commentMap = new Map();
    const topLevelComments = [];

    rawComments.forEach((c) => {
      const hasLiked = currentUserId && Array.isArray(c.likes)
        ? c.likes.some((id) => String(id) === currentUserId)
        : false;

      const enrichedComment = {
        ...c,
        replies: [],
        hasLiked,
        reactionCounts: {
          like: Array.isArray(c.likes) ? c.likes.length : 0,
        },
      };

      commentMap.set(String(c._id), enrichedComment);
    });

    // Structure into top-level comments and nested replies
    rawComments.forEach((c) => {
      const parentId = c.parentComment ? String(c.parentComment) : null;
      const mapped = commentMap.get(String(c._id));

      if (parentId && commentMap.has(parentId)) {
        commentMap.get(parentId).replies.push(mapped);
      } else {
        topLevelComments.push(mapped);
      }
    });

    return res.status(200).json({
      success: true,
      data: topLevelComments,
      totalCount: rawComments.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/posts/:id/comments - Add comment or nested reply
communityRouter.post('/posts/:id/comments', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { content, parentComment, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const resolvedParentId = parentComment || parentId || null;

    if (resolvedParentId) {
      if (!mongoose.Types.ObjectId.isValid(resolvedParentId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment ID' });
      }

      const parentDoc = await Comment.findById(resolvedParentId);
      if (!parentDoc) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }

      if (String(parentDoc.post) !== String(post._id)) {
        return res.status(400).json({ success: false, message: 'Parent comment does not belong to this post' });
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
      parentComment: resolvedParentId,
    });

    // Increment parent post comments counter
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .lean();

    return res.status(201).json({
      success: true,
      data: {
        ...populated,
        replies: [],
        hasLiked: false,
        reactionCounts: { like: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/community/comments/:id - Edit comment
communityRouter.patch('/comments/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to edit this comment' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name username email avatar avatarUrl headline role');

    return res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/community/comments/:id - Cascading delete of comment and its replies
communityRouter.delete('/comments/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if post owner or comment owner or admin
    let isPostOwner = false;
    if (comment.post) {
      const p = await Post.findById(comment.post);
      if (p && String(p.author) === String(req.user._id)) {
        isPostOwner = true;
      }
    }

    const isAuthor = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isPostOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this comment' });
    }

    // Recursively collect all descendant comment IDs
    const allIds = await getDescendantCommentIds(comment._id);
    const totalDeletedCount = allIds.length;

    await Comment.deleteMany({ _id: { $in: allIds } });

    // Decrement post commentsCount
    if (comment.post) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -totalDeletedCount },
      });
      await Post.updateOne({ _id: comment.post, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment and replies deleted successfully',
      deletedCount: totalDeletedCount,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/community/comments/:id/reactions - Toggle like reaction on comment
communityRouter.post('/comments/:id/reactions', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user._id;
    if (!Array.isArray(comment.likes)) comment.likes = [];

    const hasLiked = comment.likes.some((l) => String(l) === String(userId));

    if (hasLiked) {
      comment.likes = comment.likes.filter((l) => String(l) !== String(userId));
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      hasLiked: !hasLiked,
      likesCount: comment.likes.length,
      reactionCounts: {
        like: comment.likes.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRENDING TAGS AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/community/tags - Aggregate top 20 trending tags from eligible public posts
communityRouter.get('/tags', async (req, res, next) => {
  try {
    const tags = await Post.aggregate([
      {
        $match: {
          status: { $ne: 'hidden' },
          isHidden: { $ne: true },
        },
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: '$_id',
          tag: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    return res.status(200).json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REPORTING & MODERATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/community/reports - Submit a moderation report
communityRouter.post('/reports', protect, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, explanation } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'targetType, targetId, and reason are required',
      });
    }

    if (!['post', 'comment', 'user', 'project'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetType. Must be post, comment, user, or project',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    // Verify existence of target document
    let targetExists = false;
    if (targetType === 'post') {
      targetExists = await Post.exists({ _id: targetId });
    } else if (targetType === 'comment') {
      targetExists = await Comment.exists({ _id: targetId });
    } else if (targetType === 'user') {
      targetExists = await User.exists({ _id: targetId });
    } else if (targetType === 'project') {
      targetExists = await Project.exists({ _id: targetId });
    }

    if (!targetExists) {
      return res.status(404).json({ success: false, message: `Report target ${targetType} not found` });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
      explanation: explanation ? String(explanation).trim().slice(0, 500) : '',
    });

    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending report submitted for this item',
      });
    }
    next(err);
  }
});

// GET /api/v1/moderation/reports - Admin/Moderator dashboard queue
moderationRouter.get('/reports', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Access denied: Moderators and Admins only' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate('reporterId', 'name username email avatar avatarUrl role')
      .populate('reviewedBy', 'name username email avatar avatarUrl role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Hydrate targetPreview for each report
    const hydratedReports = await Promise.all(
      reports.map(async (r) => {
        let targetPreview = null;
        try {
          if (r.targetType === 'post') {
            const p = await Post.findById(r.targetId).populate('author', 'name username');
            if (p) {
              targetPreview = {
                title: p.title,
                content: p.content,
                author: p.author,
                status: p.status,
                isHidden: p.isHidden,
              };
            }
          } else if (r.targetType === 'comment') {
            const c = await Comment.findById(r.targetId).populate('author', 'name username');
            if (c) {
              targetPreview = {
                content: c.content,
                author: c.author,
                isDeleted: c.isDeleted,
              };
            }
          } else if (r.targetType === 'user') {
            const u = await User.findById(r.targetId).select('name username role headline');
            if (u) {
              targetPreview = u;
            }
          }
        } catch {
          targetPreview = null;
        }

        return {
          ...r,
          targetPreview,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: hydratedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/moderation/reports/:id - Review and action a report
moderationRouter.patch('/reports/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Access denied: Moderators and Admins only' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const { status, actionTaken, moderatorNotes } = req.body;

    if (status) report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    if (moderatorNotes !== undefined) report.moderatorNotes = String(moderatorNotes).trim().slice(0, 1000);

    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/moderation/posts/:postId/hide - Hide or unhide a post from public feed
moderationRouter.post('/posts/:postId/hide', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Access denied: Moderators and Admins only' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { hide } = req.body;
    const shouldHide = hide !== undefined ? Boolean(hide) : !post.isHidden;

    post.isHidden = shouldHide;
    post.status = shouldHide ? 'hidden' : 'active';
    await post.save();

    return res.status(200).json({
      success: true,
      data: {
        status: post.status,
        isHidden: post.isHidden,
        postId: post._id,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default communityRouter;
