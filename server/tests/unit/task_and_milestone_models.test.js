import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Task } from '../../src/models/Task.js';
import { Milestone } from '../../src/models/Milestone.js';

describe('Task & Milestone Models Unit Tests', () => {
  const dummyProjectId = new mongoose.Types.ObjectId();
  const dummyUserId1 = new mongoose.Types.ObjectId();
  const dummyUserId2 = new mongoose.Types.ObjectId();

  test('Task schema requires title, project, and creator', async () => {
    const task = new Task({});
    let err;
    try {
      await task.validate();
    } catch (e) {
      err = e;
    }

    assert.ok(err);
    assert.ok(err.errors.title);
    assert.ok(err.errors.project);
    assert.ok(err.errors.creator);
  });

  test('Task schema validates minimum and maximum title lengths', async () => {
    const tooShort = new Task({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'A',
    });
    let errShort;
    try {
      await tooShort.validate();
    } catch (e) {
      errShort = e;
    }
    assert.ok(errShort?.errors.title);

    const validTask = new Task({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Valid Task Title',
    });
    let errValid;
    try {
      await validTask.validate();
    } catch (e) {
      errValid = e;
    }
    assert.equal(errValid, undefined);
  });

  test('Task deduplicates assignees and syncs virtual assignee', async () => {
    const task = new Task({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Deduplication test',
      assignees: [dummyUserId1, dummyUserId1, dummyUserId2],
    });

    await task.validate();
    assert.equal(task.assignees.length, 2);
    assert.equal(String(task.assignee), String(dummyUserId1));
  });

  test('Task rejects due date earlier than start date', async () => {
    const task = new Task({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Date Order Test',
      startDate: new Date('2026-12-10'),
      dueDate: new Date('2026-12-01'),
    });

    let err;
    try {
      await task.validate();
    } catch (e) {
      err = e;
    }
    assert.ok(err);
    assert.ok(err.errors.dueDate);
  });

  test('Task sets completedAt when status is completed and clears when reopened', async () => {
    const task = new Task({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Completion test',
      status: 'completed',
    });

    await task.validate();
    assert.ok(task.completedAt instanceof Date);

    task.status = 'in_progress';
    await task.validate();
    assert.equal(task.completedAt, null);
  });

  test('Milestone schema requires title, project, and creator', async () => {
    const milestone = new Milestone({});
    let err;
    try {
      await milestone.validate();
    } catch (e) {
      err = e;
    }

    assert.ok(err);
    assert.ok(err.errors.title);
    assert.ok(err.errors.project);
    assert.ok(err.errors.creator);
  });

  test('Milestone validates date chronological ordering', async () => {
    const milestone = new Milestone({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Milestone Date Check',
      startDate: new Date('2026-06-15'),
      dueDate: new Date('2026-06-01'),
    });

    let err;
    try {
      await milestone.validate();
    } catch (e) {
      err = e;
    }
    assert.ok(err);
    assert.ok(err.errors.dueDate);
  });

  test('Milestone derives isOverdue virtual property correctly', () => {
    const overdueMilestone = new Milestone({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Past Due Milestone',
      dueDate: new Date(Date.now() - 86400000 * 2),
      status: 'in_progress',
    });

    assert.equal(overdueMilestone.isOverdue, true);

    const completedMilestone = new Milestone({
      project: dummyProjectId,
      creator: dummyUserId1,
      title: 'Completed Past Milestone',
      dueDate: new Date(Date.now() - 86400000 * 2),
      status: 'completed',
    });

    assert.equal(completedMilestone.isOverdue, false);
  });
});
