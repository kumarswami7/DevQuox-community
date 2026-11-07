import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Socket } from 'node:net';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Profile } from '../../src/models/Profile.js';

// In-process Express Dispatcher using native http IncomingMessage & ServerResponse
function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    const res = new http.ServerResponse(req);

    req.method = method.toUpperCase();
    req.url = url;
    req.originalUrl = url;
    for (const [k, v] of Object.entries(headers)) {
      req.headers[k.toLowerCase()] = v;
    }
    if (body && !req.headers['content-type']) {
      req.headers['content-type'] = 'application/json';
    }

    const chunks = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, encoding, callback) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      return originalWrite.call(this, chunk, encoding, callback);
    };

    res.end = function (chunk, encoding, callback) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      originalEnd.call(this, chunk, encoding, callback);

      const buffer = Buffer.concat(chunks);
      const text = buffer.toString('utf8');
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      resolve({
        status: res.statusCode,
        headers: {
          get: (h) => res.getHeader(h),
        },
        text: () => Promise.resolve(text),
        json: () => Promise.resolve(json),
      });
    };

    if (body !== null && body !== undefined) {
      const payloadStr = typeof body === 'object' ? JSON.stringify(body) : String(body);
      req.headers['content-length'] = Buffer.byteLength(payloadStr).toString();
      if (typeof body === 'object') {
        req.body = body;
        req._body = true;
      }
      process.nextTick(() => {
        req.push(payloadStr);
        req.push(null);
      });
    } else {
      process.nextTick(() => {
        req.push(null);
      });
    }

    app.handle(req, res, (err) => {
      if (err) reject(err);
    });
  });
}

describe('Google Authentication API & HTTP 405 Prevention Tests', () => {
  let app;
  const mockUsers = new Map();
  const mockProfiles = new Map();

  const originalUserFindOne = User.findOne;
  const originalUserCreate = User.create;
  const originalUserFindById = User.findById;
  const originalProfileCreate = Profile.create;
  const originalProfileFindOne = Profile.findOne;

  before(async () => {
    process.env.NODE_ENV = 'test';

    // In-memory stubbing for User and Profile model operations
    User.findOne = async (query) => {
      if (query.$or) {
        for (const branch of query.$or) {
          if (branch.email) {
            for (const u of mockUsers.values()) {
              if (u.email === branch.email.toLowerCase().trim()) return u;
            }
          }
          if (branch.googleId) {
            for (const u of mockUsers.values()) {
              if (u.googleId === branch.googleId) return u;
            }
          }
        }
      }
      if (query.username) {
        for (const u of mockUsers.values()) {
          if (u.username === query.username) return u;
        }
      }
      return null;
    };

    User.findById = async (id) => mockUsers.get(String(id)) || null;

    User.create = async (userData) => {
      const id = new mongoose.Types.ObjectId();
      const userDoc = {
        _id: id,
        id: id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          mockUsers.set(String(this._id), this);
          return this;
        },
      };
      mockUsers.set(String(id), userDoc);
      return userDoc;
    };

    Profile.create = async (profileData) => {
      const id = new mongoose.Types.ObjectId();
      const profileDoc = {
        _id: id,
        id: id,
        ...profileData,
        createdAt: new Date(),
        save: async function () {
          mockProfiles.set(String(this.user), this);
          return this;
        },
      };
      mockProfiles.set(String(profileData.user), profileDoc);
      return profileDoc;
    };

    Profile.findOne = async (query) => {
      if (query.user) {
        return mockProfiles.get(String(query.user)) || null;
      }
      return null;
    };

    app = createApp();
  });

  after(async () => {
    // Restore original model functions
    User.findOne = originalUserFindOne;
    User.create = originalUserCreate;
    User.findById = originalUserFindById;
    Profile.create = originalProfileCreate;
    Profile.findOne = originalProfileFindOne;
  });

  // 1. CORS Preflight & HTTP Methods
  test('OPTIONS /api/v1/auth/google returns 204 with Allow and CORS headers', async () => {
    const res = await dispatch(app, {
      method: 'OPTIONS',
      url: '/api/v1/auth/google',
      headers: {
        'Origin': 'https://dev-quox-community.vercel.app',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.equal(res.status, 204);
    const allow = res.headers.get('allow') || res.headers.get('access-control-allow-methods');
    assert.ok(allow && allow.includes('POST'));
    assert.ok(allow.includes('GET'));
    assert.ok(allow.includes('OPTIONS'));
  });

  test('GET /api/v1/auth/google returns 200 with supported methods list', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: '/api/v1/auth/google',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.supportedMethods));
    assert.ok(data.supportedMethods.includes('POST'));
    assert.ok(data.supportedMethods.includes('GET'));
    assert.ok(data.supportedMethods.includes('OPTIONS'));
  });

  // 2. HTTP 405 Method Not Allowed Tests
  test('PUT /api/v1/auth/google returns 405 Method Not Allowed with Allow header', async () => {
    const res = await dispatch(app, {
      method: 'PUT',
      url: '/api/v1/auth/google',
      body: { email: 'test@example.com' },
    });

    assert.equal(res.status, 405);
    const allowHeader = res.headers.get('allow');
    assert.ok(allowHeader && allowHeader.includes('GET, POST, OPTIONS'));
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('not allowed'));
  });

  test('DELETE /api/v1/auth/google returns 405 Method Not Allowed', async () => {
    const res = await dispatch(app, {
      method: 'DELETE',
      url: '/api/v1/auth/google',
    });

    assert.equal(res.status, 405);
    assert.ok(res.headers.get('allow')?.includes('GET, POST, OPTIONS'));
  });

  test('PATCH /api/v1/auth/google returns 405 Method Not Allowed', async () => {
    const res = await dispatch(app, {
      method: 'PATCH',
      url: '/api/v1/auth/google',
      body: { email: 'test@example.com' },
    });

    assert.equal(res.status, 405);
    assert.ok(res.headers.get('allow')?.includes('GET, POST, OPTIONS'));
  });

  // 3. Validation and Error Handling
  test('POST /api/v1/auth/google with missing email returns 400 Bad Request', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: { intent: 'check' },
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('email is required'));
  });

  test('POST /api/v1/auth/google with invalid intent returns 400 Bad Request', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'kumar@example.com',
        googleId: 'gid_123',
        accessToken: 'mock-google-token',
        intent: 'invalid_intent_action',
      },
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Invalid intent'));
  });

  // 4. Intent: check (non-existent user)
  test('POST /api/v1/auth/google with intent "check" returns exists: false for new user', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'kumar_new_user@example.com',
        googleId: 'gid_999999',
        accessToken: 'mock-google-token',
        intent: 'check',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.exists, false);
    assert.equal(data.user, null);
  });

  // 5. Intent: register (success with complete profile & experience level preservation)
  test('POST /api/v1/auth/google with intent "register" creates user and profile with all fields', async () => {
    const payload = {
      name: 'Kumar swami Kethavath',
      email: 'kumar.swami@example.com',
      googleId: 'google_user_id_445566',
      avatar: 'https://lh3.googleusercontent.com/avatar/kumar.jpg',
      accessToken: 'mock-google-token',
      role: 'developer',
      title: 'Software Developer',
      headline: 'Software Developer | Specializing in Full Stack',
      about: 'Passionate developer building scalable apps',
      skills: ['React', 'Node.js', 'TypeScript'],
      experienceLevel: 'senior',
      college: new mongoose.Types.ObjectId(),
      collegeName: 'National Institute of Technology Warangal',
      collegeCountry: 'India',
      collegeCity: 'Warangal',
      collegeLogoUrl: 'https://nitw.ac.in/logo.png',
      isVerifiedCollege: true,
      intent: 'register',
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: payload,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token, 'Must return signed JWT token');
    assert.ok(data.user, 'Must return authenticated user object');
    assert.equal(data.user.email, 'kumar.swami@example.com');
    assert.equal(data.user.name, 'Kumar swami Kethavath');
    assert.equal(data.user.role, 'developer');

    const createdUserId = data.user.id || data.user._id;

    // Verify User record
    const savedUser = await User.findById(createdUserId);
    assert.ok(savedUser);
    assert.equal(savedUser.experienceLevel, 'senior', 'experienceLevel must be preserved on User model');
    assert.equal(savedUser.googleId, 'google_user_id_445566');
    assert.equal(savedUser.isEmailVerified, true);
    assert.deepEqual(savedUser.skills, ['React', 'Node.js', 'TypeScript']);

    // Verify Profile record
    const savedProfile = await Profile.findOne({ user: createdUserId });
    assert.ok(savedProfile);
    assert.equal(savedProfile.experienceLevel, 'senior', 'experienceLevel must be preserved on Profile model');
    assert.equal(savedProfile.title, 'Software Developer');
    assert.equal(savedProfile.about, 'Passionate developer building scalable apps');
    assert.equal(savedProfile.education.length, 1);
    assert.equal(savedProfile.education[0].institution, 'National Institute of Technology Warangal');
  });

  // 6. Intent: check (after registration)
  test('POST /api/v1/auth/google with intent "check" returns exists: true for registered user', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'kumar.swami@example.com',
        googleId: 'google_user_id_445566',
        accessToken: 'mock-google-token',
        intent: 'check',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.exists, true);
    assert.ok(data.user);
    assert.equal(data.user.email, 'kumar.swami@example.com');
  });

  // 7. Intent: register conflict (HTTP 409)
  test('POST /api/v1/auth/google with intent "register" returns 409 Conflict when user already exists', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'kumar.swami@example.com',
        googleId: 'google_user_id_445566',
        accessToken: 'mock-google-token',
        intent: 'register',
      },
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.accountExists, true);
    assert.ok(data.message.includes('already exists'));
  });

  // 8. Intent: login
  test('POST /api/v1/auth/google with intent "login" authenticates existing user without wiping profile', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'kumar.swami@example.com',
        googleId: 'google_user_id_445566',
        accessToken: 'mock-google-token',
        intent: 'login',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.email, 'kumar.swami@example.com');

    // Confirm existing headline and experience level are preserved
    const savedUser = Array.from(mockUsers.values()).find(u => u.email === 'kumar.swami@example.com');
    assert.equal(savedUser.headline, 'Software Developer | Specializing in Full Stack');
    assert.equal(savedUser.experienceLevel, 'senior');
  });

  test('POST /api/v1/auth/google with intent "login" returns needsRegistration for unregistered email', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'not_yet_registered@example.com',
        googleId: 'gid_unknown_999',
        accessToken: 'mock-google-token',
        intent: 'login',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.needsRegistration, true);
    assert.ok(data.message.includes('Account not found'));
  });

  // 9. Root route and alternate prefixes resilience
  test('POST /auth/google works seamlessly if client VITE_API_URL omits /api/v1', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/auth/google',
      body: {
        email: 'kumar.swami@example.com',
        googleId: 'google_user_id_445566',
        accessToken: 'mock-google-token',
        intent: 'check',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.exists, true);
  });
});
