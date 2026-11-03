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
import { ProjectActivity } from '../../src/models/ProjectActivity.js';

dotenv.config();

describe('DevConnect Create Project Module — Comprehensive Test Suite (Suites A through O)', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  let ownerUser;
  let ownerToken;
  let hackerUser;
  let hackerToken;
  let expiredToken;

  const createdProjectIds = [];

  const createJwtToken = (userId, expiresIn = '7d') => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern',
      { expiresIn }
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

    // Create test accounts
    ownerUser = await User.create({
      name: `Project Creator ${uniqueSuffix}`,
      username: `creator_${uniqueSuffix}`,
      email: `creator_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id, '7d');

    hackerUser = await User.create({
      name: `Hacker User ${uniqueSuffix}`,
      username: `hacker_${uniqueSuffix}`,
      email: `hacker_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    hackerToken = createJwtToken(hackerUser._id, '7d');

    expiredToken = jwt.sign(
      { id: ownerUser._id },
      process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern',
      { expiresIn: '-1s' }
    );
  });

  after(async () => {
    try {
      if (createdProjectIds.length > 0) {
        await ProjectActivity.deleteMany({ project: { $in: createdProjectIds } });
        await ProjectMember.deleteMany({ project: { $in: createdProjectIds } });
        await Project.deleteMany({ _id: { $in: createdProjectIds } });
      }
      if (ownerUser) await User.deleteOne({ _id: ownerUser._id });
      if (hackerUser) await User.deleteOne({ _id: hackerUser._id });
    } catch (e) {
      // ignore cleanup errors
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // Helper request function
  const postProject = async (body, token = ownerToken) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.project?._id) {
      createdProjectIds.push(data.project._id);
    }
    return { status: res.status, data };
  };

  // ==========================================
  // Suite A: Authentication Tests
  // ==========================================
  describe('Suite A: Authentication Guardrails', () => {
    test('A1: Rejects unauthenticated request with 401', async () => {
      const { status, data } = await postProject(
        { title: 'Valid Project Title', description: 'Valid project description for testing auth' },
        null
      );
      assert.equal(status, 401);
      assert.equal(data.success, false);
    });

    test('A2: Rejects invalid JWT token with 401', async () => {
      const { status, data } = await postProject(
        { title: 'Valid Project Title', description: 'Valid project description for testing auth' },
        'invalid.token.here'
      );
      assert.equal(status, 401);
      assert.equal(data.success, false);
    });

    test('A3: Rejects expired JWT token with 401', async () => {
      const { status, data } = await postProject(
        { title: 'Valid Project Title', description: 'Valid project description for testing auth' },
        expiredToken
      );
      assert.equal(status, 401);
      assert.equal(data.success, false);
    });

    test('A4: Accepts valid token and attaches user identity to project', async () => {
      const { status, data } = await postProject({
        title: 'Auth Verification Project',
        description: 'Verifying authenticated user identity extraction',
      });
      assert.equal(status, 201);
      assert.equal(data.success, true);
      assert.equal(String(data.project.owner._id || data.project.owner), String(ownerUser._id));
    });
  });

  // ==========================================
  // Suite B: Title Validation Tests
  // ==========================================
  describe('Suite B: Title Validation', () => {
    test('B1: Rejects missing title with 400', async () => {
      const { status, data } = await postProject({
        description: 'Valid description without a title field',
      });
      assert.equal(status, 400);
      assert.match(data.message, /title is required/i);
    });

    test('B2: Rejects whitespace-only title with 400', async () => {
      const { status, data } = await postProject({
        title: '     ',
        description: 'Valid description with empty whitespace title',
      });
      assert.equal(status, 400);
      assert.match(data.message, /title is required/i);
    });

    test('B3: Rejects title shorter than 3 characters with 400', async () => {
      const { status, data } = await postProject({
        title: 'AB',
        description: 'Valid description with a two character title',
      });
      assert.equal(status, 400);
      assert.match(data.message, /at least 3 characters/i);
    });

    test('B4: Accepts title with exactly 3 characters with 201', async () => {
      const { status, data } = await postProject({
        title: 'API',
        description: 'Valid description with exactly 3 character title',
      });
      assert.equal(status, 201);
      assert.equal(data.project.title, 'API');
    });

    test('B5: Accepts title with exactly 120 characters with 201', async () => {
      const title120 = 'T'.repeat(120);
      const { status, data } = await postProject({
        title: title120,
        description: 'Valid description with maximum allowable title length',
      });
      assert.equal(status, 201);
      assert.equal(data.project.title.length, 120);
    });

    test('B6: Rejects title longer than 120 characters with 400', async () => {
      const title121 = 'T'.repeat(121);
      const { status, data } = await postProject({
        title: title121,
        description: 'Valid description with title exceeding 120 characters',
      });
      assert.equal(status, 400);
      assert.match(data.message, /cannot exceed 120 characters/i);
    });

    test('B7: Accepts title with safe punctuation and special characters with 201', async () => {
      const specialTitle = 'AI & LLM Platform (v2.0): High-Scale API!';
      const { status, data } = await postProject({
        title: specialTitle,
        description: 'Valid description with ampersands, colons, and parentheses',
      });
      assert.equal(status, 201);
      assert.equal(data.project.title, specialTitle);
    });
  });

  // ==========================================
  // Suite C: Description Validation Tests
  // ==========================================
  describe('Suite C: Description Validation', () => {
    test('C1: Rejects missing description with 400', async () => {
      const { status, data } = await postProject({
        title: 'Valid Project Title',
      });
      assert.equal(status, 400);
      assert.match(data.message, /description is required/i);
    });

    test('C2: Rejects whitespace-only description with 400', async () => {
      const { status, data } = await postProject({
        title: 'Valid Project Title',
        description: '          ',
      });
      assert.equal(status, 400);
      assert.match(data.message, /description is required/i);
    });

    test('C3: Rejects description shorter than 10 characters with 400', async () => {
      const { status, data } = await postProject({
        title: 'Valid Project Title',
        description: 'Too short',
      });
      assert.equal(status, 400);
      assert.match(data.message, /at least 10 characters/i);
    });

    test('C4: Accepts description with exactly 10 characters with 201', async () => {
      const { status, data } = await postProject({
        title: 'Valid Project Title',
        description: '1234567890',
      });
      assert.equal(status, 201);
      assert.equal(data.project.description, '1234567890');
    });

    test('C5: Accepts description up to 5000 characters with 201', async () => {
      const desc5000 = 'D'.repeat(5000);
      const { status, data } = await postProject({
        title: 'Valid Project Title',
        description: desc5000,
      });
      assert.equal(status, 201);
      assert.equal(data.project.description.length, 5000);
    });

    test('C6: Rejects description exceeding 5000 characters with 400', async () => {
      const desc5001 = 'D'.repeat(5001);
      const { status, data } = await postProject({
        title: 'Valid Project Title',
        description: desc5001,
      });
      assert.equal(status, 400);
      assert.match(data.message, /cannot exceed 5000 characters/i);
    });
  });

  // ==========================================
  // Suite D: Budget Validation Tests
  // ==========================================
  describe('Suite D: Budget Validation', () => {
    test('D1: Accepts valid budgetMin and budgetMax with 201', async () => {
      const { status, data } = await postProject({
        title: 'Budget Test Project',
        description: 'Testing valid budget min and max numbers',
        budgetMin: 1000,
        budgetMax: 5000,
        currency: 'USD',
      });
      assert.equal(status, 201);
      assert.equal(data.project.budgetMin, 1000);
      assert.equal(data.project.budgetMax, 5000);
      assert.match(data.project.budget, /\$1,000 - \$5,000/);
    });

    test('D2: Rejects budgetMin > budgetMax with 400', async () => {
      const { status, data } = await postProject({
        title: 'Budget Test Project',
        description: 'Testing invalid budget where min exceeds max',
        budgetMin: 5000,
        budgetMax: 1000,
      });
      assert.equal(status, 400);
      assert.match(data.message, /minimum budget cannot exceed maximum budget/i);
    });

    test('D3: Rejects negative budgetMin with 400', async () => {
      const { status, data } = await postProject({
        title: 'Budget Test Project',
        description: 'Testing negative minimum budget rejection',
        budgetMin: -100,
        budgetMax: 1000,
      });
      assert.equal(status, 400);
      assert.match(data.message, /minimum budget cannot be negative/i);
    });

    test('D4: Rejects negative budgetMax with 400', async () => {
      const { status, data } = await postProject({
        title: 'Budget Test Project',
        description: 'Testing negative maximum budget rejection',
        budgetMin: 0,
        budgetMax: -50,
      });
      assert.equal(status, 400);
      assert.match(data.message, /maximum budget cannot be negative/i);
    });

    test('D5: Accepts budget of 0 (e.g. volunteer or open source) with 201', async () => {
      const { status, data } = await postProject({
        title: 'Zero Budget Open Source Project',
        description: 'Volunteer community project with zero compensation',
        budgetMin: 0,
        budgetMax: 0,
        currency: 'EUR',
      });
      assert.equal(status, 201);
      assert.equal(data.project.budgetMin, 0);
      assert.equal(data.project.budgetMax, 0);
      assert.equal(data.project.currency, 'EUR');
    });

    test('D6: Automatically formats currency symbols for EUR, GBP, INR, and USD', async () => {
      const { data: eurProj } = await postProject({
        title: 'EUR Currency Project',
        description: 'Valid project with EUR currency code',
        budgetMin: 200,
        budgetMax: 600,
        currency: 'EUR',
      });
      assert.match(eurProj.project.budget, /€200 - €600/);

      const { data: gbpProj } = await postProject({
        title: 'GBP Currency Project',
        description: 'Valid project with GBP currency code',
        budgetMin: 300,
        budgetMax: 900,
        currency: 'GBP',
      });
      assert.match(gbpProj.project.budget, /£300 - £900/);

      const { data: inrProj } = await postProject({
        title: 'INR Currency Project',
        description: 'Valid project with INR currency code',
        budgetMin: 50000,
        budgetMax: 150000,
        currency: 'INR',
      });
      assert.match(inrProj.project.budget, /₹50,000 - ₹150,000/);
    });
  });

  // ==========================================
  // Suite E: Required Skills Validation Tests
  // ==========================================
  describe('Suite E: Required Skills Validation', () => {
    test('E1: Accepts valid skills array and normalizes items', async () => {
      const { status, data } = await postProject({
        title: 'Skills Test Project',
        description: 'Valid project testing skill sanitization',
        requiredSkills: ['React', '  Node.js  ', '#MongoDB', 'Express'],
      });
      assert.equal(status, 201);
      assert.deepEqual(data.project.requiredSkills, ['React', 'Node.js', 'MongoDB', 'Express']);
    });

    test('E2: Performs case-insensitive deduplication of skills', async () => {
      const { status, data } = await postProject({
        title: 'Deduplicated Skills Project',
        description: 'Valid project testing case-insensitive deduplication',
        requiredSkills: ['React', 'react', 'REACT', 'TypeScript', 'typescript'],
      });
      assert.equal(status, 201);
      assert.deepEqual(data.project.requiredSkills, ['React', 'TypeScript']);
    });

    test('E3: Accepts up to 25 skills with 201', async () => {
      const skills25 = Array.from({ length: 25 }, (_, i) => `Skill${i + 1}`);
      const { status, data } = await postProject({
        title: 'Max Skills Project',
        description: 'Testing the 25 skills ceiling',
        requiredSkills: skills25,
      });
      assert.equal(status, 201);
      assert.equal(data.project.requiredSkills.length, 25);
    });

    test('E4: Rejects more than 25 skills with 400', async () => {
      const skills26 = Array.from({ length: 26 }, (_, i) => `Skill${i + 1}`);
      const { status, data } = await postProject({
        title: 'Overflow Skills Project',
        description: 'Testing 26 skills rejection',
        requiredSkills: skills26,
      });
      assert.equal(status, 400);
      assert.match(data.message, /cannot specify more than 25 required skills/i);
    });

    test('E5: Rejects non-array requiredSkills with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Skills Type Project',
        description: 'Testing string instead of array for requiredSkills',
        requiredSkills: 'React, Node.js',
      });
      assert.equal(status, 400);
      assert.match(data.message, /must be an array/i);
    });
  });

  // ==========================================
  // Suite F: Project Configuration (Enums) Tests
  // ==========================================
  describe('Suite F: Project Configuration & Enums', () => {
    test('F1: Accepts all valid projectType enums', async () => {
      const types = ['collaboration', 'freelance', 'academic', 'open_source'];
      for (const t of types) {
        const { status, data } = await postProject({
          title: `Project Type ${t}`,
          description: `Testing valid projectType enum ${t}`,
          projectType: t,
        });
        assert.equal(status, 201);
        assert.equal(data.project.projectType, t);
      }
    });

    test('F2: Rejects invalid projectType with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Project Type',
        description: 'Testing invalid projectType enum',
        projectType: 'enterprise_contract',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid project type/i);
    });

    test('F3: Normalizes entry experienceLevel to beginner', async () => {
      const { status, data } = await postProject({
        title: 'Experience Level Entry Normalization',
        description: 'Testing entry mapping to beginner',
        experienceLevel: 'entry',
      });
      assert.equal(status, 201);
      assert.equal(data.project.experienceLevel, 'beginner');
    });

    test('F4: Accepts valid experienceLevel enums', async () => {
      const levels = ['beginner', 'intermediate', 'expert', 'all'];
      for (const lvl of levels) {
        const { status, data } = await postProject({
          title: `Experience Level ${lvl}`,
          description: `Testing valid experienceLevel enum ${lvl}`,
          experienceLevel: lvl,
        });
        assert.equal(status, 201);
        assert.equal(data.project.experienceLevel, lvl);
      }
    });

    test('F5: Rejects invalid experienceLevel with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Experience Level',
        description: 'Testing invalid experienceLevel enum',
        experienceLevel: 'rockstar_wizard',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid experience level/i);
    });

    test('F6: Accepts valid commitment enums', async () => {
      const commitments = ['full_time', 'part_time', 'flexible'];
      for (const c of commitments) {
        const { status, data } = await postProject({
          title: `Commitment ${c}`,
          description: `Testing valid commitment enum ${c}`,
          commitment: c,
        });
        assert.equal(status, 201);
        assert.equal(data.project.commitment, c);
      }
    });

    test('F7: Rejects invalid commitment with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Commitment',
        description: 'Testing invalid commitment enum',
        commitment: '24_7_on_call',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid commitment type/i);
    });

    test('F8: Accepts valid visibility enums', async () => {
      for (const v of ['public', 'private']) {
        const { status, data } = await postProject({
          title: `Visibility ${v}`,
          description: `Testing valid visibility enum ${v}`,
          visibility: v,
        });
        assert.equal(status, 201);
        assert.equal(data.project.visibility, v);
      }
    });

    test('F9: Rejects invalid visibility with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Visibility',
        description: 'Testing invalid visibility enum',
        visibility: 'secret_underground',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid visibility/i);
    });

    test('F10: Accepts draft and open status at creation, rejects completed with 400', async () => {
      const { status: sDraft, data: dDraft } = await postProject({
        title: 'Draft Project',
        description: 'Testing saving as a draft project',
        status: 'draft',
      });
      assert.equal(sDraft, 201);
      assert.equal(dDraft.project.status, 'draft');

      const { status: sOpen, data: dOpen } = await postProject({
        title: 'Open Project',
        description: 'Testing saving as an open project',
        status: 'open',
      });
      assert.equal(sOpen, 201);
      assert.equal(dOpen.project.status, 'open');

      const { status: sInvalid, data: dInvalid } = await postProject({
        title: 'Invalid Initial Status',
        description: 'Testing creation with completed status',
        status: 'completed',
      });
      assert.equal(sInvalid, 400);
      assert.match(dInvalid.message, /initial project status must be either open or draft/i);
    });
  });

  // ==========================================
  // Suite G: Team Size Validation Tests
  // ==========================================
  describe('Suite G: Team Size Validation', () => {
    test('G1: Accepts teamSize between 1 and 100', async () => {
      const { status: s1, data: d1 } = await postProject({
        title: 'Team Size 1 Project',
        description: 'Testing valid boundary teamSize 1',
        teamSize: 1,
      });
      assert.equal(s1, 201);
      assert.equal(d1.project.teamSize, 1);

      const { status: s100, data: d100 } = await postProject({
        title: 'Team Size 100 Project',
        description: 'Testing valid boundary teamSize 100',
        teamSize: 100,
      });
      assert.equal(s100, 201);
      assert.equal(d100.project.teamSize, 100);
    });

    test('G2: Rejects teamSize = 0 with 400', async () => {
      const { status, data } = await postProject({
        title: 'Zero Team Size Project',
        description: 'Testing teamSize 0 rejection',
        teamSize: 0,
      });
      assert.equal(status, 400);
      assert.match(data.message, /team size must be between 1 and 100/i);
    });

    test('G3: Rejects negative teamSize with 400', async () => {
      const { status, data } = await postProject({
        title: 'Negative Team Size Project',
        description: 'Testing negative teamSize rejection',
        teamSize: -5,
      });
      assert.equal(status, 400);
      assert.match(data.message, /team size must be between 1 and 100/i);
    });

    test('G4: Rejects teamSize > 100 with 400', async () => {
      const { status, data } = await postProject({
        title: 'Oversized Team Project',
        description: 'Testing teamSize 101 rejection',
        teamSize: 101,
      });
      assert.equal(status, 400);
      assert.match(data.message, /team size must be between 1 and 100/i);
    });
  });

  // ==========================================
  // Suite H: Duration Options Tests
  // ==========================================
  describe('Suite H: Duration Options', () => {
    test('H1: Accepts and persists standard duration strings', async () => {
      const durations = ['1 Week', '2 Weeks', '1 Month', '1 - 2 Months', '3 Months', '6 Months+'];
      for (const d of durations) {
        const { status, data } = await postProject({
          title: `Duration ${d}`,
          description: `Testing duration persistence for ${d}`,
          duration: d,
        });
        assert.equal(status, 201);
        assert.equal(data.project.duration, d);
      }
    });
  });

  // ==========================================
  // Suite I: Deadlines Validation Tests
  // ==========================================
  describe('Suite I: Deadlines Validation', () => {
    test('I1: Accepts valid ISO deadline dates', async () => {
      const appDeadline = new Date(Date.now() + 7 * 86400000).toISOString();
      const projDeadline = new Date(Date.now() + 30 * 86400000).toISOString();

      const { status, data } = await postProject({
        title: 'Valid Deadlines Project',
        description: 'Testing valid deadline ordering and persistence',
        applicationDeadline: appDeadline,
        deadline: projDeadline,
      });
      assert.equal(status, 201);
      assert.ok(data.project.deadline);
      assert.ok(data.project.applicationDeadline);
    });

    test('I2: Rejects invalid date string with 400', async () => {
      const { status, data } = await postProject({
        title: 'Invalid Date Project',
        description: 'Testing invalid deadline date format',
        deadline: 'not-a-valid-date-string',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid project deadline/i);
    });

    test('I3: Rejects applicationDeadline after project deadline with 400', async () => {
      const appDeadline = new Date(Date.now() + 45 * 86400000).toISOString();
      const projDeadline = new Date(Date.now() + 30 * 86400000).toISOString();

      const { status, data } = await postProject({
        title: 'Mismatched Deadlines Project',
        description: 'Testing application deadline greater than project deadline',
        applicationDeadline: appDeadline,
        deadline: projDeadline,
      });
      assert.equal(status, 400);
      assert.match(data.message, /application deadline cannot be after project deadline/i);
    });
  });

  // ==========================================
  // Suite J: URLs Validation Tests
  // ==========================================
  describe('Suite J: URLs Validation', () => {
    test('J1: Accepts valid http and https URLs for GitHub and Demo', async () => {
      const { status, data } = await postProject({
        title: 'Valid URLs Project',
        description: 'Testing valid http and https URLs',
        githubRepoUrl: 'https://github.com/devconnect/core-engine',
        liveDemoUrl: 'https://devconnect-demo.vercel.app',
      });
      assert.equal(status, 201);
      assert.equal(data.project.githubRepoUrl, 'https://github.com/devconnect/core-engine');
      assert.equal(data.project.liveDemoUrl, 'https://devconnect-demo.vercel.app');
    });

    test('J2: Rejects malformed GitHub URL with 400', async () => {
      const { status, data } = await postProject({
        title: 'Malformed GitHub URL',
        description: 'Testing URL missing protocol',
        githubRepoUrl: 'ftp://not-supported-protocol.com',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid github repository url format/i);
    });

    test('J3: Rejects malformed Live Demo URL with 400', async () => {
      const { status, data } = await postProject({
        title: 'Malformed Demo URL',
        description: 'Testing Demo URL missing protocol',
        liveDemoUrl: 'javascript:alert(1)',
      });
      assert.equal(status, 400);
      assert.match(data.message, /invalid live demo url format/i);
    });
  });

  // ==========================================
  // Suite K: Complete Project Creation Pipeline
  // ==========================================
  describe('Suite K: Complete Project Creation Pipeline', () => {
    test('K1: Creates project with full 18 fields correctly populated', async () => {
      const fullPayload = {
        title: 'Autonomous Multi-Agent Orchestrator',
        description:
          'A distributed orchestration engine enabling autonomous agents to coordinate and execute complex workflows.',
        category: 'AI & ML',
        projectType: 'open_source',
        experienceLevel: 'expert',
        teamSize: 4,
        budgetMin: 3000,
        budgetMax: 7500,
        currency: 'USD',
        duration: '3 Months',
        commitment: 'part_time',
        visibility: 'public',
        requiredSkills: ['Python', 'Docker', 'FastAPI', 'LangChain', 'Redis'],
        deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
        applicationDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        githubRepoUrl: 'https://github.com/devconnect/agent-mesh',
        liveDemoUrl: 'https://agents.devconnect.io',
        status: 'open',
      };

      const { status, data } = await postProject(fullPayload);
      assert.equal(status, 201);
      assert.equal(data.success, true);
      assert.equal(data.project.title, fullPayload.title);
      assert.equal(data.project.category, 'AI & ML');
      assert.equal(data.project.projectType, 'open_source');
      assert.equal(data.project.experienceLevel, 'expert');
      assert.equal(data.project.teamSize, 4);
      assert.equal(data.project.budgetMin, 3000);
      assert.equal(data.project.budgetMax, 7500);
      assert.equal(data.project.currency, 'USD');
      assert.equal(data.project.duration, '3 Months');
      assert.equal(data.project.commitment, 'part_time');
      assert.equal(data.project.visibility, 'public');
      assert.equal(data.project.status, 'open');
      assert.deepEqual(data.project.requiredSkills, fullPayload.requiredSkills);
      assert.equal(data.project.githubRepoUrl, fullPayload.githubRepoUrl);
      assert.equal(data.project.liveDemoUrl, fullPayload.liveDemoUrl);
    });
  });

  // ==========================================
  // Suite L: Owner & Membership Verification
  // ==========================================
  describe('Suite L: Project Owner & Membership Verification', () => {
    test('L1: Automatically adds creator as active ProjectMember with role owner', async () => {
      const { status, data } = await postProject({
        title: 'Membership Verification Project',
        description: 'Checking automated creation of owner in ProjectMember collection',
      });
      assert.equal(status, 201);

      const member = await ProjectMember.findOne({
        project: data.project._id,
        user: ownerUser._id,
      });

      assert.ok(member, 'ProjectMember record must exist');
      assert.equal(member.role, 'owner');
      assert.equal(member.status, 'active');
    });

    test('L2: Ignores owner field spoofing in payload, enforcing authenticated user', async () => {
      const { status, data } = await postProject({
        title: 'Spoof Attempt Project',
        description: 'Attempting to spoof owner ID as hackerUser in payload',
        owner: hackerUser._id, // malicious payload
      });
      assert.equal(status, 201);
      // Backend must enforce owner = authenticated user
      assert.equal(String(data.project.owner._id || data.project.owner), String(ownerUser._id));
      assert.notEqual(String(data.project.owner._id || data.project.owner), String(hackerUser._id));
    });
  });

  // ==========================================
  // Suite M: Activity Logging Verification
  // ==========================================
  describe('Suite M: Project Activity Logging', () => {
    test('M1: Automatically writes project_created event to ProjectActivity', async () => {
      const { status, data } = await postProject({
        title: 'Activity Verification Project',
        description: 'Verifying audit trail creation in ProjectActivity',
      });
      assert.equal(status, 201);

      const activity = await ProjectActivity.findOne({
        project: data.project._id,
        action: 'project_created',
      });

      assert.ok(activity, 'ProjectActivity audit record must exist');
      assert.equal(String(activity.user), String(ownerUser._id));
      assert.equal(activity.details?.title, 'Activity Verification Project');
    });
  });

  // ==========================================
  // Suite N: Counter Tampering Prevention
  // ==========================================
  describe('Suite N: Security & Counter Tampering Prevention', () => {
    test('N1: Whitelisting prevents manipulation of internal engagement counters', async () => {
      const { status, data } = await postProject({
        title: 'Counter Tampering Test Project',
        description: 'Attempting to inject fake engagement metrics into the project',
        reactionsCount: 99999,
        viewsCount: 88888,
        commentsCount: 77777,
        repostsCount: 66666,
        acceptedApplicantsCount: 55,
      });
      assert.equal(status, 201);
      assert.equal(data.project.reactionsCount, 0);
      assert.equal(data.project.viewsCount, 0);
      assert.equal(data.project.commentsCount, 0);
      assert.equal(data.project.repostsCount, 0);
      assert.equal(data.project.acceptedApplicantsCount, 0);
    });
  });

  // ==========================================
  // Suite O: API Response Contract
  // ==========================================
  describe('Suite O: API Response Contract', () => {
    test('O1: Valid response includes success flag, message, and populated owner details', async () => {
      const { status, data } = await postProject({
        title: 'Contract Verification Project',
        description: 'Verifying complete JSON API response contract structure',
      });
      assert.equal(status, 201);
      assert.equal(data.success, true);
      assert.equal(typeof data.message, 'string');
      assert.ok(data.project);
      assert.ok(data.project._id);
      assert.equal(typeof data.project.owner, 'object');
      assert.equal(data.project.owner.username, ownerUser.username);
      assert.equal(data.project.owner.email, ownerUser.email);
    });
  });
});
