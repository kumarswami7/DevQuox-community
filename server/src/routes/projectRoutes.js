import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Project } from '../models/Project.js';
import { Application } from '../models/Application.js';
import { User } from '../models/User.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { Task } from '../models/Task.js';
import { Milestone } from '../models/Milestone.js';
import { Conversation } from '../models/Conversation.js';
import { Reaction } from '../models/Reaction.js';
import { Comment } from '../models/Comment.js';
import { ProjectRepost } from '../models/ProjectRepost.js';
import { ProjectView } from '../models/ProjectView.js';
import { ProjectBookmark } from '../models/ProjectBookmark.js';
import { Follow } from '../models/Follow.js';
import { Profile } from '../models/Profile.js';
import { Post } from '../models/Post.js';
import { taskRouter } from './taskRoutes.js';
import { milestoneRouter } from './milestoneRoutes.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember, requireWorkspaceOwner } from '../middleware/workspaceMiddleware.js';
import { sendNotification } from '../utils/notifications.js';
import { emitToProject, emitToUser, revokeUserProjectAccess } from '../utils/socketEvents.js';

export const projectRouter = express.Router();

const ALLOWED_PROJECT_FIELDS = [
  'title',
  'description',
  'category',
  'projectType',
  'experienceLevel',
  'teamSize',
  'budget',
  'budgetMin',
  'budgetMax',
  'currency',
  'duration',
  'commitment',
  'visibility',
  'requiredSkills',
  'deadline',
  'applicationDeadline',
  'githubRepoUrl',
  'liveDemoUrl',
  'status',
];

const ALLOWED_SORT_FIELDS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  budget_asc: { budgetMin: 1, createdAt: -1 },
  budget_desc: { budgetMax: -1, createdAt: -1 },
  deadline: { deadline: 1, createdAt: -1 },
  trending: { repostsCount: -1, reactionsCount: -1, commentsCount: -1, viewsCount: -1, createdAt: -1 },
  most_discussed: { commentsCount: -1, createdAt: -1 },
  most_reacted: { reactionsCount: -1, createdAt: -1 },
  relevance: { createdAt: -1 },
};

// ==========================================
// 1. GET /api/projects - Paginated discovery feed with Feed Tabs
// ==========================================
projectRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      tab = 'for-you',
      q,
      category,
      projectType,
      experienceLevel,
      skills,
      status,
      minBudget,
      maxBudget,
      sort,
      page = 1,
      limit = 10,
      owner,
      userId,
    } = req.query;

    const filter = {};

    // Specific owner filter (e.g. for user profile)
    const targetOwner = owner || userId;
    if (targetOwner && mongoose.Types.ObjectId.isValid(targetOwner)) {
      filter.owner = new mongoose.Types.ObjectId(targetOwner);
    } else {
      // By default, only public & open/in_progress projects are discoverable in public feed
      if (status && ['open', 'in_progress', 'completed'].includes(status.toLowerCase())) {
        filter.status = status.toLowerCase();
      } else {
        filter.status = { $in: ['open', 'in_progress'] };
      }
      filter.visibility = { $in: ['public', null, undefined] };
    }

    // Text search query
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitizedQ, $options: 'i' } },
        { description: { $regex: sanitizedQ, $options: 'i' } },
        { requiredSkills: { $regex: sanitizedQ, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'All Projects') {
      if (category.toLowerCase().includes('ai')) {
        filter.category = { $regex: /ai/i };
      } else if (category.toLowerCase().includes('cloud') || category.toLowerCase().includes('devops')) {
        filter.category = { $regex: /cloud|devops/i };
      } else {
        filter.category = { $regex: new RegExp(category.trim(), 'i') };
      }
    }

    // Project type filter
    if (projectType && typeof projectType === 'string') {
      filter.projectType = projectType.toLowerCase().trim();
    }

    // Experience level filter
    if (experienceLevel && typeof experienceLevel === 'string') {
      filter.experienceLevel = experienceLevel.toLowerCase().trim();
    }

    // Skills filter (comma-separated or single)
    if (skills && typeof skills === 'string') {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsArray.length > 0) {
        filter.requiredSkills = { $in: skillsArray };
      }
    }

    // Numeric budget filters
    const numMinBudget = Number(minBudget);
    const numMaxBudget = Number(maxBudget);
    if (!isNaN(numMinBudget) && numMinBudget > 0) {
      filter.budgetMin = { $gte: numMinBudget };
    }
    if (!isNaN(numMaxBudget) && numMaxBudget > 0) {
      filter.budgetMax = { ...(filter.budgetMax || {}), $lte: numMaxBudget };
    }

    // ── Tab Behavior ───────────────────────────────────────────────────────────
    let followedReposts = [];
    if (tab === 'following') {
      if (req.user) {
        const follows = await Follow.find({ follower: req.user._id }).select('following').lean();
        const followingIds = follows.map((f) => f.following);

        followedReposts = await ProjectRepost.find({ user: { $in: followingIds } })
          .populate('user', 'name username avatar avatarUrl headline role')
          .sort({ createdAt: -1 })
          .lean();
        const repostedProjectIds = followedReposts.map((r) => r.project);

        if (followingIds.length > 0 || repostedProjectIds.length > 0) {
          filter.$or = [
            { owner: { $in: followingIds } },
            { _id: { $in: repostedProjectIds } },
          ];
        } else {
          // User follows nobody; return empty feed cleanly
          filter.owner = { $in: [] };
        }
      } else {
        filter.owner = { $in: [] };
      }
    }

    // Sorting definition
    let sortCriteria = ALLOWED_SORT_FIELDS.newest;
    if (tab === 'trending') {
      sortCriteria = ALLOWED_SORT_FIELDS.trending;
    } else if (tab === 'latest') {
      sortCriteria = ALLOWED_SORT_FIELDS.newest;
    } else if (sort && ALLOWED_SORT_FIELDS[sort]) {
      sortCriteria = ALLOWED_SORT_FIELDS[sort];
    } else if (tab === 'for-you') {
      sortCriteria = ALLOWED_SORT_FIELDS.trending;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate('owner', 'name username email avatar avatarUrl role headline')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    let enrichedProjects = projects;
    if (projects.length > 0) {
      const projectIds = projects.map((p) => p._id);

      // If following tab, associate repost information
      const repostMap = new Map(followedReposts.map((r) => [String(r.project), r]));

      let bookmarkedSet = new Set();
      let reactionMap = new Map();
      let repostedSet = new Set();

      let userSkills = [];
      if (req.user) {
        const [userBookmarks, userReactions, userReposts, userProfile] = await Promise.all([
          ProjectBookmark.find({ user: req.user._id, project: { $in: projectIds } }).select('project').lean(),
          Reaction.find({ userId: req.user._id, targetType: 'project', targetId: { $in: projectIds } }).select('targetId reactionType').lean(),
          ProjectRepost.find({ user: req.user._id, project: { $in: projectIds } }).select('project').lean(),
          Profile.findOne({ user: req.user._id }).select('skills techStack').lean(),
        ]);

        bookmarkedSet = new Set(userBookmarks.map((b) => String(b.project)));
        reactionMap = new Map(userReactions.map((r) => [String(r.targetId), r.reactionType]));
        repostedSet = new Set(userReposts.map((r) => String(r.project)));
        userSkills = [
          ...(userProfile?.skills || []),
          ...(userProfile?.techStack || []),
          ...(req.user.skills || []),
        ].map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase())).filter(Boolean);
      }

      enrichedProjects = projects.map((p) => {
        const pId = String(p._id);
        const rep = repostMap.get(pId);

        // Calculate skill match
        const pSkills = (p.requiredSkills || []).map((s) => s.toLowerCase());
        const matchedSkills = pSkills.filter((s) => userSkills.includes(s));
        const matchPct = pSkills.length > 0 && userSkills.length > 0
          ? Math.min(100, Math.round((matchedSkills.length / pSkills.length) * 100))
          : 0;

        return {
          ...p,
          isBookmarked: bookmarkedSet.has(pId),
          userReaction: reactionMap.get(pId) || null,
          hasReposted: repostedSet.has(pId),
          repostInfo: rep
            ? {
                repostedBy: rep.user,
                commentary: rep.commentary,
                isQuote: rep.isQuote,
                repostedAt: rep.createdAt,
              }
            : null,
          matchingScore: matchPct > 0
            ? {
                matchPercentage: matchPct,
                matchedSkills: p.requiredSkills.filter((s) => userSkills.includes(s.toLowerCase())),
              }
            : null,
        };
      });

      // If in For You tab and user has skills, prioritize higher match
      if (tab === 'for-you' && userSkills.length > 0 && (!sort || sort === 'match' || sort === 'relevance')) {
        enrichedProjects.sort((a, b) => (b.matchingScore?.matchPercentage || 0) - (a.matchingScore?.matchPercentage || 0));
      }
    }

    return res.status(200).json({
      success: true,
      count: enrichedProjects.length,
      total,
      page: pageNum,
      totalPages,
      tab,
      projects: enrichedProjects,
      data: enrichedProjects,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 1b. GET /api/projects/:id/analytics - Owner project analytics
// ==========================================
projectRouter.get('/:id/analytics', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the project owner or administrator can access analytics',
      });
    }

    const [
      viewsCount,
      uniqueViewers,
      reactions,
      commentsCount,
      repostsCount,
      bookmarksCount,
      applications,
    ] = await Promise.all([
      ProjectView.countDocuments({ project: project._id }),
      ProjectView.distinct('viewer', { project: project._id, viewer: { $ne: null } }),
      Reaction.find({ targetType: 'project', targetId: project._id }),
      Comment.countDocuments({ project: project._id }),
      ProjectRepost.countDocuments({ project: project._id }),
      ProjectBookmark.countDocuments({ project: project._id }),
      Application.find({ project: project._id }).select('status proposedRate createdAt').lean(),
    ]);

    const reactionBreakdown = { like: 0, celebrate: 0, support: 0, insightful: 0, curious: 0 };
    reactions.forEach((r) => {
      if (reactionBreakdown[r.reactionType] !== undefined) {
        reactionBreakdown[r.reactionType] += 1;
      }
    });

    const applicationsByStatus = { pending: 0, accepted: 0, rejected: 0, total: applications.length };
    applications.forEach((a) => {
      if (applicationsByStatus[a.status] !== undefined) {
        applicationsByStatus[a.status] += 1;
      }
    });

    const totalViews = Math.max(project.viewsCount || 0, viewsCount);
    const uniqueViewsCount = Math.max(project.uniqueViewsCount || 0, uniqueViewers.length);
    const totalEngagements = reactions.length + commentsCount + repostsCount + bookmarksCount + applications.length;
    const engagementRate = totalViews > 0
      ? ((totalEngagements / totalViews) * 100).toFixed(1) + '%'
      : '0.0%';

    return res.status(200).json({
      success: true,
      analytics: {
        projectId: project._id,
        projectTitle: project.title,
        totalViews,
        uniqueViewsCount,
        reactionsCount: reactions.length,
        reactionBreakdown,
        commentsCount,
        repostsCount,
        bookmarksCount,
        applications: applicationsByStatus,
        totalEngagements,
        engagementRate,
        formula: 'Engagement Rate = (Reactions + Comments + Reposts + Bookmarks + Applications) / Total Views * 100',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. GET /api/projects/my-projects - Current user's projects
// ==========================================
projectRouter.get('/my-projects', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .populate('owner', 'name username email avatar avatarUrl role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. GET /api/projects/my-applications - Current user's applications
// ==========================================
projectRouter.get('/my-applications', protect, async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'project',
        select: 'title description category budget duration status experienceLevel teamSize acceptedApplicantsCount owner',
        populate: { path: 'owner', select: 'name username email avatar avatarUrl role' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. POST /api/projects - Create a new project
// ==========================================
projectRouter.post('/', protect, async (req, res, next) => {
  let createdProject = null;
  try {
    const rawData = req.body || {};

    // 1. Mandatory Title Validation
    const title = typeof rawData.title === 'string' ? rawData.title.trim() : '';
    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }
    if (title.length < 3) {
      return res.status(400).json({ success: false, message: 'Title must be at least 3 characters' });
    }
    if (title.length > 120) {
      return res.status(400).json({ success: false, message: 'Title cannot exceed 120 characters' });
    }

    // 2. Mandatory Description Validation
    const description = typeof rawData.description === 'string' ? rawData.description.trim() : '';
    if (!description) {
      return res.status(400).json({ success: false, message: 'Project description is required' });
    }
    if (description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    }
    if (description.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 5000 characters' });
    }

    // 3. Team Size Validation
    let teamSize = 1;
    if (rawData.teamSize !== undefined && rawData.teamSize !== null && rawData.teamSize !== '') {
      const parsedTeam = Number(rawData.teamSize);
      if (isNaN(parsedTeam) || parsedTeam < 1 || parsedTeam > 100) {
        return res.status(400).json({ success: false, message: 'Team size must be between 1 and 100 positions' });
      }
      teamSize = Math.floor(parsedTeam);
    }

    // 4. Budget Validation
    let budgetMin = 0;
    let budgetMax = 0;
    let hasMin = false;
    let hasMax = false;

    if (rawData.budgetMin !== undefined && rawData.budgetMin !== null && rawData.budgetMin !== '') {
      budgetMin = Number(rawData.budgetMin);
      if (isNaN(budgetMin)) {
        return res.status(400).json({ success: false, message: 'Minimum budget must be a valid number' });
      }
      if (budgetMin < 0) {
        return res.status(400).json({ success: false, message: 'Minimum budget cannot be negative' });
      }
      hasMin = true;
    }

    if (rawData.budgetMax !== undefined && rawData.budgetMax !== null && rawData.budgetMax !== '') {
      budgetMax = Number(rawData.budgetMax);
      if (isNaN(budgetMax)) {
        return res.status(400).json({ success: false, message: 'Maximum budget must be a valid number' });
      }
      if (budgetMax < 0) {
        return res.status(400).json({ success: false, message: 'Maximum budget cannot be negative' });
      }
      hasMax = true;
    }

    if (hasMin && hasMax && budgetMin > budgetMax) {
      return res.status(400).json({ success: false, message: 'Minimum budget cannot exceed maximum budget' });
    }

    const currency = typeof rawData.currency === 'string' && rawData.currency.trim()
      ? rawData.currency.trim().toUpperCase()
      : 'USD';

    let formattedBudget = rawData.budget;
    if (!formattedBudget || !formattedBudget.trim()) {
      if (hasMin || hasMax) {
        const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';
        formattedBudget = `${symbol}${budgetMin.toLocaleString()} - ${symbol}${budgetMax.toLocaleString()}`;
      } else {
        formattedBudget = '$1,000 - $3,000';
      }
    }

    // 5. Skills Validation & Deduplication
    let cleanSkills = [];
    if (rawData.requiredSkills !== undefined) {
      if (!Array.isArray(rawData.requiredSkills)) {
        return res.status(400).json({ success: false, message: 'Required skills must be an array' });
      }
      const seen = new Set();
      for (const s of rawData.requiredSkills) {
        if (typeof s === 'string' && s.trim()) {
          const cleaned = s.trim().replace(/^#/, '');
          const lower = cleaned.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            cleanSkills.push(cleaned);
          }
        }
      }
      if (cleanSkills.length > 25) {
        return res.status(400).json({ success: false, message: 'Cannot specify more than 25 required skills' });
      }
    }

    // 6. Deadlines Validation
    let parsedDeadline = undefined;
    let parsedAppDeadline = undefined;

    if (rawData.deadline) {
      parsedDeadline = new Date(rawData.deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid project deadline date format' });
      }
    }

    if (rawData.applicationDeadline) {
      parsedAppDeadline = new Date(rawData.applicationDeadline);
      if (isNaN(parsedAppDeadline.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid application deadline date format' });
      }
    }

    if (parsedDeadline && parsedAppDeadline && parsedAppDeadline > parsedDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline cannot be after project deadline',
      });
    }

    // 7. URL Validation
    const urlPattern = /^https?:\/\/.+/i;
    let githubRepoUrl = '';
    if (rawData.githubRepoUrl && typeof rawData.githubRepoUrl === 'string' && rawData.githubRepoUrl.trim()) {
      const url = rawData.githubRepoUrl.trim();
      if (!urlPattern.test(url)) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub repository URL format' });
      }
      githubRepoUrl = url;
    }

    let liveDemoUrl = '';
    if (rawData.liveDemoUrl && typeof rawData.liveDemoUrl === 'string' && rawData.liveDemoUrl.trim()) {
      const url = rawData.liveDemoUrl.trim();
      if (!urlPattern.test(url)) {
        return res.status(400).json({ success: false, message: 'Invalid Live Demo URL format' });
      }
      liveDemoUrl = url;
    }

    // 8. Enum Validations
    const VALID_PROJECT_TYPES = ['collaboration', 'freelance', 'academic', 'open_source'];
    const projectType = rawData.projectType ? rawData.projectType.toLowerCase().trim() : 'collaboration';
    if (!VALID_PROJECT_TYPES.includes(projectType)) {
      return res.status(400).json({ success: false, message: `Invalid project type: ${rawData.projectType}` });
    }

    const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert', 'all', 'entry'];
    let experienceLevel = rawData.experienceLevel ? rawData.experienceLevel.toLowerCase().trim() : 'intermediate';
    if (experienceLevel === 'entry') experienceLevel = 'beginner';
    if (!VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({ success: false, message: `Invalid experience level: ${rawData.experienceLevel}` });
    }

    const VALID_COMMITMENTS = ['full_time', 'part_time', 'flexible'];
    const commitment = rawData.commitment ? rawData.commitment.toLowerCase().trim() : 'flexible';
    if (!VALID_COMMITMENTS.includes(commitment)) {
      return res.status(400).json({ success: false, message: `Invalid commitment type: ${rawData.commitment}` });
    }

    const VALID_VISIBILITIES = ['public', 'private'];
    const visibility = rawData.visibility ? rawData.visibility.toLowerCase().trim() : 'public';
    if (!VALID_VISIBILITIES.includes(visibility)) {
      return res.status(400).json({ success: false, message: `Invalid visibility: ${rawData.visibility}` });
    }

    // Status: only 'open' or 'draft' allowed at creation
    let status = 'open';
    if (rawData.status) {
      const normStatus = rawData.status.toLowerCase().trim();
      if (!['draft', 'open'].includes(normStatus)) {
        return res.status(400).json({ success: false, message: 'Initial project status must be either open or draft' });
      }
      status = normStatus;
    }

    // 9. Build Sanitized Project Document
    const projectData = {
      title,
      description,
      owner: req.user._id, // Enforce authenticated owner
      category: rawData.category && typeof rawData.category === 'string' ? rawData.category.trim() : 'Web Development',
      projectType,
      experienceLevel,
      teamSize,
      budget: formattedBudget,
      budgetMin,
      budgetMax,
      currency,
      duration: rawData.duration && typeof rawData.duration === 'string' ? rawData.duration.trim() : '1 - 2 Months',
      commitment,
      visibility,
      status,
      requiredSkills: cleanSkills,
      deadline: parsedDeadline,
      applicationDeadline: parsedAppDeadline,
      githubRepoUrl,
      liveDemoUrl,
    };

    // 10. Atomic Execution with Rollback Protection
    const project = await Project.create(projectData);
    createdProject = project;

    try {
      // Create explicit owner ProjectMember record
      await ProjectMember.create({
        project: project._id,
        projectId: project._id,
        user: req.user._id,
        userId: req.user._id,
        role: 'owner',
        status: 'active',
        joinedAt: project.createdAt || new Date(),
        addedBy: req.user._id,
      });

      // Record project creation activity
      await ProjectActivity.create({
        project: project._id,
        user: req.user._id,
        action: 'project_created',
        details: { title: project.title },
      });

      // Link origin community idea post if created from idea
      if (rawData.ideaPostId && mongoose.Types.ObjectId.isValid(rawData.ideaPostId)) {
        project.originIdeaPost = rawData.ideaPostId;
        await project.save();

        await Post.findByIdAndUpdate(rawData.ideaPostId, {
          convertedToProject: project._id,
          projectRef: project._id,
          'ideaDetails.status': 'converted',
        }).catch(() => null);
      }
    } catch (membershipOrActivityErr) {
      // Rollback project creation on failure
      await Project.findByIdAndDelete(project._id);
      throw membershipOrActivityErr;
    }

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name username email avatar avatarUrl role headline')
      .populate('originIdeaPost', 'title content author createdAt');

    return res.status(201).json({
      success: true,
      message: project.status === 'draft' ? 'Project draft saved successfully' : 'Project created successfully',
      project: populatedProject,
      data: populatedProject,
    });
  } catch (err) {
    if (createdProject && createdProject._id) {
      await Project.findByIdAndDelete(createdProject._id).catch(() => {});
    }
    next(err);
  }
});

// ==========================================
// 4b. GET /api/projects/saved - Get authenticated user's saved/bookmarked projects
// ==========================================
projectRouter.get('/saved', protect, async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await ProjectBookmark.countDocuments({ user: req.user._id });
    const bookmarks = await ProjectBookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'project',
        populate: { path: 'owner', select: 'name username email avatar avatarUrl role headline' },
      })
      .lean();

    const validBookmarks = bookmarks.filter((b) => b.project && b.project.status !== 'cancelled');
    const projects = validBookmarks.map((b) => ({
      ...b.project,
      isBookmarked: true,
      savedAt: b.createdAt,
    }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: pageNum,
      totalPages,
      projects,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
});

// Alias: GET /api/projects/bookmarks
projectRouter.get('/bookmarks', protect, async (req, res, next) => {
  req.url = '/saved';
  return projectRouter.handle(req, res, next);
});

// ==========================================
// 4c. GET /api/projects/stats - Real platform stats for project feed sidebar
// ==========================================
projectRouter.get('/stats', async (req, res, next) => {
  try {
    const [totalProjects, openProjects, inProgressProjects, completedProjects, skillAggregates, categoryAggregates] =
      await Promise.all([
        Project.countDocuments({ visibility: 'public' }),
        Project.countDocuments({ visibility: 'public', status: 'open' }),
        Project.countDocuments({ visibility: 'public', status: 'in_progress' }),
        Project.countDocuments({ visibility: 'public', status: 'completed' }),
        Project.aggregate([
          { $match: { visibility: 'public', status: { $in: ['open', 'in_progress'] } } },
          { $unwind: '$requiredSkills' },
          { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Project.aggregate([
          { $match: { visibility: 'public' } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        openProjects,
        inProgressProjects,
        completedProjects,
        trendingSkills: skillAggregates.map((s) => ({ skill: s._id, count: s.count })),
        topCategories: categoryAggregates.map((c) => ({ category: c._id, count: c.count })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. GET /api/projects/:projectId - Project details
// ==========================================
projectRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username email avatar avatarUrl role headline bio')
      .populate('members.user', 'name username avatar role')
      .populate('originIdeaPost', 'title content author createdAt');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Visibility / Draft privacy check
    if (project.visibility === 'private' || project.status === 'draft') {
      const isOwner = req.user && String(project.owner._id) === String(req.user._id);
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This project is private or unlisted',
        });
      }
    }

    // Fetch active applications count
    const applicationsCount = await Application.countDocuments({
      project: project._id,
      status: { $ne: 'withdrawn' },
    });

    const projectObj = project.toObject();
    projectObj.applicationsCount = applicationsCount;

    // Check user engagement if authenticated
    if (req.user) {
      const [bookmark, reaction, repost] = await Promise.all([
        ProjectBookmark.findOne({ user: req.user._id, project: project._id }).select('_id').lean(),
        Reaction.findOne({ userId: req.user._id, targetType: 'project', targetId: project._id }).select('reactionType').lean(),
        ProjectRepost.findOne({ user: req.user._id, project: project._id }).select('_id').lean(),
      ]);
      projectObj.isBookmarked = !!bookmark;
      projectObj.userReaction = reaction ? reaction.reactionType : null;
      projectObj.hasReposted = !!repost;
    } else {
      projectObj.isBookmarked = false;
      projectObj.userReaction = null;
      projectObj.hasReposted = false;
    }

    return res.status(200).json({
      success: true,
      project: projectObj,
      ...projectObj, // Root fields for backwards compatibility
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. PATCH /api/projects/:projectId - Update project
// ==========================================
const updateProjectHandler = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this project' });
    }

    // Validate status transition if status is being updated
    if (req.body.status && req.body.status !== project.status) {
      if (!project.canTransitionTo(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition project status from "${project.status}" to "${req.body.status}"`,
        });
      }
      project.status = req.body.status;
    }

    // Apply allowed fields
    for (const field of ALLOWED_PROJECT_FIELDS) {
      if (field !== 'status' && req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    await project.save();

    // Log project settings modification in audit trail
    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      action: 'project_settings_updated',
      details: {
        title: project.title,
        status: project.status,
        category: project.category,
      },
    }).catch(() => {});

    const updated = await Project.findById(project._id)
      .populate('owner', 'name username email avatar avatarUrl role headline')
      .populate('members.user', 'name username avatar role');

    // Real-time WebSocket synchronization
    emitToProject(project._id, 'project:settingsUpdated', updated, {
      actor: req.user,
      resourceId: project._id,
    });
    emitToProject(project._id, 'project:updated', updated, {
      actor: req.user,
      resourceId: project._id,
    });
    if (req.body.status && req.body.status !== previousStatus) {
      emitToProject(project._id, 'project:statusChanged', { status: project.status }, {
        actor: req.user,
        resourceId: project._id,
      });
    }
    emitToProject(project._id, 'activity:new', {
      project: project._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      action: 'project_settings_updated',
      details: {
        title: project.title,
        status: project.status,
        category: project.category,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updated,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

projectRouter.patch('/:id', protect, updateProjectHandler);
projectRouter.put('/:id', protect, updateProjectHandler);

// ==========================================
// 7. DELETE /api/projects/:projectId - Delete or cancel project
// ==========================================
projectRouter.delete('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    const applicationsCount = await Application.countDocuments({ project: project._id });

    // If applications or accepted members exist, preserve history with soft-cancellation
    if (applicationsCount > 0 || (project.members && project.members.length > 0)) {
      project.status = 'cancelled';
      await project.save();

      return res.status(200).json({
        success: true,
        message: 'Project has been cancelled to preserve proposal history',
        status: 'cancelled',
      });
    }

    // Otherwise permanently remove empty project
    await Project.findByIdAndDelete(project._id);
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7a. REACTIONS (Like, Celebrate, Support, Insightful, Curious)
// ==========================================
const VALID_REACTIONS = ['like', 'celebrate', 'support', 'insightful', 'curious'];

// POST /api/projects/:id/reactions - Add or switch reaction
projectRouter.post('/:id/reactions', protect, async (req, res, next) => {
  try {
    const { reactionType = 'like' } = req.body;
    const normalizedType = reactionType ? reactionType.toLowerCase() : 'like';

    if (!VALID_REACTIONS.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Must be one of: ${VALID_REACTIONS.join(', ')}`,
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const existing = await Reaction.findOne({
      userId: req.user._id,
      targetType: 'project',
      targetId: project._id,
    });

    if (existing) {
      if (existing.reactionType === normalizedType) {
        return res.status(200).json({
          success: true,
          message: 'Reaction already recorded',
          userReaction: normalizedType,
          reactionsCount: project.reactionsCount || 0,
          reactionBreakdown: project.reactionBreakdown || {},
        });
      }

      const oldType = existing.reactionType;
      existing.reactionType = normalizedType;
      await existing.save();

      const incUpdate = {};
      if (oldType) incUpdate[`reactionBreakdown.${oldType}`] = -1;
      incUpdate[`reactionBreakdown.${normalizedType}`] = 1;

      const updatedProject = await Project.findByIdAndUpdate(
        project._id,
        { $inc: incUpdate },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Reaction updated successfully',
        userReaction: normalizedType,
        reactionsCount: updatedProject.reactionsCount || 0,
        reactionBreakdown: updatedProject.reactionBreakdown || {},
      });
    }

    await Reaction.create({
      userId: req.user._id,
      targetType: 'project',
      targetId: project._id,
      reactionType: normalizedType,
    });

    const incUpdate = {
      reactionsCount: 1,
    };
    incUpdate[`reactionBreakdown.${normalizedType}`] = 1;

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $inc: incUpdate },
      { new: true }
    );

    if (String(project.owner) !== String(req.user._id)) {
      sendNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: 'reaction',
        title: 'New Project Reaction',
        message: `${req.user.name || 'A developer'} reacted to your project "${project.title}"`,
        link: `/projects/${project._id}`,
        project: project._id,
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Reaction added successfully',
      userReaction: normalizedType,
      reactionsCount: updatedProject.reactionsCount || 0,
      reactionBreakdown: updatedProject.reactionBreakdown || {},
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/reactions/me - Remove user's reaction
projectRouter.delete('/:id/reactions/me', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const existing = await Reaction.findOneAndDelete({
      userId: req.user._id,
      targetType: 'project',
      targetId: project._id,
    });

    if (!existing) {
      return res.status(200).json({
        success: true,
        message: 'No active reaction found to remove',
        userReaction: null,
        reactionsCount: project.reactionsCount || 0,
        reactionBreakdown: project.reactionBreakdown || {},
      });
    }

    const incUpdate = {
      reactionsCount: -1,
    };
    if (existing.reactionType) {
      incUpdate[`reactionBreakdown.${existing.reactionType}`] = -1;
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $inc: incUpdate },
      { new: true }
    );

    if (updatedProject.reactionsCount < 0) {
      updatedProject.reactionsCount = 0;
      await updatedProject.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
      userReaction: null,
      reactionsCount: Math.max(0, updatedProject.reactionsCount || 0),
      reactionBreakdown: updatedProject.reactionBreakdown || {},
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/reactions - Get reactions breakdown & recent reactors
projectRouter.get('/:id/reactions', optionalAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [reactions, userReactionDoc] = await Promise.all([
      Reaction.find({ targetType: 'project', targetId: project._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name username avatar avatarUrl headline role')
        .lean(),
      req.user
        ? Reaction.findOne({
            userId: req.user._id,
            targetType: 'project',
            targetId: project._id,
          }).select('reactionType').lean()
        : null,
    ]);

    return res.status(200).json({
      success: true,
      reactionsCount: project.reactionsCount || 0,
      reactionBreakdown: project.reactionBreakdown || {
        like: 0,
        celebrate: 0,
        support: 0,
        insightful: 0,
        curious: 0,
      },
      userReaction: userReactionDoc ? userReactionDoc.reactionType : null,
      recentReactors: reactions.map((r) => ({
        user: r.userId,
        reactionType: r.reactionType,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7b. COMMENTS & REPLIES
// ==========================================

// GET /api/projects/:id/comments - Paginated threaded comments
projectRouter.get('/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const totalTopLevel = await Comment.countDocuments({
      project: project._id,
      parentComment: null,
    });

    const topLevelComments = await Comment.find({
      project: project._id,
      parentComment: null,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name username email avatar avatarUrl headline role')
      .lean();

    const parentIds = topLevelComments.map((c) => c._id);
    const replies = await Comment.find({
      project: project._id,
      parentComment: { $in: parentIds },
    })
      .sort({ createdAt: 1 })
      .populate('author', 'name username email avatar avatarUrl headline role')
      .lean();

    const repliesByParent = {};
    for (const reply of replies) {
      const pId = String(reply.parentComment);
      if (!repliesByParent[pId]) repliesByParent[pId] = [];
      repliesByParent[pId].push(reply);
    }

    const threaded = topLevelComments.map((c) => ({
      ...c,
      replies: repliesByParent[String(c._id)] || [],
    }));

    const totalPages = Math.ceil(totalTopLevel / limitNum) || 1;

    return res.status(200).json({
      success: true,
      comments: threaded,
      data: threaded,
      total: project.commentsCount || totalTopLevel,
      page: pageNum,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/comments - Add comment or reply
projectRouter.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    if (content.trim().length > 3000) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 3000 characters' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let parentCommentDoc = null;
    if (parentComment) {
      parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc || String(parentCommentDoc.project) !== String(project._id)) {
        return res.status(400).json({ success: false, message: 'Parent comment not found on this project' });
      }
    }

    const comment = await Comment.create({
      project: project._id,
      author: req.user._id,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    await Project.findByIdAndUpdate(project._id, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name username email avatar avatarUrl headline role'
    );

    const notifyRecipient = parentCommentDoc ? parentCommentDoc.author : project.owner;
    if (notifyRecipient && String(notifyRecipient) !== String(req.user._id)) {
      sendNotification({
        recipient: notifyRecipient,
        sender: req.user._id,
        type: 'comment',
        title: parentCommentDoc ? 'New Reply on Project Comment' : 'New Comment on Project',
        message: `${req.user.name || 'A developer'} commented on "${project.title}"`,
        link: `/projects/${project._id}`,
        project: project._id,
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populated,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id/comments/:commentId - Edit comment
projectRouter.patch('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      project: req.params.id,
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found on this project' });
    }

    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this comment' });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name username email avatar avatarUrl headline role'
    );

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: populated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/comments/:commentId - Delete comment and replies
projectRouter.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const comment = await Comment.findOne({
      _id: req.params.commentId,
      project: project._id,
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = String(comment.author) === String(req.user._id);
    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    const childReplies = await Comment.find({ parentComment: comment._id });
    const countToDelete = 1 + childReplies.length;

    await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }],
    });

    await Project.findByIdAndUpdate(project._id, {
      $inc: { commentsCount: -countToDelete },
    });
    await Project.updateOne({ _id: project._id, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCount: countToDelete,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7c. REPOST & QUOTE REPOST
// ==========================================

// POST /api/projects/:id/reposts - Repost or Quote Repost
projectRouter.post('/:id/reposts', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { commentary = '' } = req.body;
    const isQuote = Boolean(commentary && commentary.trim().length > 0);

    const existing = await ProjectRepost.findOne({
      user: req.user._id,
      project: project._id,
    });

    if (existing) {
      if (isQuote) {
        existing.commentary = commentary.trim();
        existing.isQuote = true;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Quote repost updated successfully',
          repost: existing,
          hasReposted: true,
          repostsCount: project.repostsCount || 1,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Project already reposted to your network',
        hasReposted: true,
        repostsCount: project.repostsCount || 1,
      });
    }

    const repost = await ProjectRepost.create({
      user: req.user._id,
      project: project._id,
      commentary: commentary.trim(),
      isQuote,
    });

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $inc: { repostsCount: 1 } },
      { new: true }
    );

    if (String(project.owner) !== String(req.user._id)) {
      sendNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: 'repost',
        title: 'Project Reposted',
        message: `${req.user.name || 'A developer'} reposted your project "${project.title}"`,
        link: `/projects/${project._id}`,
        project: project._id,
      }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: isQuote ? 'Project quote reposted successfully' : 'Project reposted to your network',
      repost,
      hasReposted: true,
      repostsCount: updatedProject.repostsCount || 1,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/reposts/me - Undo Repost
projectRouter.delete('/:id/reposts/me', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const existing = await ProjectRepost.findOneAndDelete({
      user: req.user._id,
      project: project._id,
    });

    if (!existing) {
      return res.status(200).json({
        success: true,
        message: 'No active repost found to undo',
        hasReposted: false,
        repostsCount: project.repostsCount || 0,
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $inc: { repostsCount: -1 } },
      { new: true }
    );
    if (updatedProject.repostsCount < 0) {
      updatedProject.repostsCount = 0;
      await updatedProject.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Repost removed successfully',
      hasReposted: false,
      repostsCount: Math.max(0, updatedProject.repostsCount || 0),
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7d. VIEW TRACKING WITH DEDUPLICATION WINDOW
// ==========================================

// POST /api/projects/:id/views - Meaningful view tracking
projectRouter.post('/:id/views', optionalAuth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { sessionId } = req.body || {};
    const deduplicationWindowMs = 30 * 60 * 1000; // 30 minutes
    const windowStart = new Date(Date.now() - deduplicationWindowMs);

    let viewerId = req.user ? req.user._id : null;
    let effectiveSessionId = sessionId || null;
    let ipHash = null;

    if (!viewerId && !effectiveSessionId) {
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const rawUa = req.headers['user-agent'] || '';
      ipHash = crypto.createHash('sha256').update(`${rawIp}:${rawUa}`).digest('hex');
    }

    const recentQuery = {
      project: project._id,
      createdAt: { $gte: windowStart },
    };
    if (viewerId) {
      recentQuery.viewer = viewerId;
    } else if (effectiveSessionId) {
      recentQuery.sessionId = effectiveSessionId;
    } else {
      recentQuery.ipHash = ipHash;
    }

    const recentView = await ProjectView.findOne(recentQuery).lean();
    if (recentView) {
      return res.status(200).json({
        success: true,
        counted: false,
        message: 'View already recorded within deduplication window',
        viewsCount: project.viewsCount || 0,
        uniqueViewsCount: project.uniqueViewsCount || 0,
      });
    }

    const lifetimeQuery = { project: project._id };
    if (viewerId) lifetimeQuery.viewer = viewerId;
    else if (effectiveSessionId) lifetimeQuery.sessionId = effectiveSessionId;
    else lifetimeQuery.ipHash = ipHash;

    const previousLifetimeView = await ProjectView.findOne(lifetimeQuery).lean();
    const isFirstTimeUnique = !previousLifetimeView;

    await ProjectView.create({
      project: project._id,
      viewer: viewerId,
      sessionId: effectiveSessionId,
      ipHash,
    });

    const incUpdate = { viewsCount: 1 };
    if (isFirstTimeUnique) {
      incUpdate.uniqueViewsCount = 1;
    }

    const updated = await Project.findByIdAndUpdate(project._id, { $inc: incUpdate }, { new: true });

    return res.status(200).json({
      success: true,
      counted: true,
      isUnique: isFirstTimeUnique,
      viewsCount: updated.viewsCount || 1,
      uniqueViewsCount: updated.uniqueViewsCount || 1,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7e. BOOKMARKS / SAVED PROJECTS
// ==========================================

const bookmarkHandler = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await ProjectBookmark.findOneAndUpdate(
      { user: req.user._id, project: project._id },
      { user: req.user._id, project: project._id },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Project bookmarked successfully',
      isBookmarked: true,
    });
  } catch (err) {
    next(err);
  }
};
projectRouter.post('/:id/bookmark', protect, bookmarkHandler);
projectRouter.post('/:id/save', protect, bookmarkHandler);

const unbookmarkHandler = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await ProjectBookmark.findOneAndDelete({
      user: req.user._id,
      project: project._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Project removed from bookmarks',
      isBookmarked: false,
    });
  } catch (err) {
    next(err);
  }
};
projectRouter.delete('/:id/bookmark', protect, unbookmarkHandler);
projectRouter.delete('/:id/save', protect, unbookmarkHandler);

// ==========================================
// 8. POST /api/projects/:projectId/applications - Submit proposal
// ==========================================
const applyToProjectHandler = async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Status check
    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Project is currently ${project.status} and not accepting new applications`,
      });
    }

    // Owner cannot apply to their own project
    if (String(project.owner) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot apply to their own project',
      });
    }

    // Deadline check
    const deadline = project.applicationDeadline || project.deadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline for this project has passed',
      });
    }

    // Capacity check
    if (project.teamSize && project.acceptedApplicantsCount >= project.teamSize) {
      return res.status(400).json({
        success: false,
        message: 'This project has already filled all available team positions',
      });
    }

    const { coverLetter, proposedRate, resumeUrl } = req.body || {};

    if (coverLetter && typeof coverLetter === 'string' && coverLetter.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Cover letter cannot exceed 3000 characters',
      });
    }

    if (proposedRate && typeof proposedRate === 'string' && proposedRate.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Proposed rate cannot exceed 100 characters',
      });
    }

    // Check duplicate or previously withdrawn application
    let existingApp = await Application.findOne({
      project: project._id,
      applicant: req.user._id,
    });

    if (existingApp) {
      if (existingApp.status === 'withdrawn') {
        // Re-activate previously withdrawn application
        existingApp.status = 'pending';
        existingApp.coverLetter = coverLetter || existingApp.coverLetter;
        existingApp.proposedRate = proposedRate || existingApp.proposedRate;
        if (resumeUrl) existingApp.resumeUrl = resumeUrl;
        await existingApp.save();

        await sendNotification({
          recipient: project.owner,
          sender: req.user._id,
          type: 'application',
          title: 'Application Resubmitted',
          message: `${req.user.name} resubmitted their application to "${project.title}"`,
          link: `/projects/${project._id}`,
        });

        return res.status(200).json({
          success: true,
          message: 'Application resubmitted successfully',
          application: existingApp,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this project',
      });
    }

    // Snapshot user details for fast audit
    const applicantUser = await User.findById(req.user._id);

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      coverLetter: coverLetter || 'I am interested in collaborating on this project.',
      proposedRate: proposedRate || '',
      resumeUrl: resumeUrl || '',
      status: 'pending',
      applicantSnapshot: {
        name: applicantUser?.name || req.user.name,
        username: applicantUser?.username || req.user.username,
        headline: applicantUser?.headline || '',
        avatar: applicantUser?.avatar || '',
        skills: applicantUser?.skills || [],
      },
    });

    // Increment applications count
    await Project.findByIdAndUpdate(project._id, { $inc: { applicationsCount: 1 } });

    // Record application activity
    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      action: 'application_submitted',
      details: { applicationId: application._id },
    });

    // Notify project owner
    await sendNotification({
      recipient: project.owner,
      sender: req.user._id,
      type: 'application',
      title: 'New Project Application',
      message: `${applicantUser?.name || 'A developer'} submitted an application to "${project.title}"`,
      link: `/projects/${project._id}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully to project owner',
      application,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this project',
      });
    }
    next(err);
  }
};

projectRouter.post('/:id/applications', protect, applyToProjectHandler);
projectRouter.post('/:id/apply', protect, applyToProjectHandler);

// ==========================================
// 9. GET /api/projects/:projectId/applications/me - Own application
// ==========================================
projectRouter.get('/:id/applications/me', protect, async (req, res, next) => {
  try {
    const application = await Application.findOne({
      project: req.params.id,
      applicant: req.user._id,
    });

    return res.status(200).json({
      success: true,
      hasApplied: Boolean(application && application.status !== 'withdrawn'),
      application: application || null,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 10. DELETE /api/projects/:projectId/applications/me - Withdraw own proposal
// ==========================================
projectRouter.delete('/:id/applications/me', protect, async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const application = await Application.findOne({
      project: req.params.id,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn' });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw a rejected application' });
    }

    const wasAccepted = application.status === 'accepted';
    application.status = 'withdrawn';
    await application.save();

    // Reconcile applicationsCount
    await Project.findOneAndUpdate(
      { _id: application.project, applicationsCount: { $gt: 0 } },
      { $inc: { applicationsCount: -1 } }
    );

    if (wasAccepted) {
      // Reconcile accepted count and members
      await Project.findOneAndUpdate(
        { _id: application.project, acceptedApplicantsCount: { $gt: 0 } },
        {
          $inc: { acceptedApplicantsCount: -1 },
          $pull: { members: { user: application.applicant } },
        }
      );

      await ProjectMember.deleteMany({
        project: application.project,
        user: application.applicant,
      });

      const proj = await Project.findById(application.project);
      if (proj && proj.status === 'in_progress' && proj.acceptedApplicantsCount < (proj.teamSize || 1)) {
        proj.status = 'open';
        await proj.save();
      }
    }

    const project = await Project.findById(application.project);
    if (project) {
      await ProjectActivity.create({
        project: project._id,
        user: req.user._id,
        action: 'application_withdrawn',
        details: { applicationId: application._id },
      });

      await sendNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: 'application',
        title: 'Application Withdrawn',
        message: `${req.user.name} withdrew their application from "${project.title}"`,
        link: `/projects/${project._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      application,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 11. GET /api/projects/:projectId/applications - Owner view of applications
// ==========================================
projectRouter.get('/:id/applications', protect, async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can view applicants',
      });
    }

    const query = { project: project._id };
    if (req.query.status && typeof req.query.status === 'string') {
      const normStatus = req.query.status.toLowerCase().trim();
      if (['pending', 'accepted', 'rejected', 'withdrawn'].includes(normStatus)) {
        query.status = normStatus;
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('applicant', 'name username email avatar avatarUrl role skills headline location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      applications,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 12. GET /api/projects/:id/workspace - Protected Project Workspace Data
// ==========================================
projectRouter.get('/:id/workspace', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('owner', 'name username avatar avatarUrl headline role')
      .lean();

    // Fetch active members
    const memberDocs = await ProjectMember.find({
      project: project._id,
      status: 'active',
    })
      .populate('user', 'name username avatar avatarUrl headline skills')
      .sort({ joinedAt: 1 })
      .lean();

    const team = [];
    const seenUsers = new Set();
    for (const doc of memberDocs) {
      if (!doc.user) continue;
      seenUsers.add(String(doc.user._id));
      team.push({
        _id: doc._id,
        user: {
          _id: doc.user._id,
          name: doc.user.name,
          username: doc.user.username,
          avatar: doc.user.avatar || doc.user.avatarUrl,
          headline: doc.user.headline || '',
          skills: doc.user.skills || [],
        },
        role: doc.role,
        status: doc.status,
        joinedAt: doc.joinedAt,
      });
    }

    // Ensure owner is included in team list
    const ownerId = String(project.owner?._id || project.owner);
    if (!seenUsers.has(ownerId) && project.owner) {
      team.unshift({
        _id: `owner-${project._id}`,
        user: {
          _id: project.owner._id,
          name: project.owner.name,
          username: project.owner.username,
          avatar: project.owner.avatar || project.owner.avatarUrl,
          headline: project.owner.headline || '',
          skills: project.owner.skills || [],
        },
        role: 'owner',
        status: 'active',
        joinedAt: project.createdAt,
      });
    }

    // Recent activity audit log
    const activities = await ProjectActivity.find({ project: project._id })
      .populate('user', 'name username avatar avatarUrl')
      .populate('targetUser', 'name username avatar avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      workspace: {
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          category: project.category,
          projectType: project.projectType,
          experienceLevel: project.experienceLevel,
          teamSize: project.teamSize,
          acceptedApplicantsCount: project.acceptedApplicantsCount,
          budget: project.budget,
          duration: project.duration,
          status: project.status,
          visibility: project.visibility,
          requiredSkills: project.requiredSkills,
          githubRepoUrl: project.githubRepoUrl,
          liveDemoUrl: project.liveDemoUrl,
          createdAt: project.createdAt,
          owner: project.owner,
        },
        membership: {
          role: req.workspaceMembership.role,
          status: req.workspaceMembership.status,
          joinedAt: req.workspaceMembership.joinedAt,
        },
        isOwner: req.isWorkspaceOwner,
        team,
        activities,
        placeholders: {
          tasks: {
            title: 'Task & Milestone Management',
            description: 'Sprint planning and assignment workspace ready for Phase 5 integration.',
            phase: 5,
            status: 'scaffolded',
            readyForPhase5: true,
          },
          chat: {
            title: 'Real-Time Team Communication',
            description: 'Live channels and collaboration rooms ready for Phase 6 Socket.IO integration.',
            phase: 6,
            status: 'scaffolded',
            readyForPhase6: true,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 13. GET /api/projects/:id/activities - Project activity audit trail
// ==========================================
projectRouter.get('/:id/activities', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const activities = await ProjectActivity.find({ project: req.project._id })
      .populate('user', 'name username avatar avatarUrl')
      .populate('targetUser', 'name username avatar avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 14. GET /api/projects/:id/members - List active team members (Safe public projection)
// ==========================================
projectRouter.get('/:id/members', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name username avatar avatarUrl headline');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Find active members
    const memberDocs = await ProjectMember.find({
      project: project._id,
      status: 'active',
    })
      .populate('user', 'name username avatar avatarUrl headline skills')
      .sort({ joinedAt: 1 })
      .lean();

    const membersList = [];
    const seenUsers = new Set();

    for (const doc of memberDocs) {
      if (!doc.user) continue;
      const uId = String(doc.user._id);
      seenUsers.add(uId);
      membersList.push({
        _id: doc._id,
        id: doc._id,
        user: {
          _id: doc.user._id,
          id: doc.user._id,
          name: doc.user.name,
          username: doc.user.username,
          avatar: doc.user.avatar || doc.user.avatarUrl,
          avatarUrl: doc.user.avatarUrl || doc.user.avatar,
          headline: doc.user.headline || '',
          skills: doc.user.skills || [],
        },
        role: doc.role,
        status: doc.status,
        joinedAt: doc.joinedAt,
      });
    }

    // Ensure owner is included if not in ProjectMember collection
    const ownerId = String(project.owner?._id || project.owner);
    if (!seenUsers.has(ownerId) && project.owner) {
      membersList.unshift({
        _id: `owner-${project._id}`,
        id: `owner-${project._id}`,
        user: {
          _id: project.owner._id,
          id: project.owner._id,
          name: project.owner.name,
          username: project.owner.username,
          avatar: project.owner.avatar || project.owner.avatarUrl,
          avatarUrl: project.owner.avatarUrl || project.owner.avatar,
          headline: project.owner.headline || '',
          skills: project.owner.skills || [],
        },
        role: 'owner',
        status: 'active',
        joinedAt: project.createdAt,
      });
    }

    return res.status(200).json({
      success: true,
      count: membersList.length,
      members: membersList,
      data: membersList,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 15. GET /api/projects/:id/members/me - Current user's membership in project
// ==========================================
projectRouter.get('/:id/members/me', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    if (isOwner) {
      return res.status(200).json({
        success: true,
        isMember: true,
        role: 'owner',
        status: 'active',
        joinedAt: project.createdAt,
      });
    }

    const memberDoc = await ProjectMember.findOne({
      project: project._id,
      user: req.user._id,
    });

    if (!memberDoc) {
      return res.status(200).json({
        success: true,
        isMember: false,
        role: null,
        status: null,
      });
    }

    return res.status(200).json({
      success: true,
      isMember: memberDoc.status === 'active',
      role: memberDoc.role,
      status: memberDoc.status,
      joinedAt: memberDoc.joinedAt,
      removedAt: memberDoc.removedAt,
      removalReason: memberDoc.removalReason,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 16. DELETE /api/projects/:id/members/me - Member leaves project
// ==========================================
projectRouter.delete('/:id/members/me', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    if (isOwner) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot leave their own project',
      });
    }

    const membership = await ProjectMember.findOne({
      project: project._id,
      user: req.user._id,
      status: 'active',
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active membership not found for this project',
      });
    }

    membership.status = 'left';
    membership.removedAt = new Date();
    await membership.save();

    // Decrement accepted count and remove from embedded members array
    await Project.findByIdAndUpdate(project._id, {
      $inc: { acceptedApplicantsCount: -1 },
      $pull: { members: { user: req.user._id } },
    });

    // Revoke access to project conversation
    await Conversation.updateOne(
      { project: project._id },
      { $pull: { participants: req.user._id } }
    );

    // Reconcile associated accepted applications
    await Application.updateMany(
      { project: project._id, applicant: req.user._id, status: 'accepted' },
      { status: 'withdrawn', decisionReason: 'Member left project voluntarily' }
    );

    // Unassign departing member from active tasks (Safe unassignment policy)
    const assignedTasks = await Task.find({
      project: project._id,
      assignees: req.user._id,
      isDeleted: { $ne: true },
    });

    if (assignedTasks.length > 0) {
      await Task.updateMany(
        { project: project._id, assignees: req.user._id },
        { $pull: { assignees: req.user._id } }
      );
      await ProjectActivity.create({
        project: project._id,
        user: req.user._id,
        targetUser: req.user._id,
        action: 'task_unassigned',
        details: {
          reason: 'Member departed from project team',
          unassignedTasksCount: assignedTasks.length,
          taskIds: assignedTasks.map((t) => t._id),
        },
      });
    }

    // Log activity
    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      action: 'member_left',
      details: { role: membership.role },
    });

    // Notify project owner
    await sendNotification({
      recipient: project.owner,
      sender: req.user._id,
      type: 'team',
      title: 'Team Member Left',
      message: `${req.user.name} has left the team for "${project.title}".`,
      link: `/projects/${project._id}`,
    });

    // Real-time WebSocket synchronization
    emitToProject(project._id, 'member:removed', {
      userId: req.user._id,
      reason: 'Member left project voluntarily',
    }, {
      actor: req.user,
      resourceId: req.user._id,
    });
    revokeUserProjectAccess(req.user._id, project._id, 'Member left project voluntarily');
    emitToProject(project._id, 'activity:new', {
      project: project._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      action: 'member_left',
      details: { role: membership.role },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'You have left the project team',
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 17. DELETE /api/projects/:id/members/:userId - Owner removes member
// ==========================================
projectRouter.delete('/:id/members/:userId', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can remove team members',
      });
    }

    if (String(project.owner) === String(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot be removed from the project',
      });
    }

    const membership = await ProjectMember.findOne({
      project: project._id,
      user: req.params.userId,
      status: 'active',
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active member record not found',
      });
    }

    const reason = req.body?.reason || 'Removed by project owner';
    membership.status = 'removed';
    membership.removedAt = new Date();
    membership.removedBy = req.user._id;
    membership.removalReason = reason;
    await membership.save();

    await Project.findByIdAndUpdate(project._id, {
      $inc: { acceptedApplicantsCount: -1 },
      $pull: { members: { user: req.params.userId } },
    });

    // Revoke access to project conversation
    await Conversation.updateOne(
      { project: project._id },
      { $pull: { participants: req.params.userId } }
    );

    // Reconcile associated accepted applications
    await Application.updateMany(
      { project: project._id, applicant: req.params.userId, status: 'accepted' },
      { status: 'withdrawn', decisionReason: `Membership terminated: ${reason}` }
    );

    // Unassign removed member from active tasks (Safe unassignment policy)
    const assignedTasks = await Task.find({
      project: project._id,
      assignees: req.params.userId,
      isDeleted: { $ne: true },
    });

    if (assignedTasks.length > 0) {
      await Task.updateMany(
        { project: project._id, assignees: req.params.userId },
        { $pull: { assignees: req.params.userId } }
      );
      await ProjectActivity.create({
        project: project._id,
        user: req.user._id,
        targetUser: req.params.userId,
        action: 'task_unassigned',
        details: {
          reason: 'Member removed from project team by owner',
          unassignedTasksCount: assignedTasks.length,
          taskIds: assignedTasks.map((t) => t._id),
        },
      });
    }

    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      targetUser: req.params.userId,
      action: 'member_removed',
      details: { reason },
    });

    await sendNotification({
      recipient: req.params.userId,
      sender: req.user._id,
      type: 'team',
      title: 'Removed from Project Team',
      message: `You were removed from the project "${project.title}".`,
      link: `/projects/${project._id}`,
    });

    // Real-time WebSocket synchronization
    emitToProject(project._id, 'member:removed', {
      userId: req.params.userId,
      reason,
    }, {
      actor: req.user,
      resourceId: req.params.userId,
    });
    revokeUserProjectAccess(req.params.userId, project._id, reason);
    emitToProject(project._id, 'activity:new', {
      project: project._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetUser: req.params.userId,
      action: 'member_removed',
      details: { reason },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully from project team',
      membership,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 18. PATCH /api/projects/:id/members/:userId/role - Update member role
// ==========================================
projectRouter.patch('/:id/members/:userId/role', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can update member roles',
      });
    }

    if (String(project.owner) === String(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify project owner role',
      });
    }

    const { role } = req.body;
    if (!role || !['member', 'manager'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "member" or "manager"',
      });
    }

    const membership = await ProjectMember.findOne({
      project: project._id,
      user: req.params.userId,
      status: 'active',
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Active member record not found',
      });
    }

    const previousRole = membership.role;
    membership.role = role.toLowerCase();
    await membership.save();

    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      targetUser: req.params.userId,
      action: 'role_updated',
      details: { previousRole, newRole: membership.role },
    });

    await sendNotification({
      recipient: req.params.userId,
      sender: req.user._id,
      type: 'team',
      title: 'Project Role Updated',
      message: `Your role on "${project.title}" has been updated to ${membership.role}.`,
      link: `/projects/${project._id}/workspace`,
    });

    // Real-time WebSocket synchronization
    emitToProject(project._id, 'member:roleChanged', {
      userId: req.params.userId,
      previousRole,
      newRole: membership.role,
    }, {
      actor: req.user,
      resourceId: req.params.userId,
    });
    emitToUser(req.params.userId, 'workspace:updated', {
      projectId: project._id,
      role: membership.role,
    });
    emitToProject(project._id, 'activity:new', {
      project: project._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetUser: req.params.userId,
      action: 'role_updated',
      details: { previousRole, newRole: membership.role },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Member role updated to ${membership.role}`,
      membership,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 19. GET /api/projects/:id/progress - Project progress metrics overview
// ==========================================
projectRouter.get('/:id/progress', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const projectId = req.project._id;

    const [tasks, milestones] = await Promise.all([
      Task.find({ project: projectId, isDeleted: { $ne: true } })
        .populate('assignees', 'name username avatar avatarUrl')
        .lean(),
      Milestone.find({ project: projectId, isDeleted: { $ne: true } }).lean(),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const inReviewTasks = tasks.filter((t) => t.status === 'in_review').length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;
    const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
    const inProgressMilestones = milestones.filter((m) => m.status === 'in_progress').length;
    const upcomingMilestones = milestones.filter((m) => m.status === 'upcoming').length;

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const priorityBreakdown = {
      low: tasks.filter((t) => t.priority === 'low').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
    };

    return res.status(200).json({
      success: true,
      progress: {
        projectId,
        overallProgress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        todoTasks,
        blockedTasks,
        overdueTasks,
        totalMilestones,
        completedMilestones,
        inProgressMilestones,
        upcomingMilestones,
        priorityBreakdown,
      },
      data: {
        overallProgress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        todoTasks,
        blockedTasks,
        overdueTasks,
        totalMilestones,
        completedMilestones,
        inProgressMilestones,
        upcomingMilestones,
        priorityBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 20. Project Workspace Conversation (Phase 6)
// ==========================================
projectRouter.get('/:id/conversation', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const project = req.project;
    let conv = await Conversation.findOne({ project: project._id })
      .populate('participants', 'name username email avatar avatarUrl role')
      .populate('project', 'title description category status owner');

    if (!conv) {
      conv = await Conversation.create({
        type: 'project',
        project: project._id,
        title: project.title,
        participants: [project.owner, req.user._id].filter(Boolean),
      });

      conv = await Conversation.findById(conv._id)
        .populate('participants', 'name username email avatar avatarUrl role')
        .populate('project', 'title description category status owner');
    } else if (!conv.participants.some((p) => String(p._id) === String(req.user._id))) {
      conv.participants.push(req.user._id);
      await conv.save();
    }

    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 21. Mount Task & Milestone nested routers
// ==========================================
projectRouter.use('/:projectId/tasks', taskRouter);
projectRouter.use('/:id/tasks', taskRouter);
projectRouter.use('/:projectId/milestones', milestoneRouter);
projectRouter.use('/:id/milestones', milestoneRouter);

export default projectRouter;
