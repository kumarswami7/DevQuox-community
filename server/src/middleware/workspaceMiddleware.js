import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Application } from '../models/Application.js';

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

    const userId = String(req.user._id || req.user.id);
    const ownerId = String(project.owner?._id || project.owner);
    const isOwner = ownerId === userId;
    const isAdmin = req.user.role === 'admin';

    // Check project.members array
    const memberInArray = project.members?.find(
      (m) => String(m.user?._id || m.user || m) === userId
    );

    if (isOwner || isAdmin || memberInArray) {
      req.project = project;
      req.workspaceMembership = {
        role: isOwner ? 'owner' : (memberInArray?.role || 'contributor'),
        status: 'active',
        joinedAt: memberInArray?.joinedAt || project.createdAt,
      };
      req.isWorkspaceOwner = isOwner || isAdmin;
      return next();
    }

    // Look for active membership in ProjectMember collection
    const membership = await ProjectMember.findOne({
      $or: [
        { project: project._id, user: req.user._id || req.user.id },
        { projectId: project._id, userId: req.user._id || req.user.id },
      ],
      status: 'active',
    });

    if (membership) {
      req.project = project;
      req.workspaceMembership = membership;
      req.isWorkspaceOwner = membership.role === 'owner';
      return next();
    }

    // Check if user has an accepted application on this project
    const acceptedApp = await Application.findOne({
      project: project._id,
      applicant: req.user._id || req.user.id,
      status: 'accepted',
    });

    if (acceptedApp) {
      // Auto-heal ProjectMember record if missing
      await ProjectMember.findOneAndUpdate(
        {
          $or: [
            { project: project._id, user: req.user._id || req.user.id },
            { projectId: project._id, userId: req.user._id || req.user.id },
          ],
        },
        {
          project: project._id,
          projectId: project._id,
          user: req.user._id || req.user.id,
          userId: req.user._id || req.user.id,
          role: 'member',
          status: 'active',
          joinedAt: acceptedApp.updatedAt || new Date(),
        },
        { upsert: true, new: true }
      ).catch(() => {});

      req.project = project;
      req.workspaceMembership = {
        role: 'member',
        status: 'active',
        joinedAt: acceptedApp.updatedAt || new Date(),
      };
      req.isWorkspaceOwner = false;
      return next();
    }

    // Check if user was removed or left
    const inactive = await ProjectMember.findOne({
      $or: [
        { project: project._id, user: req.user._id || req.user.id },
        { projectId: project._id, userId: req.user._id || req.user.id },
      ],
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
  } catch (err) {
    next(err);
  }
};

/**
 * Reusable middleware ensuring the caller has project ownership permissions.
 */
export const requireWorkspaceOwner = (req, res, next) => {
  const isOwner = String(req.project?.owner?._id || req.project?.owner) === String(req.user?._id || req.user?.id);
  if (req.isWorkspaceOwner || isOwner || req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Only the project owner can perform this operation',
  });
};
