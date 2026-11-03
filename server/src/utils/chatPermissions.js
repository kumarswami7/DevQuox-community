import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Application } from '../models/Application.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Validates that a user has active workspace access to a project.
 */
export const verifyProjectWorkspaceAccess = async (userId, projectId) => {
  if (!projectId || !userId) {
    return { allowed: false, error: 'Missing user or project identifier' };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { allowed: false, error: 'Project not found' };
  }

  // Owner always has access
  if (String(project.owner) === String(userId)) {
    return { allowed: true, role: 'owner', project };
  }

  // Check if member was explicitly removed or left
  const inactiveMembership = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: { $in: ['removed', 'left'] },
  });

  if (inactiveMembership) {
    return {
      allowed: false,
      error: `Access revoked: membership is ${inactiveMembership.status}`,
    };
  }

  // Active workspace member
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: 'active',
  });

  if (membership) {
    return { allowed: true, role: membership.role, project, membership };
  }

  // Active accepted application check (guaranteed access for accepted applicants)
  const acceptedApp = await Application.findOne({
    project: projectId,
    applicant: userId,
    status: 'accepted',
  });

  if (acceptedApp) {
    return { allowed: true, role: 'member', project };
  }

  return {
    allowed: false,
    error: 'Access denied: not an active member of this project workspace',
  };
};

/**
 * Validates that a user has access to a specific conversation (project or direct).
 */
export const verifyConversationAccess = async (userId, conversationId) => {
  if (!conversationId || !userId) {
    return { allowed: false, error: 'Missing user or conversation identifier' };
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return { allowed: false, notFound: true, error: 'Invalid conversation identifier' };
  }

  let conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    // Check if conversationId is a recipient user's ID
    const recipientUser = await User.findById(conversationId);
    if (recipientUser && String(recipientUser._id) !== String(userId)) {
      conversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [userId, conversationId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [userId, conversationId],
        });
      }

      return {
        allowed: true,
        conversation,
        isProject: false,
      };
    }

    return { allowed: false, notFound: true, error: 'Conversation not found' };
  }

  if (conversation.type === 'project' && conversation.project) {
    const projAccess = await verifyProjectWorkspaceAccess(userId, conversation.project);
    if (!projAccess.allowed) {
      return projAccess;
    }
    return {
      allowed: true,
      conversation,
      project: projAccess.project,
      isProject: true,
    };
  }

  // Direct conversation: user must be in participants list
  const isParticipant = conversation.participants.some(
    (p) => String(p._id || p) === String(userId)
  );

  if (!isParticipant) {
    return {
      allowed: false,
      error: 'Access denied: you are not a participant in this conversation',
    };
  }

  return {
    allowed: true,
    conversation,
    isProject: false,
  };
};

export default {
  verifyProjectWorkspaceAccess,
  verifyConversationAccess,
};
