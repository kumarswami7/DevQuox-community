import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Profile } from '../../src/models/Profile.js';
import { Project } from '../../src/models/Project.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { Skill } from '../../src/models/Skill.js';
import { DeveloperBookmark } from '../../src/models/DeveloperBookmark.js';
import { Follow } from '../../src/models/Follow.js';

dotenv.config();

describe('DevConnect Phase 9: Developer Portfolios, Skills, Search & Discovery Integration Tests', { concurrency: 1 }, () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Test users
  let devUser1;
  let devToken1;
  let devUser2;
  let devToken2;
  let clientUser;
  let clientToken;
  let privateDevUser;
  let privateDevToken;

  // Test project
  let authorizedProject;
  let unauthorizedProject;

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

    // Create test developers and clients
    devUser1 = await User.create({
      name: `Alice Dev ${uniqueSuffix}`,
      username: `alicedev_${uniqueSuffix}`,
      email: `alice_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Full-Stack React & Node.js Architect',
      bio: 'Crafting scalable web systems and resilient microservices.',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      experienceLevel: 'senior',
      availability: 'available',
      hourlyRate: 85,
      location: 'San Francisco, CA',
      timezone: 'UTC-8',
      rating: 4.9,
      completedProjectsCount: 12,
    });
    devToken1 = createJwtToken(devUser1._id);

    // Profile for devUser1
    await Profile.create({
      user: devUser1._id,
      title: 'Full-Stack React & Node.js Architect',
      headline: 'Full-Stack React & Node.js Architect',
      bio: 'Crafting scalable web systems and resilient microservices.',
      about: 'Crafting scalable web systems and resilient microservices.',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      skillsWithProficiency: [
        { name: 'React', category: 'Frontend development', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'Node.js', category: 'Backend development', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'Docker', category: 'DevOps and cloud', proficiency: 'advanced', yearsOfExperience: 4 },
      ],
      experienceLevel: 'senior',
      availability: 'available',
      visibility: 'public',
      hourlyRate: 85,
      location: 'San Francisco, CA',
      timezone: 'UTC-8',
      preferredRoles: ['Full-Stack Developer', 'Tech Lead'],
    });

    devUser2 = await User.create({
      name: `Bob Dev ${uniqueSuffix}`,
      username: `bobdev_${uniqueSuffix}`,
      email: `bob_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Mobile & Flutter Specialist',
      bio: 'Cross-platform mobile applications with smooth micro-interactions.',
      skills: ['Flutter', 'Dart', 'Firebase'],
      experienceLevel: 'mid',
      availability: 'open_to_offers',
      hourlyRate: 60,
      location: 'Austin, TX',
      timezone: 'UTC-6',
      rating: 4.7,
      completedProjectsCount: 4,
    });
    devToken2 = createJwtToken(devUser2._id);

    await Profile.create({
      user: devUser2._id,
      title: 'Mobile & Flutter Specialist',
      skills: ['Flutter', 'Dart', 'Firebase'],
      skillsWithProficiency: [
        { name: 'Flutter', category: 'Mobile development', proficiency: 'advanced', yearsOfExperience: 3 },
      ],
      experienceLevel: 'mid',
      availability: 'open_to_offers',
      visibility: 'public',
      hourlyRate: 60,
      location: 'Austin, TX',
    });

    // Client user
    clientUser = await User.create({
      name: `Clara Client ${uniqueSuffix}`,
      username: `claraclient_${uniqueSuffix}`,
      email: `clara_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'client',
      status: 'active',
    });
    clientToken = createJwtToken(clientUser._id);

    // Private developer
    privateDevUser = await User.create({
      name: `Private Dev ${uniqueSuffix}`,
      username: `privatedev_${uniqueSuffix}`,
      email: `private_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Stealth Mode Engineer',
    });
    privateDevToken = createJwtToken(privateDevUser._id);

    await Profile.create({
      user: privateDevUser._id,
      title: 'Stealth Mode Engineer',
      visibility: 'private',
    });

    // Create a DevConnect project where devUser1 is an authorized active member
    authorizedProject = await Project.create({
      title: `Fintech Core Ledger ${uniqueSuffix}`,
      description: 'Distributed transaction processing engine.',
      category: 'Web Development',
      status: 'completed',
      owner: clientUser._id,
      budget: '$8,000',
      budgetMin: 8000,
      budgetMax: 8000,
      requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
    });

    await ProjectMember.create({
      project: authorizedProject._id,
      user: devUser1._id,
      role: 'member',
      status: 'active',
    });

    // Create an unauthorized project devUser1 has no relationship to
    unauthorizedProject = await Project.create({
      title: `Secret Stealth Project ${uniqueSuffix}`,
      description: 'Private unshared project.',
      category: 'Web Development',
      status: 'open',
      owner: clientUser._id,
      budget: '$15,000',
      budgetMin: 15000,
      budgetMax: 15000,
    });
  });

  after(async () => {
    // Cleanup created test records
    await User.deleteMany({ email: new RegExp(`devconnect\\.test$`) });
    await Profile.deleteMany({ user: { $in: [devUser1._id, devUser2._id, clientUser._id, privateDevUser._id] } });
    await Project.deleteMany({ _id: { $in: [authorizedProject._id, unauthorizedProject._id] } });
    await ProjectMember.deleteMany({ user: devUser1._id });
    await DeveloperBookmark.deleteMany({ user: { $in: [devUser1._id, clientUser._id] } });
    await Follow.deleteMany({ follower: { $in: [devUser1._id, clientUser._id] } });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ── 1. PORTFOLIO RETRIEVAL & FIELD PRIVACY ─────────────────────────────────
  describe('1. Portfolio Retrieval & Field Privacy', { concurrency: 1 }, () => {
    test('GET /api/v1/portfolios/:username returns public developer portfolio without exposing email or password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/${devUser1.username}`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data);
      assert.equal(json.data.user.name, devUser1.name);
      assert.equal(json.data.user.username, devUser1.username);
      assert.equal(json.data.user.role, 'developer');

      // Crucial Security & Privacy Check: email, password, and reset tokens must NEVER be leaked in public profile!
      assert.equal(json.data.user.email, undefined);
      assert.equal(json.data.user.password, undefined);
      assert.equal(json.data.user.resetPasswordTokenHash, undefined);
      assert.equal(json.data.user.resetPasswordExpires, undefined);
    });

    test('GET /api/users/:userId/portfolio supports direct user ID lookup with same safe fields', async () => {
      const res = await fetch(`${baseUrl}/api/users/${devUser1._id}/portfolio`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.user.username, devUser1.username);
      assert.equal(json.data.user.email, undefined);
    });

    test('GET /api/v1/portfolios/me returns authenticated user own portfolio', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me`, {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(String(json.data.user), String(devUser1._id));
      assert.equal(json.data.visibility, 'public');
    });
  });

  // ── 2. VISIBILITY & PRIVACY CONTROLS ───────────────────────────────────────
  describe('2. Visibility & Privacy Controls', { concurrency: 1 }, () => {
    test('Anonymous outsider receives 403 Forbidden when requesting private developer portfolio', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/${privateDevUser.username}`);
      assert.equal(res.status, 403);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /private/i);
    });

    test('Private developer can access their own private portfolio when authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/${privateDevUser.username}`, {
        headers: { Authorization: `Bearer ${privateDevToken}` },
      });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.visibility, 'private');
    });

    test('Private profile is excluded from public developer discovery directory', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?q=${privateDevUser.username}`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      const found = json.data.find((d) => d.username === privateDevUser.username);
      assert.equal(found, undefined, 'Private developer must NOT appear in discovery directory');
    });
  });

  // ── 3. PROFILE UPDATE PERMISSIONS ──────────────────────────────────────────
  describe('3. Profile Update Permissions', { concurrency: 1 }, () => {
    test('PATCH /api/v1/portfolios/me updates authenticated developer portfolio settings and mirrors to user', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          headline: 'Principal Distributed Systems Engineer',
          bio: 'Architecting high-throughput distributed event systems.',
          experienceLevel: 'lead',
          availability: 'open_to_offers',
          hourlyRate: 110,
          location: 'Remote / New York',
          timezone: 'UTC-5',
          preferredRoles: ['Staff Engineer', 'Principal Architect'],
          languages: ['English', 'French'],
          githubUrl: 'https://github.com/alicedev',
          linkedinUrl: 'https://linkedin.com/in/alicedev',
          websiteUrl: 'https://alicedev.tech',
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.headline, 'Principal Distributed Systems Engineer');
      assert.equal(json.data.experienceLevel, 'lead');
      assert.equal(json.data.hourlyRate, 110);
      assert.equal(json.data.timezone, 'UTC-5');

      // Verify that changes also mirrored into User document in DB
      const userDoc = await User.findById(devUser1._id);
      assert.equal(userDoc.headline, 'Principal Distributed Systems Engineer');
      assert.equal(userDoc.experienceLevel, 'lead');
      assert.equal(userDoc.hourlyRate, 110);
    });

    test('PATCH /api/v1/portfolios/me rejects malformed URLs with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          githubUrl: 'invalid-url-without-protocol',
        }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /URL/i);
    });
  });

  // ── 4. SKILLS CREATION, NORMALIZATION & REMOVAL ─────────────────────────────
  describe('4. Skills Creation, Categorization & Normalization', { concurrency: 1 }, () => {
    test('GET /api/v1/skills/categories returns list of canonical skill categories', async () => {
      const res = await fetch(`${baseUrl}/api/v1/skills/categories`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data.includes('Frontend development'));
      assert.ok(json.data.includes('Backend development'));
      assert.ok(json.data.includes('Data science and AI'));
      assert.ok(json.data.includes('DevOps and cloud'));
    });

    test('POST /api/v1/portfolios/me/skills normalizes skill name and updates proficiency', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          name: '   Kubernetes Orchestration   ',
          category: 'DevOps and cloud',
          proficiency: 'expert',
          yearsOfExperience: 4,
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.skills.includes('Kubernetes Orchestration'));

      const k8sSkill = json.skillsWithProficiency.find((s) => s.name === 'Kubernetes Orchestration');
      assert.ok(k8sSkill);
      assert.equal(k8sSkill.category, 'DevOps and cloud');
      assert.equal(k8sSkill.proficiency, 'expert');
      assert.equal(k8sSkill.yearsOfExperience, 4);
    });

    test('DELETE /api/v1/portfolios/me/skills/:skillName removes skill from user profile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/skills/${encodeURIComponent('Kubernetes Orchestration')}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.skills.includes('Kubernetes Orchestration'), false);
    });
  });

  // ── 5. PORTFOLIO SHOWCASE & DEVCONNECT PROJECT LINKING ──────────────────────
  describe('5. Showcase Projects & DevConnect Project Authorization', { concurrency: 1 }, () => {
    let createdProjectId;

    test('POST /api/v1/portfolios/me/projects allows adding an independent showcase project', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          title: 'Open Source Distributed Cache',
          description: 'High-speed in-memory key-value cache built with Node.js and Redis clustering.',
          category: 'Backend development',
          skills: ['Node.js', 'Redis', 'TypeScript'],
          repoUrl: 'https://github.com/alicedev/cache',
          liveUrl: 'https://cache.alicedev.tech',
          role: 'Lead Creator & Maintainer',
          contributionDescription: 'Designed protocol parser and Raft consensus implementation.',
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.project.title, 'Open Source Distributed Cache');
      assert.equal(json.project.source, 'independent');
      assert.equal(json.project.isVerified, false);
      createdProjectId = json.project._id;
    });

    test('POST /api/v1/portfolios/me/projects REJECTS unauthorized DevConnect project reference with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          title: 'Claimed Stealth Project',
          description: 'Attempting to claim a DevConnect project where user has no membership.',
          projectRef: unauthorizedProject._id,
        }),
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /not an authorized member/i);
    });

    test('POST /api/v1/portfolios/me/projects ACCEPTS linking an authorized DevConnect project with verified badge', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          title: 'Fintech Core Ledger Engine',
          description: 'Built multi-currency transaction ledger through DevConnect project workflow.',
          category: 'Web Development',
          skills: ['Node.js', 'PostgreSQL', 'Docker'],
          projectRef: authorizedProject._id,
          role: 'Core Backend Developer',
          contributionDescription: 'Implemented financial milestone ledger and double-entry accounting schema.',
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.project.source, 'devconnect');
      assert.equal(json.project.isVerified, true);
      assert.equal(String(json.project.projectRef), String(authorizedProject._id));
    });

    test('PATCH /api/v1/portfolios/me/projects/:id updates existing showcase project', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/projects/${createdProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken1}`,
        },
        body: JSON.stringify({
          title: 'Open Source Distributed Cache v2',
          inProgress: true,
        }),
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.title, 'Open Source Distributed Cache v2');
      assert.equal(json.data.inProgress, true);
    });

    test('DELETE /api/v1/portfolios/me/projects/:id deletes showcase project', async () => {
      const res = await fetch(`${baseUrl}/api/v1/portfolios/me/projects/${createdProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      const stillExists = json.data.some((p) => String(p._id) === String(createdProjectId));
      assert.equal(stillExists, false);
    });
  });

  // ── 6. DEVELOPER SEARCH & DISCOVERY DIRECTORY ──────────────────────────────
  describe('6. Developer Search & Discovery Directory', { concurrency: 1 }, () => {
    test('GET /api/v1/discovery/developers searches by query matching name or headline', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?q=Architect`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.length > 0);
      const found = json.data.find((d) => d.username === devUser1.username);
      assert.ok(found);
      assert.equal(found.name, devUser1.name);
    });

    test('GET /api/v1/discovery/developers filters by skill', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?skills=Flutter`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      const foundBob = json.data.find((d) => d.username === devUser2.username);
      assert.ok(foundBob);
      const foundAlice = json.data.find((d) => d.username === devUser1.username);
      assert.equal(foundAlice, undefined, 'Alice does not have Flutter and should not be returned');
    });

    test('GET /api/v1/discovery/developers filters by experienceLevel', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?experienceLevel=mid`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      const bob = json.data.find((d) => d.username === devUser2.username);
      assert.ok(bob);
    });

    test('GET /api/v1/discovery/developers filters by availability', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?availability=open_to_offers`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      const bob = json.data.find((d) => d.username === devUser2.username);
      assert.ok(bob);
    });

    test('GET /api/v1/discovery/developers returns stable pagination metadata', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/developers?page=1&limit=1`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.length, 1);
      assert.equal(json.pagination.page, 1);
      assert.equal(json.pagination.limit, 1);
      assert.ok(json.pagination.total >= 2);
    });
  });

  // ── 7. PROJECT & COLLABORATION DISCOVERY ────────────────────────────────────
  describe('7. Project & Collaboration Discovery', { concurrency: 1 }, () => {
    test('GET /api/v1/discovery/projects lists active Open projects and excludes Completed/Cancelled', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/projects`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      // unauthorizedProject is 'Open'
      const openProj = json.data.find((p) => String(p._id) === String(unauthorizedProject._id));
      assert.ok(openProj, 'Open project must be present in discovery');

      // authorizedProject is 'Completed' and must NOT be in recruitment discovery
      const completedProj = json.data.find((p) => String(p._id) === String(authorizedProject._id));
      assert.equal(completedProj, undefined, 'Completed project must NOT appear in recruitment discovery');
    });

    test('GET /api/v1/discovery/projects filters by category and budget', async () => {
      const res = await fetch(`${baseUrl}/api/v1/discovery/projects?category=Web+Development&minBudget=10000`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      const found = json.data.find((p) => String(p._id) === String(unauthorizedProject._id));
      assert.ok(found);
      assert.ok(found.budgetMax >= 10000 || found.budget);
    });
  });

  // ── 8. SAVED DEVELOPERS & BOOKMARKS ────────────────────────────────────────
  describe('8. Saved Developers & Bookmarks', { concurrency: 1 }, () => {
    test('POST /api/v1/bookmarks/developers/:id saves developer profile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/bookmarks/developers/${devUser1._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(String(json.data.developer), String(devUser1._id));
    });

    test('POST /api/v1/bookmarks/developers/:id rejects saving oneself with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/bookmarks/developers/${devUser1._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /cannot save your own/i);
    });

    test('Saved developer list is private to owner and displays saved developers', async () => {
      // Client checks their saved list
      const clientRes = await fetch(`${baseUrl}/api/v1/bookmarks`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      assert.equal(clientRes.status, 200);
      const clientJson = await clientRes.json();
      assert.equal(clientJson.success, true);
      const found = clientJson.data.find((d) => String(d._id) === String(devUser1._id));
      assert.ok(found, 'Saved developer must appear in client saved list');

      // devUser2 checks their own saved list — must be empty, not showing clientUser’s bookmarks
      const dev2Res = await fetch(`${baseUrl}/api/v1/bookmarks`, {
        headers: { Authorization: `Bearer ${devToken2}` },
      });
      assert.equal(dev2Res.status, 200);
      const dev2Json = await dev2Res.json();
      const dev2Found = dev2Json.data.find((d) => String(d._id) === String(devUser1._id));
      assert.equal(dev2Found, undefined, 'Another user saved list must be private');
    });

    test('DELETE /api/v1/bookmarks/developers/:id removes developer from saved list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/bookmarks/developers/${devUser1._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${clientToken}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      // Verify removed
      const listRes = await fetch(`${baseUrl}/api/v1/bookmarks`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const listJson = await listRes.json();
      const stillThere = listJson.data.some((d) => String(d._id) === String(devUser1._id));
      assert.equal(stillThere, false);
    });
  });

  // ── 9. FOLLOWING & CONNECTIONS SYSTEM ──────────────────────────────────────
  describe('9. Following & Connections System', { concurrency: 1 }, () => {
    test('POST /api/v1/users/:userId/follow allows following a developer and updates counts', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${devUser1._id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken2}` },
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.isFollowing, true);

      // Check follower count of devUser1 and following count of devUser2
      const targetUser = await User.findById(devUser1._id);
      const followerUser = await User.findById(devUser2._id);
      assert.equal(targetUser.followersCount, 1);
      assert.equal(followerUser.followingCount, 1);
    });

    test('POST /api/v1/users/:userId/follow rejects self-follow with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${devUser1._id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /cannot follow yourself/i);
    });

    test('GET /api/v1/users/:userId/followers lists followers with pagination', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${devUser1._id}/followers`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.length >= 1);
      const follower = json.data.find((f) => f.username === devUser2.username);
      assert.ok(follower);
    });

    test('DELETE /api/v1/users/:userId/follow unfollows developer and decrements counts', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${devUser1._id}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken2}` },
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.isFollowing, false);

      const targetUser = await User.findById(devUser1._id);
      const followerUser = await User.findById(devUser2._id);
      assert.equal(targetUser.followersCount, 0);
      assert.equal(followerUser.followingCount, 0);
    });
  });
});
