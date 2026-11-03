import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../../src/app.js';
import { Post } from '../../src/models/Post.js';
import { Project } from '../../src/models/Project.js';

dotenv.config();

describe('Idea Pitching, Community Review, and Project Conversion Integration Tests', () => {
  let server;
  let baseUrl;
  let authorUser, authorToken;
  let reviewerUser, reviewerToken;

  const uniqueSuffix = Date.now().toString().slice(-6);
  let createdIdeaPostId;
  let createdProjectId;

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

    // 1. Create Idea Author (Client or Developer)
    const authorRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Idea Creator ${uniqueSuffix}`,
        username: `ideacreator_${uniqueSuffix}`,
        email: `idea_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
      }),
    });
    const authorData = await authorRes.json();
    assert.strictEqual(authorRes.status, 201);
    authorUser = authorData.user;
    authorToken = authorData.token;

    // 2. Create Community Reviewer
    const reviewerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Reviewer ${uniqueSuffix}`,
        username: `reviewer_${uniqueSuffix}`,
        email: `rev_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        role: 'developer',
      }),
    });
    const reviewerData = await reviewerRes.json();
    assert.strictEqual(reviewerRes.status, 201);
    reviewerUser = reviewerData.user;
    reviewerToken = reviewerData.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. User can pitch a new Project Idea with ideaDetails', async () => {
    const res = await fetch(`${baseUrl}/api/v1/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        postType: 'idea',
        title: `AI Resume & Portfolio Analyzer ${uniqueSuffix}`,
        content: 'An intelligent platform that reviews developer portfolios and suggests improvements to land remote roles.',
        tags: ['ai', 'resume', 'react', 'nodejs'],
        ideaDetails: {
          targetAudience: 'Job-seeking developers and junior engineers',
          estimatedBudget: '$500 - $1,500',
          rolesNeeded: ['React Frontend', 'FastAPI / Python Engineer', 'UI/UX Designer'],
          feedbackQuestions: ['Would you use this before applying to jobs?', 'Is $500 reasonable for MVP?'],
          status: 'seeking_feedback',
        },
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.postType, 'idea');
    assert.equal(body.data.title, `AI Resume & Portfolio Analyzer ${uniqueSuffix}`);
    assert.ok(body.data.ideaDetails);
    assert.equal(body.data.ideaDetails.targetAudience, 'Job-seeking developers and junior engineers');
    assert.equal(body.data.ideaDetails.rolesNeeded.length, 3);
    assert.equal(body.data.convertedToProject, null);

    createdIdeaPostId = body.data._id;
  });

  test('2. Community reviewer can comment / review the idea post', async () => {
    const res = await fetch(`${baseUrl}/api/v1/community/posts/${createdIdeaPostId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerToken}`,
      },
      body: JSON.stringify({
        content: 'Awesome idea! I would recommend using LangChain and a clean Tailwind dashboard. I would love to help build the frontend!',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.equal(body.data.content, 'Awesome idea! I would recommend using LangChain and a clean Tailwind dashboard. I would love to help build the frontend!');
  });

  test('3. Launching project from the idea links both project and origin idea post', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        title: `AI Resume & Portfolio Analyzer ${uniqueSuffix}`,
        description: 'Building the MVP for AI Resume Analyzer based on community pitch and feedback.',
        category: 'AI & ML',
        projectType: 'collaboration',
        teamSize: 3,
        budgetMin: 500,
        budgetMax: 1500,
        currency: 'USD',
        requiredSkills: ['React', 'Python', 'TailwindCSS'],
        ideaPostId: createdIdeaPostId,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.equal(body.data.originIdeaPost?._id?.toString() || body.data.originIdeaPost?.toString(), createdIdeaPostId);
    createdProjectId = body.data._id;

    // Verify the original idea post now reflects the launched project
    const postRes = await fetch(`${baseUrl}/api/v1/community/posts/${createdIdeaPostId}`);
    assert.equal(postRes.status, 200);
    const postBody = await postRes.json();
    assert.equal(postBody.success, true);
    assert.ok(postBody.data.convertedToProject);
    assert.equal(
      postBody.data.convertedToProject._id?.toString() || postBody.data.convertedToProject.toString(),
      createdProjectId
    );
  });

  test('4. POST /api/v1/community/posts/:id/convert-to-project links idea and project explicitly', async () => {
    // Create another idea post
    const idea2Res = await fetch(`${baseUrl}/api/v1/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        postType: 'idea',
        title: `Decentralized Freelance Escrow ${uniqueSuffix}`,
        content: 'Smart contracts for milestone escrows without 20% platform cut.',
        tags: ['blockchain', 'web3', 'freelance'],
      }),
    });
    const idea2Data = await idea2Res.json();
    assert.equal(idea2Res.status, 201);
    const idea2Id = idea2Data.data._id;

    // Convert via dedicated endpoint
    const convertRes = await fetch(`${baseUrl}/api/v1/community/posts/${idea2Id}/convert-to-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        projectId: createdProjectId,
      }),
    });

    assert.equal(convertRes.status, 200);
    const convertData = await convertRes.json();
    assert.equal(convertData.success, true);
    assert.equal(
      convertData.data.convertedToProject?._id?.toString() || convertData.data.convertedToProject?.toString(),
      createdProjectId
    );
  });
});

