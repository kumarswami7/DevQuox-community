import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Project } from '../models/Project.js';
import { sendNotification } from '../utils/notifications.js';
import {
  verifyConversationAccess,
  verifyProjectWorkspaceAccess,
} from '../utils/chatPermissions.js';
import { validateAttachments } from '../routes/chatRoutes.js';

// Simple in-memory rate limiter per socket: max 15 messages per 5 seconds
const rateLimitMap = new Map();

// Workspace Member Presence Map: projectId -> Map<userId, { user, sockets: Set<socketId> }>
const projectPresence = new Map();

const addProjectPresence = (projectId, socketId, user) => {
  const pId = String(projectId);
  const uId = String(user._id);
  if (!projectPresence.has(pId)) {
    projectPresence.set(pId, new Map());
  }
  const membersMap = projectPresence.get(pId);
  if (!membersMap.has(uId)) {
    membersMap.set(uId, {
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar || user.avatarUrl || '',
        role: user.role,
      },
      sockets: new Set(),
    });
  }
  membersMap.get(uId).sockets.add(socketId);
  return getOnlineMembers(pId);
};

const removeProjectPresence = (projectId, socketId, userId) => {
  const pId = String(projectId);
  const uId = String(userId);
  const membersMap = projectPresence.get(pId);
  if (!membersMap || !membersMap.has(uId)) return null;
  const record = membersMap.get(uId);
  record.sockets.delete(socketId);
  if (record.sockets.size === 0) {
    membersMap.delete(uId);
  }
  if (membersMap.size === 0) {
    projectPresence.delete(pId);
  }
  return getOnlineMembers(pId);
};

const getOnlineMembers = (projectId) => {
  const membersMap = projectPresence.get(String(projectId));
  if (!membersMap) return [];
  return Array.from(membersMap.values()).map((r) => r.user);
};

const checkRateLimit = (socketId) => {
  const now = Date.now();
  const windowMs = 5000;
  const maxEvents = 15;

  let timestamps = rateLimitMap.get(socketId) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxEvents) {
    return false;
  }

  timestamps.push(now);
  rateLimitMap.set(socketId, timestamps);
  return true;
};

export function setupSocketServer(io) {
  // 1. Connection Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        } else {
          token = authHeader;
        }
      }

      if (!token && socket.handshake.headers?.cookie) {
        const cookieMatch = socket.handshake.headers.cookie
          .split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith('token='));
        if (cookieMatch) {
          token = cookieMatch.split('=')[1];
        }
      }

      if (!token || token === 'null' || token === 'undefined') {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'devconnect-secret-key-super-safe'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status && user.status !== 'active') {
        return next(new Error(`Account is ${user.status}. Access denied.`));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: ' + (err.message || 'Invalid token')));
    }
  });

  // 2. Connection Handler
  io.on('connection', (socket) => {
    const user = socket.user;
    const userIdStr = String(user._id);

    // Join personal rooms for direct user pushes
    socket.join(`user:${userIdStr}`);
    socket.join(userIdStr);

    socket.emit('connection:success', {
      status: 'authenticated',
      userId: user._id,
      name: user.name,
      socketId: socket.id,
    });

    // -------------------------------------------------------------
    // JOIN CONVERSATION ROOM (Project or Direct)
    // -------------------------------------------------------------
    socket.on('join_conversation', async (data, ack) => {
      try {
        const conversationId = typeof data === 'string' ? data : data?.conversationId;
        if (!conversationId) {
          const errPayload = { message: 'Conversation identifier is required', code: 'INVALID_PAYLOAD' };
          if (typeof ack === 'function') ack({ success: false, error: errPayload });
          return socket.emit('error', errPayload);
        }

        const auth = await verifyConversationAccess(user._id, conversationId);
        if (!auth.allowed) {
          const errPayload = { message: auth.error, code: 'UNAUTHORIZED' };
          if (typeof ack === 'function') ack({ success: false, error: errPayload });
          return socket.emit('error', errPayload);
        }

        const room = `conversation:${conversationId}`;
        socket.join(room);

        const successPayload = {
          conversationId,
          room,
          isProject: Boolean(auth.isProject),
          projectId: auth.project?._id,
          message: 'Joined conversation room successfully',
        };

        if (typeof ack === 'function') ack({ success: true, data: successPayload });
        socket.emit('conversation:joined', successPayload);
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'INTERNAL_ERROR' });
      }
    });

    // -------------------------------------------------------------
    // LEAVE CONVERSATION ROOM
    // -------------------------------------------------------------
    socket.on('leave_conversation', (data, ack) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        if (typeof ack === 'function') ack({ success: true });
        socket.emit('conversation:left', { conversationId });
      }
    });

    // -------------------------------------------------------------
    // JOIN PROJECT WORKSPACE ROOM
    // -------------------------------------------------------------
    socket.on('join_project_workspace', async (data, ack) => {
      try {
        const { projectId } = data || {};
        if (!projectId) {
          const errPayload = { message: 'Project identifier is required', code: 'INVALID_PAYLOAD' };
          if (typeof ack === 'function') ack({ success: false, error: errPayload });
          return socket.emit('error', errPayload);
        }

        const auth = await verifyProjectWorkspaceAccess(user._id, projectId);
        if (!auth.allowed) {
          const errPayload = { message: auth.error, code: 'UNAUTHORIZED' };
          if (typeof ack === 'function') ack({ success: false, error: errPayload });
          return socket.emit('error', errPayload);
        }

        // Join project room
        const projectRoom = `project:${projectId}`;
        socket.join(projectRoom);

        socket.activeProjects = socket.activeProjects || new Set();
        socket.activeProjects.add(String(projectId));

        // Track live presence and notify room
        const onlineMembers = addProjectPresence(projectId, socket.id, user);
        io.to(projectRoom).emit('presence:updated', { projectId: String(projectId), onlineMembers });

        // Find or create project conversation
        let conversation = await Conversation.findOne({ project: projectId });
        if (!conversation) {
          conversation = await Conversation.create({
            type: 'project',
            project: projectId,
            title: auth.project?.title || 'Project Workspace',
            participants: [auth.project?.owner, user._id].filter(Boolean),
          });
        } else if (!conversation.participants.some((p) => String(p) === userIdStr)) {
          conversation.participants.push(user._id);
          await conversation.save();
        }

        // Join conversation room
        socket.join(`conversation:${conversation._id}`);

        const responsePayload = {
          projectId,
          conversationId: conversation._id,
          role: auth.role,
          onlineMembers,
          message: 'Joined project workspace and conversation',
        };

        if (typeof ack === 'function') ack({ success: true, data: responsePayload });
        socket.emit('workspace_joined', responsePayload);
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'INTERNAL_ERROR' });
      }
    });

    // -------------------------------------------------------------
    // LEAVE PROJECT WORKSPACE ROOM
    // -------------------------------------------------------------
    socket.on('leave_project_workspace', ({ projectId } = {}, ack) => {
      if (!projectId) return;
      const pId = String(projectId);
      socket.leave(`project:${pId}`);
      if (socket.activeProjects) socket.activeProjects.delete(pId);
      const onlineMembers = removeProjectPresence(pId, socket.id, user._id);
      if (onlineMembers) {
        io.to(`project:${pId}`).emit('presence:updated', { projectId: pId, onlineMembers });
      }
      if (typeof ack === 'function') ack({ success: true });
    });

    // -------------------------------------------------------------
    // SEND MESSAGE (Real-time Chat with DB Persistence)
    // -------------------------------------------------------------
    socket.on('send_message', async (data, ack) => {
      try {
        if (!checkRateLimit(socket.id)) {
          const rateErr = { message: 'Too many messages. Please slow down.', code: 'RATE_LIMIT' };
          if (typeof ack === 'function') ack({ success: false, error: rateErr });
          return socket.emit('error', rateErr);
        }

        const {
          conversationId,
          recipientId,
          content,
          text,
          attachments,
        } = data || {};

        const messageText = (content || text || '').trim();
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!messageText && !hasAttachments) {
          const valErr = { message: 'Message text or attachment is required', code: 'VALIDATION_ERROR' };
          if (typeof ack === 'function') ack({ success: false, error: valErr });
          return socket.emit('error', valErr);
        }

        if (messageText.length > 4000) {
          const valErr = { message: 'Message exceeds maximum length of 4000 characters', code: 'VALIDATION_ERROR' };
          if (typeof ack === 'function') ack({ success: false, error: valErr });
          return socket.emit('error', valErr);
        }

        if (!validateAttachments(attachments)) {
          const attErr = { message: 'Invalid attachment format or unsafe attachment URL', code: 'VALIDATION_ERROR' };
          if (typeof ack === 'function') ack({ success: false, error: attErr });
          return socket.emit('error', attErr);
        }

        let conv;

        // Resolve conversation
        if (conversationId) {
          const auth = await verifyConversationAccess(user._id, conversationId);
          if (!auth.allowed) {
            const authErr = { message: auth.error, code: 'UNAUTHORIZED' };
            if (typeof ack === 'function') ack({ success: false, error: authErr });
            return socket.emit('error', authErr);
          }
          conv = auth.conversation;
        } else if (recipientId) {
          // Direct 1-on-1 chat
          conv = await Conversation.findOne({
            type: 'direct',
            participants: { $all: [user._id, recipientId], $size: 2 },
          });

          if (!conv) {
            conv = await Conversation.create({
              type: 'direct',
              participants: [user._id, recipientId],
              title: '',
            });
          }
        } else {
          const payloadErr = { message: 'Either conversationId or recipientId must be provided', code: 'INVALID_PAYLOAD' };
          if (typeof ack === 'function') ack({ success: false, error: payloadErr });
          return socket.emit('error', payloadErr);
        }

        // Create and persist message
        const targetRecipient =
          conv.type === 'direct'
            ? conv.participants.find((p) => String(p) !== userIdStr)
            : undefined;

        const newMessage = await Message.create({
          conversation: conv._id,
          sender: user._id,
          recipient: targetRecipient,
          content: messageText,
          attachments: attachments || [],
          readBy: [{ user: user._id, readAt: new Date() }],
        });

        // Update conversation summary & readState
        conv.lastMessage = {
          text: messageText || (hasAttachments ? '📎 Attachment' : ''),
          sender: user._id,
          createdAt: new Date(),
        };
        conv.lastMessageDate = new Date();

        // Update sender's readState
        const existingReadIndex = conv.readState.findIndex(
          (rs) => String(rs.user) === userIdStr
        );
        if (existingReadIndex >= 0) {
          conv.readState[existingReadIndex].lastReadAt = new Date();
          conv.readState[existingReadIndex].lastReadMessage = newMessage._id;
        } else {
          conv.readState.push({
            user: user._id,
            lastReadAt: new Date(),
            lastReadMessage: newMessage._id,
          });
        }

        // Add sender to participants if not present
        if (!conv.participants.some((p) => String(p) === userIdStr)) {
          conv.participants.push(user._id);
        }

        await conv.save();

        const populated = await Message.findById(newMessage._id).populate(
          'sender',
          'name email avatar avatarUrl role'
        );

        // Real-time broadcast
        const conversationRoom = `conversation:${conv._id}`;
        io.to(conversationRoom).emit('message:new', populated);

        // If direct recipient, also emit to recipient's personal room
        if (targetRecipient) {
          const recStr = String(targetRecipient);
          io.to(`user:${recStr}`).emit('receive_message', populated);
          io.to(recStr).emit('receive_message', populated);
        }

        if (typeof ack === 'function') {
          ack({ success: true, data: populated });
        }

        // Send persistent notification for other participants
        const otherParticipants = conv.participants.filter(
          (p) => String(p) !== userIdStr
        );

        for (const recipientUser of otherParticipants) {
          const notifTitle =
            conv.type === 'project'
              ? `Project: ${conv.title || 'Team Workspace'}`
              : user.name;

          sendNotification({
            recipient: recipientUser,
            sender: user._id,
            type: 'message',
            title: notifTitle,
            message: messageText || 'Sent an attachment',
            project: conv.project,
            conversation: conv._id,
            messageRef: newMessage._id,
            link: conv.project ? `/workspace/${conv.project}` : `/messages`,
          }).catch(() => {});
        }
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'INTERNAL_ERROR' });
      }
    });

    // -------------------------------------------------------------
    // EDIT MESSAGE
    // -------------------------------------------------------------
    socket.on('message:edit', async (data, ack) => {
      try {
        const { messageId, content, text } = data || {};
        const newText = (content || text || '').trim();

        if (!messageId || !newText) {
          const errVal = { message: 'Message ID and updated text are required', code: 'INVALID_PAYLOAD' };
          if (typeof ack === 'function') ack({ success: false, error: errVal });
          return socket.emit('error', errVal);
        }

        if (newText.length > 4000) {
          const errLen = { message: 'Message content cannot exceed 4000 characters', code: 'VALIDATION_ERROR' };
          if (typeof ack === 'function') ack({ success: false, error: errLen });
          return socket.emit('error', errLen);
        }

        const msg = await Message.findById(messageId);
        if (!msg) {
          const errNotFound = { message: 'Message not found', code: 'NOT_FOUND' };
          if (typeof ack === 'function') ack({ success: false, error: errNotFound });
          return socket.emit('error', errNotFound);
        }

        if (String(msg.sender) !== userIdStr) {
          const errAuth = { message: 'You can only edit your own messages', code: 'UNAUTHORIZED' };
          if (typeof ack === 'function') ack({ success: false, error: errAuth });
          return socket.emit('error', errAuth);
        }

        if (msg.isDeleted) {
          const errDel = { message: 'Cannot edit a deleted message', code: 'INVALID_STATE' };
          if (typeof ack === 'function') ack({ success: false, error: errDel });
          return socket.emit('error', errDel);
        }

        msg.content = newText;
        msg.isEdited = true;
        msg.editedAt = new Date();
        await msg.save();

        const updatePayload = {
          messageId: msg._id,
          conversationId: msg.conversation,
          content: msg.content,
          isEdited: true,
          editedAt: msg.editedAt,
        };

        if (msg.conversation) {
          io.to(`conversation:${msg.conversation}`).emit('message:updated', updatePayload);
        }

        if (typeof ack === 'function') ack({ success: true, data: updatePayload });
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'INTERNAL_ERROR' });
      }
    });

    // -------------------------------------------------------------
    // DELETE MESSAGE
    // -------------------------------------------------------------
    socket.on('message:delete', async (data, ack) => {
      try {
        const { messageId, deleteForEveryone } = data || {};
        if (!messageId) {
          const errVal = { message: 'Message ID is required', code: 'INVALID_PAYLOAD' };
          if (typeof ack === 'function') ack({ success: false, error: errVal });
          return socket.emit('error', errVal);
        }

        const msg = await Message.findById(messageId);
        if (!msg) {
          const errNotFound = { message: 'Message not found', code: 'NOT_FOUND' };
          if (typeof ack === 'function') ack({ success: false, error: errNotFound });
          return socket.emit('error', errNotFound);
        }

        const isSender = String(msg.sender) === userIdStr;

        // If not sender, check if workspace owner
        let isWorkspaceOwner = false;
        if (msg.conversation) {
          const conv = await Conversation.findById(msg.conversation);
          if (conv?.project) {
            const proj = await Project.findById(conv.project);
            if (proj && String(proj.owner) === userIdStr) {
              isWorkspaceOwner = true;
            }
          }
        }

        if (deleteForEveryone) {
          if (!isSender && !isWorkspaceOwner) {
            const errAuth = { message: 'Only the sender or project owner can delete message for everyone', code: 'UNAUTHORIZED' };
            if (typeof ack === 'function') ack({ success: false, error: errAuth });
            return socket.emit('error', errAuth);
          }

          msg.isDeleted = true;
          msg.deletedForEveryone = true;
          msg.deletedAt = new Date();
          msg.content = '🚫 This message was deleted';
          await msg.save();

          const deletePayload = {
            messageId: msg._id,
            conversationId: msg.conversation,
            deleteForEveryone: true,
          };

          if (msg.conversation) {
            io.to(`conversation:${msg.conversation}`).emit('message:deleted', deletePayload);
          }

          if (typeof ack === 'function') ack({ success: true, data: deletePayload });
        } else {
          // Delete for me only (requires conversation access)
          if (!msg.deletedForMe.includes(user._id)) {
            msg.deletedForMe.push(user._id);
            await msg.save();
          }
          if (typeof ack === 'function') ack({ success: true, data: { messageId: msg._id, deleteForMe: true } });
        }
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'INTERNAL_ERROR' });
      }
    });

    // -------------------------------------------------------------
    // TYPING INDICATORS (Ephemeral — NOT persisted to DB)
    // -------------------------------------------------------------
    socket.on('typing:start', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId: user._id,
          userName: user.name,
          isTyping: true,
        });
      }
      if (recipientId) {
        io.to(String(recipientId)).emit('user_typing', { userId: user._id, userName: user.name });
      }
    });

    socket.on('typing:stop', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId: user._id,
          userName: user.name,
          isTyping: false,
        });
      }
      if (recipientId) {
        io.to(String(recipientId)).emit('user_stop_typing', { userId: user._id, userName: user.name });
      }
    });

    // Legacy typing events
    socket.on('typing', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId: user._id,
          userName: user.name,
          isTyping: true,
        });
      }
      if (recipientId) {
        io.to(String(recipientId)).emit('user_typing', { userId: user._id, userName: user.name });
      }
    });

    socket.on('stop_typing', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:status', {
          conversationId,
          userId: user._id,
          userName: user.name,
          isTyping: false,
        });
      }
      if (recipientId) {
        io.to(String(recipientId)).emit('user_stop_typing', { userId: user._id, userName: user.name });
      }
    });

    // -------------------------------------------------------------
    // READ RECEIPTS & UNREAD TRACKING
    // -------------------------------------------------------------
    socket.on('message:read', async (data) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) return;

        // Mark messages read in DB for this user
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: user._id },
            'readBy.user': { $ne: user._id },
          },
          {
            $push: { readBy: { user: user._id, readAt: new Date() } },
            $set: { read: true },
          }
        );

        // Update read cursor in conversation
        await Conversation.updateOne(
          { _id: conversationId, 'readState.user': user._id },
          { $set: { 'readState.$.lastReadAt': new Date() } }
        );

        // Broadcast read receipt to room
        io.to(`conversation:${conversationId}`).emit('conversation:read', {
          conversationId,
          userId: user._id,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('[Socket] Read receipt update error:', err.message);
      }
    });

    // -------------------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      rateLimitMap.delete(socket.id);
      if (socket.activeProjects && socket.activeProjects.size > 0) {
        for (const pId of socket.activeProjects) {
          const onlineMembers = removeProjectPresence(pId, socket.id, user._id);
          if (onlineMembers) {
            io.to(`project:${pId}`).emit('presence:updated', { projectId: pId, onlineMembers });
          }
        }
        socket.activeProjects.clear();
      }
    });
  });
}

export default setupSocketServer;
