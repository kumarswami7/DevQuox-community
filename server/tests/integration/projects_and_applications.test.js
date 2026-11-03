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
import { Notification } from '../../src/models/Notification.js';

dotenv.config();

describe('DevConnect Phase 3: Projects & Applications Integration Tests', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let ownerUser;
  let ownerToken;
  let applicantUser1;
  let applicantToken1;
  let applicantUser2;
  let applicantToken2;

  // Track created resources for cleanup
  let createdProjectIds = [];

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

    // Drop legacy index if present on database
    await Application.collection.dropIndex('projectId_1_applicantId_1').catch(() => {});

    // Create test accounts
    ownerUser = await User.create({
      name: `Project Owner ${uniqueSuffix}`,
      username: `owner_${uniqueSuffix}`,
      email: `owner_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id);

    applicantUser1 = await User.create({
      name: `Applicant One ${uniqueSuffix}`,
      username: `app1_${uniqueSuffix}`,
      email: `app1_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    applicantToken1 = createJwtToken(applicantUser1._id);

    applicantUser2 = await User.create({
      name: `Applicant Two ${uniqueSuffix}`,
      username: `app2_${uniqueSuffix}`,
      email: `app2_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    applicantToken2 = createJwtToken(applicantUser2._id);
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        if (createdProjectIds.length > 0) {
          await Application.deleteMany({ project: { $in: createdProjectIds } });
          await Project.deleteMany({ _id: { $in: createdProjectIds } });
        }
        await User.deleteMany({ _id: { $in: [ownerUser._id, applicantUser1._id, applicantUser2._id] } });
        await Notification.deleteMany({
          recipient: { $in: [ownerUser._id, applicantUser1._id, applicantUser2._id] },
        });
      }
    } catch {
      // Ignore cleanup error
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // 1. PROJECTS API TESTS
  // ==========================================
  describe('1. Project Creation & Validation', () => {
    test('POST /api/projects succeeds with authenticated owner and valid data', async () => {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: `DevConnect Mobile App ${uniqueSuffix}`,
          description: 'A comprehensive React Native & Node.js application for developer portfolios.',
          category: 'Mobile Development',
          projectType: 'collaboration',
          experienceLevel: 'intermediate',
          teamSize: 2,
          budget: '$2,500 - $4,000',
          budgetMin: 2500,
          budgetMax: 4000,
          duration: '2 Months',
          requiredSkills: ['React Native', 'Node.js', 'MongoDB'],
          visibility: 'public',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.project);
      assert.equal(data.project.title, `DevConnect Mobile App ${uniqueSuffix}`);
      assert.equal(String(data.project.owner._id || data.project.owner), String(ownerUser._id));
      assert.equal(data.project.status, 'open');
      assert.equal(data.project.teamSize, 2);
      assert.equal(data.project.acceptedApplicantsCount, 0);

      createdProjectIds.push(data.project._id);
    });

    test('POST /api/projects fails when required fields are missing', async () => {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: 'Too short', // description missing
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/projects rejects unauthenticated request', async () => {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthenticated project',
          description: 'Should be rejected without valid token',
        }),
      });

      assert.equal(res.status, 401);
    });
  });

  describe('2. Project Discovery, Filtering & Pagination', () => {
    let testProjectId;

    before(async () => {
      const p = await Project.create({
        title: `AI Search Engine ${uniqueSuffix}`,
        description: 'Building deep semantic embeddings for developer knowledge base',
        owner: ownerUser._id,
        category: 'AI & ML',
        projectType: 'open_source',
        experienceLevel: 'expert',
        teamSize: 3,
        budget: '$5,000 - $10,000',
        budgetMin: 5000,
        budgetMax: 10000,
        requiredSkills: ['Python', 'FastAPI', 'PyTorch'],
        status: 'open',
        visibility: 'public',
      });
      testProjectId = p._id;
      createdProjectIds.push(p._id);
    });

    test('GET /api/projects returns paginated projects list with metadata', async () => {
      const res = await fetch(`${baseUrl}/api/projects?page=1&limit=5`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.projects));
      assert.ok(typeof data.total === 'number');
      assert.equal(data.page, 1);
      assert.ok(data.totalPages >= 1);
    });

    test('GET /api/projects filters by category', async () => {
      const res = await fetch(`${baseUrl}/api/projects?category=AI%20%26%20ML`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      const match = data.projects.find((p) => String(p._id) === String(testProjectId));
      assert.ok(match);
      assert.equal(match.category, 'AI & ML');
    });

    test('GET /api/projects filters by search query q', async () => {
      const res = await fetch(`${baseUrl}/api/projects?q=semantic%20embeddings`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      const match = data.projects.find((p) => String(p._id) === String(testProjectId));
      assert.ok(match);
    });

    test('GET /api/projects filters by required skills', async () => {
      const res = await fetch(`${baseUrl}/api/projects?skills=PyTorch`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      const match = data.projects.find((p) => String(p._id) === String(testProjectId));
      assert.ok(match);
    });

    test('GET /api/projects/:id returns full project details with applicant count', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProjectId}`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.success, true);
      const proj = data.project || data;
      assert.equal(String(proj._id), String(testProjectId));
      assert.ok(proj.owner);
      assert.equal(proj.owner.name, ownerUser.name);
      assert.equal(typeof proj.applicationsCount, 'number');
    });

    test('GET /api/projects/my-projects returns projects owned by authenticated user', async () => {
      const res = await fetch(`${baseUrl}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.projects.length >= 1);
      assert.ok(data.projects.every((p) => String(p.owner._id || p.owner) === String(ownerUser._id)));
    });
  });

  describe('3. Project Modification & Status Transitions', () => {
    let modProjectId;

    before(async () => {
      const p = await Project.create({
        title: `Editable Project ${uniqueSuffix}`,
        description: 'Testing unauthorized and authorized updates',
        owner: ownerUser._id,
        category: 'Web Development',
        status: 'open',
        teamSize: 1,
      });
      modProjectId = p._id;
      createdProjectIds.push(p._id);
    });

    test('PATCH /api/projects/:id succeeds when owner updates permitted fields', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${modProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          title: `Updated Title ${uniqueSuffix}`,
          budget: '$3,000 - $5,000',
          duration: '3 Months',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.project.title, `Updated Title ${uniqueSuffix}`);
      assert.equal(data.project.budget, '$3,000 - $5,000');
    });

    test('PATCH /api/projects/:id rejects update attempted by non-owner user with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${modProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({
          title: 'Hacked by non-owner',
        }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /not authorized/i);
    });

    test('Status transition: valid transition from open -> in_progress succeeds', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${modProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.project.status, 'in_progress');
    });

    test('Status transition: invalid transition from completed -> open is rejected with 400', async () => {
      // Transition to completed first
      await Project.findByIdAndUpdate(modProjectId, { status: 'completed' });

      const res = await fetch(`${baseUrl}/api/projects/${modProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'open' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /cannot transition/i);
    });
  });

  // ==========================================
  // 2. APPLICATIONS API TESTS
  // ==========================================
  describe('4. Applying to Projects & Withdrawal', () => {
    let applyProjectId;

    before(async () => {
      const p = await Project.create({
        title: `Application Test Gig ${uniqueSuffix}`,
        description: 'A platform test gig for proposal submission and reviews',
        owner: ownerUser._id,
        category: 'FinTech',
        status: 'open',
        teamSize: 2,
        budget: '$4,000',
      });
      applyProjectId = p._id;
      createdProjectIds.push(p._id);
    });

    test('POST /api/projects/:id/applications succeeds for authenticated applicant', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${applyProjectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({
          coverLetter: 'I have 4 years of Node.js and FinTech API experience.',
          proposedRate: '$50/hr',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.application);
      assert.equal(data.application.status, 'pending');
      assert.equal(String(data.application.applicant), String(applicantUser1._id));
      assert.equal(data.application.coverLetter, 'I have 4 years of Node.js and FinTech API experience.');

      // Verify notification sent to project owner
      const notification = await Notification.findOne({
        recipient: ownerUser._id,
        sender: applicantUser1._id,
      });
      assert.ok(notification);
      assert.match(notification.message, /submitted an application/i);
    });

    test('POST /api/projects/:id/applications rejects duplicate application from same applicant', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${applyProjectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({
          coverLetter: 'Second proposal attempt',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already submitted an application/i);
    });

    test('POST /api/projects/:id/applications prevents owner from applying to own project', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${applyProjectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          coverLetter: 'Applying to my own project',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /owner cannot apply/i);
    });

    test('POST /api/projects/:id/applications rejects application when project is closed or cancelled', async () => {
      const closedProject = await Project.create({
        title: `Closed Project ${uniqueSuffix}`,
        description: 'This project is already completed',
        owner: ownerUser._id,
        status: 'completed',
        teamSize: 1,
      });
      createdProjectIds.push(closedProject._id);

      const res = await fetch(`${baseUrl}/api/projects/${closedProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken2}`,
        },
        body: JSON.stringify({ coverLetter: 'Trying to apply to closed project' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /not accepting new applications/i);
    });

    test('POST /api/projects/:id/applications rejects when application deadline has passed', async () => {
      const expiredProject = await Project.create({
        title: `Expired Deadline Project ${uniqueSuffix}`,
        description: 'Past deadline project',
        owner: ownerUser._id,
        status: 'open',
        teamSize: 1,
        applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      });
      createdProjectIds.push(expiredProject._id);

      const res = await fetch(`${baseUrl}/api/projects/${expiredProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken2}`,
        },
        body: JSON.stringify({ coverLetter: 'Past deadline attempt' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /deadline.*passed/i);
    });

    test('GET /api/projects/:id/applications/me returns applicant own application status', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${applyProjectId}/applications/me`, {
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.hasApplied, true);
      assert.equal(data.application.status, 'pending');
    });

    test('GET /api/projects/my-applications returns user proposal pipeline list', async () => {
      const res = await fetch(`${baseUrl}/api/projects/my-applications`, {
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.applications.length >= 1);
      assert.equal(data.applications[0].project.title, `Application Test Gig ${uniqueSuffix}`);
    });

    test('DELETE /api/projects/:id/applications/me withdraws application cleanly', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${applyProjectId}/applications/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'withdrawn');

      // Verify in DB
      const appDoc = await Application.findOne({ project: applyProjectId, applicant: applicantUser1._id });
      assert.equal(appDoc.status, 'withdrawn');
    });
  });

  describe('5. Project Owner Decisions & Capacity Concurrency', () => {
    let capacityProjectId;
    let app1Id;
    let app2Id;

    before(async () => {
      // Single capacity position project to test concurrency
      const p = await Project.create({
        title: `Exclusive Solo Role ${uniqueSuffix}`,
        description: 'Only 1 developer can be accepted onto this team',
        owner: ownerUser._id,
        category: 'Cloud & DevOps',
        status: 'open',
        teamSize: 1, // EXACTLY 1 POSITION
        acceptedApplicantsCount: 0,
      });
      capacityProjectId = p._id;
      createdProjectIds.push(p._id);

      // Applicant 1 submits application
      const a1 = await Application.create({
        project: capacityProjectId,
        applicant: applicantUser1._id,
        coverLetter: 'Applicant 1 cover letter',
        status: 'pending',
      });
      app1Id = a1._id;

      // Applicant 2 submits application
      const a2 = await Application.create({
        project: capacityProjectId,
        applicant: applicantUser2._id,
        coverLetter: 'Applicant 2 cover letter',
        status: 'pending',
      });
      app2Id = a2._id;
    });

    test('GET /api/projects/:id/applications allows project owner to view all proposals', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${capacityProjectId}/applications`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 2);
    });

    test('GET /api/projects/:id/applications rejects non-owner with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${capacityProjectId}/applications`, {
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /only the project owner/i);
    });

    test('PATCH /api/applications/:id/status rejects decision attempt by non-owner with 403', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${app1Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken2}`, // not owner
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Owner accepts application: atomic capacity check increments team members and notifies applicant', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${app1Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
          decisionReason: 'Strong architectural experience',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'accepted');

      // Verify Project doc has incremented count and added member
      const updatedProj = await Project.findById(capacityProjectId);
      assert.equal(updatedProj.acceptedApplicantsCount, 1);
      assert.equal(updatedProj.members.length, 1);
      assert.equal(String(updatedProj.members[0].user), String(applicantUser1._id));

      // Verify applicant received notification
      const notif = await Notification.findOne({ recipient: applicantUser1._id, type: 'application' });
      assert.ok(notif);
      assert.match(notif.title, /accepted/i);
    });

    test('Capacity Enforcement: accepting another application when capacity is full returns 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${app2Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /capacity reached|already accepted 1 member/i);

      // Verify application 2 remains pending (not corrupted)
      const app2Doc = await Application.findById(app2Id);
      assert.equal(app2Doc.status, 'pending');
    });

    test('Owner rejects an application: transitions to rejected and notifies applicant', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${app2Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          decisionReason: 'Team capacity filled by another applicant',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'rejected');

      const app2Doc = await Application.findById(app2Id);
      assert.equal(app2Doc.status, 'rejected');
    });

    test('Status transition constraint: cannot accept an application that is already rejected', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${app2Id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already been rejected/i);
    });
  });
});
