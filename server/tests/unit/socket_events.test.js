import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEventPayload,
  emitToProject,
  emitToUser,
  revokeUserProjectAccess,
} from '../../src/utils/socketEvents.js';

test('WebSocket Centralized Dispatcher & Event System', async (t) => {
  await t.test('createEventPayload creates standardized structure with unique eventId', () => {
    const payload1 = createEventPayload({
      projectId: 'proj-123',
      eventType: 'task:created',
      data: { title: 'New Task' },
      actor: { _id: 'user-1', name: 'Alice', role: 'member' },
      resourceId: 'task-456',
    });

    const payload2 = createEventPayload({
      projectId: 'proj-123',
      eventType: 'task:created',
      data: { title: 'New Task' },
    });

    assert.ok(payload1.eventId, 'payload1 must have an eventId');
    assert.ok(payload2.eventId, 'payload2 must have an eventId');
    assert.notEqual(payload1.eventId, payload2.eventId, 'eventId must be unique per invocation');
    assert.equal(payload1.projectId, 'proj-123');
    assert.equal(payload1.eventType, 'task:created');
    assert.equal(payload1.resourceId, 'task-456');
    assert.equal(payload1.actor._id, 'user-1');
    assert.equal(payload1.actor.name, 'Alice');
    assert.deepEqual(payload1.data, { title: 'New Task' });
    assert.ok(typeof payload1.timestamp === 'string');
    assert.ok(!isNaN(Date.parse(payload1.timestamp)));
  });

  await t.test('emitToProject safely emits to project room when global.io is present', () => {
    let emittedRoom = null;
    let emittedEvent = null;
    let emittedPayload = null;

    const mockIo = {
      to: (room) => {
        emittedRoom = room;
        return {
          emit: (event, payload) => {
            emittedEvent = event;
            emittedPayload = payload;
          },
        };
      },
    };

    const originalIo = global.io;
    global.io = mockIo;

    try {
      const payload = emitToProject('proj-999', 'milestone:completed', { milestoneId: 'm-1' }, {
        resourceId: 'm-1',
      });

      assert.ok(payload);
      assert.equal(emittedRoom, 'project:proj-999');
      assert.equal(emittedEvent, 'milestone:completed');
      assert.equal(emittedPayload.projectId, 'proj-999');
      assert.equal(emittedPayload.data.milestoneId, 'm-1');
    } finally {
      global.io = originalIo;
    }
  });

  await t.test('emitToUser safely emits to user room', () => {
    let emittedRoom = null;
    let emittedEvent = null;
    let emittedData = null;

    const mockIo = {
      to: (room) => {
        emittedRoom = room;
        return {
          emit: (event, data) => {
            emittedEvent = event;
            emittedData = data;
          },
        };
      },
    };

    const originalIo = global.io;
    global.io = mockIo;

    try {
      const payload = emitToUser('user-888', 'workspace:revoked', { reason: 'Role changed' });
      assert.ok(payload);
      assert.equal(emittedEvent, 'workspace:revoked');
      assert.equal(emittedData.data.reason, 'Role changed');
    } finally {
      global.io = originalIo;
    }
  });

  await t.test('revokeUserProjectAccess kicks member from socket room and notifies', async () => {
    let notifiedEvent = null;
    let notifiedPayload = null;
    let kickedRoom = null;

    const mockIo = {
      to: () => {
        return {
          emit: (event, payload) => {
            notifiedEvent = event;
            notifiedPayload = payload;
          },
        };
      },
      in: () => {
        return {
          socketsLeave: (leaveRoom) => {
            kickedRoom = leaveRoom;
          },
        };
      },
    };

    const originalIo = global.io;
    global.io = mockIo;

    try {
      await revokeUserProjectAccess('user-444', 'proj-555', 'Removed by owner');
      assert.equal(notifiedEvent, 'workspace:revoked');
      assert.equal(notifiedPayload.data.projectId, 'proj-555');
      assert.equal(notifiedPayload.data.reason, 'Removed by owner');
      assert.equal(kickedRoom, 'project:proj-555');
    } finally {
      global.io = originalIo;
    }
  });
});
