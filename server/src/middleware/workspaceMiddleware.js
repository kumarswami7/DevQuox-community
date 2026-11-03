import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';

/**
 * Reusable middleware to verify that an authenticated user has active workspace access to a project.
 * Grants access if:
 * 1. User is the project owner
 * 2. User has an active ProjectMember record (`status: 'active'`)
 * 3. User is a global platform admin
 */
export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project identifier is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (isOwner || isAdmin) {
      req.project = project;
      req.workspaceMembership = {
        role: 'owner',
        status: 'active',
        joinedAt: project.createdAt,
      };
      req.isWorkspaceOwner = true;
      return next();
    }

    // Look for active membership in ProjectMember collection
    const membership = await ProjectMember.findOne({
      project: project._id,
      user: req.user._id,
      status: 'active',
    });

    if (!membership) {
      // Check if user was removed or left
      const inactive = await ProjectMember.findOne({
        project: project._id,
        user: req.user._id,
      });

      if (inactive?.status === 'removed') {
        return res.status(403).json({
          success: false,
          code: 'MEMBERSHIP_REMOVED',
          message: 'Your access to this project workspace has been revoked by the owner',
        });
      }

      if (inactive?.status === 'left') {
        return res.status(403).json({
          success: false,
          code: 'MEMBERSHIP_LEFT',
          message: 'You previously departed from this project workspace',
        });
      }

      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You do not have active workspace access to this project',
      });
    }

    req.project = project;
    req.workspaceMembership = membership;
    req.isWorkspaceOwner = membership.role === 'owner';
    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Reusable middleware ensuring the caller has project ownership permissions.
 */
export const requireWorkspaceOwner = (req, res, next) => {
  if (req.isWorkspaceOwner || String(req.project?.owner) === String(req.user?._id) || req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Only the project owner can perform this operation',
  });
};
