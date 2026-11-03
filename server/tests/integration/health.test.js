import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../../src/app.js';

describe('Health and Application Bootstrap Endpoints (Integration)', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.NODE_ENV = 'test';
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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/health should return 200 with standard health status and database state', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(['ok', 'degraded'].includes(body.status));
    assert.equal(body.service, 'devconnect-backend');
    assert.equal(body.version, '1.0.0');
    assert.ok(body.timestamp);
    assert.ok(typeof body.uptimeSeconds === 'number');
    assert.ok(body.database);
    assert.ok(['connected', 'disconnected'].includes(body.database.status));

    // Security check: Must never leak secrets or connection strings
    assert.equal(body.database.uri, undefined);
    assert.equal(body.database.password, undefined);
    assert.equal(body.stack, undefined);
  });

  test('GET /api/v1/health should return consistent health payload matching v1 standards', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.service, 'devconnect-backend');
    assert.ok(body.database);
  });

  test('GET / (root) should return welcome message and health endpoint link', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.health, '/api/health');
  });

  test('GET /api/v1/undefined-endpoint should return structured 404 error response', async () => {
    const res = await fetch(`${baseUrl}/api/v1/undefined-endpoint`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Resource not found/);
  });

  test('Security response headers should be applied to all responses', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-xss-protection'), '1; mode=block');
  });
});
