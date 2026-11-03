import { useMemo } from 'react';

/**
 * Centralized Workspace Permission Hook
 * Evaluates role-based capabilities across the Protected Workspace.
 *
 * @param {Object} project - The active project document
 * @param {Object|null} task - An optional task to check task-level permissions against
 * @param {Object|null} currentUser - The currently authenticated user from authStore
 * @param {Object|null} membership - The workspace membership descriptor { role, status, joinedAt }
 * @returns {Object} Comprehensive boolean capabilities map
 */
export const useWorkspacePermissions = (project, task = null, currentUser = null, membership = null) => {
  return useMemo(() => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if (!currentUserId) {
      return {
        isOwner: false,
        isManager: false,
        isAdmin: false,
        isElevated: false,
        isCreator: false,
        isAssignee: false,
        isMember: false,
        canEditProject: false,
        canManageTeam: false,
        canCreateMilestone: false,
        canEditTask: false,
        canDeleteTask: false,
        canChangeStatus: false,
        canApproveTask: false,
      };
    }

    const ownerId = String(project?.owner?._id || project?.owner?.id || project?.owner || '');
    const isOwner = Boolean(ownerId && ownerId === String(currentUserId)) || membership?.role === 'owner';
    const isManager = membership?.role === 'manager';
    const isAdmin = currentUser?.role === 'admin';
    const isElevated = isOwner || isManager || isAdmin;

    const creatorId = String(task?.creator?._id || task?.creator?.id || task?.creator || '');
    const isCreator = Boolean(task && creatorId && creatorId === String(currentUserId));

    const isAssignee = Boolean(
      task &&
      Array.isArray(task.assignees) &&
      task.assignees.some((a) => String(a?._id || a?.id || a) === String(currentUserId))
    );

    const isMember = Boolean(isOwner || membership?.status === 'active' || isElevated);

    const canEditProject = isOwner || isAdmin;
    const canManageTeam = isOwner || isAdmin;
    const canCreateMilestone = isElevated;

    // Task capabilities
    const canEditTask = Boolean(isElevated || isCreator);
    const canDeleteTask = Boolean(isElevated || isCreator);
    const canChangeStatus = Boolean(isElevated || isCreator || isAssignee);
    const canApproveTask = Boolean(isElevated || isCreator);

    return {
      isOwner,
      isManager,
      isAdmin,
      isElevated,
      isCreator,
      isAssignee,
      isMember,
      canEditProject,
      canManageTeam,
      canCreateMilestone,
      canEditTask,
      canDeleteTask,
      canChangeStatus,
      canApproveTask,
    };
  }, [project, task, currentUser, membership]);
};

export default useWorkspacePermissions;

