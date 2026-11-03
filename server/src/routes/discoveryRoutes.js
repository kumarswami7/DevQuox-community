import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill, SKILL_CATEGORIES, normalizeSkillName, createSkillSlug } from '../models/Skill.js';
import {
  findSkillByNameOrAlias,
  resolveSkillIcon,
  searchCanonicalSkills,
  CANONICAL_SKILLS,
} from '../config/skillRegistry.js';
import { DeveloperBookmark } from '../models/DeveloperBookmark.js';
import { ProjectBookmark } from '../models/ProjectBookmark.js';
import { Reaction } from '../models/Reaction.js';
import { ProjectRepost } from '../models/ProjectRepost.js';
import { SavedSearch } from '../models/SavedSearch.js';
import { Follow } from '../models/Follow.js';
import { Application } from '../models/Application.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

export const discoveryRouter = express.Router();
export const portfolioRouter = express.Router();
export const skillsRouter = express.Router();
export const bookmarksRouter = express.Router();
export const savedSearchesRouter = express.Router();
export const followRouter = express.Router();

// Helper: Safe Regex Escape
const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper: URL Validator
const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEVELOPER & PROJECT DISCOVERY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/discovery/developers or /api/developers
discoveryRouter.get(['/developers', '/'], optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const {
      q,
      skill,
      skills,
      category,
      experienceLevel,
      availability,
      openTo,
      role,
      preferredRole,
      location,
      timezone,
      minRating,
      sort,
    } = req.query;

    // 1. Privacy enforcement:
    // Determine which profiles are strictly disallowed:
    // Guests cannot see private or authenticated-only profiles.
    // Authenticated users cannot see private profiles.
    const disallowedVisibility = req.user ? ['private'] : ['private', 'authenticated'];
    const disallowedUserIds = await Profile.find({ visibility: { $in: disallowedVisibility } }).distinct('user');

    // Base user filter: active accounts with developer role only
    const userFilter = {
      _id: { $nin: disallowedUserIds },
      status: 'active',
      role: 'developer',
    };

    // Experience Level filter
    if (experienceLevel && experienceLevel.trim()) {
      const expLower = experienceLevel.toLowerCase().trim();
      const profileUserIds = await Profile.find({ experienceLevel: expLower }).distinct('user');
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [
          { experienceLevel: expLower },
          { _id: { $in: profileUserIds } },
        ],
      });
    }

    // Availability filter
    if (availability && availability.trim()) {
      const availLower = availability.toLowerCase().trim();
      const profileUserIds = await Profile.find({ availability: availLower }).distinct('user');
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [
          { availability: availLower },
          { _id: { $in: profileUserIds } },
        ],
      });
    }

    // Skill Category filter
    if (category && category.trim()) {
      const catRegex = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
      const profileUserIds = await Profile.find({
        $or: [
          { 'skillsWithProficiency.category': catRegex },
          { category: catRegex },
        ],
      }).distinct('user');
      userFilter._id = { $in: profileUserIds, $nin: disallowedUserIds };
    }

    // Skills filter (supports single or comma-separated multiple skills)
    const targetSkill = skill || skills;
    if (targetSkill && targetSkill.trim()) {
      const skillsArr = targetSkill.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillsArr.length > 0) {
        const skillRegexes = skillsArr.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i'));
        const profileUserIds = await Profile.find({ skills: { $in: skillRegexes } }).distinct('user');
        userFilter.$and = userFilter.$and || [];
        userFilter.$and.push({
          $or: [
            { skills: { $in: skillRegexes } },
            { _id: { $in: profileUserIds } },
          ],
        });
      }
    }

    // Preferred Role filter
    if (preferredRole || role) {
      const roleStr = preferredRole || role;
      const roleRegex = new RegExp(escapeRegex(roleStr.trim()), 'i');
      const profileUserIds = await Profile.find({ preferredRoles: { $in: [roleRegex] } }).distinct('user');
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [
          { headline: roleRegex },
          { _id: { $in: profileUserIds } },
        ],
      });
    }

    // Timezone filter
    if (timezone && timezone.trim()) {
      const tzRegex = new RegExp(escapeRegex(timezone.trim()), 'i');
      const profileUserIds = await Profile.find({ timezone: tzRegex }).distinct('user');
      userFilter.$and = userFilter.$and || [];
      userFilter.$and.push({
        $or: [
          { timezone: tzRegex },
          { _id: { $in: profileUserIds } },
        ],
      });
    }

    // Location filter
    if (location && location.trim()) {
      userFilter.location = { $regex: escapeRegex(location.trim()), $options: 'i' };
    }

    // Open-To work preferences filter
    if (openTo && openTo.trim()) {
      const openToArr = openTo.split(',').map((o) => o.trim()).filter(Boolean);
      if (openToArr.length > 0) {
        userFilter.openTo = { $in: openToArr.map((o) => new RegExp(escapeRegex(o), 'i')) };
      }
    }

    // Minimum rating filter
    if (minRating !== undefined && minRating !== '') {
      const parsedRating = parseFloat(minRating);
      if (!isNaN(parsedRating)) {
        userFilter.rating = { $gte: parsedRating };
      }
    }

    // Search query matching name, username, headline, bio, or skills
    if (q && q.trim()) {
      const queryRegex = new RegExp(escapeRegex(q.trim()), 'i');
      userFilter.$or = [
        { name: queryRegex },
        { username: queryRegex },
        { headline: queryRegex },
        { bio: queryRegex },
        { skills: queryRegex },
      ];
    }

    // Sorting logic with deterministic secondary keys
    let sortCriteria = { rating: -1, completedProjectsCount: -1, createdAt: -1, _id: -1 };
    if (sort === 'recently_updated') {
      sortCriteria = { updatedAt: -1, createdAt: -1, _id: -1 };
    } else if (sort === 'projects_count' || sort === 'projects') {
      sortCriteria = { completedProjectsCount: -1, rating: -1, createdAt: -1, _id: -1 };
    } else if (sort === 'rating') {
      sortCriteria = { rating: -1, completedProjectsCount: -1, createdAt: -1, _id: -1 };
    } else if (sort === 'experience') {
      sortCriteria = { completedProjectsCount: -1, rating: -1, createdAt: -1, _id: -1 };
    }

    const total = await User.countDocuments(userFilter);
    const developers = await User.find(userFilter)
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit);

    // Map to safe public representations (stripping emails, passwords, reset hashes)
    const safeDevelopers = developers.map((dev) => dev.toPublicProfile());

    return res.status(200).json({
      success: true,
      data: safeDevelopers,
      developers: safeDevelopers,
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

// GET /api/v1/discovery/recommendations/developers
discoveryRouter.get('/recommendations/developers', optionalAuth, async (req, res, next) => {
  try {
    const disallowedVisibility = req.user ? ['private'] : ['private', 'authenticated'];
    const disallowedUserIds = await Profile.find({ visibility: { $in: disallowedVisibility } }).distinct('user');

    const topDevelopers = await User.find({
      _id: { $nin: disallowedUserIds },
      role: 'developer',
      status: 'active',
    })
      .sort({ rating: -1, completedProjectsCount: -1, createdAt: -1 })
      .limit(12);

    const scoredRecommendations = topDevelopers.map((dev) => {
      const rating = typeof dev.rating === 'number' ? dev.rating : 5.0;
      const completed = typeof dev.completedProjectsCount === 'number' ? dev.completedProjectsCount : 0;
      const score = Math.round(rating * 20 + Math.min(completed * 5, 20));
      const reason =
        completed > 0
          ? `${rating}★ Rated Developer with ${completed} completed community projects`
          : 'Top Rated Developer with proven track record in community projects';

      const publicProf = dev.toPublicProfile();
      return {
        item: publicProf,
        developer: publicProf,
        score,
        matchScore: score,
        reason,
        reasons: [reason],
      };
    });

    scoredRecommendations.sort((a, b) => b.score - a.score);
    const recommendations = scoredRecommendations.slice(0, 6);

    return res.status(200).json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/discovery/projects - Project and Collaboration Discovery
discoveryRouter.get('/projects', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const { q, skills, category, minBudget, maxBudget, tags } = req.query;

    // Discovery shows Open and Active recruiting projects.
    const filter = { status: { $in: ['open', 'Open', 'in_progress'] } };

    if (category && category !== 'All Projects' && category !== 'All Categories') {
      if (category.toLowerCase().includes('ai')) {
        filter.category = { $regex: /ai/i };
      } else if (category.toLowerCase().includes('cloud') || category.toLowerCase().includes('devops')) {
        filter.category = { $regex: /cloud|devops/i };
      } else {
        filter.category = { $regex: new RegExp(category.trim(), 'i') };
      }
    }

    if (skills) {
      const skillsArr = skills.split(',').map((s) => s.trim());
      filter.requiredSkills = { $in: skillsArr.map((s) => new RegExp(`^${s}$`, 'i')) };
    }

    if (tags) {
      const tagsArr = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagsArr };
    }

    if (minBudget || maxBudget) {
      const budgetConditions = [];
      if (minBudget) {
        budgetConditions.push({ budgetMax: { $gte: parseFloat(minBudget) } });
      }
      if (maxBudget) {
        budgetConditions.push({ budgetMin: { $lte: parseFloat(maxBudget) } });
      }
      if (budgetConditions.length > 0) {
        filter.$and = budgetConditions;
      }
    }

    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('owner', 'name username avatar avatarUrl headline role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    let enrichedProjects = projects;
    if (req.user && projects.length > 0) {
      const projectIds = projects.map((p) => p._id);
      const [userBookmarks, userReactions, userReposts] = await Promise.all([
        ProjectBookmark.find({ user: req.user._id, project: { $in: projectIds } }).select('project').lean(),
        Reaction.find({ userId: req.user._id, targetType: 'project', targetId: { $in: projectIds } }).select('targetId reactionType').lean(),
        ProjectRepost.find({ user: req.user._id, project: { $in: projectIds } }).select('project').lean(),
      ]);

      const bookmarkedSet = new Set(userBookmarks.map((b) => String(b.project)));
      const reactionMap = new Map(userReactions.map((r) => [String(r.targetId), r.reactionType]));
      const repostedSet = new Set(userReposts.map((r) => String(r.project)));

      enrichedProjects = projects.map((p) => {
        const pId = String(p._id);
        return {
          ...p,
          isBookmarked: bookmarkedSet.has(pId),
          userReaction: reactionMap.get(pId) || null,
          hasReposted: repostedSet.has(pId),
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: enrichedProjects,
      projects: enrichedProjects,
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

// GET /api/v1/discovery/recommendations/projects
discoveryRouter.get('/recommendations/projects', async (req, res, next) => {
  try {
    const topProjects = await Project.find({ status: { $in: ['open', 'Open'] } })
      .populate('owner', 'name username avatar avatarUrl role')
      .sort({ createdAt: -1 })
      .limit(6);

    const recommendations = topProjects.map((p) => ({
      item: p,
      score: 90,
      reason: 'Actively recruiting developers with competitive budgets',
    }));

    return res.status(200).json({ success: true, data: recommendations });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/discovery/developers/:id or /api/developers/:id
discoveryRouter.get(['/developers/:id', '/:id'], optionalAuth, async (req, res, next) => {
  try {
    const idOrUsername = req.params.id;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
      user = await User.findById(idOrUsername);
    }
    if (!user) {
      user = await User.findOne({ username: idOrUsername.toLowerCase() });
    }

    if (!user || user.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Developer profile not found' });
    }

    const profile = await Profile.findOne({ user: user._id });

    // Check visibility
    if (profile && profile.visibility === 'private') {
      const isOwner = req.user && String(req.user._id) === String(user._id);
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'This developer profile is private' });
      }
    }

    if (profile && profile.visibility === 'authenticated' && !req.user) {
      return res.status(401).json({ success: false, message: 'Please sign in to view this profile' });
    }

    const safeUser = user.toPublicProfile();

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        profile: profile || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PORTFOLIO ROUTES (GET public, GET me, PATCH me, PROJECTS CRUD, SKILLS)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/portfolios/me - Authenticated user's full private & public portfolio
portfolioRouter.get('/me', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate(
      'portfolio.projectRef',
      'title category status budget duration'
    );

    if (!profile) {
      profile = await Profile.create({
        user: req.user._id,
        title: req.user.headline || 'Software Developer',
        headline: req.user.headline || '',
        bio: req.user.bio || '',
        about: req.user.bio || '',
        skills: req.user.skills || [],
        experienceLevel: req.user.experienceLevel || 'mid',
        preferredRoles: req.user.preferredRoles || [],
        availability: req.user.availability || 'available',
        openTo: req.user.openTo || ['full_time', 'freelance', 'contract'],
        location: req.user.location || '',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
      profile,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/portfolios/me - Update authenticated user's portfolio and settings
portfolioRouter.patch('/me', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    const {
      title,
      headline,
      bio,
      about,
      experienceLevel,
      preferredRoles,
      availability,
      visibility,
      openTo,
      preferredProjectTypes,
      languages,
      hourlyRate,
      location,
      timezone,
      githubUrl,
      linkedinUrl,
      websiteUrl,
      twitterUrl,
      skills,
      skillsWithProficiency,
    } = req.body;

    // Validate URLs if provided
    if (githubUrl && !isValidUrl(githubUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid GitHub URL format' });
    }
    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid LinkedIn URL format' });
    }
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid Website URL format' });
    }
    if (twitterUrl && !isValidUrl(twitterUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid Twitter/X URL format' });
    }

    // Apply allowed profile updates
    if (title !== undefined) profile.title = title;
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (about !== undefined) profile.about = about;
    if (experienceLevel !== undefined) profile.experienceLevel = experienceLevel;
    if (preferredRoles !== undefined) profile.preferredRoles = preferredRoles;
    if (availability !== undefined) profile.availability = availability;
    if (visibility !== undefined) profile.visibility = visibility;
    if (openTo !== undefined) profile.openTo = openTo;
    if (preferredProjectTypes !== undefined) profile.preferredProjectTypes = preferredProjectTypes;
    if (languages !== undefined) profile.languages = languages;
    if (hourlyRate !== undefined) profile.hourlyRate = Math.max(0, parseFloat(hourlyRate) || 0);
    if (location !== undefined) profile.location = location;
    if (timezone !== undefined) profile.timezone = timezone;
    if (githubUrl !== undefined) profile.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
    if (websiteUrl !== undefined) profile.websiteUrl = websiteUrl;
    if (twitterUrl !== undefined) profile.twitterUrl = twitterUrl;

    if (skills !== undefined && Array.isArray(skills)) {
      profile.skills = skills.map((s) => normalizeSkillName(s)).filter(Boolean);
    }
    if (skillsWithProficiency !== undefined && Array.isArray(skillsWithProficiency)) {
      profile.skillsWithProficiency = skillsWithProficiency;
    }

    await profile.save();

    // Mirror matching fields back to User model
    const userUpdates = {};
    if (headline !== undefined) userUpdates.headline = headline;
    if (bio !== undefined) userUpdates.bio = bio;
    if (availability !== undefined) userUpdates.availability = availability;
    if (openTo !== undefined) userUpdates.openTo = openTo;
    if (location !== undefined) userUpdates.location = location;
    if (hourlyRate !== undefined) userUpdates.hourlyRate = Math.max(0, parseFloat(hourlyRate) || 0);
    if (githubUrl !== undefined) userUpdates.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) userUpdates.linkedinUrl = linkedinUrl;
    if (websiteUrl !== undefined) userUpdates.websiteUrl = websiteUrl;
    if (twitterUrl !== undefined) userUpdates.twitterUrl = twitterUrl;
    if (skills !== undefined) userUpdates.skills = profile.skills;
    if (experienceLevel !== undefined) userUpdates.experienceLevel = experienceLevel;
    if (preferredRoles !== undefined) userUpdates.preferredRoles = preferredRoles;
    if (preferredProjectTypes !== undefined) userUpdates.preferredProjectTypes = preferredProjectTypes;
    if (languages !== undefined) userUpdates.languages = languages;
    if (timezone !== undefined) userUpdates.timezone = timezone;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    return res.status(200).json({
      success: true,
      message: 'Portfolio updated successfully',
      data: profile,
      profile,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/portfolios/:username - Public developer portfolio
portfolioRouter.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const usernameParam = req.params.username;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(usernameParam)) {
      user = await User.findById(usernameParam);
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { username: usernameParam.toLowerCase() },
          { name: { $regex: `^${usernameParam}$`, $options: 'i' } },
        ],
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Developer not found' });
    }

    let profile = await Profile.findOne({ user: user._id }).populate(
      'portfolio.projectRef',
      'title category status budget duration'
    );

    if (!profile) {
      profile = await Profile.create({
        user: user._id,
        title: user.headline || 'Software Developer',
        headline: user.headline || '',
        about: user.bio || '',
        bio: user.bio || '',
        skills: user.skills || [],
        experienceLevel: user.experienceLevel || 'mid',
        preferredRoles: user.preferredRoles || [],
        availability: user.availability || 'available',
        openTo: user.openTo || ['full_time', 'freelance', 'contract'],
        location: user.location || '',
      });
    }

    const isOwner = req.user && String(req.user._id) === String(user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    // Visibility Check
    if (profile.visibility === 'private' && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'This developer portfolio is private' });
    }

    if (profile.visibility === 'authenticated' && !req.user && !isOwner && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Please sign in to view this developer portfolio' });
    }

    // Convert to plain object to sanitize fields
    const safeProfile = profile.toObject();

    // Filter out private showcase projects unless requested by owner/admin
    if (!isOwner && !isAdmin && safeProfile.portfolio) {
      safeProfile.portfolio = safeProfile.portfolio.filter((p) => p.visibility !== 'private');
    }

    // Embed safe public user profile (excluding email, password, internal hashes)
    safeProfile.user = user.toPublicProfile();

    return res.status(200).json({
      success: true,
      data: safeProfile,
      profile: safeProfile,
      user: safeProfile.user,
    });
  } catch (err) {
    next(err);
  }
});

// ── Showcase Projects Management ─────────────────────────────────────────────

// POST /api/v1/portfolios/me/projects - Add a showcase project
portfolioRouter.post('/me/projects', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await Profile.create({ user: req.user._id });
    }

    const {
      title,
      description,
      skills,
      technologies,
      category,
      thumbnail,
      screenshots,
      repoUrl,
      liveUrl,
      role,
      contributionDescription,
      projectRef,
      inProgress,
      startDate,
      endDate,
      visibility,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    if (repoUrl && !isValidUrl(repoUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid repository URL format' });
    }
    if (liveUrl && !isValidUrl(liveUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid live demo URL format' });
    }

    let isDevConnect = false;
    let isVerified = false;

    // Validate DevConnect project link authorization if projectRef provided
    if (projectRef) {
      if (!mongoose.Types.ObjectId.isValid(projectRef)) {
        return res.status(400).json({ success: false, message: 'Invalid DevConnect project ID' });
      }

      const devconnectProject = await Project.findById(projectRef);
      if (!devconnectProject) {
        return res.status(404).json({ success: false, message: 'DevConnect project reference not found' });
      }

      // Check whether current user is owner OR accepted applicant OR active team member
      const isOwner = devconnectProject.owner.equals(req.user._id);
      const isMember = await ProjectMember.findOne({
        project: projectRef,
        user: req.user._id,
        status: 'active',
      });
      const isAcceptedApplicant = await Application.findOne({
        project: projectRef,
        applicant: req.user._id,
        status: 'accepted',
      });

      if (!isOwner && !isMember && !isAcceptedApplicant) {
        return res.status(403).json({
          success: false,
          message: 'You cannot link a DevConnect project you were not an authorized member or owner of',
        });
      }

      isDevConnect = true;
      isVerified = true;
    }

    const newProject = {
      title: title.trim(),
      description: description || '',
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      technologies: Array.isArray(technologies) ? technologies : (technologies ? [technologies] : []),
      category: category || 'Web Development',
      thumbnail: thumbnail || '',
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      repoUrl: repoUrl || '',
      liveUrl: liveUrl || '',
      role: role || '',
      contributionDescription: contributionDescription || '',
      projectRef: projectRef || null,
      source: isDevConnect ? 'devconnect' : 'independent',
      isVerified,
      inProgress: !!inProgress,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      visibility: visibility === 'private' ? 'private' : 'public',
      createdAt: new Date(),
    };

    profile.portfolio.push(newProject);
    await profile.save();

    // Update user showcase count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { showcaseCount: 1 },
    });

    const addedProject = profile.portfolio[profile.portfolio.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Showcase project added successfully',
      data: addedProject,
      project: addedProject,
      portfolio: profile.portfolio,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/portfolios/me/projects/:id - Update showcase project
portfolioRouter.patch('/me/projects/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const project = profile.portfolio.id(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Showcase project not found' });
    }

    const { repoUrl, liveUrl } = req.body;
    if (repoUrl && !isValidUrl(repoUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid repository URL format' });
    }
    if (liveUrl && !isValidUrl(liveUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid live demo URL format' });
    }

    Object.assign(project, req.body);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Showcase project updated',
      data: project,
      portfolio: profile.portfolio,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/portfolios/me/projects/:id - Remove showcase project
portfolioRouter.delete('/me/projects/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const project = profile.portfolio.id(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Showcase project not found' });
    }

    profile.portfolio.pull(req.params.id);
    await profile.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { showcaseCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Showcase project deleted',
      data: profile.portfolio,
    });
  } catch (err) {
    next(err);
  }
});

// ── Skills Profile Sub-Endpoints ─────────────────────────────────────────────

// POST /api/v1/portfolios/me/skills - Add or update a structured skill
portfolioRouter.post('/me/skills', protect, async (req, res, next) => {
  try {
    const { name, category, proficiency, yearsOfExperience } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const normalizedName = normalizeSkillName(name);

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await Profile.create({ user: req.user._id });
    }

    // Add to flat skills array if not present (case-insensitive deduplication)
    const existsInFlat = profile.skills.some(
      (s) => s.toLowerCase() === normalizedName.toLowerCase()
    );
    if (!existsInFlat) {
      profile.skills.push(normalizedName);
    }

    // Add or update in skillsWithProficiency
    const existingIndex = profile.skillsWithProficiency.findIndex(
      (s) => s.name.toLowerCase() === normalizedName.toLowerCase()
    );

    const skillItem = {
      name: normalizedName,
      category: category || 'General',
      proficiency: proficiency || 'intermediate',
      yearsOfExperience: Math.max(0, parseInt(yearsOfExperience) || 1),
    };

    if (existingIndex >= 0) {
      profile.skillsWithProficiency[existingIndex] = skillItem;
    } else {
      profile.skillsWithProficiency.push(skillItem);
    }

    await profile.save();

    // Sync to User model
    await User.findByIdAndUpdate(req.user._id, {
      skills: profile.skills,
      skillsWithProficiency: profile.skillsWithProficiency,
    });

    // Update global canonical skill usageCount
    await Skill.findOneAndUpdate(
      { slug: createSkillSlug(normalizedName) },
      {
        $setOnInsert: { name: normalizedName, slug: createSkillSlug(normalizedName), category: category || 'General' },
        $inc: { usageCount: 1 },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Skill added or updated successfully',
      skills: profile.skills,
      skillsWithProficiency: profile.skillsWithProficiency,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/portfolios/me/skills/:skillName - Remove a skill from user profile
portfolioRouter.delete('/me/skills/:skillName', protect, async (req, res, next) => {
  try {
    const targetName = decodeURIComponent(req.params.skillName).trim().toLowerCase();

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    profile.skills = profile.skills.filter((s) => s.toLowerCase() !== targetName);
    profile.skillsWithProficiency = profile.skillsWithProficiency.filter(
      (s) => s.name.toLowerCase() !== targetName
    );

    await profile.save();

    await User.findByIdAndUpdate(req.user._id, {
      skills: profile.skills,
      skillsWithProficiency: profile.skillsWithProficiency,
    });

    return res.status(200).json({
      success: true,
      message: 'Skill removed successfully',
      skills: profile.skills,
      skillsWithProficiency: profile.skillsWithProficiency,
    });
  } catch (err) {
    next(err);
  }
});

// ── Experience & Education Sub-Endpoints ─────────────────────────────────────

// POST /api/v1/portfolios/me/experience
portfolioRouter.post('/me/experience', protect, async (req, res, next) => {
  try {
    const { company, role, location, startDate, endDate, current, description } = req.body;
    if (!company || !role) {
      return res.status(400).json({ success: false, message: 'Company and role are required' });
    }

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = await Profile.create({ user: req.user._id });

    profile.experiences.push({
      company,
      role,
      location: location || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      current: !!current,
      description: description || '',
    });

    await profile.save();
    return res.status(201).json({ success: true, data: profile.experiences });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/portfolios/me/experience/:id
portfolioRouter.delete('/me/experience/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile.experiences.pull(req.params.id);
    await profile.save();
    return res.status(200).json({ success: true, data: profile.experiences });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/portfolios/me/education
portfolioRouter.post('/me/education', protect, async (req, res, next) => {
  try {
    const { institution, degree, fieldOfStudy, startYear, endYear, description } = req.body;
    if (!institution) {
      return res.status(400).json({ success: false, message: 'Institution is required' });
    }

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = await Profile.create({ user: req.user._id });

    profile.education.push({
      institution,
      degree: degree || '',
      fieldOfStudy: fieldOfStudy || '',
      startYear: startYear || null,
      endYear: endYear || null,
      description: description || '',
      university: req.body.university || null,
      universityCountry: req.body.universityCountry || '',
      universityLogoUrl: req.body.universityLogoUrl || '',
      universityDomain: req.body.universityDomain || '',
      isVerifiedUniversity: Boolean(req.body.isVerifiedUniversity),
      college: req.body.college || null,
      collegeName: req.body.collegeName || institution || '',
      collegeCity: req.body.collegeCity || '',
      collegeState: req.body.collegeState || '',
      collegeCountry: req.body.collegeCountry || req.body.universityCountry || '',
      collegeLogoUrl: req.body.collegeLogoUrl || req.body.universityLogoUrl || '',
      collegeLogoSource: req.body.collegeLogoSource || 'favicon',
      collegeInitials: req.body.collegeInitials || '',
      collegeWebsite: req.body.collegeWebsite || '',
      isVerifiedCollege: Boolean(req.body.isVerifiedCollege || req.body.isVerifiedUniversity),
    });

    if (req.body.college) {
      profile.college = req.body.college;
      await User.findByIdAndUpdate(req.user._id, { college: req.body.college });
    }

    await profile.save();
    return res.status(201).json({ success: true, data: profile.education });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/portfolios/me/education/:id
portfolioRouter.delete('/me/education/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile.education.pull(req.params.id);
    await profile.save();
    return res.status(200).json({ success: true, data: profile.education });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SKILLS TAXONOMY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/skills/categories - List available canonical skill categories
skillsRouter.get('/categories', (req, res) => {
  return res.status(200).json({ success: true, data: SKILL_CATEGORIES });
});

// GET /api/v1/skills/registry - List complete canonical developer skills registry with multi-provider icons
skillsRouter.get('/registry', (req, res) => {
  return res.status(200).json({ success: true, count: CANONICAL_SKILLS.length, data: CANONICAL_SKILLS });
});

// GET /api/v1/skills - List skills optionally by category or search
skillsRouter.get('/', async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q && q.trim()) {
      filter.name = { $regex: q.trim(), $options: 'i' };
    }

    let skills = await Skill.find(filter).sort({ usageCount: -1, name: 1 });

    // Fallback to canonical skills registry if database has not yet been seeded
    if ((!skills || skills.length === 0) && (!category || category === 'all')) {
      const canonicalMatches = searchCanonicalSkills(q || '', 50);
      return res.status(200).json({ success: true, data: canonicalMatches });
    }

    // Ensure icon fields are enriched
    const enriched = skills.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      if (!obj.iconUrl) {
        const iconMeta = resolveSkillIcon(obj.name);
        obj.iconUrl = iconMeta.iconUrl;
        obj.fallbackUrl = iconMeta.fallbackUrl;
        obj.iconifyUrl = iconMeta.iconifyUrl;
        obj.color = iconMeta.color;
        obj.iconProvider = iconMeta.provider;
      }
      return obj;
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/skills/suggest - Autocomplete suggestions with multi-provider icon metadata
skillsRouter.get('/suggest', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const dbSkills = await Skill.find({
      name: { $regex: q, $options: 'i' },
    })
      .limit(10)
      .sort({ usageCount: -1 });

    const canonicalMatches = searchCanonicalSkills(q, 10);
    const seenNames = new Set();
    const combined = [];

    // Prioritize exact canonical matches for top developer technologies
    for (const c of canonicalMatches) {
      seenNames.add(c.name.toLowerCase());
      combined.push(c);
    }

    for (const s of dbSkills) {
      if (!seenNames.has(s.name.toLowerCase())) {
        seenNames.add(s.name.toLowerCase());
        const sObj = s.toObject ? s.toObject() : { ...s };
        const iconMeta = resolveSkillIcon(sObj.name);
        combined.push({
          ...sObj,
          iconUrl: sObj.iconUrl || iconMeta.iconUrl,
          fallbackUrl: sObj.fallbackUrl || iconMeta.fallbackUrl,
          iconifyUrl: sObj.iconifyUrl || iconMeta.iconifyUrl,
          color: sObj.color || iconMeta.color,
          iconProvider: sObj.iconProvider || iconMeta.provider,
        });
      }
    }

    return res.status(200).json({ success: true, data: combined.slice(0, 12) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/skills/suggestions or /api/skills - Create or suggest canonical skill
skillsRouter.post(['/suggestions', '/'], protect, async (req, res, next) => {
  try {
    const { name, category, aliases } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const normalizedName = normalizeSkillName(name);
    const slug = createSkillSlug(normalizedName);
    const iconMeta = resolveSkillIcon(normalizedName);

    let skill = await Skill.findOne({ slug });

    if (!skill) {
      skill = await Skill.create({
        name: iconMeta.found ? iconMeta.name : normalizedName,
        slug,
        category: SKILL_CATEGORIES.includes(category)
          ? category
          : (iconMeta.category || 'General'),
        aliases: Array.isArray(aliases) ? aliases : [],
        iconProvider: iconMeta.provider || 'devicon',
        iconName: iconMeta.id || slug,
        iconUrl: iconMeta.iconUrl || '',
        fallbackUrl: iconMeta.fallbackUrl || '',
        iconifyUrl: iconMeta.iconifyUrl || '',
        color: iconMeta.color || '#64748b',
        usageCount: 1,
      });
    } else {
      skill.usageCount = (skill.usageCount || 0) + 1;
      if (!skill.iconUrl && iconMeta.iconUrl) {
        skill.iconUrl = iconMeta.iconUrl;
        skill.fallbackUrl = iconMeta.fallbackUrl;
        skill.color = iconMeta.color;
      }
      await skill.save();
    }

    return res.status(201).json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. BOOKMARKS / SAVED DEVELOPERS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/bookmarks or /api/developers/saved - List saved developers for authenticated user
bookmarksRouter.get(['/', '/saved', '/developers'], protect, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

    const total = await DeveloperBookmark.countDocuments({ user: req.user._id });
    const bookmarks = await DeveloperBookmark.find({ user: req.user._id })
      .populate({
        path: 'developer',
        select: '-password',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter out any deactivated/null developers and map to safe public profiles
    const savedDevelopers = bookmarks
      .filter((b) => b.developer && b.developer.status === 'active')
      .map((b) => {
        const publicDev = b.developer.toPublicProfile();
        return {
          ...publicDev,
          developer: publicDev,
          bookmarkId: b._id,
          notes: b.notes || '',
          bookmarkedAt: b.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      data: savedDevelopers,
      developers: savedDevelopers,
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

// POST /api/v1/bookmarks/developers/:id or /api/developers/:id/save
bookmarksRouter.post(['/developers/:id', '/:id/save', '/:id'], protect, async (req, res, next) => {
  try {
    const developerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(400).json({ success: false, message: 'Invalid developer ID' });
    }

    // Prevent bookmarking oneself
    if (String(req.user._id) === String(developerId)) {
      return res.status(400).json({ success: false, message: 'You cannot bookmark yourself and cannot save your own profile' });
    }

    const developer = await User.findById(developerId);
    if (!developer || developer.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Developer profile not found' });
    }

    if (developer.role !== 'developer') {
      return res.status(400).json({ success: false, message: 'Only developer accounts can be saved' });
    }

    const { notes = '' } = req.body || {};

    const existing = await DeveloperBookmark.findOne({ user: req.user._id, developer: developerId });
    if (existing) {
      if (req.body && req.body.notes !== undefined) {
        existing.notes = String(req.body.notes).slice(0, 500);
        await existing.save();
      }
      return res.status(200).json({
        success: true,
        message: 'Developer already bookmarked',
        data: existing,
      });
    }

    const bookmark = await DeveloperBookmark.create({
      user: req.user._id,
      developer: developerId,
      notes: String(notes).slice(0, 500),
    });

    return res.status(201).json({
      success: true,
      message: 'Developer saved to your favorites',
      data: bookmark,
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await DeveloperBookmark.findOne({ user: req.user._id, developer: req.params.id });
      return res.status(200).json({
        success: true,
        message: 'Developer already bookmarked',
        data: existing,
      });
    }
    next(err);
  }
});

// DELETE /api/v1/bookmarks/developers/:id or /api/developers/:id/save
bookmarksRouter.delete(['/developers/:id', '/:id/save', '/:id'], protect, async (req, res, next) => {
  try {
    const developerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(400).json({ success: false, message: 'Invalid developer ID' });
    }

    const deleted = await DeveloperBookmark.findOneAndDelete({
      user: req.user._id,
      developer: developerId,
    });

    return res.status(200).json({
      success: true,
      message: deleted ? 'Developer removed from saved favorites' : 'Bookmark not found or already removed',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bookmarks/check/:developerId - Check if developer is saved
bookmarksRouter.get('/check/:developerId', protect, async (req, res, next) => {
  try {
    const bookmark = await DeveloperBookmark.findOne({
      user: req.user._id,
      developer: req.params.developerId,
    });

    return res.status(200).json({
      success: true,
      isSaved: !!bookmark,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bookmarks/projects - List saved projects
bookmarksRouter.get('/projects', protect, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const total = await ProjectBookmark.countDocuments({ user: req.user._id });
    const bookmarks = await ProjectBookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'project',
        populate: { path: 'owner', select: 'name username avatar avatarUrl headline role' },
      })
      .lean();

    const savedProjects = bookmarks
      .filter((b) => b.project && b.project.status !== 'cancelled')
      .map((b) => ({ ...b.project, isBookmarked: true }));

    return res.status(200).json({
      success: true,
      data: savedProjects,
      projects: savedProjects,
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

// POST /api/v1/bookmarks/projects/:id - Save project
bookmarksRouter.post(['/projects/:id', '/projects/:id/save'], protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const bookmark = await ProjectBookmark.findOneAndUpdate(
      { user: req.user._id, project: project._id },
      { user: req.user._id, project: project._id },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Project bookmarked successfully',
      data: bookmark,
      isBookmarked: true,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/bookmarks/projects/:id - Unsave project
bookmarksRouter.delete(['/projects/:id', '/projects/:id/save'], protect, async (req, res, next) => {
  try {
    await ProjectBookmark.findOneAndDelete({
      user: req.user._id,
      project: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Project removed from saved bookmarks',
      isBookmarked: false,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bookmarks/check/project/:projectId - Check if project is saved
bookmarksRouter.get('/check/project/:projectId', protect, async (req, res, next) => {
  try {
    const bookmark = await ProjectBookmark.findOne({
      user: req.user._id,
      project: req.params.projectId,
    });

    return res.status(200).json({
      success: true,
      isSaved: !!bookmark,
      isBookmarked: !!bookmark,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SAVED SEARCHES ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/saved-searches
savedSearchesRouter.get('/', protect, async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const searches = await SavedSearch.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: searches });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/saved-searches
savedSearchesRouter.post('/', protect, async (req, res, next) => {
  try {
    const { name, type, filters, query } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Search name is required' });
    }

    const searchFilters = filters || query || {};
    const search = await SavedSearch.create({
      user: req.user._id,
      name: name.trim(),
      type: type || 'developer',
      filters: searchFilters,
      query: searchFilters,
    });

    return res.status(201).json({ success: true, data: search });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/saved-searches/:id or PUT /api/v1/saved-searches/:id - Update or rename saved search
const updateSavedSearchHandler = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid saved search ID' });
    }

    const search = await SavedSearch.findById(req.params.id);

    if (!search) {
      return res.status(404).json({ success: false, message: 'Saved search not found' });
    }

    if (String(search.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this saved search preset' });
    }

    const { name, filters, query } = req.body;
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Search name cannot be empty' });
      }
      search.name = name.trim();
    }

    if (filters !== undefined && typeof filters === 'object') {
      search.filters = filters;
      search.query = filters;
    } else if (query !== undefined && typeof query === 'object') {
      search.filters = query;
      search.query = query;
    }

    await search.save();

    return res.status(200).json({
      success: true,
      message: 'Saved search updated successfully',
      data: search,
    });
  } catch (err) {
    next(err);
  }
};

savedSearchesRouter.patch('/:id', protect, updateSavedSearchHandler);
savedSearchesRouter.put('/:id', protect, updateSavedSearchHandler);

// DELETE /api/v1/saved-searches/:id
savedSearchesRouter.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid saved search ID' });
    }

    const search = await SavedSearch.findById(req.params.id);

    if (!search) {
      return res.status(404).json({ success: false, message: 'Saved search not found' });
    }

    if (String(search.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this saved search preset' });
    }

    await search.deleteOne();

    return res.status(200).json({ success: true, message: 'Saved search deleted' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FOLLOWING & CONNECTIONS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/users/:userId/follow - Follow a user
followRouter.post('/:userId/follow', protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid target user ID' });
    }

    if (String(req.user._id) === String(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.status !== 'active') {
      return res.status(404).json({ success: false, message: 'User not found or inactive' });
    }

    // Check if already following
    const existing = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already following this user',
        isFollowing: true,
      });
    }

    await Follow.create({
      follower: req.user._id,
      following: targetUserId,
    });

    // Atomically increment counts
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
    await Profile.findOneAndUpdate({ user: req.user._id }, { $inc: { followingCount: 1 } });
    await Profile.findOneAndUpdate({ user: targetUserId }, { $inc: { followersCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Successfully followed user',
      isFollowing: true,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/:userId/follow - Unfollow a user
followRouter.delete('/:userId/follow', protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    const follow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetUserId,
    });

    if (follow) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
      await Profile.findOneAndUpdate({ user: req.user._id }, { $inc: { followingCount: -1 } });
      await Profile.findOneAndUpdate({ user: targetUserId }, { $inc: { followersCount: -1 } });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user',
      isFollowing: false,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:userId/followers - List followers
followRouter.get('/:userId/followers', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const total = await Follow.countDocuments({ following: req.params.userId });
    const follows = await Follow.find({ following: req.params.userId })
      .populate('follower', 'name username avatar avatarUrl headline role')
      .skip((page - 1) * limit)
      .limit(limit);

    const followers = follows.map((f) => f.follower).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: followers,
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

// GET /api/v1/users/:userId/following - List following
followRouter.get('/:userId/following', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const total = await Follow.countDocuments({ follower: req.params.userId });
    const follows = await Follow.find({ follower: req.params.userId })
      .populate('following', 'name username avatar avatarUrl headline role')
      .skip((page - 1) * limit)
      .limit(limit);

    const following = follows.map((f) => f.following).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: following,
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

export default {
  discoveryRouter,
  portfolioRouter,
  skillsRouter,
  bookmarksRouter,
  savedSearchesRouter,
  followRouter,
};
