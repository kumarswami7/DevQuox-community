import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Conversation } from '../../src/models/Conversation.js';
import { Message } from '../../src/models/Message.js';
import { Notification } from '../../src/models/Notification.js';

describe('Chat, Message & Notification Models Unit Tests', () => {
  const dummyUserId1 = new mongoose.Types.ObjectId();
  const dummyUserId2 = new mongoose.Types.ObjectId();
  const dummyProjectId = new mongoose.Types.ObjectId();
  const dummyConvId = new mongoose.Types.ObjectId();

  test('Conversation schema defaults type to direct and validates allowed enum values', async () => {
    const conv = new Conversation({
      participants: [dummyUserId1, dummyUserId2],
    });

    assert.equal(conv.type, 'direct');
    assert.equal(conv.participants.length, 2);

    conv.type = 'invalid_type';
    await assert.rejects(
      async () => conv.validate(),
      (err) => err instanceof mongoose.Error.ValidationError
    );
  });

  test('Conversation schema supports project-linked conversations', () => {
    const conv = new Conversation({
      type: 'project',
      project: dummyProjectId,
      title: 'DevConnect Fullstack Workspace',
      participants: [dummyUserId1],
    });

    assert.equal(conv.type, 'project');
    assert.equal(String(conv.project), String(dummyProjectId));
    assert.equal(conv.title, 'DevConnect Fullstack Workspace');
  });

  test('Message schema requires either non-empty text content or a valid attachment', async () => {
    // 1. Both empty -> fails
    const emptyMsg = new Message({
      conversation: dummyConvId,
      sender: dummyUserId1,
      content: '   ',
    });

    await assert.rejects(
      async () => emptyMsg.validate(),
      (err) => {
        assert.ok(err.errors.content);
        return true;
      }
    );

    // 2. Has text -> passes
    const validTextMsg = new Message({
      conversation: dummyConvId,
      sender: dummyUserId1,
      content: 'Valid team collaboration message',
    });
    await validTextMsg.validate();

    // 3. Has attachment without text -> passes
    const validAttachmentMsg = new Message({
      conversation: dummyConvId,
      sender: dummyUserId1,
      content: '',
      attachments: [
        {
          url: 'https://cdn.devconnect.com/docs/spec.pdf',
          fileName: 'spec.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      ],
    });
    await validAttachmentMsg.validate();
  });

  test('Message schema enforces max length limit of 4000 characters', async () => {
    const oversizedMsg = new Message({
      conversation: dummyConvId,
      sender: dummyUserId1,
      content: 'x'.repeat(4001),
    });

    await assert.rejects(
      async () => oversizedMsg.validate(),
      (err) => {
        assert.ok(err.errors.content);
        return true;
      }
    );
  });

  test('Message schema initializes default editing and deletion flags', () => {
    const msg = new Message({
      conversation: dummyConvId,
      sender: dummyUserId1,
      content: 'Hello DevConnect',
    });

    assert.equal(msg.isEdited, false);
    assert.equal(msg.isDeleted, false);
    assert.equal(msg.deletedForEveryone, false);
    assert.equal(Array.isArray(msg.deletedForMe), true);
    assert.equal(msg.deletedForMe.length, 0);
  });

  test('Notification schema validates recipient and type enum', async () => {
    // Missing recipient fails
    const invalidNotif = new Notification({
      type: 'message',
      message: 'New message received',
    });

    await assert.rejects(
      async () => invalidNotif.validate(),
      (err) => {
        assert.ok(err.errors.recipient);
        return true;
      }
    );

    // Valid notification passes
    const validNotif = new Notification({
      recipient: dummyUserId1,
      sender: dummyUserId2,
      type: 'message',
      title: 'New Message',
      message: 'Alex sent you a message in project workspace',
      read: false,
    });
    await validNotif.validate();
    assert.equal(validNotif.read, false);
  });
});
