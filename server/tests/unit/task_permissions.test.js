import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isProjectOwner,
  isTaskCreator,
  isTaskAssignee,
  canEditProject,
  canManageTeam,
  canCreateMilestone,
  canEditTask,
  canDeleteTask,
  canChangeTaskStatus,
  canApproveTask,
  isValidStatusTransition,
  PERMISSION_ERROR,
} from '../../src/utils/taskPermissions.js';

describe('Task & Workspace Authorization Engine (Unit)', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const managerId = '507f1f77bcf86cd799439022';
  const creatorId = '507f1f77bcf86cd799439033';
  const assigneeId = '507f1f77bcf86cd799439044';
  const memberId = '507f1f77bcf86cd799439055';
  const outsiderId = '507f1f77bcf86cd799439066';

  const mockProject = {
    _id: '607f1f77bcf86cd799439001',
    owner: { _id: ownerId },
  };

  const mockTask = {
    _id: '707f1f77bcf86cd799439001',
    creator: { _id: creatorId },
    assignees: [{ _id: assigneeId }],
    status: 'in_progress',
  };

  it('correctly identifies project ownership', () => {
    assert.strictEqual(isProjectOwner(mockProject, ownerId), true);
    assert.strictEqual(isProjectOwner(mockProject, outsiderId), false);
    assert.strictEqual(isProjectOwner(mockProject, null), false);
  });

  it('correctly identifies task creator and assignees', () => {
    assert.strictEqual(isTaskCreator(mockTask, creatorId), true);
    assert.strictEqual(isTaskCreator(mockTask, assigneeId), false);
    assert.strictEqual(isTaskAssignee(mockTask, assigneeId), true);
    assert.strictEqual(isTaskAssignee(mockTask, memberId), false);
  });

  it('strictly limits project settings editing to Project Owner & Admin', () => {
    assert.strictEqual(canEditProject(mockProject, { _id: ownerId, role: 'developer' }), true);
    assert.strictEqual(canEditProject(mockProject, { _id: outsiderId, role: 'admin' }), true);
    assert.strictEqual(canEditProject(mockProject, { _id: managerId, role: 'developer' }), false);
    assert.strictEqual(canEditProject(mockProject, { _id: creatorId, role: 'developer' }), false);
    assert.strictEqual(canEditProject(mockProject, { _id: memberId, role: 'developer' }), false);
  });

  it('strictly limits team roster management to Project Owner & Admin', () => {
    assert.strictEqual(canManageTeam(mockProject, { _id: ownerId, role: 'developer' }), true);
    assert.strictEqual(canManageTeam(mockProject, { _id: outsiderId, role: 'admin' }), true);
    assert.strictEqual(canManageTeam(mockProject, { _id: managerId, role: 'developer' }), false);
    assert.strictEqual(canManageTeam(mockProject, { _id: memberId, role: 'developer' }), false);
  });

  it('allows elevated roles (Owner, Manager, Admin) to create milestones', () => {
    assert.strictEqual(canCreateMilestone('owner', true, { _id: ownerId, role: 'developer' }), true);
    assert.strictEqual(canCreateMilestone('manager', false, { _id: managerId, role: 'developer' }), true);
    assert.strictEqual(canCreateMilestone(null, false, { _id: outsiderId, role: 'admin' }), true);
    assert.strictEqual(canCreateMilestone('member', false, { _id: memberId, role: 'developer' }), false);
  });

  it('allows Task Creator and Elevated roles to edit or delete tasks', () => {
    // Creator can edit/delete their own task
    assert.strictEqual(canEditTask(mockTask, { _id: creatorId, role: 'developer' }, { isOwner: false, role: 'member' }), true);
    assert.strictEqual(canDeleteTask(mockTask, { _id: creatorId, role: 'developer' }, { isOwner: false, role: 'member' }), true);

    // Owner can edit/delete any task
    assert.strictEqual(canEditTask(mockTask, { _id: ownerId, role: 'developer' }, { isOwner: true, role: 'owner' }), true);
    assert.strictEqual(canDeleteTask(mockTask, { _id: ownerId, role: 'developer' }, { isOwner: true, role: 'owner' }), true);

    // Non-creator, non-owner members CANNOT edit or delete someone else\'s task
    assert.strictEqual(canEditTask(mockTask, { _id: memberId, role: 'developer' }, { isOwner: false, role: 'member' }), false);
    assert.strictEqual(canDeleteTask(mockTask, { _id: memberId, role: 'developer' }, { isOwner: false, role: 'member' }), false);
    assert.strictEqual(canEditTask(mockTask, { _id: assigneeId, role: 'developer' }, { isOwner: false, role: 'member' }), false);
  });

  it('allows Task Assignee, Creator, and Elevated roles to change status', () => {
    // Assignee can change status
    assert.strictEqual(canChangeTaskStatus(mockTask, { _id: assigneeId, role: 'developer' }, { isOwner: false, role: 'member' }), true);
    // Creator can change status
    assert.strictEqual(canChangeTaskStatus(mockTask, { _id: creatorId, role: 'developer' }, { isOwner: false, role: 'member' }), true);
    // Owner can change status
    assert.strictEqual(canChangeTaskStatus(mockTask, { _id: ownerId, role: 'developer' }, { isOwner: true, role: 'owner' }), true);
    // Non-assigned member CANNOT change status
    assert.strictEqual(canChangeTaskStatus(mockTask, { _id: memberId, role: 'developer' }, { isOwner: false, role: 'member' }), false);
    // Outsider CANNOT change status
    assert.strictEqual(canChangeTaskStatus(mockTask, { _id: outsiderId, role: 'developer' }, { isOwner: false, role: null }), false);
  });

  it('enforces task workflow state machine transitions', () => {
    // Valid transitions
    assert.strictEqual(isValidStatusTransition('todo', 'in_progress'), true);
    assert.strictEqual(isValidStatusTransition('todo', 'blocked'), true);
    assert.strictEqual(isValidStatusTransition('in_progress', 'in_review'), true);
    assert.strictEqual(isValidStatusTransition('in_progress', 'blocked'), true);
    assert.strictEqual(isValidStatusTransition('in_progress', 'todo'), true);
    assert.strictEqual(isValidStatusTransition('in_review', 'completed'), true);
    assert.strictEqual(isValidStatusTransition('in_review', 'in_progress'), true);
    assert.strictEqual(isValidStatusTransition('completed', 'in_progress'), true); // Reopen
    assert.strictEqual(isValidStatusTransition('blocked', 'todo'), true);
    assert.strictEqual(isValidStatusTransition('blocked', 'in_progress'), true);

    // Invalid transitions
    assert.strictEqual(isValidStatusTransition('todo', 'completed'), false); // Cannot bypass in_progress and in_review
    assert.strictEqual(isValidStatusTransition('in_progress', 'completed'), false); // Must go through in_review first
    assert.strictEqual(isValidStatusTransition('todo', 'in_review'), false); // Cannot skip in_progress
  });

  it('standardizes permission error payload', () => {
    assert.strictEqual(PERMISSION_ERROR.code, 'PERMISSION_DENIED');
    assert.strictEqual(typeof PERMISSION_ERROR.message, 'string');
  });
});
