import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../../src/config/env.js';

describe('Environment Configuration Validation (Unit)', () => {
  test('should validate valid environment configuration successfully', () => {
    const validConfig = {
      NODE_ENV: 'development',
      PORT: '5000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/devconnect',
      JWT_SECRET: 'super_secret_jwt_key_908124_mern',
      CLIENT_URL: 'http://localhost:3000',
    };

    const env = validateEnv(validConfig);
    assert.equal(env.NODE_ENV, 'development');
    assert.equal(env.PORT, 5000);
    assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27017/devconnect');
    assert.equal(env.isDevelopment, true);
    assert.equal(env.isProduction, false);
  });

  test('should reject invalid PORT values', () => {
    assert.throws(
      () => validateEnv({ PORT: 'not_a_number' }),
      /Invalid PORT configuration/
    );

    assert.throws(
      () => validateEnv({ PORT: '-1' }),
      /Invalid PORT configuration/
    );

    assert.throws(
      () => validateEnv({ PORT: '999999' }),
      /Invalid PORT configuration/
    );
  });

  test('should reject invalid MONGODB_URI values', () => {
    assert.throws(
      () => validateEnv({ PORT: '5000', MONGODB_URI: 'http://invalid-db-url' }),
      /Invalid MONGODB_URI/
    );
  });

  test('should require strong JWT_SECRET in production mode', () => {
    assert.throws(
      () => validateEnv({
        NODE_ENV: 'production',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/prod',
        JWT_SECRET: 'short',
      }),
      /JWT_SECRET must be at least 16 characters/
    );
  });
});
