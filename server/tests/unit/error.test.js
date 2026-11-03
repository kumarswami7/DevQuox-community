import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { notFound } from '../../src/middleware/notFound.js';

describe('Centralized Error Handling Middleware (Unit)', () => {
  const createMockResponse = () => {
    const res = {
      statusCode: 200,
      headers: {},
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  test('should format malformed JSON syntax error as 400 Bad Request', () => {
    const err = new SyntaxError('Unexpected token in JSON at position 1');
    err.status = 400;
    err.body = '{ bad json';

    const req = {};
    const res = createMockResponse();
    const next = () => {};

    errorHandler(err, req, res, next);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Malformed JSON payload/);
  });

  test('should format Mongoose CastError (bad ObjectId) as 404', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    err.kind = 'ObjectId';
    err.value = 'invalid-id-xyz';

    const req = {};
    const res = createMockResponse();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Resource not found with ID: invalid-id-xyz/);
  });

  test('should format duplicate key error (code 11000) as 400 with duplicate field name', () => {
    const err = new Error('E11000 duplicate key error');
    err.code = 11000;
    err.keyValue = { email: 'test@example.com' };

    const req = {};
    const res = createMockResponse();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Duplicate field value entered: email already exists/);
  });

  test('should format Mongoose ValidationError as 400 with validation details', () => {
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    err.errors = {
      title: { message: 'Title is required' },
      budget: { message: 'Budget must be positive' },
    };

    const req = {};
    const res = createMockResponse();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Title is required/);
    assert.match(res.jsonData.message, /Budget must be positive/);
  });

  test('should format JWT authentication errors as 401 Unauthorized', () => {
    const jwtErr = new Error('jwt malformed');
    jwtErr.name = 'JsonWebTokenError';

    const res = createMockResponse();
    errorHandler(jwtErr, {}, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Invalid authentication token/);
  });

  test('notFound middleware should create 404 error with request URL', () => {
    const req = { originalUrl: '/api/v1/unknown-endpoint' };
    const res = createMockResponse();
    let passedError = null;

    notFound(req, res, (err) => {
      passedError = err;
    });

    assert.equal(res.statusCode, 404);
    assert.ok(passedError);
    assert.equal(passedError.statusCode, 404);
    assert.match(passedError.message, /Resource not found - \/api\/v1\/unknown-endpoint/);
  });
});
