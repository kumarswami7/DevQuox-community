import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Project, VALID_STATUS_TRANSITIONS } from '../../src/models/Project.js';
import { Application, VALID_APPLICATION_STATUS_TRANSITIONS } from '../../src/models/Application.js';

describe('Project & Application Models Unit Tests', () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  test('Project schema requires title, description, and owner', () => {
    const p = new Project({});
    const error = p.validateSync();
    assert.ok(error);
    assert.ok(error.errors.title);
    assert.ok(error.errors.description);
    assert.ok(error.errors.owner);
  });

  test('Project schema validates minimum and maximum lengths', () => {
    const tooShort = new Project({
      title: 'Hi', // min 3
      description: 'Short', // min 10
      owner: dummyUserId,
    });
    const error = tooShort.validateSync();
    assert.ok(error);
    assert.ok(error.errors.title);
    assert.ok(error.errors.description);
  });

  test('Project status transition validation logic behaves correctly', () => {
    const project = new Project({
      title: 'Valid Project Title',
      description: 'Valid project description for testing',
      owner: dummyUserId,
      status: 'open',
    });

    assert.equal(project.canTransitionTo('in_progress'), true);
    assert.equal(project.canTransitionTo('cancelled'), true);
    assert.equal(project.canTransitionTo('completed'), true);

    // Cancelled project cannot transition back to open
    project.status = 'cancelled';
    assert.equal(project.canTransitionTo('open'), false);
    assert.equal(project.canTransitionTo('in_progress'), false);
  });

  test('Application schema requires project and applicant references', () => {
    const app = new Application({});
    const error = app.validateSync();
    assert.ok(error);
    assert.ok(error.errors.project);
    assert.ok(error.errors.applicant);
  });

  test('Application status transitions enforce unidirectional decision lifecycle', () => {
    const app = new Application({
      project: new mongoose.Types.ObjectId(),
      applicant: dummyUserId,
      status: 'pending',
    });

    assert.equal(app.canTransitionTo('accepted'), true);
    assert.equal(app.canTransitionTo('rejected'), true);
    assert.equal(app.canTransitionTo('withdrawn'), true);

    // Rejected cannot transition to accepted
    app.status = 'rejected';
    assert.equal(app.canTransitionTo('accepted'), false);
  });
});
