import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { Task } from '../../src/models/Task.js';
import { Milestone } from '../../src/models/Milestone.js';
import { ProjectActivity } from '../../src/models/ProjectActivity.js';
import { Notification } from '../../src/models/Notification.js';

dotenv.config();

describe('DevConnect Phase 5: Tasks, Milestones & Team Collaboration Workflow Integration Tests', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let ownerUser;
  let ownerToken;
  let managerUser;
  let managerToken;
  let memberUser;
  let memberToken;
  let outsiderUser;
  let outsiderToken;

  // Projects & Milestones & Tasks
  let projectA;
  let projectB;
  let milestoneA1;
  let milestoneA2;
  let milestoneB;
  let createdTaskIds = [];

  const createdProjectIds = [];

  const createJwtToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern', {
      expiresIn: '7d',
    });
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devconnect-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const app = createApp();
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Create test accounts
    ownerUser = await User.create({
      name: `Owner P5 ${uniqueSuffix}`,
      username: `owner_p5_${uniqueSuffix}`,
      email: `owner_p5_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id);

    managerUser = await User.create({
      name: `Manager P5 ${uniqueSuffix}`,
      username: `manager_p5_${uniqueSuffix}`,
      email: `manager_p5_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    managerToken = createJwtToken(managerUser._id);

    memberUser = await User.create({
      name: `Member P5 ${uniqueSuffix}`,
      username: `member_p5_${uniqueSuffix}`,
      email: `member_p5_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    memberToken = createJwtToken(memberUser._id);

    outsiderUser = await User.create({
      name: `Outsider P5 ${uniqueSuffix}`,
      username: `outsider_p5_${uniqueSuffix}`,
      email: `outsider_p5_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    outsiderToken = createJwtToken(outsiderUser._id);

    // Create Project A
    projectA = await Project.create({
      title: `E-Commerce Microservices P5 ${uniqueSuffix}`,
      description: 'Distributed payment gateway and inventory tracking architecture.',
      category: 'Web Development',
      projectType: 'collaboration',
      experienceLevel: 'intermediate',
      teamSize: 5,
      budget: 8000,
      duration: '3 months',
      status: 'in_progress',
      visibility: 'public',
      requiredSkills: ['Node.js', 'React', 'MongoDB'],
      owner: ownerUser._id,
      acceptedApplicantsCount: 2,
    });
    createdProjectIds.push(projectA._id);

    // Set up ProjectMember records for Project A
    await ProjectMember.create({
      project: projectA._id,
      user: managerUser._id,
      role: 'manager',
      status: 'active',
    });

    await ProjectMember.create({
      project: projectA._id,
      user: memberUser._id,
      role: 'member',
      status: 'active',
    });

    // Create Project B (for cross-project checks)
    projectB = await Project.create({
      title: `AI Knowledge Graph P5 ${uniqueSuffix}`,
      description: 'Secondary project for cross-project boundary testing.',
      category: 'AI / Machine Learning',
      projectType: 'freelance',
      experienceLevel: 'expert',
      teamSize: 3,
      budget: 12000,
      duration: '4 months',
      status: 'in_progress',
      visibility: 'public',
      requiredSkills: ['Python', 'GraphQL'],
      owner: outsiderUser._id,
    });
    createdProjectIds.push(projectB._id);

    // Create Milestones
    milestoneA1 = await Milestone.create({
      project: projectA._id,
      title: 'Sprint 1: Core Setup',
      description: 'Setup database and authorization workflow',
      creator: ownerUser._id,
      status: 'in_progress',
      order: 1,
      dueDate: new Date(Date.now() + 86400000 * 10),
    });

    milestoneA2 = await Milestone.create({
      project: projectA._id,
      title: 'Sprint 2: Client UI',
      description: 'Frontend components and responsive layouts',
      creator: managerUser._id,
      status: 'upcoming',
      order: 2,
      dueDate: new Date(Date.now() + 86400000 * 20),
    });

    milestoneB = await Milestone.create({
      project: projectB._id,
      title: 'Project B Independent Milestone',
      description: 'Belongs strictly to Project B',
      creator: outsiderUser._id,
      status: 'in_progress',
      order: 1,
    });
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        if (createdProjectIds.length > 0) {
          await Task.deleteMany({ project: { $in: createdProjectIds } });
          await Milestone.deleteMany({ project: { $in: createdProjectIds } });
          await ProjectMember.deleteMany({ project: { $in: createdProjectIds } });
          await ProjectActivity.deleteMany({ project: { $in: createdProjectIds } });
          await Project.deleteMany({ _id: { $in: createdProjectIds } });
        }
        await User.deleteMany({
          _id: { $in: [ownerUser._id, managerUser._id, memberUser._id, outsiderUser._id] },
        });
        await Notification.deleteMany({
          recipient: { $in: [ownerUser._id, managerUser._id, memberUser._id, outsiderUser._id] },
        });
      }
    } catch {
      // quiet cleanup
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // 1. TASK CREATION & VALIDATION TESTS
  // =========================================================================
  describe('1. Task Creation & Validation', () => {
    let createdTaskId;

    test('POST /api/projects/:projectId/tasks succeeds for authorized workspace member', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          title: 'Implement JWT refresh rotation',
          description: 'Secure HTTP-only cookie refresh rotation with Redis or Mongo store',
          priority: 'high',
          status: 'todo',
          assignees: [memberUser._id],
          milestone: milestoneA1._id,
          estimatedEffort: 6,
          labels: ['security', 'backend'],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.title, 'Implement JWT refresh rotation');
      assert.equal(data.task.priority, 'high');
      assert.equal(data.task.status, 'todo');
      assert.equal(String(data.task.creator._id || data.task.creator), String(managerUser._id));
      assert.equal(data.task.assignees.length, 1);
      assert.equal(String(data.task.assignees[0]._id), String(memberUser._id));
      assert.equal(String(data.task.milestone._id), String(milestoneA1._id));

      createdTaskId = data.task._id;
      createdTaskIds.push(createdTaskId);

      // Verify notification sent to assigned member
      const notification = await Notification.findOne({
        recipient: memberUser._id,
        type: 'task',
      });
      assert.ok(notification);
      assert.match(notification.message, /assigned you to task/i);
    });

    test('POST /api/projects/:projectId/tasks rejects unauthenticated caller with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthenticated Task' }),
      });

      assert.equal(res.status, 401);
    });

    test('POST /api/projects/:projectId/tasks rejects outsider non-member with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({ title: 'Outsider Intruder Task' }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, 'ACCESS_DENIED');
    });

    test('POST /api/projects/:projectId/tasks rejects missing or blank title with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ title: '  ', description: 'Blank title' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /title is required/i);
    });

    test('POST /api/projects/:projectId/tasks rejects assignment to non-project member with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: 'Invalid Assignment Task',
          assignees: [outsiderUser._id],
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /All assignees must be active project members/i);
    });

    test('POST /api/projects/:projectId/tasks rejects cross-project milestone linking with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: 'Cross Project Linking Task',
          milestone: milestoneB._id, // Belongs to Project B!
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Cross-project milestone association is prohibited/i);
    });
  });

  // =========================================================================
  // 2. TASK ASSIGNMENT, REASSIGNMENT & UNASSIGNMENT
  // =========================================================================
  describe('2. Task Assignment, Reassignment & Lifecycle', () => {
    let lifecycleTask;

    before(async () => {
      lifecycleTask = await Task.create({
        project: projectA._id,
        title: 'Build checkout cart review interface',
        description: 'React components for order summary and voucher input',
        creator: ownerUser._id,
        assignees: [memberUser._id],
        milestone: milestoneA1._id,
        status: 'todo',
        priority: 'medium',
      });
      createdTaskIds.push(lifecycleTask._id);
    });

    test('GET /api/tasks/:taskId returns task details to authorized member', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${lifecycleTask._id}`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.title, 'Build checkout cart review interface');
      assert.equal(data.task.assignees.length, 1);
    });

    test('GET /api/tasks/:taskId rejects unauthorized outsider with 403', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${lifecycleTask._id}`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('PATCH /api/tasks/:taskId reassigns task to another active member', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${lifecycleTask._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          assignees: [managerUser._id, memberUser._id],
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.assignees.length, 2);

      // Verify activity recorded
      const act = await ProjectActivity.findOne({
        project: projectA._id,
        action: 'task_reassigned',
      });
      assert.ok(act);
    });

    test('Ordinary member cannot reassign tasks when policy restricts that action', async () => {
      const otherTask = await Task.create({
        project: projectA._id,
        title: 'Task created by owner',
        creator: ownerUser._id,
        assignees: [managerUser._id],
      });
      createdTaskIds.push(otherTask._id);

      const res = await fetch(`${baseUrl}/api/tasks/${otherTask._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          assignees: [memberUser._id],
        }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Only the project owner, manager, or task creator can reassign/i);
    });

    test('GET /api/tasks/my-tasks returns tasks assigned to authenticated caller', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.tasks.length >= 1);
      const hasTask = data.tasks.some((t) => String(t._id) === String(lifecycleTask._id));
      assert.equal(hasTask, true);
    });
  });

  // =========================================================================
  // 3. TASK STATUS WORKFLOW & FORMAL REVIEW APPROVAL
  // =========================================================================
  describe('3. Task Status & Review Workflow', () => {
    let reviewTask;

    before(async () => {
      reviewTask = await Task.create({
        project: projectA._id,
        title: 'Payment webhook handler and idempotency key check',
        description: 'Verify HMAC signatures and avoid double charges',
        creator: ownerUser._id,
        assignees: [memberUser._id],
        milestone: milestoneA1._id,
        status: 'todo',
        priority: 'high',
      });
      createdTaskIds.push(reviewTask._id);
    });

    test('Valid transition: todo -> in_progress succeeds', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.status, 'in_progress');
    });

    test('Invalid status transition: in_progress -> todo is valid, but invalid arbitrary status is rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ status: 'not_a_valid_status' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /must be one of/i);
    });

    test('Valid transition: in_progress -> in_review moves task to formal review', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ status: 'in_review', note: 'Ready for PR review' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.status, 'in_review');

      // Verify review notification dispatched to owner
      const notif = await Notification.findOne({
        recipient: ownerUser._id,
        type: 'task',
        title: 'Task Submitted for Review',
      });
      assert.ok(notif);
    });

    test('Formal review security: ordinary member cannot approve task completion without permission (403)', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`, // Ordinary member, not owner/manager/creator!
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Formal review approval required/i);
    });

    test('Authorized completion: project owner approves task completion, setting completedAt timestamp', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.status, 'completed');
      assert.ok(data.task.completedAt);

      // Verify notification sent to assignee about completion
      const notif = await Notification.findOne({
        recipient: memberUser._id,
        type: 'task',
        title: 'Task Approved & Completed',
      });
      assert.ok(notif);
    });

    test('Idempotency: repeating status change to same status returns 200 without duplicate updates', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /already in status/i);
    });

    test('Reopening task: authorized owner reopens task, clearing completedAt', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${reviewTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.task.status, 'in_progress');
      assert.equal(data.task.completedAt, null);

      // Verify reopen activity
      const reopenAct = await ProjectActivity.findOne({
        project: projectA._id,
        action: 'task_reopened',
      });
      assert.ok(reopenAct);
    });
  });

  // =========================================================================
  // 4. MILESTONES & PROGRESS CALCULATION
  // =========================================================================
  describe('4. Milestones, Tasks Association & Progress Aggregation', () => {
    let testMilestone;

    test('POST /api/projects/:projectId/milestones succeeds for manager or owner', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          title: 'Sprint 3: Payment Integration',
          description: 'Stripe webhooks and escrow settlement',
          deliverables: ['Stripe test charge', 'Receipt generation'],
          order: 3,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 30),
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.milestone.title, 'Sprint 3: Payment Integration');
      assert.equal(data.milestone.progress, 0);

      testMilestone = data.milestone;
    });

    test('POST /api/projects/:projectId/milestones rejects ordinary member with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Milestone',
        }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Only the project owner or manager can create milestones/i);
    });

    test('POST /api/projects/:projectId/milestones rejects invalid dates (dueDate < startDate) with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: 'Invalid Date Milestone',
          startDate: new Date(Date.now() + 86400000 * 5),
          dueDate: new Date(Date.now()), // Earlier than start date!
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /due date cannot be earlier than start date/i);
    });

    test('Milestone Progress Calculation: dynamically computes progress from linked tasks', async () => {
      // Create 2 tasks linked to testMilestone: 1 completed, 1 in_progress
      const task1 = await Task.create({
        project: projectA._id,
        title: 'Task M1 Completed',
        creator: ownerUser._id,
        milestone: testMilestone._id,
        status: 'completed',
        completedAt: new Date(),
      });
      createdTaskIds.push(task1._id);

      const task2 = await Task.create({
        project: projectA._id,
        title: 'Task M2 In Progress',
        creator: ownerUser._id,
        milestone: testMilestone._id,
        status: 'in_progress',
      });
      createdTaskIds.push(task2._id);

      // Fetch milestone details
      const res = await fetch(`${baseUrl}/api/milestones/${testMilestone._id}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.milestone.totalTasks, 2);
      assert.equal(data.milestone.completedTasks, 1);
      // Progress = 1 / 2 * 100 = 50%
      assert.equal(data.milestone.progress, 50);
    });

    test('GET /api/projects/:projectId/milestones lists all milestones with live progress', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/milestones`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.milestones.length >= 3);
    });

    test('DELETE /api/milestones/:milestoneId unlinks associated tasks gracefully', async () => {
      const res = await fetch(`${baseUrl}/api/milestones/${testMilestone._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.unlinkedTasksCount >= 2);

      // Verify milestone is marked deleted
      const deletedMilestone = await Milestone.findById(testMilestone._id);
      assert.equal(deletedMilestone.isDeleted, true);

      // Verify tasks now have milestone: null
      const tasks = await Task.find({ project: projectA._id, title: /Task M[12]/ });
      for (const t of tasks) {
        assert.equal(t.milestone, null);
      }
    });
  });

  // =========================================================================
  // 5. PROJECT PROGRESS OVERVIEW & METRICS
  // =========================================================================
  describe('5. Project Progress Overview & Metrics', () => {
    test('GET /api/projects/:id/progress returns synthesized project metrics', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/progress`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.progress);
      assert.equal(typeof data.progress.overallProgress, 'number');
      assert.ok(data.progress.totalTasks >= 3);
      assert.ok(data.progress.priorityBreakdown);
      assert.equal(typeof data.progress.priorityBreakdown.high, 'number');
    });

    test('GET /api/projects/:id/progress rejects outsider with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/progress`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });

      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 6. MEMBER REMOVAL & SAFE UNASSIGNMENT POLICY
  // =========================================================================
  describe('6. Member Removal & Safe Unassignment Policy', () => {
    let departingMember;
    let departingToken;
    let assignedTask;

    before(async () => {
      departingMember = await User.create({
        name: `Departing Dev ${uniqueSuffix}`,
        username: `departing_${uniqueSuffix}`,
        email: `departing_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
        status: 'active',
      });
      departingToken = createJwtToken(departingMember._id);

      await ProjectMember.create({
        project: projectA._id,
        user: departingMember._id,
        role: 'member',
        status: 'active',
      });

      assignedTask = await Task.create({
        project: projectA._id,
        title: 'Task for departing developer',
        creator: ownerUser._id,
        assignees: [departingMember._id],
        status: 'in_progress',
      });
      createdTaskIds.push(assignedTask._id);
    });

    test('Member removal safely unassigns active tasks without corrupting state', async () => {
      // Owner removes the member
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/members/${departingMember._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ reason: 'Replaced on team' }),
      });

      assert.equal(res.status, 200);

      // Verify that the task is now unassigned
      const taskAfter = await Task.findById(assignedTask._id);
      const isStillAssigned = taskAfter.assignees.some(
        (a) => String(a) === String(departingMember._id)
      );
      assert.equal(isStillAssigned, false);

      // Verify task_unassigned activity record was logged
      const unassignedAct = await ProjectActivity.findOne({
        project: projectA._id,
        action: 'task_unassigned',
        targetUser: departingMember._id,
      });
      assert.ok(unassignedAct);
      assert.equal(unassignedAct.details.reason, 'Member removed from project team by owner');
    });
  });

  // =========================================================================
  // 7. TASK FILTERING & PAGINATION
  // =========================================================================
  describe('7. Task Filtering & Pagination', () => {
    test('GET /api/projects/:projectId/tasks filters by status', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks?status=in_progress`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.tasks));
      for (const t of data.tasks) {
        assert.equal(t.status, 'in_progress');
      }
    });

    test('GET /api/projects/:projectId/tasks filters by search query q', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks?q=webhook`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.tasks.length >= 1);
      assert.match(data.tasks[0].title, /webhook/i);
    });

    test('GET /api/projects/:projectId/tasks applies database pagination', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${projectA._id}/tasks?page=1&limit=2`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.tasks.length, 2);
      assert.equal(data.page, 1);
      assert.ok(data.total >= 3);
    });
  });
});
