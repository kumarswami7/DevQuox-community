import express from 'express';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Milestone } from '../models/Milestone.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceMiddleware.js';
import {
  getProjectUserRole,
  validateProjectAssignees,
  isValidStatusTransition,
} from '../utils/taskPermissions.js';
import { sendNotification } from '../utils/notifications.js';
import { emitToProject } from '../utils/socketEvents.js';

export const taskRouter = express.Router({ mergeParams: true });

// Allowed editable fields for task updates
const ALLOWED_TASK_UPDATE_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'assignees',
  'assignee',
  'milestone',
  'startDate',
  'dueDate',
  'estimatedEffort',
  'labels',
  'tags',
  'isArchived',
];

// ==========================================
// 1. GET /api/tasks/my-tasks - List tasks assigned to current user across all projects
// ==========================================
taskRouter.get('/my-tasks', protect, async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 50 } = req.query;

    const filter = {
      assignees: req.user._id,
      isDeleted: { $ne: true },
    };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filter)
        .populate('project', 'title status category')
        .populate('creator', 'name username avatar avatarUrl')
        .populate('assignees', 'name username avatar avatarUrl email')
        .populate('milestone', 'title status dueDate')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      tasks,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. GET /api/projects/:projectId/tasks (and /project/:projectId) - List project tasks with filtering & pagination
// ==========================================
export const getProjectTasksHandler = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.project?._id || req.params.id;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project identifier is required' });
    }

    const {
      status,
      priority,
      assignee,
      milestone,
      q,
      isArchived,
      sort = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { project: projectId, isDeleted: { $ne: true } };

    if (isArchived === 'true') {
      filter.isArchived = true;
    } else if (isArchived === 'false' || isArchived === undefined) {
      filter.isArchived = { $ne: true };
    }

    // Status filter
    if (status && status !== 'all') {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = status.trim();
      }
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority.trim();
    }

    // Assignee filter
    if (assignee && assignee !== 'all') {
      if (assignee === 'me') {
        filter.assignees = req.user._id;
      } else if (assignee === 'unassigned') {
        filter.$or = [{ assignees: { $size: 0 } }, { assignees: { $exists: false } }];
      } else {
        filter.assignees = assignee;
      }
    }

    // Milestone filter
    if (milestone && milestone !== 'all') {
      if (milestone === 'none' || milestone === 'null') {
        filter.$or = [{ milestone: null }, { milestone: { $exists: false } }];
      } else {
        filter.milestone = milestone;
      }
    }

    // Search query
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitizedQ, $options: 'i' } },
        { description: { $regex: sanitizedQ, $options: 'i' } },
      ];
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };
    if (sort === 'dueDate') sortQuery = { dueDate: 1, createdAt: -1 };
    if (sort === 'priority') sortQuery = { priority: -1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filter)
        .populate('assignees', 'name username avatar avatarUrl email role headline')
        .populate('creator', 'name username avatar avatarUrl')
        .populate('milestone', 'title status dueDate')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      tasks,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
};

taskRouter.get('/project/:projectId', protect, requireWorkspaceMember, getProjectTasksHandler);
taskRouter.get('/', protect, requireWorkspaceMember, getProjectTasksHandler);

// ==========================================
// 3. POST /api/projects/:projectId/tasks (and /project/:projectId) - Create task
// ==========================================
export const createProjectTaskHandler = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.project?._id || req.params.id;
    const project = req.project || (await Project.findById(projectId));
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const {
      title,
      description,
      status,
      priority,
      assignees,
      assignee,
      milestone,
      startDate,
      dueDate,
      estimatedEffort,
      labels,
      tags,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // Normalize assignees list
    let targetAssignees = [];
    if (Array.isArray(assignees)) {
      targetAssignees = assignees;
    } else if (assignee) {
      targetAssignees = [assignee];
    }

    // Validate that all assignees are active project members
    if (targetAssignees.length > 0) {
      const validation = await validateProjectAssignees(project._id, targetAssignees);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign task to non-members: ${validation.invalidIds.join(', ')}. All assignees must be active project members.`,
          invalidAssignees: validation.invalidIds,
        });
      }
    }

    // Validate milestone if provided (must belong to same project)
    if (milestone) {
      const milestoneDoc = await Milestone.findOne({
        _id: milestone,
        isDeleted: { $ne: true },
      });
      if (!milestoneDoc) {
        return res.status(400).json({ success: false, message: 'Specified milestone not found' });
      }
      if (String(milestoneDoc.project) !== String(project._id)) {
        return res.status(400).json({
          success: false,
          message: 'Cross-project milestone association is prohibited. Milestone does not belong to this project.',
        });
      }
    }

    // Validate dates
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Task due date cannot be earlier than start date',
      });
    }

    const task = await Task.create({
      project: project._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      creator: req.user._id,
      assignees: targetAssignees,
      status: status && ['todo', 'in_progress', 'in_review', 'completed', 'blocked'].includes(status) ? status : 'todo',
      priority: priority && ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      milestone: milestone || null,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      estimatedEffort: typeof estimatedEffort === 'number' ? estimatedEffort : undefined,
      labels: Array.isArray(labels) ? labels.filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
    });

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name username avatar avatarUrl email role headline')
      .populate('creator', 'name username avatar avatarUrl')
      .populate('milestone', 'title status dueDate')
      .lean();

    // Log project activity
    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      targetTask: task._id,
      action: 'task_created',
      details: { title: task.title, status: task.status, priority: task.priority },
    });

    // Notify newly assigned members
    if (targetAssignees.length > 0) {
      for (const uid of targetAssignees) {
        const uidStr = String(uid._id || uid);
        if (uidStr !== String(req.user._id)) {
          await sendNotification({
            recipient: uidStr,
            sender: req.user._id,
            type: 'task',
            title: 'Task Assigned',
            message: `${req.user.name} assigned you to task "${task.title}" on project "${project.title}".`,
            link: `/projects/${project._id}/workspace`,
          });
        }
      }
    }

    // Real-time WebSocket synchronization
    emitToProject(project._id, 'task:created', populated, {
      actor: req.user,
      resourceId: task._id,
    });
    emitToProject(project._id, 'activity:new', {
      project: project._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetTask: task._id,
      action: 'task_created',
      details: { title: task.title, status: task.status, priority: task.priority },
      createdAt: new Date(),
    });
    if (targetAssignees.length > 0) {
      emitToProject(project._id, 'task:assigned', { task: populated, assignees: targetAssignees }, {
        actor: req.user,
        resourceId: task._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

taskRouter.post('/project/:projectId', protect, requireWorkspaceMember, createProjectTaskHandler);
taskRouter.post('/', protect, requireWorkspaceMember, createProjectTaskHandler);

// ==========================================
// 4. GET /api/tasks/:taskId - Get single task details
// ==========================================
taskRouter.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .populate('project', 'title status owner category')
      .populate('creator', 'name username avatar avatarUrl')
      .populate('assignees', 'name username avatar avatarUrl email role headline')
      .populate('milestone', 'title status dueDate');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify workspace membership for the task's project
    const { isMember } = await getProjectUserRole(task.project._id || task.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You do not have access to this task',
      });
    }

    return res.status(200).json({
      success: true,
      task,
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. PATCH & PUT /api/tasks/:taskId - Update task details with permissions & validation
// ==========================================
export const updateTaskHandler = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { isMember, role, isOwner, project } = await getProjectUserRole(task.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You do not have access to modify this task',
      });
    }

    const isCreator = String(task.creator) === String(req.user._id);
    const isAssignee = Array.isArray(task.assignees) && task.assignees.some((a) => String(a._id || a) === String(req.user._id));
    const isManager = role === 'manager';
    const isElevated = isOwner || isManager || isCreator || req.user.role === 'admin';

    // Allowlist filtering
    const updates = {};
    for (const field of ALLOWED_TASK_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Permission check: only elevated users (owner, manager, creator) or assignees can touch the task
    if (!isElevated && !isAssignee) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Permission denied. You can only modify tasks that you created or are assigned to (or Project Owner).',
      });
    }

    // Assignees who are not creator/owner can only update status
    if (!isElevated && isAssignee) {
      const nonStatusUpdates = Object.keys(updates).filter((k) => k !== 'status');
      if (nonStatusUpdates.length > 0) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: 'Assignees can only update task status. Only the task creator or project owner can edit task details.',
        });
      }
    }

    // If assignees or milestone are being updated, require elevated privileges
    if (updates.assignees !== undefined || updates.assignee !== undefined) {
      if (!isElevated) {
        return res.status(403).json({
          success: false,
          message: 'Only the project owner, manager, or task creator can reassign tasks',
        });
      }

      let newAssignees = [];
      if (Array.isArray(updates.assignees)) {
        newAssignees = updates.assignees;
      } else if (updates.assignee) {
        newAssignees = [updates.assignee];
      }

      // Validate all new assignees are active project members
      const validation = await validateProjectAssignees(task.project, newAssignees);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign task to non-members: ${validation.invalidIds.join(', ')}`,
          invalidAssignees: validation.invalidIds,
        });
      }

      // Detect newly assigned members to notify
      const previousSet = new Set((task.assignees || []).map((a) => String(a._id || a)));
      const newlyAdded = newAssignees.filter((a) => !previousSet.has(String(a._id || a)));

      task.assignees = newAssignees;
      delete updates.assignees;
      delete updates.assignee;

      for (const uid of newlyAdded) {
        const uidStr = String(uid._id || uid);
        if (uidStr !== String(req.user._id)) {
          await sendNotification({
            recipient: uidStr,
            sender: req.user._id,
            type: 'task',
            title: 'Task Assigned',
            message: `${req.user.name} assigned you to task "${task.title}".`,
            link: `/projects/${task.project}/workspace`,
          });
        }
      }

      await ProjectActivity.create({
        project: task.project,
        user: req.user._id,
        targetTask: task._id,
        action: 'task_reassigned',
        details: { taskTitle: task.title, assigneesCount: newAssignees.length },
      });
    }

    // Validate milestone update
    if (updates.milestone !== undefined) {
      if (!isElevated) {
        return res.status(403).json({
          success: false,
          message: 'Only the project owner, manager, or task creator can link or change task milestones',
        });
      }

      if (updates.milestone) {
        const milestoneDoc = await Milestone.findOne({
          _id: updates.milestone,
          isDeleted: { $ne: true },
        });
        if (!milestoneDoc) {
          return res.status(400).json({ success: false, message: 'Specified milestone not found' });
        }
        if (String(milestoneDoc.project) !== String(task.project)) {
          return res.status(400).json({
            success: false,
            message: 'Milestone belongs to a different project. Cross-project assignment is rejected.',
          });
        }
      }

      await ProjectActivity.create({
        project: task.project,
        user: req.user._id,
        targetTask: task._id,
        action: 'task_moved_milestone',
        details: {
          previousMilestone: task.milestone,
          newMilestone: updates.milestone,
        },
      });
    }

    // Date validation
    const effectiveStart = updates.startDate !== undefined ? updates.startDate : task.startDate;
    const effectiveDue = updates.dueDate !== undefined ? updates.dueDate : task.dueDate;
    if (effectiveStart && effectiveDue && new Date(effectiveDue) < new Date(effectiveStart)) {
      return res.status(400).json({
        success: false,
        message: 'Task due date cannot be earlier than start date',
      });
    }

    // Status transition validation
    if (updates.status && updates.status !== task.status) {
      if (!isValidStatusTransition(task.status, updates.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${task.status}' to '${updates.status}'. Allowed transitions: ${
            ALLOWED_STATUS_TRANSITIONS[task.status]?.join(', ') || 'none'
          }`,
        });
      }

      // Review approval permission check
      if (updates.status === 'completed' && !isElevated) {
        return res.status(403).json({
          success: false,
          message: 'Formal review approval required. Only project owner, manager, or task creator can approve completion.',
        });
      }

      // Reopening permission check
      if (task.status === 'completed' && !isElevated) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner, manager, or task creator can reopen a completed task.',
        });
      }

      const previousStatus = task.status;
      await ProjectActivity.create({
        project: task.project,
        user: req.user._id,
        targetTask: task._id,
        action: updates.status === 'completed' ? 'task_status_changed' : previousStatus === 'completed' ? 'task_reopened' : 'task_status_changed',
        details: { previousStatus, newStatus: updates.status },
      });
    }

    Object.assign(task, updates);
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name username avatar avatarUrl email role headline')
      .populate('creator', 'name username avatar avatarUrl')
      .populate('milestone', 'title status dueDate')
      .lean();

    // Real-time WebSocket synchronization
    emitToProject(task.project, 'task:updated', populated, {
      actor: req.user,
      resourceId: task._id,
    });
    emitToProject(task.project, 'activity:new', {
      project: task.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetTask: task._id,
      action: 'task_updated',
      details: { title: task.title, updates: Object.keys(updates) },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

taskRouter.patch('/:id', protect, updateTaskHandler);
taskRouter.put('/:id', protect, updateTaskHandler);

// ==========================================
// 6. PATCH /api/tasks/:taskId/status - Dedicated workflow status transition
// ==========================================
taskRouter.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status || !['todo', 'in_progress', 'in_review', 'completed', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: todo, in_progress, in_review, completed, blocked',
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { isMember, role, isOwner, project } = await getProjectUserRole(task.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to update this task',
      });
    }

    // Idempotency: If already in requested status, return success without duplicate actions
    if (task.status === status) {
      const current = await Task.findById(task._id)
        .populate('assignees', 'name username avatar avatarUrl email role')
        .populate('creator', 'name username avatar avatarUrl')
        .populate('milestone', 'title status dueDate')
        .lean();

      return res.status(200).json({
        success: true,
        message: `Task is already in status '${status}'`,
        task: current,
        data: current,
      });
    }

    const isCreator = String(task.creator) === String(req.user._id);
    const isAssignee = Array.isArray(task.assignees) && task.assignees.some((a) => String(a._id || a) === String(req.user._id));
    const isManager = role === 'manager';
    const isElevated = isOwner || isManager || isCreator || req.user.role === 'admin';
    const canChangeStatus = isElevated || isAssignee;

    if (!canChangeStatus) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Permission denied. Only the task creator, assigned team member, or project owner can change this task status.',
      });
    }

    // Validate workflow transition
    if (!isValidStatusTransition(task.status, status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TRANSITION',
        message: `Invalid status transition from '${task.status}' to '${status}'. Allowed: ${
          ALLOWED_STATUS_TRANSITIONS[task.status]?.join(', ') || 'none'
        }`,
      });
    }

    // Permissions on completion approval
    if (status === 'completed' && !isElevated) {
      return res.status(403).json({
        success: false,
        message: 'Formal review approval required. Only project owner, manager, or task creator can approve completion.',
      });
    }

    // Permissions on reopening completed tasks
    if (task.status === 'completed' && !isElevated) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner, manager, or task creator can reopen a completed task.',
      });
    }

    const previousStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
      task.completedBy = req.user._id;

      // Notify assignees of completion approval
      for (const a of task.assignees || []) {
        const aStr = String(a._id || a);
        if (aStr !== String(req.user._id)) {
          await sendNotification({
            recipient: aStr,
            sender: req.user._id,
            type: 'task',
            title: 'Task Approved & Completed',
            message: `Task "${task.title}" has been approved and marked as completed by ${req.user.name}.`,
            link: `/projects/${task.project}/workspace`,
          });
        }
      }
    } else if (status === 'in_review') {
      // Notify project owner/creator that review is requested
      const notifyTarget = isOwner ? task.creator : project.owner;
      if (notifyTarget && String(notifyTarget) !== String(req.user._id)) {
        await sendNotification({
          recipient: notifyTarget,
          sender: req.user._id,
          type: 'task',
          title: 'Task Submitted for Review',
          message: `${req.user.name} submitted task "${task.title}" for review.`,
          link: `/projects/${task.project}/workspace`,
        });
      }
    } else {
      task.completedAt = null;
      task.completedBy = null;
    }

    await task.save();

    await ProjectActivity.create({
      project: task.project,
      user: req.user._id,
      targetTask: task._id,
      action: previousStatus === 'completed' ? 'task_reopened' : 'task_status_changed',
      details: { previousStatus, newStatus: status, note: note || '' },
    });

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name username avatar avatarUrl email role')
      .populate('creator', 'name username avatar avatarUrl')
      .populate('milestone', 'title status dueDate')
      .lean();

    // Real-time WebSocket emission
    emitToProject(task.project, 'task:statusChanged', populated, {
      actor: req.user,
      resourceId: task._id,
    });
    if (status === 'in_review') {
      emitToProject(task.project, 'task:reviewRequested', populated, {
        actor: req.user,
        resourceId: task._id,
      });
    } else if (status === 'completed') {
      emitToProject(task.project, 'task:approved', populated, {
        actor: req.user,
        resourceId: task._id,
      });
    } else if (previousStatus === 'completed' && status === 'in_progress') {
      emitToProject(task.project, 'task:reopened', populated, {
        actor: req.user,
        resourceId: task._id,
      });
    }
    emitToProject(task.project, 'activity:new', {
      project: task.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetTask: task._id,
      action: previousStatus === 'completed' ? 'task_reopened' : 'task_status_changed',
      details: { previousStatus, newStatus: status, note: note || '' },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Task status changed to ${status}`,
      task: populated,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. DELETE /api/tasks/:taskId - Soft delete task
// ==========================================
taskRouter.delete('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { isMember, role, isOwner } = await getProjectUserRole(task.project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }

    const isCreator = String(task.creator) === String(req.user._id);
    const isAssignee = Array.isArray(task.assignees) && task.assignees.some((a) => String(a._id || a) === String(req.user._id));
    const isManager = role === 'manager';
    const isElevated = isOwner || isManager || isCreator || req.user.role === 'admin';
    const canChangeStatus = isElevated || isAssignee;

    if (!canChangeStatus) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Permission denied. Only the task creator, assigned team member, or project owner can change this task status.',
      });
    }

    if (!isElevated) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner, manager, or task creator can delete tasks',
      });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    task.deletedBy = req.user._id;
    await task.save();

    await ProjectActivity.create({
      project: task.project,
      user: req.user._id,
      targetTask: task._id,
      action: 'task_deleted',
      details: { title: task.title },
    });

    // Real-time WebSocket emission
    emitToProject(task.project, 'task:deleted', { _id: task._id, title: task.title }, {
      actor: req.user,
      resourceId: task._id,
    });
    emitToProject(task.project, 'activity:new', {
      project: task.project,
      user: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar || req.user.avatarUrl || '',
      },
      targetTask: task._id,
      action: 'task_deleted',
      details: { title: task.title },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default taskRouter;
