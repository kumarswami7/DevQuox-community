import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';

import { createApp } from '../../src/app.js';
import { setupSocketServer } from '../../src/socket/socket.server.js';
import { User } from '../../src/models/User.js';
import { Project } from '../../src/models/Project.js';
import { ProjectMember } from '../../src/models/ProjectMember.js';
import { Conversation } from '../../src/models/Conversation.js';
import { Message } from '../../src/models/Message.js';
import { Notification } from '../../src/models/Notification.js';

dotenv.config();

describe('DevConnect Phase 6: Real-Time Chat, Notifications & Project Communication Integration Tests', () => {
  let server;
  let ioServer;
  let baseUrl;
  let socketUrl;
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Users
  let ownerUser;
  let ownerToken;
  let memberUser;
  let memberToken;
  let outsiderUser;
  let outsiderToken;

  // Project & Conversation
  let testProject;
  let projectConversation;
  let directConversation;

  const createdUserIds = [];
  const createdProjectIds = [];

  const createJwtToken = (userId) => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'devconnect-secret-key-super-safe',
      { expiresIn: '7d' }
    );
  };

  const createSocketClient = (token) => {
    return ClientIO(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: false,
    });
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devconnect-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const app = createApp();
    server = http.createServer(app);

    ioServer = new Server(server, {
      cors: { origin: '*' },
    });
    app.set('io', ioServer);
    global.io = ioServer;
    setupSocketServer(ioServer);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
        socketUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // 1. Create Users
    ownerUser = await User.create({
      name: `Chat Owner ${uniqueSuffix}`,
      email: `owner.chat.${uniqueSuffix}@test.devconnect.com`,
      username: `owner_chat_${uniqueSuffix}`,
      password: 'Password123!',
      role: 'client',
      status: 'active',
    });
    ownerToken = createJwtToken(ownerUser._id);
    createdUserIds.push(ownerUser._id);

    memberUser = await User.create({
      name: `Chat Member ${uniqueSuffix}`,
      email: `member.chat.${uniqueSuffix}@test.devconnect.com`,
      username: `member_chat_${uniqueSuffix}`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    memberToken = createJwtToken(memberUser._id);
    createdUserIds.push(memberUser._id);

    outsiderUser = await User.create({
      name: `Chat Outsider ${uniqueSuffix}`,
      email: `outsider.chat.${uniqueSuffix}@test.devconnect.com`,
      username: `outsider_chat_${uniqueSuffix}`,
      password: 'Password123!',
      role: 'developer',
      status: 'active',
    });
    outsiderToken = createJwtToken(outsiderUser._id);
    createdUserIds.push(outsiderUser._id);

    // 2. Create Project
    testProject = await Project.create({
      title: `Realtime Chat Project ${uniqueSuffix}`,
      description: 'Comprehensive project for validating Socket.IO rooms, permissions, and history.',
      category: 'Web Development',
      projectType: 'collaboration',
      owner: ownerUser._id,
      teamSize: 5,
      status: 'in_progress',
    });
    createdProjectIds.push(testProject._id);

    // 3. Create Project Membership for memberUser
    await ProjectMember.create({
      project: testProject._id,
      user: memberUser._id,
      role: 'member',
      status: 'active',
    });
  });

  after(async () => {
    // Clean up created resources
    if (createdProjectIds.length > 0) {
      await Project.deleteMany({ _id: { $in: createdProjectIds } });
      await ProjectMember.deleteMany({ project: { $in: createdProjectIds } });
      await Conversation.deleteMany({ project: { $in: createdProjectIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await Message.deleteMany({ sender: { $in: createdUserIds } });
      await Notification.deleteMany({ recipient: { $in: createdUserIds } });
    }

    if (ioServer) {
      ioServer.disconnectSockets(true);
      await new Promise((res) => ioServer.close(res));
    }
    if (server) {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // =========================================================================
  // 1. Socket Connection Authentication & Security
  // =========================================================================
  describe('1. Socket.IO Connection & Authentication Security', () => {
    test('Authenticated user connects successfully with valid JWT token', async () => {
      const client = createSocketClient(ownerToken);

      const connResult = await new Promise((resolve) => {
        client.on('connection:success', (data) => resolve({ status: 'connected', data }));
        client.on('connect_error', (err) => resolve({ status: 'error', error: err.message }));
      });

      client.disconnect();
      assert.equal(connResult.status, 'connected');
      assert.equal(connResult.data.status, 'authenticated');
      assert.equal(String(connResult.data.userId), String(ownerUser._id));
    });

    test('Unauthenticated socket connection without token is rejected', async () => {
      const client = createSocketClient(null);

      const errResult = await new Promise((resolve) => {
        client.on('connect_error', (err) => resolve(err.message));
        client.on('connect', () => resolve('unexpected_connect'));
      });

      client.disconnect();
      assert.match(errResult, /Authentication error/i);
    });

    test('Socket connection with malformed/invalid token is rejected', async () => {
      const client = createSocketClient('this-is-not-a-valid-jwt-token');

      const errResult = await new Promise((resolve) => {
        client.on('connect_error', (err) => resolve(err.message));
        client.on('connect', () => resolve('unexpected_connect'));
      });

      client.disconnect();
      assert.match(errResult, /Authentication error/i);
    });
  });

  // =========================================================================
  // 2. Project Room Access Control & Workspace Permissions
  // =========================================================================
  describe('2. Project Room Access Control & Authorization', () => {
    test('Project owner joins project workspace room successfully', async () => {
      const client = createSocketClient(ownerToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const joinResult = await new Promise((resolve) => {
        client.emit('join_project_workspace', { projectId: testProject._id }, (ack) => {
          resolve(ack);
        });
      });

      client.disconnect();
      assert.equal(joinResult.success, true);
      assert.equal(String(joinResult.data.projectId), String(testProject._id));
      assert.ok(joinResult.data.conversationId);
      projectConversation = await Conversation.findById(joinResult.data.conversationId);
      assert.ok(projectConversation);
    });

    test('Active project member joins project workspace room successfully', async () => {
      const client = createSocketClient(memberToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const joinResult = await new Promise((resolve) => {
        client.emit('join_project_workspace', { projectId: testProject._id }, (ack) => {
          resolve(ack);
        });
      });

      client.disconnect();
      assert.equal(joinResult.success, true);
      assert.equal(String(joinResult.data.projectId), String(testProject._id));
      assert.equal(joinResult.data.role, 'member');
    });

    test('Non-member outsider is rejected when attempting to join project workspace (UNAUTHORIZED)', async () => {
      const client = createSocketClient(outsiderToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const joinResult = await new Promise((resolve) => {
        client.emit('join_project_workspace', { projectId: testProject._id }, (ack) => {
          resolve(ack);
        });
      });

      client.disconnect();
      assert.equal(joinResult.success, false);
      assert.equal(joinResult.error.code, 'UNAUTHORIZED');
    });

    test('REST endpoint: GET /chats/project/:projectId returns conversation for authorized member', async () => {
      const res = await fetch(`${baseUrl}/chats/project/${testProject._id}`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(String(data.conversation.project._id || data.conversation.project), String(testProject._id));
    });

    test('REST endpoint: GET /chats/project/:projectId rejects unauthorized outsider with 403', async () => {
      const res = await fetch(`${baseUrl}/chats/project/${testProject._id}`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 3. Real-Time Message Exchange & Validation
  // =========================================================================
  describe('3. Real-Time Message Exchange & Validation', () => {
    let sentMessageId;

    test('Project member sends message: persisted in DB and broadcast to conversation room', async () => {
      const senderClient = createSocketClient(memberToken);
      const receiverClient = createSocketClient(ownerToken);

      await Promise.all([
        new Promise((resolve) => senderClient.on('connect', resolve)),
        new Promise((resolve) => receiverClient.on('connect', resolve)),
      ]);

      // Receiver joins conversation room
      await new Promise((resolve) => {
        receiverClient.emit('join_conversation', { conversationId: projectConversation._id }, resolve);
      });

      const messageContent = 'Hello team, the backend tasks are proceeding smoothly!';

      const receivedPromise = new Promise((resolve) => {
        receiverClient.on('message:new', (msg) => {
          resolve(msg);
        });
      });

      // Send message
      const sendAck = await new Promise((resolve) => {
        senderClient.emit(
          'send_message',
          {
            conversationId: projectConversation._id,
            content: messageContent,
          },
          (ack) => resolve(ack)
        );
      });

      const received = await receivedPromise;

      senderClient.disconnect();
      receiverClient.disconnect();

      assert.equal(sendAck.success, true);
      assert.equal(sendAck.data.content, messageContent);
      assert.equal(received.content, messageContent);
      assert.equal(String(received.sender._id), String(memberUser._id));

      sentMessageId = sendAck.data._id;

      // Verify in MongoDB
      const dbMsg = await Message.findById(sentMessageId);
      assert.ok(dbMsg);
      assert.equal(dbMsg.content, messageContent);
    });

    test('Message validation: empty content without attachment is rejected', async () => {
      const client = createSocketClient(memberToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const sendAck = await new Promise((resolve) => {
        client.emit(
          'send_message',
          {
            conversationId: projectConversation._id,
            content: '   ',
          },
          (ack) => resolve(ack)
        );
      });

      client.disconnect();
      assert.equal(sendAck.success, false);
      assert.equal(sendAck.error.code, 'VALIDATION_ERROR');
    });

    test('Message validation: message exceeding 4000 characters is rejected', async () => {
      const client = createSocketClient(memberToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const hugeText = 'A'.repeat(4005);
      const sendAck = await new Promise((resolve) => {
        client.emit(
          'send_message',
          {
            conversationId: projectConversation._id,
            content: hugeText,
          },
          (ack) => resolve(ack)
        );
      });

      client.disconnect();
      assert.equal(sendAck.success, false);
      assert.equal(sendAck.error.code, 'VALIDATION_ERROR');
    });

    test('Non-member outsider cannot send message to project conversation (UNAUTHORIZED)', async () => {
      const client = createSocketClient(outsiderToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const sendAck = await new Promise((resolve) => {
        client.emit(
          'send_message',
          {
            conversationId: projectConversation._id,
            content: 'I am an outsider trying to spam this channel',
          },
          (ack) => resolve(ack)
        );
      });

      client.disconnect();
      assert.equal(sendAck.success, false);
      assert.equal(sendAck.error.code, 'UNAUTHORIZED');
    });
  });

  // =========================================================================
  // 4. Message Pagination & Chronological History
  // =========================================================================
  describe('4. Message History & Cursor Pagination', () => {
    before(async () => {
      // Seed 5 consecutive messages
      for (let i = 1; i <= 5; i++) {
        await Message.create({
          conversation: projectConversation._id,
          sender: ownerUser._id,
          content: `Test message sequential ${i}`,
          readBy: [{ user: ownerUser._id, readAt: new Date() }],
        });
      }
    });

    test('GET /chats/conversations/:id/messages returns messages in chronological order', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations/${projectConversation._id}/messages?limit=20`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.messages));
      assert.ok(data.messages.length >= 6);

      // Verify chronological order (older messages come first)
      for (let i = 0; i < data.messages.length - 1; i++) {
        const t1 = new Date(data.messages[i].createdAt).getTime();
        const t2 = new Date(data.messages[i + 1].createdAt).getTime();
        assert.ok(t1 <= t2, 'Messages should be ordered chronologically');
      }
    });

    test('GET /chats/conversations/:id/messages applies pagination limit and before cursor', async () => {
      // First page with limit 3
      const res1 = await fetch(`${baseUrl}/chats/conversations/${projectConversation._id}/messages?limit=3`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data1 = await res1.json();
      assert.equal(data1.messages.length, 3);

      const oldestInPage1 = data1.messages[0];

      // Second page using before cursor
      const res2 = await fetch(
        `${baseUrl}/chats/conversations/${projectConversation._id}/messages?limit=3&before=${oldestInPage1._id}`,
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        }
      );
      const data2 = await res2.json();
      assert.ok(data2.messages.length > 0);

      const newestInPage2 = data2.messages[data2.messages.length - 1];
      assert.ok(
        new Date(newestInPage2.createdAt).getTime() <= new Date(oldestInPage1.createdAt).getTime(),
        'Older page messages must precede the cursor timestamp'
      );
    });

    test('GET /chats/conversations/:id/messages rejects unauthorized outsider with 403', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations/${projectConversation._id}/messages`, {
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });
      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // 5. Message Editing & Soft Deletion Permissions
  // =========================================================================
  describe('5. Message Editing & Deletion Permissions', () => {
    let testMsg;

    before(async () => {
      testMsg = await Message.create({
        conversation: projectConversation._id,
        sender: memberUser._id,
        content: 'Original message before editing',
        readBy: [{ user: memberUser._id, readAt: new Date() }],
      });
    });

    test('Author edits their own message: updates content and sets isEdited flag', async () => {
      const res = await fetch(`${baseUrl}/chats/messages/${testMsg._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ content: 'Updated content after editing' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.message.content, 'Updated content after editing');
      assert.equal(data.message.isEdited, true);
      assert.ok(data.message.editedAt);
    });

    test('Non-author cannot edit another user message (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/chats/messages/${testMsg._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({ content: 'Malicious modification attempt' }),
      });

      assert.equal(res.status, 403);
    });

    test('Author deletes their message: masks content and marks deletedForEveryone', async () => {
      const res = await fetch(`${baseUrl}/chats/messages/${testMsg._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ deleteForEveryone: true }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      // Verify in DB
      const dbMsg = await Message.findById(testMsg._id);
      assert.equal(dbMsg.isDeleted, true);
      assert.equal(dbMsg.deletedForEveryone, true);
      assert.match(dbMsg.content, /This message was deleted/i);
    });
  });

  // =========================================================================
  // 6. Read Receipts & Unread Message Tallies
  // =========================================================================
  describe('6. Read Receipts & Unread Message Tracking', () => {
    let unreadMsg;

    before(async () => {
      // Create a fresh message from member to owner
      unreadMsg = await Message.create({
        conversation: projectConversation._id,
        sender: memberUser._id,
        content: 'Unread message for tally verification',
        readBy: [{ user: memberUser._id, readAt: new Date() }],
      });
    });

    test('GET /chats/unread-count returns accurate unread message count', async () => {
      const res = await fetch(`${baseUrl}/chats/unread-count`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.count >= 1);
    });

    test('POST /chats/conversations/:id/read marks conversation read and decrements unread count', async () => {
      const readRes = await fetch(`${baseUrl}/chats/conversations/${projectConversation._id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(readRes.status, 200);
      const readData = await readRes.json();
      assert.equal(readData.success, true);

      // Verify unread count for owner is now 0 for this conversation
      const countRes = await fetch(`${baseUrl}/chats/unread-count`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const countData = await countRes.json();
      assert.equal(countData.count, 0);

      // Verify message has owner in readBy in DB
      const dbMsg = await Message.findById(unreadMsg._id);
      assert.ok(
        dbMsg.readBy.some((rb) => String(rb.user) === String(ownerUser._id)),
        'Recipient must be recorded in readBy array'
      );
    });
  });

  // =========================================================================
  // 7. Persistent Notifications & Cross-User Privacy
  // =========================================================================
  describe('7. Persistent Notifications & Privacy Security', () => {
    let sentNotif;

    test('REST send creates persistent notification for recipient and emits socket push', async () => {
      const receiverClient = createSocketClient(ownerToken);
      await new Promise((resolve) => receiverClient.on('connect', resolve));

      const pushPromise = new Promise((resolve) => {
        receiverClient.on('notification:new', (notif) => resolve(notif));
      });

      // Send message via REST fallback
      const sendRes = await fetch(`${baseUrl}/chats/conversations/${projectConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          content: 'Important notification trigger message via REST',
        }),
      });

      assert.equal(sendRes.status, 201);

      // Wait for real-time notification push
      const pushedNotif = await pushPromise;
      receiverClient.disconnect();

      assert.ok(pushedNotif);
      assert.equal(pushedNotif.type, 'message');
      assert.equal(String(pushedNotif.recipient), String(ownerUser._id));
      assert.match(pushedNotif.message, /notification trigger message/i);

      sentNotif = pushedNotif;
    });

    test('GET /notifications retrieves caller notifications with unread count', async () => {
      const res = await fetch(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.notifications));
      assert.ok(data.unreadCount >= 1);
    });

    test('Cross-user privacy: outsider cannot access or mark another user notification', async () => {
      const res = await fetch(`${baseUrl}/notifications/${sentNotif._id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${outsiderToken}` },
      });

      assert.equal(res.status, 404); // 404 because query filters by recipient: req.user._id
    });

    test('PATCH /notifications/read-all marks all notifications read for recipient', async () => {
      const res = await fetch(`${baseUrl}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.unreadCount, 0);

      // Verify unread count endpoint returns 0
      const countRes = await fetch(`${baseUrl}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const countData = await countRes.json();
      assert.equal(countData.count, 0);
    });
  });

  // =========================================================================
  // 8. Ephemeral Typing Indicators (Never Persisted in DB)
  // =========================================================================
  describe('8. Ephemeral Typing Indicators', () => {
    test('Typing indicator broadcasts to room participants without persisting to DB', async () => {
      const client1 = createSocketClient(memberToken);
      const client2 = createSocketClient(ownerToken);

      await Promise.all([
        new Promise((resolve) => client1.on('connect', resolve)),
        new Promise((resolve) => client2.on('connect', resolve)),
      ]);

      // Both join conversation room
      await Promise.all([
        new Promise((resolve) => client1.emit('join_conversation', { conversationId: projectConversation._id }, resolve)),
        new Promise((resolve) => client2.emit('join_conversation', { conversationId: projectConversation._id }, resolve)),
      ]);

      const typingPromise = new Promise((resolve) => {
        client2.on('typing:status', (data) => resolve(data));
      });

      client1.emit('typing:start', { conversationId: projectConversation._id });

      const typingData = await typingPromise;
      client1.disconnect();
      client2.disconnect();

      assert.equal(String(typingData.conversationId), String(projectConversation._id));
      assert.equal(String(typingData.userId), String(memberUser._id));
      assert.equal(typingData.isTyping, true);

      // Verify typing indicator was NEVER saved as a chat message in MongoDB
      const typingMsg = await Message.findOne({
        conversation: projectConversation._id,
        content: { $regex: /typing/i },
      });
      assert.equal(typingMsg, null, 'Typing indicators must never be persisted as messages');
    });
  });

  // =========================================================================
  // 9. Direct Conversations & REST Fallback Delivery
  // =========================================================================
  describe('9. Direct Conversations & REST Fallback', () => {
    test('POST /chats/direct creates or retrieves 1-on-1 direct conversation', async () => {
      const res = await fetch(`${baseUrl}/chats/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ recipientId: ownerUser._id }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.type, 'direct');
      directConversation = data.conversation;
    });

    test('REST message sending works when client is disconnected from Socket.IO', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          content: 'Reliable direct message delivered via REST fallback',
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.message.content, 'Reliable direct message delivered via REST fallback');

      // Verify conversation lastMessage was updated
      const updatedConv = await Conversation.findById(directConversation._id);
      assert.equal(updatedConv.lastMessage.text, 'Reliable direct message delivered via REST fallback');
    });

    test('GET /chats/conversations lists conversations for current user with unread counts', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      assert.equal(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.length >= 2, 'Should include project conversation and direct conversation');
    });
  });

  // =========================================================================
  // 10. Direct Chat Lifecycle & Duplicate Prevention
  // =========================================================================
  describe('10. Direct Chat Lifecycle & Duplicate Prevention', () => {
    test('POST /chats/direct from User A to User B, and User B to User A returns same conversation', async () => {
      // User A (memberUser) creates/gets direct conversation with outsiderUser
      const res1 = await fetch(`${baseUrl}/chats/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ recipientId: outsiderUser._id }),
      });
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);
      const convId1 = data1.conversation._id;

      // User B (outsiderUser) creates/gets direct conversation with memberUser
      const res2 = await fetch(`${baseUrl}/chats/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${outsiderToken}`,
        },
        body: JSON.stringify({ recipientId: memberUser._id }),
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      const convId2 = data2.conversation._id;

      // Assert they are the exact same conversation document in MongoDB
      assert.equal(String(convId1), String(convId2), 'Should reuse existing direct conversation');

      // Check DB to ensure no duplicate direct conversation documents exist for this pair
      const count = await Conversation.countDocuments({
        type: 'direct',
        participants: { $all: [memberUser._id, outsiderUser._id], $size: 2 },
      });
      assert.equal(count, 1, 'Exactly one conversation document must exist for user pair');
    });

    test('POST /chats/direct with oneself returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/chats/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ recipientId: memberUser._id }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /cannot start conversation with yourself/i);
    });
  });

  // =========================================================================
  // 11. Secure Attachment Messaging & Validation
  // =========================================================================
  describe('11. Secure Attachment Messaging & Validation', () => {
    test('POST message with valid HTTPS attachment succeeds (201)', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          content: 'Here is the project specification document',
          attachments: [
            {
              url: 'https://devconnect.storage/specs/project-architecture.pdf',
              fileName: 'project-architecture.pdf',
              fileType: 'pdf',
              fileSize: 1048576,
            },
          ],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.message.attachments.length, 1);
      assert.equal(data.message.attachments[0].fileName, 'project-architecture.pdf');
    });

    test('POST message with unsafe attachment protocol (javascript:...) is rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          content: 'Check this exploit payload',
          attachments: [
            {
              url: 'javascript:alert(document.cookie)',
              fileName: 'exploit.js',
            },
          ],
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /invalid attachment/i);
    });

    test('POST message with more than 10 attachments is rejected with 400', async () => {
      const excessiveAttachments = Array.from({ length: 11 }, (_, i) => ({
        url: `https://example.com/file${i}.png`,
        fileName: `file${i}.png`,
      }));

      const res = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          content: 'Too many files attached',
          attachments: excessiveAttachments,
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  // =========================================================================
  // 12. Delete For Me Scoping & Privacy Verification
  // =========================================================================
  describe('12. Delete For Me Scoping & Privacy', () => {
    let testMsgId;

    before(async () => {
      const sendRes = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ content: 'Confidential note to test delete for me' }),
      });
      const data = await sendRes.json();
      testMsgId = data.message._id;
    });

    test('DELETE /chats/messages/:id with deleteForEveryone: false removes message from caller view only', async () => {
      // MemberUser deletes for themselves only
      const delRes = await fetch(`${baseUrl}/chats/messages/${testMsgId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ deleteForEveryone: false }),
      });
      assert.equal(delRes.status, 200);

      // Verify memberUser no longer sees the message in message history
      const memberHistoryRes = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const memberHistory = await memberHistoryRes.json();
      const existsInMember = memberHistory.messages.some((m) => String(m._id) === String(testMsgId));
      assert.equal(existsInMember, false, 'Message should be removed from caller view');

      // Verify ownerUser (recipient) can STILL see the message in their message history!
      const ownerHistoryRes = await fetch(`${baseUrl}/chats/conversations/${directConversation._id}/messages`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const ownerHistory = await ownerHistoryRes.json();
      const existsInOwner = ownerHistory.messages.some((m) => String(m._id) === String(testMsgId));
      assert.equal(existsInOwner, true, 'Message must remain visible to the other participant');
    });
  });

  // =========================================================================
  // 13. Project Membership Revocation & Access Termination
  // =========================================================================
  describe('13. Project Membership Revocation & Access Termination', () => {
    let revokedProject;
    let revokedConv;
    let tempMember;
    let tempToken;

    before(async () => {
      tempMember = await User.create({
        name: `Revoked Member ${uniqueSuffix}`,
        email: `revoked.${uniqueSuffix}@test.devconnect.com`,
        username: `revoked_${uniqueSuffix}`,
        password: 'Password123!',
        role: 'developer',
        status: 'active',
      });
      tempToken = createJwtToken(tempMember._id);
      createdUserIds.push(tempMember._id);

      revokedProject = await Project.create({
        title: `Revocation Test Gig ${uniqueSuffix}`,
        description: 'Testing real-time access revocation.',
        category: 'Web Development',
        owner: ownerUser._id,
        teamSize: 2,
        status: 'open',
      });
      createdProjectIds.push(revokedProject._id);

      // Add as active member
      await ProjectMember.create({
        project: revokedProject._id,
        user: tempMember._id,
        role: 'member',
        status: 'active',
      });

      revokedConv = await Conversation.create({
        type: 'project',
        project: revokedProject._id,
        title: revokedProject.title,
        participants: [ownerUser._id, tempMember._id],
      });
    });

    test('Active member can access project chat, then access is immediately revoked upon removal', async () => {
      // 1. While active: GET /chats/project/:projectId succeeds (200)
      const resActive = await fetch(`${baseUrl}/chats/project/${revokedProject._id}`, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(resActive.status, 200);

      // 2. Remove member from project (simulate membership termination / removal)
      await ProjectMember.deleteOne({ project: revokedProject._id, user: tempMember._id });

      // 3. After removal: GET /chats/project/:projectId returns 403 Forbidden!
      const resRevoked = await fetch(`${baseUrl}/chats/project/${revokedProject._id}`, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(resRevoked.status, 403);

      // 4. Messages endpoint also returns 403 Forbidden!
      const resMessages = await fetch(`${baseUrl}/chats/conversations/${revokedConv._id}/messages`, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(resMessages.status, 403);
    });

    test('Removed member is rejected when attempting to join Socket.IO room (UNAUTHORIZED)', async () => {
      const client = createSocketClient(tempToken);
      await new Promise((resolve) => client.on('connect', resolve));

      const joinResult = await new Promise((resolve) => {
        client.emit('join_conversation', { conversationId: revokedConv._id }, (response) => {
          resolve(response);
        });
      });

      client.disconnect();
      assert.equal(joinResult.success, false);
      assert.equal(joinResult.error.code, 'UNAUTHORIZED');
    });
  });

  // =========================================================================
  // 14. Multi-Client Real-Time Synchronization & Read Receipts
  // =========================================================================
  describe('14. Multi-Client Real-Time Synchronization & Read Receipts', () => {
    test('Two distinct socket clients exchange message and confirm real-time read receipt', async () => {
      const clientAlice = createSocketClient(memberToken);
      const clientBob = createSocketClient(ownerToken);

      await Promise.all([
        new Promise((resolve) => clientAlice.on('connect', resolve)),
        new Promise((resolve) => clientBob.on('connect', resolve)),
      ]);

      // Both join conversation
      await Promise.all([
        new Promise((resolve) =>
          clientAlice.emit('join_conversation', { conversationId: directConversation._id }, resolve)
        ),
        new Promise((resolve) =>
          clientBob.emit('join_conversation', { conversationId: directConversation._id }, resolve)
        ),
      ]);

      // Bob listens for message:new
      const bobReceivePromise = new Promise((resolve) => {
        clientBob.on('message:new', (msg) => resolve(msg));
      });

      // Alice emits send_message
      clientAlice.emit('send_message', {
        conversationId: directConversation._id,
        content: 'Hey Bob, live socket sync test!',
      });

      const receivedMsg = await bobReceivePromise;
      assert.equal(receivedMsg.content, 'Hey Bob, live socket sync test!');
      assert.equal(String(receivedMsg.sender._id || receivedMsg.sender), String(memberUser._id));

      // Alice listens for conversation:read event
      const aliceReadPromise = new Promise((resolve) => {
        clientAlice.on('conversation:read', (data) => resolve(data));
      });

      // Bob emits message:read
      clientBob.emit('message:read', {
        conversationId: directConversation._id,
        messageId: receivedMsg._id,
      });

      const readEvent = await aliceReadPromise;
      assert.equal(String(readEvent.conversationId), String(directConversation._id));
      assert.equal(String(readEvent.userId), String(ownerUser._id));

      clientAlice.disconnect();
      clientBob.disconnect();
    });
  });
});
