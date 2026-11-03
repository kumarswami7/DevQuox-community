import express from 'express';
import { Milestone } from '../models/Milestone.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceMiddleware.js';
import { getProjectUserRole } from '../utils/taskPermissions.js';
import { sendNotification } from '../utils/notifications.js';
import { emitToProject } from '../utils/socketEvents.js';

export const milestoneRouter = express.Router({ mergeParams: true });

/**
 * Helper to calculate milestone progress dynamically from active tasks
 */
export const calculateMilestoneProgress = async (milestoneId) => {
  const tasks = await Task.find({
    milestone: milestoneId,
    isDeleted: { $ne: true },
  }).select('status priority title dueDate assignees');

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    progress,
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    inReviewTasks: inReview,
    todoTasks: todo,
    blockedTasks: blocked,
    tasks,
  };
};

// ==========================================
// 1. GET /api/projects/:projectId/milestones - List milestones with live progress
// ==========================================
milestoneRouter.get('/', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = { project: projectId, isDeleted: { $ne: true } };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [milestones, totalCount] = await Promise.all([
      Milestone.find(filter)
        .populate('creator', 'name username avatar avatarUrl')
        .sort({ order: 1, dueDate: 1, createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Milestone.countDocuments(filter),
    ]);

    // Attach calculated progress to each milestone
    const enriched = await Promise.all(
      milestones.map(async (m) => {
        const stats = await calculateMilestoneProgress(m._id);
        const isOverdue =
          m.dueDate && new Date() > new Date(m.dueDate) && m.status !== 'completed' && m.status !== 'cancelled';
        return {
          ...m,
          isOverdue: Boolean(isOverdue),
          progress: m.status === 'completed' && stats.totalTasks === 0 ? 100 : stats.progress,
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          inProgressTasks: stats.inProgressTasks,
          inReviewTasks: stats.inReviewTasks,
          todoTasks: stats.todoTasks,
          blockedTasks: stats.blockedTasks,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      milestones: enriched,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. POST /api/projects/:projectId/milestones - Create new milestone
// ==========================================
milestoneRouter.post('/', protect, requireWorkspaceMember, async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const isOwner = req.isWorkspaceOwner;
    const userRole = req.workspaceMembership?.role;

    // Only owner or manager may create milestones
    if (!isOwner && userRole !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or manager can create milestones',
      });
    }

    const { title, description, startDate, dueDate, deliverables, order, amount, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Milestone title is required',
      });
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Milestone due date cannot be earlier than start date',
      });
    }

    const milestone = await Milestone.create({
      project: projectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      creator: req.user._id,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      deliverables: Array.isArray(deliverables) ? deliverables.filter(Boolean) : [],
      order: typeof order === 'number' ? order : 1,
      amount: typeof amount === 'number' ? amount : 0,
      status: status && ['upcoming', 'in_progress', 'completed', 'cancelled'].includes(status) ? status : 'upcoming',
    });

    const populated = await Milestone.findById(milestone._id)
      .populate('creator', 'name username avatar avatarUrl')
      .lean();

    // Log project activity
    await ProjectActivity.create({
      project: projectId,
      user: req.user._id,
      targetMilestone: milestone._id,
      action: 'milestone_created',
      details: { title: milestone.title, status: milestone.status, dueDate: milestone.dueDate },
    });

    const milestoneData = {
      ...populated,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
    };

    // Real-time WebSocket emission
    emitToProject(projectId, 'milestone:created', milestoneData, {
      actor: req.user,
      resourceId: milestone._id,
    });
    emitToProject(projectId, 'activity:new', {
      project: projectId,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetMilestone: milestone._id,
      action: 'milestone_created',
      details: { title: milestone.title, status: milestone.status, dueDate: milestone.dueDate },
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      milestone: milestoneData,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. GET /api/milestones/:milestoneId - Get single milestone with details and linked tasks
// ==========================================
milestoneRouter.get('/:milestoneId', protect, async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({
      _id: req.params.milestoneId,
      isDeleted: { $ne: true },
    }).populate('creator', 'name username avatar avatarUrl');

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    // Verify caller workspace membership
    const { isMember } = await getProjectUserRole(milestone.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You do not have access to this milestone',
      });
    }

    const stats = await calculateMilestoneProgress(milestone._id);
    const populatedTasks = await Task.find({
      milestone: milestone._id,
      isDeleted: { $ne: true },
    })
      .populate('assignees', 'name username avatar avatarUrl email')
      .populate('creator', 'name username avatar avatarUrl')
      .sort({ createdAt: -1 });

    const isOverdue =
      milestone.dueDate &&
      new Date() > new Date(milestone.dueDate) &&
      milestone.status !== 'completed' &&
      milestone.status !== 'cancelled';

    return res.status(200).json({
      success: true,
      milestone: {
        ...milestone.toObject(),
        isOverdue: Boolean(isOverdue),
        progress: milestone.status === 'completed' && stats.totalTasks === 0 ? 100 : stats.progress,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
        inReviewTasks: stats.inReviewTasks,
        todoTasks: stats.todoTasks,
        blockedTasks: stats.blockedTasks,
      },
      tasks: populatedTasks,
      progress: stats.progress,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. GET /api/milestones/:milestoneId/tasks - List tasks belonging to a milestone
// ==========================================
milestoneRouter.get('/:milestoneId/tasks', protect, async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({
      _id: req.params.milestoneId,
      isDeleted: { $ne: true },
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { isMember } = await getProjectUserRole(milestone.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await Task.find({
      milestone: milestone._id,
      isDeleted: { $ne: true },
    })
      .populate('assignees', 'name username avatar avatarUrl email')
      .populate('creator', 'name username avatar avatarUrl')
      .sort({ createdAt: -1 });

    const stats = await calculateMilestoneProgress(milestone._id);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
      progress: stats.progress,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. PATCH /api/milestones/:milestoneId - Update milestone fields
// ==========================================
milestoneRouter.patch('/:milestoneId', protect, async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({
      _id: req.params.milestoneId,
      isDeleted: { $ne: true },
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { isMember, role, isOwner, project } = await getProjectUserRole(milestone.project, req.user._id);
    if (!isMember || (!isOwner && role !== 'manager' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or manager can update milestone details',
      });
    }

    const ALLOWED_FIELDS = [
      'title',
      'description',
      'status',
      'startDate',
      'dueDate',
      'deliverables',
      'order',
      'amount',
      'isArchived',
    ];

    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Date validation
    const effectiveStart = updates.startDate !== undefined ? updates.startDate : milestone.startDate;
    const effectiveDue = updates.dueDate !== undefined ? updates.dueDate : milestone.dueDate;
    if (effectiveStart && effectiveDue && new Date(effectiveDue) < new Date(effectiveStart)) {
      return res.status(400).json({
        success: false,
        message: 'Milestone due date cannot be earlier than start date',
      });
    }

    // Handle status transitions
    const previousStatus = milestone.status;
    if (updates.status && updates.status !== previousStatus) {
      if (updates.status === 'completed') {
        milestone.completedAt = new Date();
        milestone.completedBy = req.user._id;

        await ProjectActivity.create({
          project: milestone.project,
          user: req.user._id,
          targetMilestone: milestone._id,
          action: 'milestone_completed',
          details: { title: milestone.title },
        });

        // Notify project owner if caller is not owner
        if (String(project.owner) !== String(req.user._id)) {
          await sendNotification({
            recipient: project.owner,
            sender: req.user._id,
            type: 'milestone',
            title: 'Milestone Completed',
            message: `Milestone "${milestone.title}" was marked as completed by ${req.user.name}.`,
            link: `/projects/${project._id}/workspace`,
          });
        }
      } else {
        milestone.completedAt = null;
        milestone.completedBy = null;
      }
    }

    Object.assign(milestone, updates);
    await milestone.save();

    await ProjectActivity.create({
      project: milestone.project,
      user: req.user._id,
      targetMilestone: milestone._id,
      action: 'milestone_updated',
      details: { title: milestone.title, updates: Object.keys(updates) },
    });

    const stats = await calculateMilestoneProgress(milestone._id);
    const updatedData = {
      ...milestone.toObject(),
      progress: milestone.status === 'completed' && stats.totalTasks === 0 ? 100 : stats.progress,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
    };

    // Real-time WebSocket emission
    emitToProject(milestone.project, 'milestone:updated', updatedData, {
      actor: req.user,
      resourceId: milestone._id,
    });
    emitToProject(milestone.project, 'activity:new', {
      project: milestone.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetMilestone: milestone._id,
      action: 'milestone_updated',
      details: { title: milestone.title, updates: Object.keys(updates) },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Milestone updated successfully',
      milestone: updatedData,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. PATCH /api/milestones/:milestoneId/status - Update milestone status
// ==========================================
milestoneRouter.patch('/:milestoneId/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['upcoming', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: upcoming, in_progress, completed, cancelled',
      });
    }

    const milestone = await Milestone.findOne({
      _id: req.params.milestoneId,
      isDeleted: { $ne: true },
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { isMember, role, isOwner, project } = await getProjectUserRole(milestone.project, req.user._id);
    if (!isMember || (!isOwner && role !== 'manager' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or manager can change milestone status',
      });
    }

    if (milestone.status === status) {
      return res.status(200).json({
        success: true,
        message: 'Milestone status is already ' + status,
        milestone,
      });
    }

    const previousStatus = milestone.status;
    milestone.status = status;

    if (status === 'completed') {
      milestone.completedAt = new Date();
      milestone.completedBy = req.user._id;

      await ProjectActivity.create({
        project: milestone.project,
        user: req.user._id,
        targetMilestone: milestone._id,
        action: 'milestone_completed',
        details: { title: milestone.title, previousStatus },
      });

      if (String(project.owner) !== String(req.user._id)) {
        await sendNotification({
          recipient: project.owner,
          sender: req.user._id,
          type: 'milestone',
          title: 'Milestone Completed',
          message: `Milestone "${milestone.title}" was completed by ${req.user.name}.`,
          link: `/projects/${project._id}/workspace`,
        });
      }
    } else {
      milestone.completedAt = null;
      milestone.completedBy = null;

      await ProjectActivity.create({
        project: milestone.project,
        user: req.user._id,
        targetMilestone: milestone._id,
        action: 'milestone_status_changed',
        details: { title: milestone.title, previousStatus, newStatus: status },
      });
    }

    await milestone.save();
    const stats = await calculateMilestoneProgress(milestone._id);
    const statusData = {
      ...milestone.toObject(),
      progress: milestone.status === 'completed' && stats.totalTasks === 0 ? 100 : stats.progress,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
    };

    // Real-time WebSocket emission
    if (status === 'completed') {
      emitToProject(milestone.project, 'milestone:completed', statusData, {
        actor: req.user,
        resourceId: milestone._id,
      });
    }
    emitToProject(milestone.project, 'milestone:updated', statusData, {
      actor: req.user,
      resourceId: milestone._id,
    });
    emitToProject(milestone.project, 'activity:new', {
      project: milestone.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetMilestone: milestone._id,
      action: status === 'completed' ? 'milestone_completed' : 'milestone_status_changed',
      details: { title: milestone.title, previousStatus, newStatus: status },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Milestone status updated to ${status}`,
      milestone: statusData,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. DELETE /api/milestones/:milestoneId - Soft delete milestone & unlink tasks
// ==========================================
milestoneRouter.delete('/:milestoneId', protect, async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({
      _id: req.params.milestoneId,
      isDeleted: { $ne: true },
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { isMember, role, isOwner } = await getProjectUserRole(milestone.project, req.user._id);
    if (!isMember || (!isOwner && role !== 'manager' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or manager can delete milestones',
      });
    }

    // Soft delete milestone
    milestone.isDeleted = true;
    milestone.deletedAt = new Date();
    milestone.deletedBy = req.user._id;
    await milestone.save();

    // Linked tasks policy: Unlink all associated tasks gracefully without deleting them
    const linkedTasksUpdate = await Task.updateMany(
      { milestone: milestone._id },
      { $set: { milestone: null } }
    );

    await ProjectActivity.create({
      project: milestone.project,
      user: req.user._id,
      targetMilestone: milestone._id,
      action: 'milestone_deleted',
      details: {
        title: milestone.title,
        unlinkedTasksCount: linkedTasksUpdate.modifiedCount,
      },
    });

    // Real-time WebSocket emission
    emitToProject(milestone.project, 'milestone:deleted', { _id: milestone._id, title: milestone.title }, {
      actor: req.user,
      resourceId: milestone._id,
    });
    emitToProject(milestone.project, 'activity:new', {
      project: milestone.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetMilestone: milestone._id,
      action: 'milestone_deleted',
      details: { title: milestone.title, unlinkedTasksCount: linkedTasksUpdate.modifiedCount },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Milestone deleted and associated tasks unlinked successfully',
      unlinkedTasksCount: linkedTasksUpdate.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
});

export default milestoneRouter;
