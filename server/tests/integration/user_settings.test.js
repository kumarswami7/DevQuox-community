import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Profile } from '../../src/models/Profile.js';

dotenv.config();

describe('DevConnect Settings Module: Backend Integration & Persistence Tests', () => {
  let server;
  let baseUrl;
  let testUserId;
  let testToken;
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testEmail = `settings_user_${uniqueSuffix}@example.com`;
  const testUsername = `setuser_${uniqueSuffix}`;
  const testPassword = 'InitialPassword123!';

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

    // Register a fresh user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Settings Tester',
        username: testUsername,
        email: testEmail,
        password: testPassword,
        role: 'developer',
      }),
    });

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    testUserId = regData.user.id || regData.user._id;
    testToken = regData.token;
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await User.deleteMany({ email: new RegExp(uniqueSuffix, 'i') });
        if (testUserId) {
          await Profile.deleteMany({ user: testUserId });
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

  // 1. Fetch settings (GET /api/users/me)
  test('1. GET /api/users/me returns authenticated user settings profile', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, testEmail);
    assert.strictEqual(data.user.username, testUsername);
    assert.strictEqual(data.user.name, 'Settings Tester');
  });

  // 2. Update Profile & Identity
  test('2. PATCH /api/users/me updates profile info (headline, bio, location, timezone, languages)', async () => {
    const updates = {
      headline: 'Principal Fullstack Architect & MERN Specialist',
      bio: 'Over 8 years crafting scalable microservices and high-throughput real-time webapps.',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles (PST / PDT - UTC-8)',
      languages: ['English', 'Spanish', 'Telugu'],
    };

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(updates),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.headline, updates.headline);
    assert.strictEqual(data.user.bio, updates.bio);
    assert.strictEqual(data.user.location, updates.location);
    assert.strictEqual(data.user.timezone, updates.timezone);
    assert.deepStrictEqual(data.user.languages, updates.languages);
  });

  // 3. Update Work & Availability Preferences
  test('3. PATCH /api/users/me updates work availability, rates, skills, and project types', async () => {
    const workUpdates = {
      availability: 'busy',
      hourlyRate: 85,
      experienceLevel: 'senior',
      skills: ['React', 'Node.js', 'MongoDB', 'Socket.IO', 'TailwindCSS'],
      openTo: ['full_time', 'contract'],
      preferredProjectTypes: ['fixed_price', 'hourly'],
    };

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(workUpdates),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.availability, 'busy');
    assert.strictEqual(data.user.hourlyRate, 85);
    assert.strictEqual(data.user.experienceLevel, 'senior');
    assert.deepStrictEqual(data.user.skills, workUpdates.skills);
    assert.deepStrictEqual(data.user.openTo, workUpdates.openTo);
    assert.deepStrictEqual(data.user.preferredProjectTypes, workUpdates.preferredProjectTypes);
  });

  // 4. Update Social & Portfolio URLs
  test('4. PATCH /api/users/me updates social profiles (github, linkedin, website, twitter)', async () => {
    const socialUpdates = {
      githubUrl: 'https://github.com/settingstester',
      linkedinUrl: 'https://linkedin.com/in/settingstester',
      websiteUrl: 'https://settingstester.dev',
      twitterUrl: 'https://x.com/settingstester',
    };

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(socialUpdates),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.githubUrl, socialUpdates.githubUrl);
    assert.strictEqual(data.user.linkedinUrl, socialUpdates.linkedinUrl);
    assert.strictEqual(data.user.websiteUrl, socialUpdates.websiteUrl);
    assert.strictEqual(data.user.twitterUrl, socialUpdates.twitterUrl);
  });

  // 5. Update Notification Preferences
  test('5. PATCH /api/users/me persists notification preferences', async () => {
    const notifPrefs = {
      notificationPreferences: {
        emailAlerts: false,
        projectUpdates: true,
        directMessages: true,
        applicationAlerts: true,
        communityMentions: false,
        marketingNewsletter: true,
      },
    };

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(notifPrefs),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.notificationPreferences.emailAlerts, false);
    assert.strictEqual(data.user.notificationPreferences.marketingNewsletter, true);
    assert.strictEqual(data.user.notificationPreferences.directMessages, true);
  });

  // 6. Username validation
  test('6. PATCH /api/users/me rejects invalid username formatting with 400', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ username: 'invalid name with spaces!' }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  // 7. Security: Change Password
  test('7. PATCH /api/auth/change-password validates current password and updates to new password', async () => {
    // 7a. Fail with wrong current password
    const failRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewPassword123!',
      }),
    });

    assert.strictEqual(failRes.status, 401);

    // 7b. Succeed with correct current password
    const successRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        currentPassword: testPassword,
        newPassword: 'BrandNewPassword123!',
      }),
    });

    assert.strictEqual(successRes.status, 200);
    const successData = await successRes.json();
    assert.strictEqual(successData.success, true);

    // 7c. Verify login works with the updated password
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'BrandNewPassword123!',
      }),
    });

    assert.strictEqual(loginRes.status, 200);
  });

  // 8. Account Deactivation
  test('8. POST /api/users/me/deactivate sets account status to deactivated and blocks subsequent access', async () => {
    const res = await fetch(`${baseUrl}/api/users/me/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.status, 'deactivated');

    // Verify subsequent protected requests are rejected with 403
    const blockedRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert.strictEqual(blockedRes.status, 403);
  });

  // 9. Account Deletion with password check on an active user
  test('9. DELETE /api/users/me verifies password and removes user profile safely', async () => {
    // Register another active user
    const delEmail = `to_delete_${uniqueSuffix}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Delete Target',
        username: `del_${uniqueSuffix}`,
        email: delEmail,
        password: 'PasswordToDelete123!',
        role: 'developer',
      }),
    });

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    const delToken = regData.token;

    // Fail with wrong password
    const failRes = await fetch(`${baseUrl}/api/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${delToken}`,
      },
      body: JSON.stringify({ password: 'WrongPassword!' }),
    });
    assert.strictEqual(failRes.status, 401);

    // Succeed with correct password
    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${delToken}`,
      },
      body: JSON.stringify({ password: 'PasswordToDelete123!' }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });
});
