import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { Application } from '../../src/models/Application.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { ProjectActivity } from '../../src/models/ProjectActivity.js';
import { Notification } from '../../src/models/Notification.js';

dotenv.config();

describe('DevConnect Phase 4: Project Acceptance, Team Membership & Secure Workspace Access', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let ownerUser;
  let ownerToken;
  let developerUser1;
  let developerToken1;
  let developerUser2;
  let developerToken2;
  let outsiderUser;
  let outsiderToken;

  // Track created resources for cleanup
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

    // Safely drop any legacy Atlas indexes if present
    await Application.collection.dropIndex('projectId_1_applicantId_1').catch(() => {});
    await ProjectMember.collection.dropIndex('projectId_1_userId_1').catch(() => {});

    // Create test user accounts
    ownerUser = await User.create({
      name: `Team Owner ${uniqueSuffix}`,
      username: `team_owner_${uniqueSuffix}`,
      email: `team_owner_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id);

    developerUser1 = await User.create({
      name: `Developer One ${uniqueSuffix}`,
      username: `dev1_${uniqueSuffix}`,
      email: `dev1_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      headline: 'Full-stack MERN Architect',
      skills: ['React', 'Node.js', 'MongoDB'],
      status: 'active',
    });
    developerToken1 = createJwtToken(developerUser1._id);

    developerUser2 = await User.create({
      name: `Developer Two ${uniqueSuffix}`,
      username: `dev2_${uniqueSuffix}`,
      email: `dev2_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      headline: 'Frontend UI/UX Specialist',
      skills: ['React', 'Tailwind', 'CSS'],
      status: 'active',
    });
    developerToken2 = createJwtToken(developerUser2._id);

    outsiderUser = await User.create({
      name: `Outsider User ${uniqueSuffix}`,
      username: `outsider_${uniqueSuffix}`,
      email: `outsider_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    outsiderToken = createJwtToken(outsiderUser._id);
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        if (createdProjectIds.length > 0) {
          await Application.deleteMany({ project: { $in: createdProjectIds } });
          await ProjectMember.deleteMany({ project: { $in: createdProjectIds } });
          await ProjectActivity.deleteMany({ project: { $in: createdProjectIds } });
          await Project.deleteMany({ _id: { $in: createdProjectIds } });
        }
        await User.deleteMany({
          _id: { $in: [ownerUser._id, developerUser1._id, developerUser2._id, outsiderUser._id] },
        });
        await Notification.deleteMany({
          recipient: { $in: [ownerUser._id, developerUser1._id, developerUser2._id, outsiderUser._id] },
        });
      }
    } catch {
      // Clean up quietly
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // Shared state across sequential test groups
  let testProject;
  let application1;
  let application2;
  let application3;

  // ====================================================
  // GROUP 1: Application Acceptance & Membership Integration
  // ====================================================
  describe('1. Application Acceptance Integration & Membership Creation', () => {
    test('Project creation initializes owner membership and creation activity', async () => {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: `DevConnect Collaboration Hub ${uniqueSuffix}`,
          description: 'A platform to test project team membership and workspace access security.',
          category: 'Web Development',
          teamSize: 2,
          budgetMin: 500,
          budgetMax: 2000,
          requiredSkills: ['React', 'Node.js', 'Express'],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      testProject = data.project;
      createdProjectIds.push(testProject._id);

      // Verify explicit owner membership record
      const ownerMember = await ProjectMember.findOne({
        project: testProject._id,
        user: ownerUser._id,
      });
      assert.ok(ownerMember, 'Owner should have an explicit ProjectMember record');
      assert.equal(ownerMember.role, 'owner');
      assert.equal(ownerMember.status, 'active');

      // Verify project creation activity
      const activity = await ProjectActivity.findOne({
        project: testProject._id,
        action: 'project_created',
      });
      assert.ok(activity, 'Project creation should be logged in ProjectActivity');
      assert.equal(String(activity.user), String(ownerUser._id));
    });

    test('Developers submit applications to the project', async () => {
      // Developer 1 applies
      const res1 = await fetch(`${baseUrl}/api/projects/${testProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken1}`,
        },
        body: JSON.stringify({
          coverLetter: 'Experienced full stack developer interested in building this platform.',
          proposedRate: '$50/hr',
        }),
      });
      assert.equal(res1.status, 201);
      const data1 = await res1.json();
      application1 = data1.application;

      // Developer 2 applies
      const res2 = await fetch(`${baseUrl}/api/projects/${testProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken2}`,
        },
        body: JSON.stringify({
          coverLetter: 'Frontend developer passionate about UI design and real-time collaboration.',
          proposedRate: '$45/hr',
        }),
      });
      assert.equal(res2.status, 201);
      const data2 = await res2.json();
      application2 = data2.application;

      // Outsider applies while project is open
      const res3 = await fetch(`${baseUrl}/api/projects/${testProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({
          coverLetter: 'Interested in working on this project.',
          proposedRate: '$40/hr',
        }),
      });
      assert.equal(res3.status, 201);
      const data3 = await res3.json();
      application3 = data3.application;

      // Unaccepted applicants must NOT yet have ProjectMember records
      const pendingMember = await ProjectMember.findOne({
        project: testProject._id,
        user: developerUser1._id,
      });
      assert.equal(pendingMember, null, 'Applicant must not have membership before acceptance');
    });

    test('Owner accepts application: creates active ProjectMember record and audit activities', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${application1._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
          decisionReason: 'Strong skill set and portfolio.',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'accepted');

      // Verify ProjectMember record was created
      const member = await ProjectMember.findOne({
        project: testProject._id,
        user: developerUser1._id,
      });
      assert.ok(member, 'Active ProjectMember record must be created on acceptance');
      assert.equal(member.role, 'member');
      assert.equal(member.status, 'active');
      assert.equal(String(member.addedBy), String(ownerUser._id));

      // Verify ProjectActivity entries
      const acceptActivity = await ProjectActivity.findOne({
        project: testProject._id,
        action: 'application_accepted',
        targetUser: developerUser1._id,
      });
      assert.ok(acceptActivity, 'application_accepted activity should be logged');

      const joinActivity = await ProjectActivity.findOne({
        project: testProject._id,
        action: 'member_joined',
        user: developerUser1._id,
      });
      assert.ok(joinActivity, 'member_joined activity should be logged');

      // Verify applicant received notification with workspace link
      const notif = await Notification.findOne({
        recipient: developerUser1._id,
        type: 'application',
      }).sort({ createdAt: -1 });
      assert.ok(notif, 'Notification should be delivered to applicant');
      assert.match(notif.link, /workspace/i, 'Notification link should navigate to workspace');
    });

    test('Idempotency: repeating acceptance request returns 200 without duplicate membership', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${application1._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /already accepted/i);

      // Verify no duplicate ProjectMember records
      const count = await ProjectMember.countDocuments({
        project: testProject._id,
        user: developerUser1._id,
      });
      assert.equal(count, 1, 'Only one ProjectMember record must exist per user per project');
    });

    test('Owner accepts second application: fills team capacity (2/2)', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${application2._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
          decisionReason: 'Excellent UI skills.',
        }),
      });

      assert.equal(res.status, 200);
      const member2 = await ProjectMember.findOne({
        project: testProject._id,
        user: developerUser2._id,
        status: 'active',
      });
      assert.ok(member2);
    });

    test('Capacity enforcement: third application beyond team capacity is rejected with 409 Conflict', async () => {
      // Owner attempts to accept third application when team capacity is already full (2/2 accepted)
      const acceptRes = await fetch(`${baseUrl}/api/applications/${application3._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      const acceptData = await acceptRes.json();
      assert.equal(acceptRes.status, 409);
      assert.equal(acceptData.success, false);
      assert.match(acceptData.message, /capacity reached/i);
    });
  });

  // ====================================================
  // GROUP 2: Centralized Workspace Authorization & Security
  // ====================================================
  describe('2. Protected Project Workspace Security & Authorization', () => {
    test('Unauthenticated request to workspace is rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Non-member outsider accessing workspace is rejected with 403 Access Denied', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, 'ACCESS_DENIED');
    });

    test('Project owner accessing workspace succeeds with 200 and full workspace payload', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.workspace);
      assert.equal(data.workspace.isOwner, true);
      assert.equal(data.workspace.membership.role, 'owner');
      assert.equal(data.workspace.project.title, testProject.title);
      assert.ok(Array.isArray(data.workspace.team));
      assert.ok(Array.isArray(data.workspace.activities));

      // Check Phase 5 and Phase 6 placeholder configurations
      assert.ok(data.workspace.placeholders.tasks.readyForPhase5);
      assert.ok(data.workspace.placeholders.chat.readyForPhase6);
    });

    test('Active accepted member accessing workspace succeeds with 200', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`, {
        headers: { Authorization: `Bearer ${developerToken1}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.workspace.isOwner, false);
      assert.equal(data.workspace.membership.role, 'member');
      assert.equal(data.workspace.membership.status, 'active');
      assert.equal(data.workspace.team.length >= 2, true);
    });
  });

  // ====================================================
  // GROUP 3: Team Members Directory & Data Sanitization
  // ====================================================
  describe('3. Team Member Directory & Sensitive Data Sanitization', () => {
    test('GET /api/projects/:id/members returns active team members with safe fields', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.members.length >= 2);

      // Verify that NO sensitive user fields are exposed
      for (const m of data.members) {
        assert.ok(m.user.name, 'Display name should be present');
        assert.ok(m.user.username, 'Username should be present');
        assert.equal(m.user.password, undefined, 'Password hash must NEVER be exposed');
        assert.equal(m.user.email, undefined, 'Email must NOT be exposed in public member feed');
        assert.equal(m.user.resetPasswordToken, undefined, 'Reset token must NOT be exposed');
        assert.equal(m.user.isEmailVerified, undefined, 'Internal verification flags must NOT be exposed');
        assert.ok(['owner', 'manager', 'member'].includes(m.role));
      }
    });

    test('GET /api/projects/:id/members/me returns current user membership status', async () => {
      // For developer 1
      const res1 = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/me`, {
        headers: { Authorization: `Bearer ${developerToken1}` },
      });
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.isMember, true);
      assert.equal(data1.role, 'member');
      assert.equal(data1.status, 'active');

      // For owner
      const resOwner = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/me`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(resOwner.status, 200);
      const dataOwner = await resOwner.json();
      assert.equal(dataOwner.isMember, true);
      assert.equal(dataOwner.role, 'owner');

      // For non-member outsider
      const resOutsider = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/me`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.equal(resOutsider.status, 200);
      const dataOutsider = await resOutsider.json();
      assert.equal(dataOutsider.isMember, false);
      assert.equal(dataOutsider.role, null);
    });
  });

  // ====================================================
  // GROUP 4: Role Management & Audit Activity Trail
  // ====================================================
  describe('4. Role Management & Project Audit Trail', () => {
    test('Project owner updates member role to manager', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser1._id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ role: 'manager' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.membership.role, 'manager');

      // Verify audit activity entry
      const roleActivity = await ProjectActivity.findOne({
        project: testProject._id,
        action: 'role_updated',
        targetUser: developerUser1._id,
      });
      assert.ok(roleActivity);
      assert.equal(roleActivity.details.newRole, 'manager');

      // Verify notification delivered to member
      const notif = await Notification.findOne({
        recipient: developerUser1._id,
        type: 'team',
      }).sort({ createdAt: -1 });
      assert.ok(notif);
      assert.match(notif.message, /manager/i);
    });

    test('Attempting to assign invalid role is rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser1._id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ role: 'superadmin' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Non-owner cannot update member roles (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser2._id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${developerToken1}`, // Developer 1 is manager, but not owner
        },
        body: JSON.stringify({ role: 'manager' }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('GET /api/projects/:id/activities returns chronological project audit trail', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/activities`, {
        headers: { Authorization: `Bearer ${developerToken1}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.activities.length >= 3);

      const actionTypes = data.activities.map((a) => a.action);
      assert.ok(actionTypes.includes('project_created'));
      assert.ok(actionTypes.includes('application_accepted'));
      assert.ok(actionTypes.includes('member_joined'));
      assert.ok(actionTypes.includes('role_updated'));
    });
  });

  // ====================================================
  // GROUP 5: Leaving & Removing Team Members
  // ====================================================
  describe('5. Member Departure & Removal Security', () => {
    test('Project owner cannot leave their own project (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /owner cannot leave/i);
    });

    test('Ordinary member can voluntarily leave project', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${developerToken2}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /left the project/i);

      // Verify membership record status is updated to 'left'
      const membership = await ProjectMember.findOne({
        project: testProject._id,
        user: developerUser2._id,
      });
      assert.equal(membership.status, 'left');
      assert.ok(membership.removedAt);

      // Verify activity logged
      const leftActivity = await ProjectActivity.findOne({
        project: testProject._id,
        action: 'member_left',
        user: developerUser2._id,
      });
      assert.ok(leftActivity);
    });

    test('Departed member attempting to access workspace is rejected with 403 MEMBERSHIP_LEFT', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`, {
        headers: { Authorization: `Bearer ${developerToken2}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, 'MEMBERSHIP_LEFT');
    });

    test('Non-owner cannot remove another member (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser1._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Owner cannot be removed through member removal endpoint (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${ownerUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /owner cannot be removed/i);
    });

    test('Owner removes a member: updates status to removed and revokes workspace access', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser1._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ reason: 'Project milestone reached.' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /removed successfully/i);

      // Verify membership record status is 'removed'
      const member = await ProjectMember.findOne({
        project: testProject._id,
        user: developerUser1._id,
      });
      assert.equal(member.status, 'removed');
      assert.equal(String(member.removedBy), String(ownerUser._id));
      assert.equal(member.removalReason, 'Project milestone reached.');

      // Removed member immediately loses workspace access (403 MEMBERSHIP_REMOVED)
      const workspaceRes = await fetch(`${baseUrl}/api/projects/${testProject._id}/workspace`, {
        headers: { Authorization: `Bearer ${developerToken1}` },
      });
      assert.equal(workspaceRes.status, 403);
      const workspaceData = await workspaceRes.json();
      assert.equal(workspaceData.success, false);
      assert.equal(workspaceData.code, 'MEMBERSHIP_REMOVED');
    });
  });
});
