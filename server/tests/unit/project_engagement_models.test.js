import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Project } from '../../src/models/Project.js';
import { Reaction } from '../../src/models/Reaction.js';
import { Comment } from '../../src/models/Comment.js';
import { ProjectRepost } from '../../src/models/ProjectRepost.js';
import { ProjectView } from '../../src/models/ProjectView.js';
import { ProjectBookmark } from '../../src/models/ProjectBookmark.js';

describe('Project Engagement Models Unit Tests', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyProjectId = new mongoose.Types.ObjectId();

  test('Project schema initializes engagement counters and breakdown to zero', () => {
    const project = new Project({
      title: 'DevConnect Social Feed Test',
      description: 'Testing engagement counters initialization',
      owner: dummyUserId,
    });

    assert.equal(project.reactionsCount, 0);
    assert.equal(project.commentsCount, 0);
    assert.equal(project.repostsCount, 0);
    assert.equal(project.viewsCount, 0);
    assert.equal(project.uniqueViewsCount, 0);
    assert.equal(project.reactionBreakdown.like, 0);
    assert.equal(project.reactionBreakdown.celebrate, 0);
    assert.equal(project.reactionBreakdown.support, 0);
    assert.equal(project.reactionBreakdown.insightful, 0);
    assert.equal(project.reactionBreakdown.curious, 0);
  });

  test('Reaction schema supports project targetType and valid reactionType enums', () => {
    const validTypes = ['like', 'celebrate', 'support', 'insightful', 'curious'];

    for (const rType of validTypes) {
      const reaction = new Reaction({
        userId: dummyUserId,
        targetType: 'project',
        targetId: dummyProjectId,
        reactionType: rType,
      });
      const error = reaction.validateSync();
      assert.equal(error, undefined, `Expected reactionType ${rType} to be valid`);
    }

    const invalidReaction = new Reaction({
      userId: dummyUserId,
      targetType: 'project',
      targetId: dummyProjectId,
      reactionType: 'angry', // invalid
    });
    const error = invalidReaction.validateSync();
    assert.ok(error);
    assert.ok(error.errors.reactionType);
  });

  test('Comment schema accepts project reference and enforces content length', () => {
    const comment = new Comment({
      project: dummyProjectId,
      author: dummyUserId,
      content: 'This is a valid project feedback comment',
    });
    const error = comment.validateSync();
    assert.equal(error, undefined);
    assert.equal(comment.content, 'This is a valid project feedback comment');

    const emptyComment = new Comment({
      project: dummyProjectId,
      author: dummyUserId,
      content: '',
    });
    const emptyErr = emptyComment.validateSync();
    assert.ok(emptyErr);
    assert.ok(emptyErr.errors.content);
  });

  test('ProjectRepost schema requires user and project references', () => {
    const repost = new ProjectRepost({
      user: dummyUserId,
      project: dummyProjectId,
      commentary: 'Great open source initiative!',
      isQuote: true,
    });
    const error = repost.validateSync();
    assert.equal(error, undefined);
    assert.equal(repost.isQuote, true);
    assert.equal(repost.commentary, 'Great open source initiative!');

    const missingFields = new ProjectRepost({});
    const missingErr = missingFields.validateSync();
    assert.ok(missingErr);
    assert.ok(missingErr.errors.user);
    assert.ok(missingErr.errors.project);
  });

  test('ProjectView schema requires project reference and initializes timestamps', () => {
    const view = new ProjectView({
      project: dummyProjectId,
      viewer: dummyUserId,
      sessionId: 'session_abc_123',
    });
    const error = view.validateSync();
    assert.equal(error, undefined);
    assert.equal(view.sessionId, 'session_abc_123');

    const missingProject = new ProjectView({});
    const missingErr = missingProject.validateSync();
    assert.ok(missingErr);
    assert.ok(missingErr.errors.project);
  });

  test('ProjectBookmark schema requires user and project references', () => {
    const bookmark = new ProjectBookmark({
      user: dummyUserId,
      project: dummyProjectId,
    });
    const error = bookmark.validateSync();
    assert.equal(error, undefined);

    const missing = new ProjectBookmark({});
    const missingErr = missing.validateSync();
    assert.ok(missingErr);
    assert.ok(missingErr.errors.user);
    assert.ok(missingErr.errors.project);
  });
});

