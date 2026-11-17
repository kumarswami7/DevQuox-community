import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Application } from '../models/Application.js';

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

  // Also check embedded project.members array
  const memberInArray = project.members?.find((m) => String(m.user?._id || m.user || m) === uId);
  if (memberInArray) {
    return { isMember: true, role: memberInArray.role || 'contributor', isOwner: false, project };
  }

  // Also check if user has an accepted application
  const acceptedApp = await Application.findOne({
    project: project._id,
    applicant: uId,
    status: 'accepted',
  });
  if (acceptedApp) {
    return { isMember: true, role: 'contributor', isOwner: false, project };
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
 * ONLY Project Owner, Manager, or Admin.
 * (Unassigned task creator can edit if unassigned).
 */
export const canEditTask = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin' || isOwner || role === 'manager') return true;
  // If task is unassigned, creator may edit details
  const uid = user._id || user.id;
  if ((!task.assignees || task.assignees.length === 0) && isTaskCreator(task, uid)) {
    return true;
  }
  return false;
};

/**
 * Helper: Check if user can delete task
 * ONLY Project Owner, Manager, or Admin
 */
export const canDeleteTask = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin' || isOwner || role === 'manager') return true;
  const uid = user._id || user.id;
  if ((!task.assignees || task.assignees.length === 0) && isTaskCreator(task, uid)) {
    return true;
  }
  return false;
};

/**
 * Helper: Check if user can change task status
 * - Assigned member can ONLY update their own assigned task
 * - Project Owner, Manager, or Admin can update any task
 * - If unassigned, creator can update
 */
export const canChangeTaskStatus = (task, user, { isOwner, role }) => {
  if (!task || !user) return false;
  if (user.role === 'admin' || isOwner || role === 'manager') return true;
  const uid = user._id || user.id;
  // Assigned team member can update their own task
  if (isTaskAssignee(task, uid)) return true;
  // Unassigned tasks can be updated by creator
  if ((!task.assignees || task.assignees.length === 0) && isTaskCreator(task, uid)) {
    return true;
  }
  return false;
};

/**
 * Helper: Check if user can assign tasks to members
 * ONLY Project Owner, Manager, or Admin
 */
export const canAssignTask = (user, { isOwner, role }) => {
  if (!user) return false;
  return user.role === 'admin' || isOwner || role === 'manager';
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

    if (member) {
      continue;
    }

    const memberInArray = project.members?.some((m) => String(m.user?._id || m.user || m) === strId);
    if (memberInArray) {
      continue;
    }

    const acceptedApp = await Application.findOne({
      project: projectId,
      applicant: strId,
      status: 'accepted',
    });
    if (acceptedApp) {
      continue;
    }

    invalidIds.push(strId);
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
