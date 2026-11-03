import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Profile } from '../../src/models/Profile.js';

dotenv.config();

describe('DevConnect Phase 2: Authentication & User Profiles API Tests', () => {
  let server;
  let baseUrl;
  let testUserId;
  let testAuthToken;
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testEmail = `dev_${uniqueSuffix}@example.com`;
  const testUsername = `user_${uniqueSuffix}`;
  const testPassword = 'Password123!';

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
  });

  after(async () => {
    // Cleanup test users created during test run
    try {
      if (mongoose.connection.readyState !== 0) {
        await User.deleteMany({ email: new RegExp(uniqueSuffix, 'i') });
        if (testUserId) {
          await Profile.deleteMany({ user: testUserId });
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

  // 1. REGISTRATION TESTS
  describe('1. Registration (/api/auth/register)', () => {
    test('Successful registration creates user and returns 201 with safe user and token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Engineer',
          username: testUsername,
          email: testEmail,
          password: testPassword,
          role: 'developer',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.token);
      assert.ok(data.user);
      assert.equal(data.user.email, testEmail);
      assert.equal(data.user.username, testUsername);
      assert.equal(data.user.role, 'developer');
      assert.equal(data.user.status, 'active');
      assert.equal(data.user.isEmailVerified, false);
      // Sensitive fields must never be exposed
      assert.equal(data.user.password, undefined);
      assert.equal(data.user.resetPasswordTokenHash, undefined);

      testUserId = data.user.id || data.user._id;
      testAuthToken = data.token;
    });

    test('Registration rejects duplicate email', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Email User',
          username: `diff_${uniqueSuffix}`,
          email: testEmail, // same email
          password: testPassword,
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /already exists/i);
    });

    test('Registration rejects duplicate username', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Username User',
          username: testUsername, // same username
          email: `diff_${uniqueSuffix}@example.com`,
          password: testPassword,
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /taken|already exists/i);
    });

    test('Registration rejects missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `empty_${uniqueSuffix}@example.com` }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Registration rejects weak password (less than 6 characters)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pass',
          username: `short_${uniqueSuffix}`,
          email: `short_${uniqueSuffix}@example.com`,
          password: '123',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /at least 6 characters/i);
    });

    test('Registration rejects attempted self-assignment of privileged roles (admin/moderator)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Privileged Attacker',
          username: `admin_${uniqueSuffix}`,
          email: `attacker_${uniqueSuffix}@example.com`,
          password: testPassword,
          role: 'admin',
        }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /administrative roles is not permitted/i);
    });
  });

  // 2. LOGIN AND AUTHENTICATION TESTS
  describe('2. Login and Authentication (/api/auth)', () => {
    test('Successful login using email identifier', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testEmail,
          password: testPassword,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.token);
      assert.equal(data.user.email, testEmail);
      assert.equal(data.user.password, undefined);

      // Verify HttpOnly cookie header was set
      const cookieHeader = res.headers.get('set-cookie');
      assert.ok(cookieHeader);
      assert.match(cookieHeader, /token=/);
      assert.match(cookieHeader, /HttpOnly/i);
    });

    test('Successful login using username identifier', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testUsername,
          password: testPassword,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.username, testUsername);
    });

    test('Login with incorrect password returns generic 401 error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testEmail,
          password: 'WrongPassword999!',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid email\/username or password/i);
    });

    test('Login with unknown identifier returns generic 401 error without revealing account existence', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: `nonexistent_${uniqueSuffix}@example.com`,
          password: testPassword,
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid email\/username or password/i);
    });

    test('Login with missing credentials returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('GET /api/auth/me returns current authenticated user with valid token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${testAuthToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, testEmail);
      assert.equal(data.user.username, testUsername);
      assert.equal(data.user.password, undefined);
    });

    test('GET /api/auth/me rejects request without token with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('GET /api/auth/me rejects request with invalid/tampered token with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer this-is-a-completely-tampered-token' },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('POST /api/auth/logout clears cookie and returns 200', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      const cookieHeader = res.headers.get('set-cookie') || (res.headers.getSetCookie ? res.headers.getSetCookie().join('; ') : '');
      assert.ok(cookieHeader);
      assert.match(cookieHeader, /token=/i);
    });
  });

  // 3. USER PROFILE TESTS
  describe('3. User Profile Management (/api/users)', () => {
    test('GET /api/users/me returns authenticated user details', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${testAuthToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, testEmail);
      assert.equal(data.user.password, undefined);
    });

    test('PATCH /api/users/me updates permitted fields (name, headline, bio, skills)', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAuthToken}`,
        },
        body: JSON.stringify({
          name: 'Updated Name',
          headline: 'Senior MERN Specialist',
          bio: 'Writing high-performance Node.js code',
          skills: ['Node.js', 'Express', 'React', 'MongoDB'],
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.name, 'Updated Name');
      assert.equal(data.user.headline, 'Senior MERN Specialist');
      assert.equal(data.user.bio, 'Writing high-performance Node.js code');
      assert.deepEqual(data.user.skills, ['Node.js', 'Express', 'React', 'MongoDB']);
    });

    test('PATCH /api/users/me rejects mass-assignment of privileged fields (role, status, isEmailVerified)', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAuthToken}`,
        },
        body: JSON.stringify({
          role: 'admin',
          status: 'suspended',
          isEmailVerified: true,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      // Role and status must remain developer and active
      assert.equal(data.user.role, 'developer');
      assert.equal(data.user.status, 'active');
      assert.equal(data.user.isEmailVerified, false);
    });

    test('GET /api/users/:username returns safe public profile without email or password', async () => {
      const res = await fetch(`${baseUrl}/api/users/${testUsername}`);

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.username, testUsername);
      assert.equal(data.user.name, 'Updated Name');
      assert.equal(data.user.headline, 'Senior MERN Specialist');
      // Critical security requirement: Public profile must NOT leak email or password
      assert.equal(data.user.email, undefined);
      assert.equal(data.user.password, undefined);
      assert.equal(data.user.resetPasswordTokenHash, undefined);
    });

    test('GET /api/users/:username returns 404 for nonexistent username', async () => {
      const res = await fetch(`${baseUrl}/api/users/completely_missing_user_xyz`);

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /not found/i);
    });
  });

  // 4. PASSWORD MANAGEMENT TESTS
  describe('4. Password Management', () => {
    const newPassword = 'NewSecretPassword456!';

    test('PATCH /api/auth/change-password fails when current password is incorrect', async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAuthToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'IncorrectOldPassword!',
          newPassword: newPassword,
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /current password is incorrect/i);
    });

    test('PATCH /api/auth/change-password fails when new password is too short', async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAuthToken}`,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: '123',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /at least 6 characters/i);
    });

    test('PATCH /api/auth/change-password succeeds with correct current password and valid new password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAuthToken}`,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.match(data.message, /password changed successfully/i);

      // Verify that old password no longer works
      const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testEmail,
          password: testPassword,
        }),
      });
      assert.equal(oldLoginRes.status, 401);

      // Verify that new password works
      const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testEmail,
          password: newPassword,
        }),
      });
      assert.equal(newLoginRes.status, 200);
    });

    test('POST /api/auth/forgot-password generates cryptographically secure reset token hash in database', async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.resetToken); // Returned in non-production environments for automated testing

      // Verify in DB that token is stored as a hash, NOT in plaintext
      const userDoc = await User.findOne({ email: testEmail }).select('+resetPasswordTokenHash +resetPasswordExpires');
      assert.ok(userDoc.resetPasswordTokenHash);
      assert.notEqual(userDoc.resetPasswordTokenHash, data.resetToken);
      assert.ok(userDoc.resetPasswordExpires > Date.now());

      // Reset password using the secure token
      const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          token: data.resetToken,
          password: 'BrandNewPassword789!',
        }),
      });

      assert.equal(resetRes.status, 200);
      const resetData = await resetRes.json();
      assert.equal(resetData.success, true);

      // Verify token reuse prevention (attempting to use same token again must fail)
      const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          token: data.resetToken,
          password: 'AnotherPassword000!',
        }),
      });

      assert.equal(reuseRes.status, 400);
      const reuseData = await reuseRes.json();
      assert.equal(reuseData.success, false);
      assert.match(reuseData.message, /invalid or expired/i);
    });
  });

  // 5. REGRESSION TESTS
  describe('5. Regression Tests', () => {
    test('GET /api/health remains fully operational with database state', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.service, 'devconnect-backend');
      assert.ok(data.database);
    });

    test('Suspended user accounts cannot access protected endpoints', async () => {
      // Suspend test user
      await User.updateOne({ _id: testUserId }, { status: 'suspended' });

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${testAuthToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /account is suspended/i);

      // Restore active status
      await User.updateOne({ _id: testUserId }, { status: 'active' });
    });
  });
});
