import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { Application } from '../../src/models/Application.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { Conversation } from '../../src/models/Conversation.js';

dotenv.config();

describe('Project Creator Identity & Exclusive Team Chat Access Control Tests', () => {
  let server;
  let baseUrl;

  // Actors
  let clientUser;
  let clientToken;

  let developerUser;
  let developerToken;

  let outsiderUser;
  let outsiderToken;

  let testProject;
  let testApplication;

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

    // 1. Create Client (Project Owner)
    const clientRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alpha Founder',
        username: `client_${uniqueSuffix}`,
        email: `client_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'client',
      }),
    });
    const clientData = await clientRes.json();
    assert.strictEqual(clientRes.status, 201);
    clientUser = clientData.user;
    clientToken = clientData.token;

    // 2. Create Developer (Applicant)
    const devRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Beta Engineer',
        username: `dev_${uniqueSuffix}`,
        email: `dev_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
      }),
    });
    const devData = await devRes.json();
    assert.strictEqual(devRes.status, 201);
    developerUser = devData.user;
    developerToken = devData.token;

    // 3. Create Outsider (Neither owner nor accepted)
    const outRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Gamma Outsider',
        username: `outsider_${uniqueSuffix}`,
        email: `outsider_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
      }),
    });
    const outData = await outRes.json();
    assert.strictEqual(outRes.status, 201);
    outsiderUser = outData.user;
    outsiderToken = outData.token;

    // 4. Client posts a project
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        title: `AI Fintech Platform ${uniqueSuffix}`,
        description: 'Building modern real-time automated ledger with React and Node.js.',
        category: 'Web Development',
        projectType: 'freelance',
        budgetMin: 500,
        budgetMax: 2500,
        currency: 'USD',
        duration: '1-3 months',
        commitment: 'part_time',
        visibility: 'public',
        requiredSkills: ['React', 'Node.js', 'MongoDB'],
      }),
    });
    const projData = await projRes.json();
    assert.strictEqual(projRes.status, 201);
    testProject = projData.project || projData.data;
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await User.deleteMany({ email: new RegExp(uniqueSuffix, 'i') });
        if (testProject?._id) {
          await Project.deleteOne({ _id: testProject._id });
          await Application.deleteMany({ project: testProject._id });
          await ProjectMember.deleteMany({ project: testProject._id });
          await Conversation.deleteMany({ project: testProject._id });
        }
      }
    } catch {
      // ignore
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // 1. Verify Project Creator Role Identity
  test('1. GET /api/projects/:id populates owner role indicating Client / Founder vs Developer', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProject._id}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const proj = data.project || data.data;

    assert.ok(proj.owner);
    assert.strictEqual(proj.owner.name, 'Alpha Founder');
    assert.strictEqual(proj.owner.role, 'client');
  });

  // 2. Owner can access project conversation
  test('2. Project Owner can create and access the project team chat', async () => {
    const res = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.conversation);
    assert.strictEqual(String(data.conversation.project._id || data.conversation.project), String(testProject._id));
  });

  // 3. Outsider is strictly rejected with 403 Forbidden
  test('3. Non-member outsider is strictly rejected (403) from accessing project conversation', async () => {
    const res = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });

    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  // 4. Outsider conversation list excludes the private project chat
  test('4. GET /api/chats/conversations completely excludes project chat from outsider view', async () => {
    const res = await fetch(`${baseUrl}/api/chats/conversations`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });

    assert.strictEqual(res.status, 200);
    const list = await res.json();
    const hasProjectChat = list.some(
      (c) => String(c.project?._id || c.project) === String(testProject._id)
    );
    assert.strictEqual(hasProjectChat, false);
  });

  // 5. Developer applies -> Still pending -> Still cannot access chat
  test('5. Applicant with PENDING status cannot access project team chat (403)', async () => {
    // Developer applies
    const appRes = await fetch(`${baseUrl}/api/projects/${testProject._id}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${developerToken}`,
      },
      body: JSON.stringify({
        coverLetter: 'I am an expert fullstack dev and ready to build this ledger.',
        proposedRate: 60,
      }),
    });

    const appData = await appRes.json();
    assert.strictEqual(appRes.status, 201);
    testApplication = appData.application || appData.data;

    // Try to access chat before being accepted
    const chatRes = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });

    assert.strictEqual(chatRes.status, 403);
  });

  // 6. Owner ACCEPTS application -> Developer gains full access to chat
  test('6. When proposal is ACCEPTED, developer gains immediate access to project team chat', async () => {
    // Client accepts proposal
    const acceptRes = await fetch(`${baseUrl}/api/applications/${testApplication._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        status: 'accepted',
        decisionReason: 'Excellent portfolio and competitive rate.',
      }),
    });

    assert.strictEqual(acceptRes.status, 200);

    // Developer accesses chat now
    const chatRes = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });

    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert.strictEqual(chatData.success, true);
    assert.ok(chatData.conversation);
  });

  // 7. Developer sends message in team chat
  test('7. Accepted developer sends a message in the private project team chat', async () => {
    const convRes = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });
    const convData = await convRes.json();
    const convId = convData.conversation._id;

    const msgRes = await fetch(`${baseUrl}/api/chats/conversations/${convId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${developerToken}`,
      },
      body: JSON.stringify({
        content: 'Hello team! Excited to work on this project.',
      }),
    });

    assert.strictEqual(msgRes.status, 201);
    const msgData = await msgRes.json();
    assert.strictEqual(msgData.message.content, 'Hello team! Excited to work on this project.');
  });

  // 8. Outsider still cannot read messages from this conversation
  test('8. Outsider cannot read messages from the private project conversation (403)', async () => {
    const conv = await Conversation.findOne({ project: testProject._id });
    assert.ok(conv);

    const msgRes = await fetch(`${baseUrl}/api/chats/conversations/${conv._id}/messages`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });

    assert.strictEqual(msgRes.status, 403);
  });

  // 9. When member is removed, access is immediately revoked
  test('9. When member is removed from project, chat access is immediately terminated', async () => {
    // Client removes developer from project
    const removeRes = await fetch(`${baseUrl}/api/projects/${testProject._id}/members/${developerUser._id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({ reason: 'Sprint scope completed' }),
    });

    assert.strictEqual(removeRes.status, 200);

    // Developer tries to access chat again
    const chatRes = await fetch(`${baseUrl}/api/chats/project/${testProject._id}`, {
      headers: { Authorization: `Bearer ${developerToken}` },
    });

    assert.strictEqual(chatRes.status, 403);
  });
});
