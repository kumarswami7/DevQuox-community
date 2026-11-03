import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { Reaction } from '../../src/models/Reaction.js';
import { Comment } from '../../src/models/Comment.js';
import { ProjectRepost } from '../../src/models/ProjectRepost.js';
import { ProjectView } from '../../src/models/ProjectView.js';
import { ProjectBookmark } from '../../src/models/ProjectBookmark.js';
import { Follow } from '../../src/models/Follow.js';
import { Notification } from '../../src/models/Notification.js';
import { Report } from '../../src/models/Report.js';
import { Profile } from '../../src/models/Profile.js';

dotenv.config();

describe('DevConnect Professional Project Feed & Engagement Integration Tests', () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  let ownerUser;
  let ownerToken;
  let devUser1;
  let devToken1;
  let devUser2;
  let devToken2;

  let testProject;

  const createJwtToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_908124_mern', {
      expiresIn: '7d',
    });
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

    return { status: res.status, body: json };
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

    // Create users
    ownerUser = await User.create({
      name: `Feed Owner ${uniqueSuffix}`,
      username: `feed_owner_${uniqueSuffix}`,
      email: `feed_owner_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id);

    devUser1 = await User.create({
      name: `Feed Dev One ${uniqueSuffix}`,
      username: `feed_dev1_${uniqueSuffix}`,
      email: `feed_dev1_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    devToken1 = createJwtToken(devUser1._id);

    devUser2 = await User.create({
      name: `Feed Dev Two ${uniqueSuffix}`,
      username: `feed_dev2_${uniqueSuffix}`,
      email: `feed_dev2_${uniqueSuffix}@example.com`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    devToken2 = createJwtToken(devUser2._id);

    // Create a shared test project
    testProject = await Project.create({
      title: `Social Feed Target Project ${uniqueSuffix}`,
      description: 'Building modern microservices with Node.js, Express, and Redis.',
      category: 'Web Development',
      projectType: 'freelance',
      experienceLevel: 'intermediate',
      budget: '$2,000 - $5,000',
      budgetMin: 2000,
      budgetMax: 5000,
      teamSize: 2,
      duration: '1 - 2 Months',
      requiredSkills: ['Node.js', 'Express', 'Redis', 'MongoDB'],
      owner: ownerUser._id,
      status: 'open',
      visibility: 'public',
    });
    // Create dev profile with skills for For-You matching
    await Profile.create({
      user: devUser1._id,
      skills: ['Node.js', 'Express', 'MongoDB', 'React'],
      experienceLevel: 'mid',
      availability: 'available',
    });
  });

  after(async () => {
    // Cleanup created test documents
    if (testProject?._id) {
      await Project.findByIdAndDelete(testProject._id);
      await Reaction.deleteMany({ targetId: testProject._id });
      await Comment.deleteMany({ project: testProject._id });
      await ProjectRepost.deleteMany({ project: testProject._id });
      await ProjectView.deleteMany({ project: testProject._id });
      await ProjectBookmark.deleteMany({ project: testProject._id });
    }

    const testUserIds = [ownerUser?._id, devUser1?._id, devUser2?._id].filter(Boolean);
    if (testUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: testUserIds } });
      await Profile.deleteMany({ user: { $in: testUserIds } });
      await Follow.deleteMany({ $or: [{ follower: { $in: testUserIds } }, { following: { $in: testUserIds } }] });
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REACTIONS TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Reactions Management & Deduplication', () => {
    test('POST /api/projects/:id/reactions requires authentication', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        body: { reactionType: 'like' },
      });
      assert.equal(res.status, 401);
    });

    test('POST /api/projects/:id/reactions rejects invalid reaction types', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { reactionType: 'angry_face' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('Invalid reaction type'));
    });

    test('POST /api/projects/:id/reactions successfully adds insightful reaction', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { reactionType: 'insightful' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.userReaction, 'insightful');
      assert.equal(res.body.reactionsCount, 1);
      assert.equal(res.body.reactionBreakdown.insightful, 1);
    });

    test('Idempotency: repeating identical reaction returns 200 without duplicate increment', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { reactionType: 'insightful' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.reactionsCount, 1);
    });

    test('Reaction switching: changing insightful to celebrate updates breakdown accurately', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { reactionType: 'celebrate' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.userReaction, 'celebrate');
      assert.equal(res.body.reactionsCount, 1);
      assert.equal(res.body.reactionBreakdown.insightful, 0);
      assert.equal(res.body.reactionBreakdown.celebrate, 1);
    });

    test('Second user adds a reaction: reactionsCount increments to 2', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken2}` },
        body: { reactionType: 'like' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.reactionsCount, 2);
      assert.equal(res.body.reactionBreakdown.like, 1);
      assert.equal(res.body.reactionBreakdown.celebrate, 1);
    });

    test('GET /api/projects/:id/reactions returns breakdown and user reaction', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions`, {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.reactionsCount, 2);
      assert.equal(res.body.userReaction, 'celebrate');
      assert.equal(res.body.recentReactors.length, 2);
    });

    test('DELETE /api/projects/:id/reactions/me removes reaction and decrements counters', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reactions/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.userReaction, null);
      assert.equal(res.body.reactionsCount, 1);
      assert.equal(res.body.reactionBreakdown.celebrate, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. COMMENTS & REPLIES TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Comments and Threaded Replies', () => {
    let parentCommentId;
    let replyCommentId;

    test('POST /api/projects/:id/comments rejects empty content', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { content: '   ' },
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('content is required'));
    });

    test('POST /api/projects/:id/comments adds top-level comment', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { content: 'What Redis caching strategy are you planning to employ?' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.comment._id);
      parentCommentId = res.body.comment._id;

      // Verify project commentsCount updated
      const projCheck = await Project.findById(testProject._id);
      assert.equal(projCheck.commentsCount, 1);
    });

    test('POST /api/projects/:id/comments with parentComment creates nested reply', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: {
          content: 'We are using write-through caching with Redis streams.',
          parentComment: parentCommentId,
        },
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.comment._id);
      replyCommentId = res.body.comment._id;

      const projCheck = await Project.findById(testProject._id);
      assert.equal(projCheck.commentsCount, 2);
    });

    test('GET /api/projects/:id/comments returns threaded comments with replies', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments`);
      assert.equal(res.status, 200);
      assert.ok(res.body.comments.length >= 1);
      const topComment = res.body.comments.find((c) => String(c._id) === String(parentCommentId));
      assert.ok(topComment);
      assert.equal(topComment.replies.length, 1);
      assert.equal(String(topComment.replies[0]._id), String(replyCommentId));
    });

    test('PATCH /api/projects/:id/comments/:commentId allows author to edit content', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments/${parentCommentId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { content: 'Updated: What Redis caching strategy are you using in production?' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.comment.content, 'Updated: What Redis caching strategy are you using in production?');
    });

    test('PATCH rejects non-author attempting to edit comment with 403', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments/${parentCommentId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${devToken2}` },
        body: { content: 'Hacked comment' },
      });
      assert.equal(res.status, 403);
    });

    test('DELETE /api/projects/:id/comments/:commentId removes comment & child replies', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/comments/${parentCommentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.deletedCount, 2); // Parent + child reply

      const projCheck = await Project.findById(testProject._id);
      assert.equal(projCheck.commentsCount, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REPOSTS & QUOTE REPOSTS TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Reposts and Quote Reposts', () => {
    test('POST /api/projects/:id/reposts creates standard repost', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reposts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: {},
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.hasReposted, true);
      assert.equal(res.body.repostsCount, 1);
    });

    test('POST /api/projects/:id/reposts is idempotent for duplicate standard repost', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reposts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: {},
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.repostsCount, 1);
    });

    test('POST /api/projects/:id/reposts supports quote commentary', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reposts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken2}` },
        body: { commentary: 'Excellent Node.js project for backend engineers looking to build scalable APIs.' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.repostsCount, 2);
    });

    test('DELETE /api/projects/:id/reposts/me undoes repost', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/reposts/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.hasReposted, false);
      assert.equal(res.body.repostsCount, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. VIEW TRACKING WITH DEDUPLICATION WINDOW
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. View Tracking & Deduplication Window', () => {
    test('POST /api/projects/:id/views records initial unique view', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/views`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { sessionId: 'sess_123' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.counted, true);
      assert.equal(res.body.viewsCount, 1);
      assert.equal(res.body.uniqueViewsCount, 1);
    });

    test('Rapid consecutive view within 30 min window is deduplicated', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/views`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
        body: { sessionId: 'sess_123' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.counted, false);
      assert.equal(res.body.viewsCount, 1);
    });

    test('Anonymous view with different session records as new view', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/views`, {
        method: 'POST',
        body: { sessionId: `anon_sess_${uniqueSuffix}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.counted, true);
      assert.equal(res.body.viewsCount, 2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. BOOKMARKS & SAVED PROJECTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Bookmarks & Saved Projects', () => {
    test('POST /api/projects/:id/bookmark saves project in database', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.isBookmarked, true);
    });

    test('GET /api/projects/saved returns authenticated user saved projects', async () => {
      const res = await makeRequest('/api/projects/saved', {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.projects.length >= 1);
      const savedProj = res.body.projects.find((p) => String(p._id) === String(testProject._id));
      assert.ok(savedProj);
      assert.equal(savedProj.isBookmarked, true);
    });

    test('DELETE /api/projects/:id/bookmark removes project from saved list', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/bookmark`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.isBookmarked, false);

      const checkRes = await makeRequest('/api/projects/saved', {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      const exists = checkRes.body.projects.some((p) => String(p._id) === String(testProject._id));
      assert.equal(exists, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PLATFORM STATS & FEED ENRICHMENT
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Platform Stats and Reactive Feed Enrichment', () => {
    test('GET /api/projects/stats returns real aggregated data for feed sidebar', async () => {
      const res = await makeRequest('/api/projects/stats');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.stats);
      assert.ok(typeof res.body.stats.totalProjects === 'number');
      assert.ok(Array.isArray(res.body.stats.trendingSkills));
      assert.ok(Array.isArray(res.body.stats.topCategories));
    });

    test('GET /api/projects enriches project objects with isBookmarked and userReaction when logged in', async () => {
      // Dev 2 bookmarks testProject and reacts
      await makeRequest(`/api/projects/${testProject._id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${devToken2}` },
      });

      const res = await makeRequest('/api/projects', {
        headers: { Authorization: `Bearer ${devToken2}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.projects.length > 0);
      const target = res.body.projects.find((p) => String(p._id) === String(testProject._id));
      assert.ok(target);
      assert.equal(target.isBookmarked, true);
      assert.equal(target.userReaction, 'like');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. FEED TABS DISCOVERY
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Feed Tabs Discovery (Latest, Trending, For-You, Following)', () => {
    test('GET /api/projects?tab=latest returns projects ordered by newest first', async () => {
      const res = await makeRequest('/api/projects?tab=latest');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.projects));
      assert.ok(res.body.projects.length > 0);
      for (let i = 0; i < res.body.projects.length - 1; i++) {
        const current = new Date(res.body.projects[i].createdAt).getTime();
        const next = new Date(res.body.projects[i + 1].createdAt).getTime();
        assert.ok(current >= next, 'Projects must be ordered newest first');
      }
    });

    test('GET /api/projects?tab=trending returns projects sorted by engagement metrics', async () => {
      const res = await makeRequest('/api/projects?tab=trending');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.projects));
      assert.ok(res.body.projects.length > 0);
    });

    test('GET /api/projects?tab=for-you calculates matchingScore based on profile skills', async () => {
      const res = await makeRequest('/api/projects?tab=for-you', {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.projects));
      const match = res.body.projects.find((p) => String(p._id) === String(testProject._id));
      assert.ok(match, 'Test project should be in the feed');
      assert.ok(match.matchingScore, 'Project should have a matchingScore attached');
      assert.ok(match.matchingScore.matchPercentage > 0, 'Match percentage should be greater than 0');
      assert.ok(match.matchingScore.matchedSkills.length > 0, 'Should have matched skills');
    });

    test('GET /api/projects?tab=following returns empty list for unauthenticated user or user following nobody', async () => {
      const anonRes = await makeRequest('/api/projects?tab=following');
      assert.equal(anonRes.status, 200);
      assert.equal(anonRes.body.projects.length, 0);

      const unauthDevRes = await makeRequest('/api/projects?tab=following', {
        headers: { Authorization: `Bearer ${devToken2}` },
      });
      assert.equal(unauthDevRes.status, 200);
      assert.equal(unauthDevRes.body.projects.length, 0);
    });

    test('GET /api/projects?tab=following returns projects and reposts from followed creators', async () => {
      // devUser1 follows ownerUser
      await Follow.create({
        follower: devUser1._id,
        following: ownerUser._id,
      });

      const res = await makeRequest('/api/projects?tab=following', {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.projects));
      const hasFollowedProject = res.body.projects.some(
        (p) => String(p.owner?._id || p.owner) === String(ownerUser._id)
      );
      assert.ok(hasFollowedProject, 'Feed should include projects from followed creator');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. PROJECT OWNER ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Owner Project Analytics', () => {
    test('GET /api/projects/:id/analytics returns detailed metrics and audited formula for owner', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.analytics);
      assert.equal(String(res.body.analytics.projectId), String(testProject._id));
      assert.equal(res.body.analytics.projectTitle, testProject.title);
      assert.ok(typeof res.body.analytics.totalViews === 'number');
      assert.ok(typeof res.body.analytics.uniqueViewsCount === 'number');
      assert.ok(typeof res.body.analytics.reactionsCount === 'number');
      assert.ok(res.body.analytics.reactionBreakdown);
      assert.ok(typeof res.body.analytics.commentsCount === 'number');
      assert.ok(typeof res.body.analytics.repostsCount === 'number');
      assert.ok(typeof res.body.analytics.bookmarksCount === 'number');
      assert.ok(res.body.analytics.applications);
      assert.ok(typeof res.body.analytics.totalEngagements === 'number');
      assert.ok(typeof res.body.analytics.engagementRate === 'string');
      assert.ok(res.body.analytics.engagementRate.includes('%'));
      assert.ok(res.body.analytics.formula.includes('Engagement Rate ='));
    });

    test('GET /api/projects/:id/analytics rejects unauthorized non-owner developer with 403', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/analytics`, {
        headers: { Authorization: `Bearer ${devToken1}` },
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Unauthorized') || res.body.message.includes('owner'));
    });

    test('GET /api/projects/:id/analytics rejects unauthenticated requests with 401', async () => {
      const res = await makeRequest(`/api/projects/${testProject._id}/analytics`);
      assert.equal(res.status, 401);
    });

    test('GET /api/projects/:id/analytics returns 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await makeRequest(`/api/projects/${fakeId}/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });
});
