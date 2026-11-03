import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Application } from '../models/Application.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Task } from '../models/Task.js';
import { Milestone } from '../models/Milestone.js';
import { Contract } from '../models/Contract.js';
import { Payment } from '../models/Payment.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Community } from '../models/Community.js';
import { Notification } from '../models/Notification.js';
import { Post } from '../models/Post.js';
import { Conversation } from '../models/Conversation.js';

/**
 * Calculates profile completeness score (0-100) and actionable tips
 */
const calculateProfileCompleteness = (user, profile) => {
  let score = 0;
  const missing = [];

  if (user?.name) score += 10;
  else missing.push('Full Name');

  if (user?.avatar || profile?.avatar) score += 15;
  else missing.push('Profile Picture');

  if (profile?.title || user?.headline) score += 15;
  else missing.push('Professional Headline / Title');

  if (profile?.about || profile?.bio) score += 15;
  else missing.push('About / Bio Summary');

  if (Array.isArray(profile?.skills) && profile.skills.length >= 3) score += 15;
  else missing.push('Add at least 3 skills');

  if (Array.isArray(profile?.portfolio) && profile.portfolio.length > 0) score += 15;
  else missing.push('Add at least 1 showcase project');

  if (Array.isArray(profile?.experience) && profile.experience.length > 0) score += 10;
  else missing.push('Add work experience');

  if (profile?.github || profile?.linkedin || profile?.website) score += 10;
  else missing.push('Add GitHub or LinkedIn link');

  return {
    score: Math.min(100, score),
    missingTips: missing.slice(0, 3),
  };
};

/**
 * GET /api/v1/dashboard/summary
 * Returns role-aware aggregated dashboard metrics, activities, and feeds
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const user = req.user || null;
    const role = user?.role || 'guest';
    const isClient = role === 'client';
    const isDeveloper = ['developer', 'freelancer', 'student'].includes(role);

    // 1. Fetch Global Platform Counts, Communities & Real Projects
    const [
      totalProjectsCount,
      totalDevelopersCount,
      totalCommunitiesCount,
      communitiesList,
      allPlatformProjects,
    ] = await Promise.all([
      Project.countDocuments({ status: { $ne: 'cancelled' } }).catch(() => 0),
      User.countDocuments({ role: { $in: ['developer', 'freelancer', 'student'] }, status: 'active' }).catch(() => 0),
      Community.countDocuments({}).catch(() => 0),
      Community.find({}).limit(8).lean().catch(() => []),
      Project.find({ status: { $ne: 'cancelled' } })
        .populate('owner', 'name avatar role username')
        .populate('originIdeaPost', 'title postType')
        .sort({ createdAt: -1 })
        .limit(16)
        .lean()
        .catch(() => []),
    ]);

    // 2. Fetch User Profile & User Created Projects
    let userProfile = null;
    let myCreatedProjects = [];
    if (user?._id) {
      [userProfile, myCreatedProjects] = await Promise.all([
        Profile.findOne({ user: user._id }).lean().catch(() => null),
        Project.find({ owner: user._id })
          .populate('owner', 'name avatar role')
          .sort({ createdAt: -1 })
          .lean()
          .catch(() => []),
      ]);
    }

    const completeness = calculateProfileCompleteness(user, userProfile);

    // 3. Role-specific data structures
    let stats = {
      totalProjects: totalProjectsCount,
      totalDevelopers: totalDevelopersCount,
      totalCommunities: totalCommunitiesCount,
      myProjectsCount: myCreatedProjects.length,
    };
    let recentProjects = allPlatformProjects;
    let recentApplications = [];
    let myTasks = [];
    let recentActivities = [];
    let recommendedProjects = [];
    let financialSummary = null;

    if (isClient && user?._id) {
      // ----------------------------------------------------------------------
      // CLIENT DASHBOARD DATA
      // ----------------------------------------------------------------------
      const clientProjectQuery = { owner: user._id };

      const [
        totalClientProjects,
        openClientProjects,
        inProgressClientProjects,
        completedClientProjects,
        clientProjectsList,
        clientApplications,
        hiredMembersCount,
        clientContracts,
        clientActivities,
      ] = await Promise.all([
        Project.countDocuments(clientProjectQuery).catch(() => 0),
        Project.countDocuments({ ...clientProjectQuery, status: 'open' }).catch(() => 0),
        Project.countDocuments({ ...clientProjectQuery, status: 'in_progress' }).catch(() => 0),
        Project.countDocuments({ ...clientProjectQuery, status: 'completed' }).catch(() => 0),
        Project.find(clientProjectQuery).sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
        Application.find()
          .populate({
            path: 'project',
            match: { owner: user._id },
            select: 'title category budget status',
          })
          .populate('applicant', 'name username email avatar')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .catch(() => []),
        ProjectMember.countDocuments({
          project: { $in: (await Project.find(clientProjectQuery).select('_id')).map((p) => p._id) },
          role: { $in: ['member', 'developer'] },
          status: 'active',
        }).catch(() => 0),
        Contract.find({ client: user._id }).lean().catch(() => []),
        ProjectActivity.find({
          project: { $in: (await Project.find(clientProjectQuery).select('_id')).map((p) => p._id) },
        })
          .populate('user', 'name avatar username')
          .populate('project', 'title')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
          .catch(() => []),
      ]);

      // Filter applications that actually belong to this client's projects
      const filteredClientApplications = clientApplications.filter((app) => app.project != null);
      const pendingReviewCount = filteredClientApplications.filter(
        (app) => app.status === 'pending' || !app.status
      ).length;

      // Calculate total budget committed
      const totalBudgetCommitted = clientProjectsList.reduce((acc, curr) => {
        const val = Number(curr.budgetMax || curr.budget || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      // Financials
      financialSummary = {
        totalCommitted: totalBudgetCommitted,
        activeContractsCount: clientContracts.filter((c) => c.status === 'active').length,
        totalContractsCount: clientContracts.length,
      };

      stats = {
        totalProjects: totalClientProjects,
        openProjects: openClientProjects,
        inProgressProjects: inProgressClientProjects,
        completedProjects: completedClientProjects,
        applicationsReceived: filteredClientApplications.length,
        pendingReviewCount,
        hiredEngineers: hiredMembersCount,
        platformDevelopers: totalDevelopersCount,
        budgetCommitted: totalBudgetCommitted,
      };

      recentProjects = clientProjectsList;
      recentApplications = filteredClientApplications.slice(0, 10);
      recentActivities = clientActivities;

    } else if (isDeveloper && user?._id) {
      // ----------------------------------------------------------------------
      // DEVELOPER DASHBOARD DATA
      // ----------------------------------------------------------------------
      const [
        myApplicationsList,
        myMemberships,
        assignedTasksList,
        completedTasksCount,
        devContracts,
        devActivities,
      ] = await Promise.all([
        Application.find({ applicant: user._id })
          .populate('project', 'title category budget status experienceLevel owner')
          .sort({ createdAt: -1 })
          .limit(15)
          .lean()
          .catch(() => []),
        ProjectMember.find({ user: user._id, status: 'active' })
          .populate('project', 'title category status budget teamSize')
          .lean()
          .catch(() => []),
        Task.find({ assignees: user._id })
          .populate('project', 'title')
          .sort({ dueDate: 1, createdAt: -1 })
          .limit(10)
          .lean()
          .catch(() => []),
        Task.countDocuments({ assignees: user._id, status: 'completed' }).catch(() => 0),
        Contract.find({ developer: user._id }).lean().catch(() => []),
        ProjectActivity.find({
          $or: [
            { user: user._id },
            { targetUser: user._id },
          ],
        })
          .populate('user', 'name avatar username')
          .populate('project', 'title')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
          .catch(() => []),
      ]);

      const activeApplications = myApplicationsList.filter((a) => a.status === 'pending');
      const acceptedApplications = myApplicationsList.filter((a) => a.status === 'accepted');

      // Recommended projects based on developer skills
      const userSkills = userProfile?.skills || [];
      const recQuery = {
        status: 'open',
      };
      if (userSkills.length > 0) {
        recQuery.$or = [
          { requiredSkills: { $in: userSkills } },
          { category: userProfile?.category || 'Web Development' },
        ];
      }
      recommendedProjects = await Project.find(recQuery)
        .populate('owner', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
        .catch(() => []);

      stats = {
        totalApplications: myApplicationsList.length,
        pendingApplications: activeApplications.length,
        acceptedApplications: acceptedApplications.length,
        activeWorkspaces: myMemberships.length,
        assignedTasks: assignedTasksList.length,
        completedTasks: completedTasksCount,
        activeContracts: devContracts.filter((c) => c.status === 'active').length,
        profileCompleteness: completeness.score,
        totalProjects: totalProjectsCount,
        totalDevelopers: totalDevelopersCount,
        totalCommunities: totalCommunitiesCount,
        myProjectsCount: myCreatedProjects.length,
      };

      recentApplications = myApplicationsList;
      myTasks = assignedTasksList;
      recentActivities = devActivities;
      recentProjects = allPlatformProjects;

    } else {
      // ----------------------------------------------------------------------
      // GUEST / ADMIN / FALLBACK SUMMARY
      // ----------------------------------------------------------------------
      const [featuredProjects, topDevs] = await Promise.all([
        Project.find({ status: 'open' })
          .populate('owner', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
          .catch(() => []),
        Profile.find({})
          .populate('user', 'name username avatar role')
          .limit(6)
          .lean()
          .catch(() => []),
      ]);

      stats = {
        totalProjects: totalProjectsCount,
        totalDevelopers: totalDevelopersCount,
        totalCommunities: totalCommunitiesCount,
        myProjectsCount: myCreatedProjects.length,
        platformStatus: 'healthy',
      };

      recentProjects = featuredProjects;
      recommendedProjects = featuredProjects;
    }

    // 4. Also fetch top developer profiles for the Talent showcase tab
    const [talentShowcase, recentPosts] = await Promise.all([
      Profile.find({})
        .populate('user', 'name username avatar role email')
        .sort({ rating: -1, updatedAt: -1 })
        .limit(8)
        .lean()
        .catch(() => []),
      Post.find({})
        .populate('author', 'name username avatar role headline')
        .populate('convertedToProject', 'title status slug')
        .sort({ createdAt: -1 })
        .limit(16)
        .lean()
        .catch(() => []),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        role,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
            }
          : null,
        stats,
        completeness,
        recentProjects: allPlatformProjects,
        myProjects: myCreatedProjects,
        recommendedProjects,
        recentPosts,
        communities: communitiesList,
        recentApplications,
        myTasks,
        recentActivities,
        talentShowcase,
        financialSummary,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/dashboard/analytics
 * Returns chart metrics: category distributions, application statuses, weekly velocity
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const user = req.user || null;
    const role = user?.role || 'guest';
    const isClient = role === 'client';

    // 1. Projects by Category
    const categoryAggregation = await Project.aggregate([
      { $match: isClient && user ? { owner: new mongoose.Types.ObjectId(user._id) } : {} },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]).catch(() => []);

    // 2. Application status breakdown
    const applicationStatusAggregation = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).catch(() => []);

    // 3. Task status breakdown
    const taskStatusAggregation = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).catch(() => []);

    // 4. Recent 7-day activity velocity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivities = await ProjectActivity.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).catch(() => []);

    return res.status(200).json({
      success: true,
      data: {
        categoryDistribution: categoryAggregation.map((c) => ({
          category: c._id || 'General',
          count: c.count,
        })),
        applicationStatuses: applicationStatusAggregation.map((a) => ({
          status: a._id || 'pending',
          count: a.count,
        })),
        taskStatuses: taskStatusAggregation.map((t) => ({
          status: t._id || 'todo',
          count: t.count,
        })),
        weeklyVelocity: weeklyActivities.map((w) => ({
          date: w._id,
          count: w.count,
        })),
      },
    });
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/dashboard/activities
 * Returns recent activity stream with pagination
 */
export const getDashboardActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user) {
      // Find projects user owns or is a member of
      const [ownedProjects, memberProjects] = await Promise.all([
        Project.find({ owner: req.user._id }).select('_id'),
        ProjectMember.find({ user: req.user._id, status: 'active' }).select('project'),
      ]);

      const projectIds = [
        ...ownedProjects.map((p) => p._id),
        ...memberProjects.map((m) => m.project),
      ];

      query.$or = [
        { project: { $in: projectIds } },
        { user: req.user._id },
        { targetUser: req.user._id },
      ];
    }

    const [activities, total] = await Promise.all([
      ProjectActivity.find(query)
        .populate('user', 'name avatar username')
        .populate('targetUser', 'name avatar username')
        .populate('project', 'title')
        .populate('targetTask', 'title')
        .populate('targetMilestone', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProjectActivity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardActivities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard activities',
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/dashboard/tasks
 * Returns user's assigned or managed tasks
 */
export const getDashboardTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { status, priority } = req.query;
    const filter = {
      $or: [{ assignees: req.user._id }, { creator: req.user._id }],
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('project', 'title category owner')
      .populate('assignees', 'name avatar username')
      .populate('creator', 'name avatar username')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('[DashboardController] Error in getDashboardTasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard tasks',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/v1/dashboard/quick-action
 * Allows inline quick-actions: e.g., toggle task status or update application status
 */
export const updateQuickAction = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { actionType, targetId, value } = req.body;

    if (actionType === 'task_status') {
      const task = await Task.findById(targetId);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      task.status = value; // e.g. 'completed', 'in_progress', 'todo'
      await task.save();

      // Log activity
      await ProjectActivity.create({
        project: task.project,
        user: req.user._id,
        targetTask: task._id,
        action: 'task_status_changed',
        details: { newStatus: value },
      }).catch(() => null);

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    }

    if (actionType === 'application_review') {
      const application = await Application.findById(targetId).populate('project');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      // Check authorization (only project owner can review)
      if (application.project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only project owner can review applications' });
      }

      application.status = value; // 'accepted' | 'rejected'
      application.reviewedAt = new Date();
      application.reviewedBy = req.user._id;
      await application.save();

      // If accepted, add applicant to ProjectMember
      if (value === 'accepted') {
        await ProjectMember.findOneAndUpdate(
          { project: application.project._id, user: application.applicant },
          { role: 'member', status: 'active', joinedAt: new Date() },
          { upsert: true, new: true }
        ).catch(() => null);

        // Update project acceptedApplicantsCount
        await Project.findByIdAndUpdate(application.project._id, {
          $inc: { acceptedApplicantsCount: 1 },
        }).catch(() => null);

        // Add accepted member to Project Team Chat
        await Conversation.findOneAndUpdate(
          { project: application.project._id, type: 'project' },
          { $addToSet: { participants: application.applicant } }
        ).catch(() => null);
      }

      // Log activity
      await ProjectActivity.create({
        project: application.project._id,
        user: req.user._id,
        targetUser: application.applicant,
        action: value === 'accepted' ? 'application_accepted' : 'application_rejected',
        details: { status: value },
      }).catch(() => null);

      return res.status(200).json({
        success: true,
        message: `Application marked as ${value}`,
        data: application,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid actionType specified',
    });
  } catch (error) {
    console.error('[DashboardController] Error in updateQuickAction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process quick action',
      error: error.message,
    });
  }
};
