import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Profile } from '../../src/models/Profile.js';
import { DeveloperBookmark } from '../../src/models/DeveloperBookmark.js';
import { SavedSearch } from '../../src/models/SavedSearch.js';

dotenv.config();

describe('DevConnect Developer Discovery Module Comprehensive Integration & Unit Tests', { concurrency: 1 }, () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  let searcherUser;
  let searcherToken;

  let publicSeniorDev;
  let publicMidDev;
  let publicJuniorDev;
  let authenticatedOnlyDev;
  let authenticatedOnlyDevToken;
  let privateDev;

  const createJwtToken = (userId) => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern',
      { expiresIn: '7d' }
    );
  };

  const makeRequest = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let json;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return {
      status: res.status,
      headers: res.headers,
      body: json,
    };
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

    // Setup Test Users
    searcherUser = await User.create({
      name: `Searcher User ${uniqueSuffix}`,
      username: `searcher_${uniqueSuffix}`,
      email: `searcher_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
    });
    searcherToken = createJwtToken(searcherUser._id);

    // 1. Senior Full-Stack Engineer (Public, rating 4.9, 10 projects)
    publicSeniorDev = await User.create({
      name: `Devin Senior ${uniqueSuffix}`,
      username: `devinsenior_${uniqueSuffix}`,
      email: `senior_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Principal Cloud & Full-Stack Architect',
      bio: 'Deep expertise in Kubernetes, React, Node.js, and TypeScript.',
      skills: ['React', 'Node.js', 'Kubernetes', 'TypeScript', 'GraphQL'],
      experienceLevel: 'senior',
      availability: 'available',
      openTo: ['full-time', 'contract'],
      location: 'San Francisco, CA',
      rating: 4.9,
      completedProjectsCount: 10,
    });
    await Profile.create({
      user: publicSeniorDev._id,
      headline: 'Principal Cloud & Full-Stack Architect',
      skills: ['React', 'Node.js', 'Kubernetes', 'TypeScript', 'GraphQL'],
      skillsWithProficiency: [
        { name: 'React', category: 'Frontend development', proficiency: 'expert' },
        { name: 'Node.js', category: 'Backend development', proficiency: 'expert' },
      ],
      visibility: 'public',
      location: 'San Francisco, CA',
      experienceLevel: 'senior',
    });

    // 2. Mid Frontend Engineer (Public, rating 4.6, 3 projects)
    publicMidDev = await User.create({
      name: `Maya Frontend ${uniqueSuffix}`,
      username: `mayafront_${uniqueSuffix}`,
      email: `maya_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Mid React & Tailwind Specialist',
      bio: 'Crafting pixel-perfect responsive user interfaces and state management.',
      skills: ['React', 'Tailwind', 'JavaScript', 'CSS3'],
      experienceLevel: 'mid',
      availability: 'open_to_offers',
      openTo: ['part-time', 'open-source'],
      location: 'Austin, TX',
      rating: 4.6,
      completedProjectsCount: 3,
    });
    await Profile.create({
      user: publicMidDev._id,
      headline: 'Mid React & Tailwind Specialist',
      skills: ['React', 'Tailwind', 'JavaScript', 'CSS3'],
      skillsWithProficiency: [
        { name: 'React', category: 'Frontend development', proficiency: 'advanced' },
      ],
      visibility: 'public',
      location: 'Austin, TX',
      experienceLevel: 'mid',
    });

    // 3. Junior AI Engineer (Public, rating 3.8, 1 project)
    publicJuniorDev = await User.create({
      name: `Arun Python ${uniqueSuffix}`,
      username: `arunpy_${uniqueSuffix}`,
      email: `arun_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Junior Python & PyTorch Enthusiast',
      bio: 'Exploring generative AI, fine-tuning LLMs, and prompt pipelines.',
      skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI'],
      experienceLevel: 'junior',
      availability: 'busy',
      openTo: ['mentorship', 'contract'],
      location: 'Bengaluru, India',
      rating: 3.8,
      completedProjectsCount: 1,
    });
    await Profile.create({
      user: publicJuniorDev._id,
      headline: 'Junior Python & PyTorch Enthusiast',
      skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI'],
      visibility: 'public',
      location: 'Bengaluru, India',
      experienceLevel: 'junior',
    });

    // 4. Authenticated-Only Developer (Visibility = 'authenticated')
    authenticatedOnlyDev = await User.create({
      name: `Sara AuthOnly ${uniqueSuffix}`,
      username: `saraauth_${uniqueSuffix}`,
      email: `sara_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Full-Stack Rust & WebAssembly Engineer',
      skills: ['Rust', 'WebAssembly', 'React'],
      experienceLevel: 'senior',
      availability: 'available',
      rating: 5.0,
      completedProjectsCount: 8,
    });
    authenticatedOnlyDevToken = createJwtToken(authenticatedOnlyDev._id);
    await Profile.create({
      user: authenticatedOnlyDev._id,
      headline: 'Full-Stack Rust & WebAssembly Engineer',
      visibility: 'authenticated',
      skills: ['Rust', 'WebAssembly', 'React'],
    });

    // 5. Private Developer (Visibility = 'private')
    privateDev = await User.create({
      name: `Hidden Dev ${uniqueSuffix}`,
      username: `hiddendev_${uniqueSuffix}`,
      email: `hidden_${uniqueSuffix}@devtest.io`,
      password: 'password123',
      role: 'developer',
      status: 'active',
      headline: 'Stealth Cryptography Researcher',
      skills: ['Cryptography', 'C++', 'Zero-Knowledge'],
      experienceLevel: 'senior',
      availability: 'available',
      rating: 5.0,
      completedProjectsCount: 20,
    });
    await Profile.create({
      user: privateDev._id,
      headline: 'Stealth Cryptography Researcher',
      visibility: 'private',
      skills: ['Cryptography', 'C++', 'Zero-Knowledge'],
    });
  });

  after(async () => {
    const userIds = [
      searcherUser?._id,
      publicSeniorDev?._id,
      publicMidDev?._id,
      publicJuniorDev?._id,
      authenticatedOnlyDev?._id,
      privateDev?._id,
    ].filter(Boolean);

    await User.deleteMany({ _id: { $in: userIds } });
    await Profile.deleteMany({ user: { $in: userIds } });
    await DeveloperBookmark.deleteMany({ user: { $in: userIds } });
    await SavedSearch.deleteMany({ user: { $in: userIds } });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION A: MODEL & SCHEMA INTEGRITY TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('A. Data Models & Schema Constraints', () => {
    test('DeveloperBookmark rejects duplicate bookmarks for the same (user, developer) pair', async () => {
      const bookmark1 = await DeveloperBookmark.create({
        user: searcherUser._id,
        developer: publicSeniorDev._id,
        notes: 'Great senior architect for cloud revamp',
      });
      assert.ok(bookmark1._id);

      // Attempt duplicate
      let error = null;
      try {
        await DeveloperBookmark.create({
          user: searcherUser._id,
          developer: publicSeniorDev._id,
        });
      } catch (err) {
        error = err;
      }
      assert.ok(error, 'Expected MongoDB duplicate key error');
      assert.match(error.message, /E11000/i);

      // Clean up bookmark1 for subsequent tests
      await DeveloperBookmark.findByIdAndDelete(bookmark1._id);
    });

    test('DeveloperBookmark stores and updates notes up to 500 characters', async () => {
      const noteContent = 'Specialized in Kubernetes clusters and microservice deployments.';
      const bookmark = await DeveloperBookmark.create({
        user: searcherUser._id,
        developer: publicMidDev._id,
        notes: noteContent,
      });
      assert.equal(bookmark.notes, noteContent);
      await DeveloperBookmark.findByIdAndDelete(bookmark._id);
    });

    test('SavedSearch enforces user ownership and supports type filters', async () => {
      const search = await SavedSearch.create({
        user: searcherUser._id,
        name: 'Senior React Devs in SF',
        query: { skill: 'React', experienceLevel: 'senior', location: 'San Francisco' },
        type: 'developer',
      });
      assert.ok(search._id);
      assert.equal(search.name, 'Senior React Devs in SF');
      assert.equal(search.type, 'developer');
      assert.equal(search.query.skill, 'React');
      await SavedSearch.findByIdAndDelete(search._id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION B: DEVELOPER SEARCH API (FILTERING, SORTING, PAGINATION)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('B. Developer Search & Filter API', () => {
    test('GET /api/v1/discovery/developers with empty query returns verified developers and excludes private', async () => {
      const res = await makeRequest('/api/v1/discovery/developers');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));

      const ids = res.body.data.map((d) => d._id || d.id);
      // Public devs must be present
      assert.ok(ids.includes(String(publicSeniorDev._id)));
      assert.ok(ids.includes(String(publicMidDev._id)));
      // Private dev must NOT be present
      assert.ok(!ids.includes(String(privateDev._id)));
    });

    test('GET /api/v1/discovery/developers searches safely with q matching name or headline without regex crash', async () => {
      // Test regex safety with special chars like "C++" or "("
      const resSafe = await makeRequest('/api/v1/discovery/developers?q=C%2B%2B');
      assert.equal(resSafe.status, 200);
      assert.equal(resSafe.body.success, true);

      // Search for "Architect"
      const res = await makeRequest(`/api/v1/discovery/developers?q=Architect`);
      assert.equal(res.status, 200);
      const match = res.body.data.find((d) => (d._id || d.id) === String(publicSeniorDev._id));
      assert.ok(match, 'Expected publicSeniorDev to match headline "Architect"');
    });

    test('GET /api/v1/discovery/developers filters by single skill and multiple skills', async () => {
      // Single skill "Python"
      const resPython = await makeRequest('/api/v1/discovery/developers?skill=Python');
      assert.equal(resPython.status, 200);
      const foundArun = resPython.body.data.some((d) => (d._id || d.id) === String(publicJuniorDev._id));
      assert.ok(foundArun, 'Expected junior dev with Python to be found');

      // Multiple skills "React,Kubernetes"
      const resMultiple = await makeRequest('/api/v1/discovery/developers?skills=React,Kubernetes');
      assert.equal(resMultiple.status, 200);
      const foundSenior = resMultiple.body.data.some((d) => (d._id || d.id) === String(publicSeniorDev._id));
      assert.ok(foundSenior, 'Expected senior dev with React and Kubernetes to be found');
    });

    test('GET /api/v1/discovery/developers filters by experienceLevel', async () => {
      const res = await makeRequest('/api/v1/discovery/developers?experienceLevel=junior');
      assert.equal(res.status, 200);
      const allJunior = res.body.data.every((d) => d.experienceLevel === 'junior');
      assert.ok(allJunior);
      assert.ok(res.body.data.some((d) => (d._id || d.id) === String(publicJuniorDev._id)));
    });

    test('GET /api/v1/discovery/developers filters by availability', async () => {
      const res = await makeRequest('/api/v1/discovery/developers?availability=open_to_offers');
      assert.equal(res.status, 200);
      const allMatches = res.body.data.every((d) => d.availability === 'open_to_offers');
      assert.ok(allMatches);
      assert.ok(res.body.data.some((d) => (d._id || d.id) === String(publicMidDev._id)));
    });

    test('GET /api/v1/discovery/developers filters by openTo preference', async () => {
      const res = await makeRequest('/api/v1/discovery/developers?openTo=full-time');
      assert.equal(res.status, 200);
      const foundSenior = res.body.data.some((d) => (d._id || d.id) === String(publicSeniorDev._id));
      assert.ok(foundSenior);
    });

    test('GET /api/v1/discovery/developers filters by minRating', async () => {
      const res = await makeRequest('/api/v1/discovery/developers?minRating=4.5');
      assert.equal(res.status, 200);
      // All results must have rating >= 4.5
      res.body.data.forEach((dev) => {
        assert.ok((dev.rating || 5) >= 4.5);
      });
      // Arun with 3.8 should NOT be present
      assert.ok(!res.body.data.some((d) => (d._id || d.id) === String(publicJuniorDev._id)));
    });

    test('GET /api/v1/discovery/developers caps pagination at limit=50 and handles pages safely', async () => {
      const res = await makeRequest('/api/v1/discovery/developers?limit=100&page=1');
      assert.equal(res.status, 200);
      assert.equal(res.body.pagination.limit, 50, 'Limit should be clamped at 50 max');
      assert.equal(res.body.pagination.page, 1);
    });

    test('GET /api/v1/discovery/developers sorts by rating descending and projects descending', async () => {
      const resRating = await makeRequest('/api/v1/discovery/developers?sort=rating');
      assert.equal(resRating.status, 200);
      const ratings = resRating.body.data.map((d) => d.rating || 0);
      for (let i = 0; i < ratings.length - 1; i++) {
        assert.ok(ratings[i] >= ratings[i + 1], 'Expected descending rating sort');
      }

      const resProjects = await makeRequest('/api/v1/discovery/developers?sort=projects');
      assert.equal(resProjects.status, 200);
      const projects = resProjects.body.data.map((d) => d.completedProjectsCount || 0);
      for (let i = 0; i < projects.length - 1; i++) {
        assert.ok(projects[i] >= projects[i + 1], 'Expected descending projects count sort');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION C: PRIVACY, PERMISSIONS & SANITIZATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('C. Privacy, Roles & Data Sanitization', () => {
    test('Anonymous guest CANNOT see developers with visibility: authenticated or private', async () => {
      const res = await makeRequest('/api/v1/discovery/developers');
      assert.equal(res.status, 200);
      const ids = res.body.data.map((d) => d._id || d.id);
      assert.ok(!ids.includes(String(authenticatedOnlyDev._id)), 'Guest should not see authenticated-only profile');
      assert.ok(!ids.includes(String(privateDev._id)), 'Guest should never see private profile');
    });

    test('Authenticated user CAN see developers with visibility: authenticated, but NOT private', async () => {
      const res = await makeRequest('/api/v1/discovery/developers', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      const ids = res.body.data.map((d) => d._id || d.id);
      assert.ok(ids.includes(String(authenticatedOnlyDev._id)), 'Auth user should see authenticated profile');
      assert.ok(!ids.includes(String(privateDev._id)), 'Auth user should NOT see private profile');
    });

    test('Developer cards never leak sensitive fields (email, password, resetPasswordTokenHash)', async () => {
      const res = await makeRequest('/api/v1/discovery/developers');
      assert.equal(res.status, 200);
      res.body.data.forEach((dev) => {
        assert.equal(dev.password, undefined);
        assert.equal(dev.email, undefined);
        assert.equal(dev.resetPasswordTokenHash, undefined);
        assert.equal(dev.verificationToken, undefined);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION D: SCORING & RECOMMENDATIONS ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  describe('D. Scoring & Recommendations Engine', () => {
    test('GET /api/v1/discovery/recommendations/developers computes exact score: rating * 20 + min(projects * 5, 20)', async () => {
      const res = await makeRequest('/api/v1/discovery/recommendations/developers', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));

      res.body.data.forEach((rec) => {
        assert.ok(typeof rec.matchScore === 'number');
        assert.ok(rec.matchScore >= 0 && rec.matchScore <= 120);
        assert.ok(Array.isArray(rec.reasons) && rec.reasons.length > 0);

        // Verify mathematical formula
        const rating = rec.developer.rating || 5;
        const projects = rec.developer.completedProjectsCount || 0;
        const expectedScore = Math.round(rating * 20 + Math.min(projects * 5, 20));
        assert.equal(rec.matchScore, expectedScore, `Expected score ${expectedScore} for rating ${rating} and projects ${projects}`);
      });

      // Verify descending ordering of recommendation scores
      const scores = res.body.data.map((r) => r.matchScore);
      for (let i = 0; i < scores.length - 1; i++) {
        assert.ok(scores[i] >= scores[i + 1], 'Recommendations should be ordered by score descending');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION E: BOOKMARKS ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('E. Developer Bookmarking API', () => {
    test('POST /api/v1/bookmarks/developers/:id saves a developer bookmark and supports notes', async () => {
      const res = await makeRequest(`/api/v1/bookmarks/developers/${publicSeniorDev._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${searcherToken}` },
        body: { notes: 'Top candidate for upcoming backend scaling initiative' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.notes, 'Top candidate for upcoming backend scaling initiative');
    });

    test('POST /api/v1/bookmarks/developers/:id handles existing bookmark idempotently with 200', async () => {
      const res = await makeRequest(`/api/v1/bookmarks/developers/${publicSeniorDev._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('POST /api/v1/bookmarks/developers/:id rejects self-bookmarking with 400 Bad Request', async () => {
      const res = await makeRequest(`/api/v1/bookmarks/developers/${searcherUser._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /cannot bookmark yourself/i);
    });

    test('GET /api/v1/bookmarks/developers returns authenticated user bookmarked developers', async () => {
      const res = await makeRequest('/api/v1/bookmarks/developers', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      const hasSenior = res.body.data.some(
        (b) => String(b.developer?._id || b.developer) === String(publicSeniorDev._id)
      );
      assert.ok(hasSenior);
    });

    test('DELETE /api/v1/bookmarks/developers/:id removes bookmark successfully', async () => {
      const res = await makeRequest(`/api/v1/bookmarks/developers/${publicSeniorDev._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify deletion
      const checkRes = await makeRequest('/api/v1/bookmarks/developers', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      const stillThere = checkRes.body.data.some(
        (b) => String(b.developer?._id || b.developer) === String(publicSeniorDev._id)
      );
      assert.equal(stillThere, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION F: SAVED SEARCHES (CRUD & OWNERSHIP)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('F. Saved Searches API (CRUD & Ownership)', () => {
    let createdSearchId;

    test('POST /api/v1/discovery/saved-searches creates a new saved search preset', async () => {
      const res = await makeRequest('/api/v1/discovery/saved-searches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${searcherToken}` },
        body: {
          name: 'React Seniors in Austin',
          query: { skill: 'React', experienceLevel: 'senior', location: 'Austin' },
          type: 'developer',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'React Seniors in Austin');
      createdSearchId = res.body.data._id;
    });

    test('GET /api/v1/discovery/saved-searches retrieves the user saved searches', async () => {
      const res = await makeRequest('/api/v1/discovery/saved-searches?type=developer', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const match = res.body.data.find((s) => s._id === createdSearchId);
      assert.ok(match);
      assert.equal(match.name, 'React Seniors in Austin');
    });

    test('PATCH /api/v1/discovery/saved-searches/:id updates search name and query', async () => {
      const res = await makeRequest(`/api/v1/discovery/saved-searches/${createdSearchId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${searcherToken}` },
        body: {
          name: 'Renamed React Experts Search',
          query: { skill: 'React', minRating: 4.5 },
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Renamed React Experts Search');
    });

    test('PATCH /api/v1/discovery/saved-searches/:id rejects unauthorized update by non-owner with 403', async () => {
      const res = await makeRequest(`/api/v1/discovery/saved-searches/${createdSearchId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authenticatedOnlyDevToken}` },
        body: { name: 'Malicious Rename' },
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    test('DELETE /api/v1/discovery/saved-searches/:id rejects deletion by non-owner with 403', async () => {
      const res = await makeRequest(`/api/v1/discovery/saved-searches/${createdSearchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authenticatedOnlyDevToken}` },
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    test('DELETE /api/v1/discovery/saved-searches/:id removes saved search for owner', async () => {
      const res = await makeRequest(`/api/v1/discovery/saved-searches/${createdSearchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify removal
      const listRes = await makeRequest('/api/v1/discovery/saved-searches?type=developer', {
        headers: { Authorization: `Bearer ${searcherToken}` },
      });
      assert.ok(!listRes.body.data.some((s) => s._id === createdSearchId));
    });
  });
});

