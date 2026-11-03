import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../../src/models/User.js';
import crypto from 'crypto';

describe('User Model Schema & Security Unit Tests', () => {
  test('User schema requires name, email, and password', () => {
    const user = new User({});
    const error = user.validateSync();
    assert.ok(error);
    assert.ok(error.errors.name);
    assert.ok(error.errors.email);
    assert.ok(error.errors.password);
  });

  test('Username must match alphanumeric and underscore format', () => {
    const invalidUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      username: 'bad username!@#',
    });
    const error = invalidUser.validateSync();
    assert.ok(error);
    assert.ok(error.errors.username);
  });

  test('Allowed roles include developer, client, student, freelancer, admin', () => {
    const roles = ['developer', 'client', 'student', 'freelancer', 'admin'];
    for (const role of roles) {
      const user = new User({
        name: 'Test Role',
        email: `${role}@example.com`,
        password: 'Password123!',
        username: `${role}_tester`,
        role,
      });
      const error = user.validateSync();
      assert.equal(error?.errors?.role, undefined);
    }

    const invalidRoleUser = new User({
      name: 'Invalid Role',
      email: 'bad@example.com',
      password: 'Password123!',
      username: 'invalid_role',
      role: 'superadmin',
    });
    const error = invalidRoleUser.validateSync();
    assert.ok(error);
    assert.ok(error.errors.role);
  });

  test('toJSON and toObject transform must delete password and sensitive hashes', () => {
    const user = new User({
      name: 'Safe User',
      email: 'safe@example.com',
      password: 'HashedPasswordValue123',
      username: 'safe_user',
      role: 'developer',
      resetPasswordTokenHash: 'secret-hash-123',
    });

    const json = user.toJSON();
    assert.equal(json.password, undefined);
    assert.equal(json.resetPasswordTokenHash, undefined);
    assert.equal(json.name, 'Safe User');
    assert.equal(json.username, 'safe_user');
  });

  test('toPublicProfile returns only public, non-sensitive profile fields', () => {
    const user = new User({
      name: 'Public Persona',
      email: 'private@example.com',
      password: 'HashedPasswordValue123',
      username: 'public_dev',
      role: 'developer',
      headline: 'Fullstack Engineer',
      bio: 'Open source contributor',
      skills: ['Node.js', 'React'],
      status: 'active',
      isEmailVerified: true,
    });

    const publicProfile = user.toPublicProfile();
    // Public profile must NOT contain email, password, or verification status
    assert.equal(publicProfile.email, undefined);
    assert.equal(publicProfile.password, undefined);
    assert.equal(publicProfile.resetPasswordTokenHash, undefined);
    assert.equal(publicProfile.name, 'Public Persona');
    assert.equal(publicProfile.username, 'public_dev');
    assert.equal(publicProfile.headline, 'Fullstack Engineer');
    assert.deepEqual(publicProfile.skills, ['Node.js', 'React']);
  });
});
