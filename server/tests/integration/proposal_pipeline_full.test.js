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

describe('DevConnect Proposal Pipeline — End-to-End Master Test Suite (Suites 1 to 9)', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let ownerUser;
  let ownerToken;
  let adminUser;
  let adminToken;
  let applicantUser1;
  let applicantToken1;
  let applicantUser2;
  let applicantToken2;
  let strangerUser;
  let strangerToken;

  // Track created resources for cleanup
  let createdProjectIds = [];
  let createdUserIds = [];

  const createJwtToken = (userId, role = 'developer') => {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern',
      { expiresIn: '7d' }
    );
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

    // Clean any conflicting legacy index
    await Application.collection.dropIndex('projectId_1_applicantId_1').catch(() => {});

    // Create test accounts
    ownerUser = await User.create({
      name: `Pipeline Owner ${uniqueSuffix}`,
      username: `pipe_owner_${uniqueSuffix}`,
      email: `pipe_owner_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id, 'client');
    createdUserIds.push(ownerUser._id);

    adminUser = await User.create({
      name: `Pipeline Admin ${uniqueSuffix}`,
      username: `pipe_admin_${uniqueSuffix}`,
      email: `pipe_admin_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    adminToken = createJwtToken(adminUser._id, 'admin');
    createdUserIds.push(adminUser._id);

    applicantUser1 = await User.create({
      name: `Alice Dev ${uniqueSuffix}`,
      username: `alice_${uniqueSuffix}`,
      email: `alice_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      headline: 'Fullstack React & Node.js Engineer',
      skills: ['React', 'Node.js', 'MongoDB'],
      status: 'active',
    });
    applicantToken1 = createJwtToken(applicantUser1._id, 'developer');
    createdUserIds.push(applicantUser1._id);

    applicantUser2 = await User.create({
      name: `Bob Dev ${uniqueSuffix}`,
      username: `bob_${uniqueSuffix}`,
      email: `bob_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      headline: 'Frontend UI/UX Specialist',
      skills: ['React', 'TailwindCSS'],
      status: 'active',
    });
    applicantToken2 = createJwtToken(applicantUser2._id, 'developer');
    createdUserIds.push(applicantUser2._id);

    strangerUser = await User.create({
      name: `Stranger Dev ${uniqueSuffix}`,
      username: `stranger_${uniqueSuffix}`,
      email: `stranger_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    strangerToken = createJwtToken(strangerUser._id, 'developer');
    createdUserIds.push(strangerUser._id);
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
        if (createdUserIds.length > 0) {
          await User.deleteMany({ _id: { $in: createdUserIds } });
          await Notification.deleteMany({ recipient: { $in: createdUserIds } });
        }
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

  // ============================================================
  // SUITE 1: Application Model Verification
  // ============================================================
  describe('Suite 1: Application Model Verification', () => {
    let testProject;

    before(async () => {
      testProject = await Project.create({
        title: `Model Test Project ${uniqueSuffix}`,
        description: 'Verifying Application Mongoose schema bounds and behaviors.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(testProject._id);
    });

    test('1.1 Requires project and applicant fields', async () => {
      const invalidApp = new Application({});
      let err;
      try {
        await invalidApp.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, 'Validation should fail when required fields are missing');
      assert.ok(err.errors['project']);
      assert.ok(err.errors['applicant']);
    });

    test('1.2 Default status is "pending"', async () => {
      const appDoc = new Application({
        project: testProject._id,
        applicant: applicantUser1._id,
      });
      assert.equal(appDoc.status, 'pending');
    });

    test('1.3 Rejects invalid status enum value', async () => {
      const appDoc = new Application({
        project: testProject._id,
        applicant: applicantUser1._id,
        status: 'invalid_status_enum',
      });
      let err;
      try {
        await appDoc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors['status']);
    });

    test('1.4 Enforces maximum length constraints on text fields', async () => {
      const appDoc = new Application({
        project: testProject._id,
        applicant: applicantUser1._id,
        coverLetter: 'a'.repeat(3001),
        proposedRate: 'r'.repeat(101),
        decisionReason: 'd'.repeat(1001),
      });
      let err;
      try {
        await appDoc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors['coverLetter']);
      assert.ok(err.errors['proposedRate']);
      assert.ok(err.errors['decisionReason']);
    });

    test('1.5 Compound index on { project: 1, applicant: 1 } prevents duplicate documents', async () => {
      const app1 = await Application.create({
        project: testProject._id,
        applicant: applicantUser1._id,
        coverLetter: 'First application doc',
      });
      assert.ok(app1._id);

      let duplicateErr;
      try {
        await Application.create({
          project: testProject._id,
          applicant: applicantUser1._id,
          coverLetter: 'Duplicate application doc',
        });
      } catch (e) {
        duplicateErr = e;
      }
      assert.ok(duplicateErr, 'Duplicate insertion must be rejected by unique index');
      assert.equal(duplicateErr.code, 11000);

      // Clean up the created application
      await Application.deleteOne({ _id: app1._id });
    });
  });

  // ============================================================
  // SUITE 2: Submit Application (POST /api/projects/:id/applications)
  // ============================================================
  describe('Suite 2: Submit Application (POST /api/projects/:id/applications)', () => {
    let openProject;
    let closedProject;
    let pastDeadlineProject;

    before(async () => {
      openProject = await Project.create({
        title: `Open Pipeline Gig ${uniqueSuffix}`,
        description: 'Accepting applications for test verification.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(openProject._id);

      closedProject = await Project.create({
        title: `Closed Gig ${uniqueSuffix}`,
        description: 'Project is closed and completed.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 1,
        status: 'completed',
      });
      createdProjectIds.push(closedProject._id);

      pastDeadlineProject = await Project.create({
        title: `Expired Deadline Gig ${uniqueSuffix}`,
        description: 'Deadline in the past.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
        applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      });
      createdProjectIds.push(pastDeadlineProject._id);
    });

    test('2.1 Rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${openProject._id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter: 'Interested' }),
      });
      assert.equal(res.status, 401);
    });

    test('2.2 Owner cannot apply to their own project (returns 400)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${openProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ coverLetter: 'I own this project' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /owner cannot apply/i);
    });

    test('2.3 Rejects application to closed project with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${closedProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({ coverLetter: 'Applying to closed project' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /not accepting new applications/i);
    });

    test('2.4 Rejects application when application deadline has passed with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${pastDeadlineProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({ coverLetter: 'Applying late' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /deadline.*passed/i);
    });

    test('2.5 Rejects invalid project ID format with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/not-a-valid-id/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({ coverLetter: 'Invalid ID' }),
      });
      assert.equal(res.status, 400);
    });

    test('2.6 Returns 404 for nonexistent project ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(`${baseUrl}/api/projects/${fakeId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({ coverLetter: 'Nonexistent project' }),
      });
      assert.equal(res.status, 404);
    });

    test('2.7 Successfully submits proposal, saves snapshot, and increments applicationsCount', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${openProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({
          coverLetter: 'I have 5 years building scalable MERN web applications.',
          proposedRate: '$45/hr',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.application);
      assert.equal(data.application.status, 'pending');
      assert.equal(data.application.proposedRate, '$45/hr');
      assert.equal(data.application.applicantSnapshot?.name, applicantUser1.name);

      // Verify counter incremented in project document
      const updatedProject = await Project.findById(openProject._id);
      assert.equal(updatedProject.applicationsCount, 1);
    });

    test('2.8 Rejects duplicate application submission with 400', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${openProject._id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${applicantToken1}`,
        },
        body: JSON.stringify({ coverLetter: 'Trying to apply again' }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already submitted an application/i);
    });
  });

  // ============================================================
  // SUITE 3: My Applications Pipeline (GET /api/projects/my-applications)
  // ============================================================
  describe('Suite 3: My Applications Pipeline', () => {
    let pipelineProject;
    let submittedApp;

    before(async () => {
      pipelineProject = await Project.create({
        title: `Applicant Pipeline Project ${uniqueSuffix}`,
        description: 'Verifying applicant self-view and status tracking.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(pipelineProject._id);

      submittedApp = await Application.create({
        project: pipelineProject._id,
        applicant: applicantUser1._id,
        status: 'pending',
        coverLetter: 'Alice testing pipeline self-view.',
        proposedRate: '$50/hr',
      });
    });

    test('3.1 Rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/my-applications`);
      assert.equal(res.status, 401);
    });

    test('3.2 Applicant retrieves their own submitted applications list', async () => {
      const res = await fetch(`${baseUrl}/api/projects/my-applications`, {
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.applications));
      assert.ok(data.applications.length >= 1);

      const found = data.applications.find((a) => String(a._id) === String(submittedApp._id));
      assert.ok(found, 'Submitted application should be found in list');
      assert.equal(found.status, 'pending');
      assert.ok(found.project, 'Project details should be populated');
      assert.ok(found.project.title);
      assert.ok(found.project.owner, 'Owner should be populated');
    });

    test('3.3 User with no applications receives empty array', async () => {
      const res = await fetch(`${baseUrl}/api/projects/my-applications`, {
        headers: { Authorization: `Bearer ${strangerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.applications.length, 0);
    });

    test('3.4 GET /api/projects/:id/applications/me returns specific application status', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${pipelineProject._id}/applications/me`, {
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.hasApplied, true);
      assert.equal(data.application.status, 'pending');
    });
  });

  // ============================================================
  // SUITE 4: Application Withdrawal (DELETE /api/projects/:id/applications/me & DELETE /api/applications/:id)
  // ============================================================
  describe('Suite 4: Application Withdrawal', () => {
    let withdrawProject;
    let pendingApp;

    before(async () => {
      withdrawProject = await Project.create({
        title: `Withdrawal Test Gig ${uniqueSuffix}`,
        description: 'Testing proposal cancellation and capacity recovery.',
        category: 'DevOps',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(withdrawProject._id);

      pendingApp = await Application.create({
        project: withdrawProject._id,
        applicant: applicantUser1._id,
        status: 'pending',
        coverLetter: 'Will withdraw soon.',
      });
      await Project.findByIdAndUpdate(withdrawProject._id, { $inc: { applicationsCount: 1 } });
    });

    test('4.1 Rejects unauthenticated withdrawal with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${withdrawProject._id}/applications/me`, {
        method: 'DELETE',
      });
      assert.equal(res.status, 401);
    });

    test('4.2 Returns 404 when user has not applied to project', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${withdrawProject._id}/applications/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${strangerToken}` },
      });
      assert.equal(res.status, 404);
    });

    test('4.3 Applicant successfully withdraws pending application via project route', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${withdrawProject._id}/applications/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /withdrawn successfully/i);

      // Verify status in DB
      const updatedApp = await Application.findById(pendingApp._id);
      assert.equal(updatedApp.status, 'withdrawn');

      // Verify applicationsCount decremented
      const updatedProject = await Project.findById(withdrawProject._id);
      assert.equal(updatedProject.applicationsCount, 0);
    });

    test('4.4 Repeated withdrawal returns 400 (already withdrawn)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${withdrawProject._id}/applications/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already.*withdrawn/i);
    });

    test('4.5 Rejected application cannot be withdrawn (returns 400)', async () => {
      const rejectedApp = await Application.create({
        project: withdrawProject._id,
        applicant: applicantUser2._id,
        status: 'rejected',
        coverLetter: 'Rejected proposal.',
      });

      const res = await fetch(`${baseUrl}/api/applications/${rejectedApp._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${applicantToken2}` },
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /cannot withdraw.*rejected/i);

      await Application.deleteOne({ _id: rejectedApp._id });
    });
  });

  // ============================================================
  // SUITE 5: Owner Application Management
  // ============================================================
  describe('Suite 5: Owner Application Management', () => {
    let mgmtProject;

    before(async () => {
      mgmtProject = await Project.create({
        title: `Management Test Project ${uniqueSuffix}`,
        description: 'Owner proposal review suite.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 3,
        status: 'open',
      });
      createdProjectIds.push(mgmtProject._id);

      await Application.create([
        {
          project: mgmtProject._id,
          applicant: applicantUser1._id,
          status: 'pending',
          coverLetter: 'Alice proposal',
        },
        {
          project: mgmtProject._id,
          applicant: applicantUser2._id,
          status: 'accepted',
          coverLetter: 'Bob proposal',
        },
      ]);
    });

    test('5.1 Rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${mgmtProject._id}/applications`);
      assert.equal(res.status, 401);
    });

    test('5.2 Rejects non-owner / non-admin with 403', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${mgmtProject._id}/applications`, {
        headers: { Authorization: `Bearer ${strangerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('5.3 Project owner can view all submitted proposals', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${mgmtProject._id}/applications`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.applications.length, 2);
    });

    test('5.4 Admin user has access to view project proposals', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${mgmtProject._id}/applications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.applications.length, 2);
    });

    test('5.5 Filters applications by status parameter (?status=pending)', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${mgmtProject._id}/applications?status=pending`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.applications.length, 1);
      assert.equal(data.applications[0].status, 'pending');
    });
  });

  // ============================================================
  // SUITE 6: Accept Application (PATCH /api/applications/:id/status)
  // ============================================================
  describe('Suite 6: Accept Application (PATCH /api/applications/:id/status)', () => {
    let acceptProject;
    let pendingApp;

    before(async () => {
      acceptProject = await Project.create({
        title: `Acceptance Suite Gig ${uniqueSuffix}`,
        description: 'Accepting candidate into team.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 1, // Will fill capacity on 1 accept
        status: 'open',
      });
      createdProjectIds.push(acceptProject._id);

      pendingApp = await Application.create({
        project: acceptProject._id,
        applicant: applicantUser1._id,
        status: 'pending',
        coverLetter: 'Ready to join team.',
      });
    });

    test('6.1 Rejects unauthenticated decision with 401', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${pendingApp._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 401);
    });

    test('6.2 Rejects non-owner decision with 403', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${pendingApp._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${strangerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 403);
    });

    test('6.3 Owner accepts applicant: increments capacity, creates ProjectMember, updates status to in_progress', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${pendingApp._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'accepted',
          decisionReason: 'Great portfolio and strong match.',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'accepted');
      assert.equal(data.application.decisionReason, 'Great portfolio and strong match.');

      // Check project counter and auto status progression (teamSize: 1 -> in_progress)
      const updatedProject = await Project.findById(acceptProject._id);
      assert.equal(updatedProject.acceptedApplicantsCount, 1);
      assert.equal(updatedProject.status, 'in_progress');

      // Verify ProjectMember creation
      const member = await ProjectMember.findOne({
        project: acceptProject._id,
        user: applicantUser1._id,
      });
      assert.ok(member, 'ProjectMember record should be created');
      assert.equal(member.role, 'member');

      // Verify applicant received notification (model enum is 'application')
      const notification = await Notification.findOne({
        recipient: applicantUser1._id,
        type: 'application',
      });
      assert.ok(notification, 'Applicant must receive notification');
      assert.match(notification.title, /Application Accepted/i);
    });

    test('6.4 Accepting when capacity is filled returns 409 Conflict', async () => {
      // Create second applicant proposal for same full project
      const secondApp = await Application.create({
        project: acceptProject._id,
        applicant: applicantUser2._id,
        status: 'pending',
        coverLetter: 'Second applicant wanting to join full project.',
      });

      const res = await fetch(`${baseUrl}/api/applications/${secondApp._id}/status`, {
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
      assert.match(data.message, /capacity reached/i);

      await Application.deleteOne({ _id: secondApp._id });
    });
  });

  // ============================================================
  // SUITE 7: Reject Application (PATCH /api/applications/:id/status)
  // ============================================================
  describe('Suite 7: Reject Application (PATCH /api/applications/:id/status)', () => {
    let rejectProject;
    let pendingApp;

    before(async () => {
      rejectProject = await Project.create({
        title: `Rejection Suite Gig ${uniqueSuffix}`,
        description: 'Testing proposal decline.',
        category: 'Mobile Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(rejectProject._id);

      pendingApp = await Application.create({
        project: rejectProject._id,
        applicant: applicantUser1._id,
        status: 'pending',
        coverLetter: 'Hope to be selected.',
      });
    });

    test('7.1 Owner rejects proposal with optional decision reason', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${pendingApp._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          decisionReason: 'Project scope shifted toward Flutter instead of React Native.',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.application.status, 'rejected');
      assert.equal(
        data.application.decisionReason,
        'Project scope shifted toward Flutter instead of React Native.'
      );

      // Verify DB persistence
      const updatedApp = await Application.findById(pendingApp._id);
      assert.equal(updatedApp.status, 'rejected');
      assert.ok(updatedApp.reviewedAt);

      // Verify applicant received rejection notification
      const notif = await Notification.findOne({
        recipient: applicantUser1._id,
        type: 'application',
        title: 'Application Update',
      });
      assert.ok(notif, 'Applicant should receive rejection notification');
    });

    test('7.2 Rejected proposal cannot be re-accepted (returns 400)', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${pendingApp._id}/status`, {
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
      assert.match(data.message, /cannot accept an application that has already been rejected/i);
    });
  });

  // ============================================================
  // SUITE 8: State Machine Transitions
  // ============================================================
  describe('Suite 8: State Machine Transitions', () => {
    let smProject;

    before(async () => {
      smProject = await Project.create({
        title: `State Machine Gig ${uniqueSuffix}`,
        description: 'Validating valid and invalid state machine transitions.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 3,
        status: 'open',
      });
      createdProjectIds.push(smProject._id);
    });

    test('8.1 Cannot reject an already accepted application (returns 400)', async () => {
      const acceptedApp = await Application.create({
        project: smProject._id,
        applicant: applicantUser1._id,
        status: 'accepted',
        coverLetter: 'Already accepted',
      });

      const res = await fetch(`${baseUrl}/api/applications/${acceptedApp._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /cannot reject an application that has already been accepted/i);

      await Application.deleteOne({ _id: acceptedApp._id });
    });

    test('8.2 Cannot transition a withdrawn application to accepted (returns 400)', async () => {
      const withdrawnApp = await Application.create({
        project: smProject._id,
        applicant: applicantUser2._id,
        status: 'withdrawn',
        coverLetter: 'Withdrawn',
      });

      const res = await fetch(`${baseUrl}/api/applications/${withdrawnApp._id}/status`, {
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
      assert.match(data.message, /withdrawn/i);

      await Application.deleteOne({ _id: withdrawnApp._id });
    });
  });

  // ============================================================
  // SUITE 9: Capacity and Concurrency Reconciliation
  // ============================================================
  describe('Suite 9: Capacity and Concurrency Reconciliation', () => {
    let concurrentProject;
    let appA;
    let appB;

    before(async () => {
      // 1 Seat Capacity
      concurrentProject = await Project.create({
        title: `Concurrency Gig ${uniqueSuffix}`,
        description: 'Single seat gig testing atomic rollback and seat restoration.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 1,
        acceptedApplicantsCount: 0,
        status: 'open',
      });
      createdProjectIds.push(concurrentProject._id);

      appA = await Application.create({
        project: concurrentProject._id,
        applicant: applicantUser1._id,
        status: 'pending',
        coverLetter: 'Applicant A proposal',
      });

      appB = await Application.create({
        project: concurrentProject._id,
        applicant: applicantUser2._id,
        status: 'pending',
        coverLetter: 'Applicant B proposal',
      });
    });

    test('9.1 Acceptance reserves last seat and transitions project to in_progress', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${appA._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 200);

      const proj = await Project.findById(concurrentProject._id);
      assert.equal(proj.acceptedApplicantsCount, 1);
      assert.equal(proj.status, 'in_progress');
    });

    test('9.2 Conflicting acceptance attempt fails with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${appB._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 409);
    });

    test('9.3 When accepted contributor withdraws: capacity is restored, ProjectMember deleted, project reopens', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${appA._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${applicantToken1}` },
      });
      assert.equal(res.status, 200);

      // Verify project seat restored and status reverted to 'open'
      const proj = await Project.findById(concurrentProject._id);
      assert.equal(proj.acceptedApplicantsCount, 0);
      assert.equal(proj.status, 'open');

      // Verify member record removed
      const mem = await ProjectMember.findOne({
        project: concurrentProject._id,
        user: applicantUser1._id,
      });
      assert.equal(mem, null, 'ProjectMember record should be removed on accepted contributor withdrawal');
    });

    test('9.4 Remaining applicant B can now be accepted into the newly opened seat', async () => {
      const res = await fetch(`${baseUrl}/api/applications/${appB._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      assert.equal(res.status, 200);

      const proj = await Project.findById(concurrentProject._id);
      assert.equal(proj.acceptedApplicantsCount, 1);
      assert.equal(proj.status, 'in_progress');
    });
  });
});
