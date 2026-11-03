import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../../src/app.js';
import { Post } from '../../src/models/Post.js';
import { Project } from '../../src/models/Project.js';

dotenv.config();

describe('Dashboard Summary API Integration Tests', () => {
  let server;
  let baseUrl;
  let devUser, devToken;
  let clientUser, clientToken;

  const uniqueSuffix = Date.now().toString().slice(-6);

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

    const devRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Dev Summary ${uniqueSuffix}`,
        username: `devsum_${uniqueSuffix}`,
        email: `devsum_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
      }),
    });
    const devData = await devRes.json();
    assert.strictEqual(devRes.status, 201);
    devUser = devData.user;
    devToken = devData.token;

    const clientRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Client Summary ${uniqueSuffix}`,
        username: `clientsum_${uniqueSuffix}`,
        email: `clientsum_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'client',
      }),
    });
    const clientData = await clientRes.json();
    assert.strictEqual(clientRes.status, 201);
    clientUser = clientData.user;
    clientToken = clientData.token;

    // Create a post to verify Post.find populates cleanly
    await Post.create({
      author: devUser._id,
      title: `First Community Post ${uniqueSuffix}`,
      content: 'This is test content for community discussions.',
      postType: 'discussion',
    });

    // Create a project
    await Project.create({
      title: `E-Commerce Platform ${uniqueSuffix}`,
      description: 'Building an online shopping platform with React and Node',
      owner: clientUser._id,
      category: 'Web Development',
      status: 'open',
      budget: '1500',
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/v1/dashboard/summary as guest returns 200 with summary data and recentPosts', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.equal(body.data.role, 'guest');
    assert.ok(Array.isArray(body.data.recentPosts));
    assert.ok(body.data.recentPosts.length >= 1);
  });

  test('GET /api/v1/dashboard/summary as developer returns 200 with stats and developer metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${devToken}`,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.role, 'developer');
    assert.ok(body.data.stats);
    assert.ok(Array.isArray(body.data.recentPosts));
  });

  test('GET /api/v1/dashboard/summary as client returns 200 with stats and client metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.role, 'client');
    assert.ok(body.data.stats);
    assert.ok(Array.isArray(body.data.recentPosts));
    assert.ok(body.data.stats.totalProjects >= 1);
  });
});
