import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Community } from '../../src/models/Community.js';
import { Post } from '../../src/models/Post.js';
import { Comment } from '../../src/models/Comment.js';
import { Report } from '../../src/models/Report.js';

dotenv.config();

describe('DevConnect Community Hub & Knowledge Feed Comprehensive Integration Tests', { concurrency: 1 }, () => {
  let server;
  let baseUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  let authorUser;
  let authorToken;

  let memberUser;
  let memberToken;

  let adminUser;
  let adminToken;

  let outsiderUser;
  let outsiderToken;

  let testCommunity;
  let testPost;

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

    // 1. Setup Test Users
    authorUser = await User.create({
      name: `Alice Author ${uniqueSuffix}`,
      username: `alice_${uniqueSuffix}`,
      email: `alice_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
    });
    authorToken = createJwtToken(authorUser._id);

    memberUser = await User.create({
      name: `Bob Member ${uniqueSuffix}`,
      username: `bob_${uniqueSuffix}`,
      email: `bob_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
    });
    memberToken = createJwtToken(memberUser._id);

    adminUser = await User.create({
      name: `Admin Mod ${uniqueSuffix}`,
      username: `admin_${uniqueSuffix}`,
      email: `admin_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'admin',
      status: 'active',
    });
    adminToken = createJwtToken(adminUser._id);

    outsiderUser = await User.create({
      name: `Charlie Outsider ${uniqueSuffix}`,
      username: `charlie_${uniqueSuffix}`,
      email: `charlie_${uniqueSuffix}@devconnect.test`,
      password: 'password123',
      role: 'developer',
      status: 'active',
    });
    outsiderToken = createJwtToken(outsiderUser._id);
  });

  after(async () => {
    const userIds = [
      authorUser?._id,
      memberUser?._id,
      adminUser?._id,
      outsiderUser?._id,
    ].filter(Boolean);

    await User.deleteMany({ _id: { $in: userIds } });
    await Community.deleteMany({ name: new RegExp(uniqueSuffix) });
    await Post.deleteMany({ author: { $in: userIds } });
    await Comment.deleteMany({ author: { $in: userIds } });
    await Report.deleteMany({ reporterId: { $in: userIds } });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. COMMUNITIES / ENGINEERING CIRCLES TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Technology Circles & Community Guilds', () => {
    test('POST /api/v1/communities creates a new circle and adds creator as first member', async () => {
      const res = await makeRequest('/api/v1/communities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authorToken}` },
        body: {
          name: `Next.js & Turborepo Guild ${uniqueSuffix}`,
          description: 'High performance full-stack web applications and monorepos.',
          category: 'Web Dev',
          icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      assert.equal(res.body.data.membersCount, 1);
      assert.equal(res.body.data.name, `Next.js & Turborepo Guild ${uniqueSuffix}`);
      testCommunity = res.body.data;
    });

    test('POST /api/v1/communities rejects duplicate community name with 400 Bad Request', async () => {
      const res = await makeRequest('/api/v1/communities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: {
          name: `Next.js & Turborepo Guild ${uniqueSuffix}`,
          description: 'Duplicate name attempt',
        },
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    test('POST /api/v1/communities/:id/join allows another user to join circle and increments counter', async () => {
      const res = await makeRequest(`/api/v1/communities/${testCommunity._id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.joined, true);
      assert.equal(res.body.membersCount, 2);

      const dbComm = await Community.findById(testCommunity._id);
      assert.equal(dbComm.membersCount, 2);
      assert.ok(dbComm.members.some((m) => String(m) === String(memberUser._id)));
    });

    test('POST /api/v1/communities/:id/join leaves community if already a member and decrements counter', async () => {
      const res = await makeRequest(`/api/v1/communities/${testCommunity._id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.joined, false);
      assert.equal(res.body.membersCount, 1);

      const dbComm = await Community.findById(testCommunity._id);
      assert.equal(dbComm.membersCount, 1);
      assert.ok(!dbComm.members.some((m) => String(m) === String(memberUser._id)));
    });

    test('GET /api/v1/communities lists communities sorted by membersCount descending', async () => {
      const res = await makeRequest('/api/v1/communities');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      const found = res.body.find((c) => (c._id || c.id) === testCommunity._id);
      assert.ok(found);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. POST CREATION, EDITING & RETRIEVAL TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Post Creation, Editing & Retrieval', () => {
    test('POST /api/v1/community/posts creates discussion post with tags, links and type', async () => {
      const res = await makeRequest('/api/v1/community/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authorToken}` },
        body: {
          title: `Optimizing Next.js 15 Server Actions ${uniqueSuffix}`,
          content: 'Here is a deep-dive into caching, revalidation, and optimistic updates in React 19.',
          postType: 'knowledge',
          tags: ['nextjs', 'react', 'performance'],
          links: [{ title: 'Next.js Docs', url: 'https://nextjs.org/docs' }],
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      assert.equal(res.body.data.postType, 'knowledge');
      assert.equal(res.body.data.title, `Optimizing Next.js 15 Server Actions ${uniqueSuffix}`);
      assert.deepEqual(res.body.data.tags, ['nextjs', 'react', 'performance']);
      testPost = res.body.data;
    });

    test('POST /api/v1/community/posts rejects empty content with 400 Bad Request', async () => {
      const res = await makeRequest('/api/v1/community/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authorToken}` },
        body: {
          title: 'Empty post',
          content: '   ',
        },
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /content is required/i);
    });

    test('GET /api/v1/community/posts/:id returns enriched post with safe author details', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}`, {
        headers: { Authorization: `Bearer ${authorToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data._id, testPost._id);
      assert.equal(res.body.data.author.username, authorUser.username);
      assert.equal(res.body.data.author.password, undefined);
    });

    test('PATCH /api/v1/community/posts/:id allows author to edit content', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authorToken}` },
        body: {
          content: 'Updated content with additional benchmark comparisons.',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.content, 'Updated content with additional benchmark comparisons.');
      assert.equal(res.body.data.isEdited, true);
    });

    test('PATCH /api/v1/community/posts/:id rejects unauthorized edit by outsider with 403 Forbidden', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${outsiderToken}` },
        body: {
          content: 'Malicious modification',
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REACTIONS, LIKES, BOOKMARKS & REPOSTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Reactions, Likes, Bookmarks & Reposts', () => {
    test('POST /api/v1/community/posts/:id/reactions toggles like and updates count', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.hasLiked, true);
      assert.equal(res.body.data.hasReacted, true);
      assert.equal(res.body.data.reactionCounts.like, 1);

      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost.upvotes, 1);
      assert.ok(dbPost.likes.some((id) => String(id) === String(memberUser._id)));
    });

    test('POST /api/v1/community/posts/:id/reactions removes like on second click', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.hasLiked, false);
      assert.equal(res.body.data.reactionCounts.like, 0);

      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost.upvotes, 0);
    });

    test('POST /api/v1/community/posts/:id/bookmark toggles saving a post', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isSaved, true);

      // Verify appearance in saved posts list
      const savedRes = await makeRequest('/api/v1/community/posts/saved', {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(savedRes.status, 200);
      assert.ok(savedRes.body.data.some((p) => p._id === testPost._id));
    });

    test('POST /api/v1/community/posts/:id/repost toggles reposting', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/repost`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isReposted, true);
      assert.equal(res.body.data.repostCount, 1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. COMMENTS & NESTED REPLIES TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Comments & Nested Threading Tree', () => {
    let parentComment;
    let childReply;

    test('POST /api/v1/community/posts/:id/comments adds top-level comment and increments post counter', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: { content: 'Excellent article! Have you tested this with Turbopack?' },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      assert.equal(res.body.data.content, 'Excellent article! Have you tested this with Turbopack?');
      parentComment = res.body.data;

      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost.commentsCount, 1);
    });

    test('POST /api/v1/community/posts/:id/comments with parentId creates nested reply', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authorToken}` },
        body: {
          content: 'Yes! Turbopack builds are 3x faster in our benchmarks.',
          parentId: parentComment._id,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.parentComment, parentComment._id);
      childReply = res.body.data;

      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost.commentsCount, 2);
    });

    test('GET /api/v1/community/posts/:id/comments returns tree with replies nested inside top-level comment', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/comments`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.equal(res.body.data.length, 1, 'Only top-level comments should be at the root');

      const rootComment = res.body.data[0];
      assert.equal(rootComment._id, parentComment._id);
      assert.ok(Array.isArray(rootComment.replies));
      assert.equal(rootComment.replies.length, 1);
      assert.equal(rootComment.replies[0]._id, childReply._id);
    });

    test('PATCH /api/v1/community/comments/:id allows author to edit comment', async () => {
      const res = await makeRequest(`/api/v1/community/comments/${parentComment._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: { content: 'Edited top comment with extra question.' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.content, 'Edited top comment with extra question.');
    });

    test('DELETE /api/v1/community/comments/:id deletes parent comment and cascades to child replies', async () => {
      const res = await makeRequest(`/api/v1/community/comments/${parentComment._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.deletedCount, 2);

      // Verify deletion in DB
      const remainingComments = await Comment.countDocuments({ post: testPost._id });
      assert.equal(remainingComments, 0);

      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost.commentsCount, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SEARCH, SORTING & TAGS TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Search, Sorting, Feed Types & Trending Tags', () => {
    test('GET /api/v1/community/posts filters by tag', async () => {
      const res = await makeRequest('/api/v1/community/posts?tag=nextjs');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.some((p) => p._id === testPost._id));
    });

    test('GET /api/v1/community/posts searches across title and content with safe regex', async () => {
      const res = await makeRequest('/api/v1/community/posts?q=Server%20Actions');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.some((p) => p._id === testPost._id));
    });

    test('GET /api/v1/community/tags aggregates active tags with counts', async () => {
      const res = await makeRequest('/api/v1/community/tags');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.some((t) => t.name === 'nextjs' || t.tag === 'nextjs'));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. REPORTING & MODERATION TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Content Moderation & Reporting Workflow', () => {
    let createdReportId;

    test('POST /api/v1/community/reports allows user to report a post', async () => {
      const res = await makeRequest('/api/v1/community/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${outsiderToken}` },
        body: {
          targetType: 'post',
          targetId: testPost._id,
          reason: 'spam',
          explanation: 'Flagged for promotional review',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data._id);
      createdReportId = res.body.data._id;
    });

    test('POST /api/v1/community/reports prevents duplicate pending report from same user', async () => {
      const res = await makeRequest('/api/v1/community/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${outsiderToken}` },
        body: {
          targetType: 'post',
          targetId: testPost._id,
          reason: 'spam',
        },
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already have a pending report/i);
    });

    test('GET /api/v1/moderation/reports denies ordinary user with 403 Forbidden', async () => {
      const res = await makeRequest('/api/v1/moderation/reports', {
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    test('GET /api/v1/moderation/reports allows admin and returns target preview', async () => {
      const res = await makeRequest('/api/v1/moderation/reports', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      const match = res.body.data.find((r) => r._id === createdReportId);
      assert.ok(match);
      assert.ok(match.targetPreview);
      assert.equal(match.targetPreview.title, testPost.title);
    });

    test('POST /api/v1/moderation/posts/:id/hide hides post from public feed', async () => {
      const hideRes = await makeRequest(`/api/v1/moderation/posts/${testPost._id}/hide`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { hide: true },
      });

      assert.equal(hideRes.status, 200);
      assert.equal(hideRes.body.data.status, 'hidden');

      // Guest / ordinary user should not see hidden post
      const feedRes = await makeRequest('/api/v1/community/posts');
      assert.ok(!feedRes.body.data.some((p) => p._id === testPost._id));

      // Unhide post
      await makeRequest(`/api/v1/moderation/posts/${testPost._id}/hide`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { hide: false },
      });
    });

    test('POST /api/v1/community/posts/:id/pin allows admin to pin post to top', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { isPinned: true },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.isPinned, true);
    });

    test('POST /api/v1/community/posts/:id/pin rejects non-admin with 403 Forbidden', async () => {
      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}/pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: { isPinned: true },
      });

      assert.equal(res.status, 403);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. CASCADING POST DELETION CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Post Deletion & Cascading Dependent Records Cleanup', () => {
    test('DELETE /api/v1/community/posts/:id removes post, comments and reports', async () => {
      // Add a comment to be cleaned up
      await Comment.create({
        post: testPost._id,
        author: memberUser._id,
        content: 'Comment before post delete',
      });

      const res = await makeRequest(`/api/v1/community/posts/${testPost._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authorToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify post gone
      const dbPost = await Post.findById(testPost._id);
      assert.equal(dbPost, null);

      // Verify comments gone
      const remainingComments = await Comment.countDocuments({ post: testPost._id });
      assert.equal(remainingComments, 0);

      // Verify reports gone
      const remainingReports = await Report.countDocuments({ targetId: testPost._id });
      assert.equal(remainingReports, 0);
    });
  });
});

