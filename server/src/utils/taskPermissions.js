import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';

/**
 * Standard API error format constants
 */
export const PERMISSION_ERROR = {
  success: false,
  code: 'PERMISSION_DENIED',
  message: 'You do not have permission to perform this action.',
};

/**
 * Validates that a user is an active member or owner of the project.
 * Returns { isMember: boolean, role: string|null, isOwner: boolean, project: Object }
 */
export const getProjectUserRole = async (projectId, userId) => {
  if (!projectId || !userId) return { isMember: false, role: null, isOwner: false };

  const project = typeof projectId === 'object' && projectId._id ? projectId : await Project.findById(projectId);
  if (!project) return { isMember: false, role: null, isOwner: false };

  const ownerId = String(project.owner?._id || project.owner);
  const uId = String(userId._id || userId);

  if (ownerId === uId) {
    return { isMember: true, role: 'owner', isOwner: true, project };
  }

  const membership = await ProjectMember.findOne({
    project: project._id,
    user: uId,
    status: 'active',
  });

  if (membership) {
    return { isMember: true, role: membership.role, isOwner: false, project };
  }

  return { isMember: false, role: null, isOwner: false, project };
};

/**
 * Helper: Check if user is the project owner
 */
export const isProjectOwner = (project, userId) => {
  if (!project || !userId) return false;
  const ownerId = String(project.owner?._id || project.owner);
  const uId = String(userId._id || userId);
  return ownerId === uId;
};

/**
 * Helper: Check if user is task creator
 */
export const isTaskCreator = (task, userId) => {
  if (!task || !userId) return false;
  const creatorId = String(task.creator?._id || task.creator);
  const uId = String(userId._id || userId);
  return creatorId === uId;
};

/**
 * Helper: Check if user is task assignee
 */
export const isTaskAssignee = (task, userId) => {
  if (!task || !userId || !Array.isArray(task.assignees)) return false;
  const uId = String(userId._id || userId);
  return task.assignees.some((a) => String(a._id || a) === uId);
};

/**
 * Helper: Check if user can edit project details
 * ONLY Project Owner or Admin
 */
export const canEditProject = (project, user) => {
  if (!project || !user) return false;
  if (user.role === 'admin') return true;
  return isProjectOwner(project, user._id || user.id);
};

/**
 * Helper: Check if user can manage team (roles, removal)
 * ONLY Project Owner or Admin
 */
export const canManageTeam = (project, user) => {
  if (!project || !user) return false;
  if (user.role === 'admin') return true;
  return isProjectOwner(project, user._id || user.id);
};

/**
 * Helper: Check if user can create / edit milestones
 * Project Owner, Manager, or Admin
 */
export const canCreateMilestone = (role, isOwner, user) => {
  if (user?.role === 'admin') return true;
  return isOwner || role === 'manager';
};

/**
 * Helper: Check if user can edit task content (title, description, tags, effort)
 * Project Owner, Manager, or Task Creator
 */
export const canEditTask = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin') return true;
  if (isOwner || role === 'manager') return true;
  return isTaskCreator(task, user._id || user.id);
};

/**
 * Helper: Check if user can delete task
 * ONLY Project Owner, Manager, or Task Creator
 */
export const canDeleteTask = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin') return true;
  if (isOwner || role === 'manager') return true;
  return isTaskCreator(task, user._id || user.id);
};

/**
 * Helper: Check if user can change task status
 * Project Owner, Manager, Task Creator, OR Assigned Member
 */
export const canChangeTaskStatus = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin') return true;
  if (isOwner || role === 'manager') return true;
  const uid = user._id || user.id;
  return isTaskCreator(task, uid) || isTaskAssignee(task, uid);
};

/**
 * Helper: Check if user can approve completion
 * Project Owner, Manager, or Task Creator
 */
export const canApproveTask = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin') return true;
  if (isOwner || role === 'manager') return true;
  return isTaskCreator(task, user._id || user.id);
};

/**
 * Validates that all IDs in the assignees list belong to active project members.
 * Returns { valid: boolean, invalidIds: string[] }
 */
export const validateProjectAssignees = async (projectId, assigneeIds = []) => {
  if (!assigneeIds || assigneeIds.length === 0) {
    return { valid: true, invalidIds: [] };
  }

  const project = await Project.findById(projectId);
  if (!project) return { valid: false, invalidIds: assigneeIds };

  const ownerId = String(project.owner?._id || project.owner);
  const invalidIds = [];

  for (const id of assigneeIds) {
    const strId = String(id._id || id);
    if (strId === ownerId) {
      continue;
    }

    const member = await ProjectMember.findOne({
      project: projectId,
      user: strId,
      status: 'active',
    });

    if (!member) {
      invalidIds.push(strId);
    }
  }

  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
};

/**
 * Status transitions validation map (Phase 4 State Machine)
 * Allowed transitions:
 * todo -> in_progress, blocked
 * in_progress -> in_review, blocked, todo
 * blocked -> in_progress, todo
 * in_review -> completed, in_progress, blocked
 * completed -> in_progress (reopen)
 */
export const ALLOWED_STATUS_TRANSITIONS = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['in_review', 'blocked', 'todo'],
  blocked: ['todo', 'in_progress'],
  in_review: ['completed', 'in_progress', 'blocked'],
  completed: ['in_progress'],
};

/**
 * Checks if transitioning from currentStatus to newStatus is allowed
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) return false;
  if (currentStatus === newStatus) return true; // Idempotent

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(newStatus));
};
