import express from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  verifyConversationAccess,
  verifyProjectWorkspaceAccess,
} from '../utils/chatPermissions.js';
import { sendNotification } from '../utils/notifications.js';

export const chatRouter = express.Router();

/**
 * Validates message attachments array for secure format and supported protocols.
 */
export const validateAttachments = (attachments) => {
  if (!attachments || (Array.isArray(attachments) && attachments.length === 0)) return true;
  if (!Array.isArray(attachments)) return false;
  if (attachments.length > 10) return false;
  for (const att of attachments) {
    if (!att || typeof att !== 'object') return false;
    if (!att.url || typeof att.url !== 'string') return false;
    const url = att.url.trim().toLowerCase();
    const isSafe =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/uploads/') ||
      url.startsWith('data:image/') ||
      url.startsWith('data:application/pdf');
    if (!isSafe) return false;
  }
  return true;
};

/**
 * GET /api/v1/chats/unread-count
 * Returns total unread messages count for authenticated user across all conversations.
 */
chatRouter.get('/unread-count', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find conversations where user is a participant
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const convIds = conversations.map((c) => c._id);

    // Count messages in those conversations where user is NOT sender and user is NOT in readBy, excluding messages deleted for me
    const unreadCount = await Message.countDocuments({
      conversation: { $in: convIds },
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      deletedForMe: { $ne: userId },
      isDeleted: false,
    });

    return res.status(200).json({ success: true, count: unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/chats/conversations
 * Returns all conversations available to the authenticated user (project & direct)
 * with unread message counts, participant details, and latest message preview.
 */
chatRouter.get('/conversations', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name username email avatar avatarUrl role')
      .populate('project', 'title description category status owner')
      .populate('lastMessage.sender', 'name email avatar avatarUrl')
      .sort({ updatedAt: -1 });

    // Validate active access for each conversation and compute unread counts
    const validConversations = [];

    for (const conv of conversations) {
      // If it's a project chat, verify user still has active workspace membership or ownership
      if (conv.type === 'project' && conv.project) {
        const projectId = conv.project._id || conv.project;
        const auth = await verifyProjectWorkspaceAccess(userId, projectId);
        if (!auth.allowed) {
          // Prune revoked member from conversation participants in background
          Conversation.updateOne(
            { _id: conv._id },
            { $pull: { participants: userId } }
          ).catch(() => {});
          continue;
        }
      }

      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        deletedForMe: { $ne: userId },
        isDeleted: false,
      });

      // Determine partner for direct chats
      const partner =
        conv.type === 'direct'
          ? conv.participants.find((p) => String(p._id) !== String(userId)) || conv.participants[0]
          : null;

      validConversations.push({
        _id: conv._id,
        id: conv._id,
        type: conv.type,
        title: conv.type === 'project' ? conv.project?.title || conv.title || 'Project Chat' : partner?.name || 'Direct Chat',
        project: conv.project,
        participants: conv.participants,
        user: partner, // backwards compatibility with legacy UI
        lastMessage: conv.lastMessage?.text || '',
        lastMessageDate: conv.lastMessage?.createdAt || conv.updatedAt,
        updatedAt: conv.updatedAt,
        unreadCount,
      });
    }

    // Deduplicate conversations so each partner and project appears at most once (keeping latest)
    const seenDirectPartners = new Set();
    const seenProjects = new Set();
    const uniqueConversations = [];

    for (const conv of validConversations) {
      if (conv.type === 'direct' && conv.user?._id) {
        const partnerId = String(conv.user._id);
        if (seenDirectPartners.has(partnerId)) {
          continue; // Skip older redundant direct conversation
        }
        seenDirectPartners.add(partnerId);
      } else if (conv.type === 'project' && conv.project?._id) {
        const projId = String(conv.project._id);
        if (seenProjects.has(projId)) {
          continue; // Skip redundant project conversation
        }
        seenProjects.add(projId);
      }
      uniqueConversations.push(conv);
    }

    return res.status(200).json(uniqueConversations);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/chats/project/:projectId
 * Get or create project conversation for authorized workspace members.
 */
chatRouter.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const auth = await verifyProjectWorkspaceAccess(req.user._id, projectId);

    if (!auth.allowed) {
      return res.status(403).json({
        success: false,
        message: auth.error,
      });
    }

    let conv = await Conversation.findOne({ project: projectId })
      .populate('participants', 'name username email avatar avatarUrl role')
      .populate('project', 'title description category status owner');

    if (!conv) {
      conv = await Conversation.create({
        type: 'project',
        project: projectId,
        title: auth.project.title,
        participants: [auth.project.owner, req.user._id].filter(Boolean),
      });

      conv = await Conversation.findById(conv._id)
        .populate('participants', 'name username email avatar avatarUrl role')
        .populate('project', 'title description category status owner');
    } else if (!conv.participants.some((p) => String(p._id) === String(req.user._id))) {
      conv.participants.push(req.user._id);
      await conv.save();
    }

    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/chats/direct
 * Get or create 1-on-1 direct conversation with a recipient.
 */
chatRouter.post('/direct', protect, async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient identifier is required' });
    }

    if (String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot start conversation with yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    let conv = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, recipientId] },
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name username email avatar avatarUrl role');

    if (!conv) {
      conv = await Conversation.create({
        type: 'direct',
        participants: [req.user._id, recipientId],
        title: '',
      });

      conv = await Conversation.findById(conv._id).populate(
        'participants',
        'name username email avatar avatarUrl role'
      );
    }

    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/chats/conversations/:id/messages
 * Paginated message history for a conversation in chronological order.
 * Query params:
 * - limit: default 30 (max 100)
 * - before: cursor message ID or ISO timestamp
 * - page: page number (alternative pagination)
 */
chatRouter.get('/conversations/:id/messages', protect, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const auth = await verifyConversationAccess(req.user._id, rawId);

    if (!auth.allowed) {
      if (auth.notFound) {
        return res.status(200).json({ success: true, messages: [], data: [], pagination: { hasMore: false, total: 0 } });
      }
      return res.status(403).json({ success: false, message: auth.error });
    }

    const conversationId = auth.conversation?._id || rawId;

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const before = req.query.before;
    const page = parseInt(req.query.page, 10) || 1;

    const query = {
      conversation: conversationId,
      deletedForMe: { $ne: req.user._id },
    };

    if (before) {
      if (mongoose.Types.ObjectId.isValid(before)) {
        const cursorMsg = await Message.findById(before);
        if (cursorMsg) {
          query.createdAt = { $lt: cursorMsg.createdAt };
        }
      } else {
        const parsedDate = new Date(before);
        if (!isNaN(parsedDate.getTime())) {
          query.createdAt = { $lt: parsedDate };
        }
      }
    }

    // Retrieve newest messages first, then reverse to chronological order
    const skip = before ? 0 : (page - 1) * limit;

    const messages = await Message.find(query)
      .populate('sender', 'name username email avatar avatarUrl role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reorder to chronological (oldest to newest)
    const chronological = messages.reverse();

    const totalCount = await Message.countDocuments({
      conversation: conversationId,
      deletedForMe: { $ne: req.user._id },
    });

    const hasMore = skip + messages.length < totalCount;

    return res.status(200).json({
      success: true,
      messages: chronological,
      pagination: {
        limit,
        page,
        total: totalCount,
        hasMore,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/chats/conversations/:id/messages
 * REST message send endpoint (reliable fallback for real-time socket).
 */
chatRouter.post('/conversations/:id/messages', protect, async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const auth = await verifyConversationAccess(req.user._id, conversationId);

    if (!auth.allowed) {
      return res.status(403).json({ success: false, message: auth.error });
    }

    const { content, text, attachments } = req.body;
    const messageText = (content || text || '').trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!validateAttachments(attachments)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attachment format or unsafe attachment URL',
      });
    }

    if (!messageText && !hasAttachments) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain either text content or an attachment',
      });
    }

    if (messageText.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot exceed 4000 characters',
      });
    }

    const conv = auth.conversation;
    const targetRecipient =
      conv.type === 'direct'
        ? conv.participants.find((p) => String(p) !== String(req.user._id))
        : undefined;

    const message = await Message.create({
      conversation: conv._id,
      sender: req.user._id,
      recipient: targetRecipient,
      content: messageText,
      attachments: attachments || [],
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update conversation last message
    conv.lastMessage = {
      text: messageText || (hasAttachments ? '📎 Attachment' : ''),
      sender: req.user._id,
      createdAt: new Date(),
    };
    conv.lastMessageDate = new Date();

    const existingReadIndex = conv.readState.findIndex(
      (rs) => String(rs.user) === String(req.user._id)
    );
    if (existingReadIndex >= 0) {
      conv.readState[existingReadIndex].lastReadAt = new Date();
      conv.readState[existingReadIndex].lastReadMessage = message._id;
    } else {
      conv.readState.push({
        user: req.user._id,
        lastReadAt: new Date(),
        lastReadMessage: message._id,
      });
    }

    if (!conv.participants.some((p) => String(p) === String(req.user._id))) {
      conv.participants.push(req.user._id);
    }

    await conv.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name username email avatar avatarUrl role'
    );

    // Real-time broadcast if socket server is active
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(`conversation:${conv._id}`).emit('message:new', populated);
      if (targetRecipient) {
        io.to(String(targetRecipient)).emit('message:new', populated);
      }
    }

    // Persistent notifications for other participants
    const otherParticipants = conv.participants.filter(
      (p) => String(p) !== String(req.user._id)
    );

    for (const recipientUser of otherParticipants) {
      sendNotification({
        recipient: recipientUser,
        sender: req.user._id,
        type: 'message',
        title: conv.type === 'project' ? `Project: ${conv.title || 'Workspace'}` : req.user.name,
        message: messageText || 'Sent an attachment',
        project: conv.project,
        conversation: conv._id,
        messageRef: message._id,
        link: conv.project ? `/workspace/${conv.project}` : `/messages`,
      }).catch(() => {});
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/chats/messages/:id
 * Edit user's own message within policy limits.
 */
chatRouter.patch('/messages/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, text } = req.body;
    const newText = (content || text || '').trim();

    if (!newText) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    if (newText.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot exceed 4000 characters',
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
    }

    message.content = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name username email avatar avatarUrl role'
    );

    const io = req.app.get('io') || global.io;
    if (io && message.conversation) {
      io.to(`conversation:${message.conversation}`).emit('message:updated', {
        messageId: message._id,
        content: message.content,
        isEdited: true,
        editedAt: message.editedAt,
      });
    }

    return res.status(200).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/chats/messages/:id
 * Soft delete a message.
 */
chatRouter.delete('/messages/:id', protect, async (req, res, next) => {
  try {
    const { deleteForEveryone } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const userId = req.user._id;
    const isSender = String(message.sender) === String(userId);

    let isWorkspaceOwner = false;
    if (message.conversation) {
      const conv = await Conversation.findById(message.conversation);
      if (conv?.project) {
        const proj = await Project.findById(conv.project);
        if (proj && String(proj.owner) === String(userId)) {
          isWorkspaceOwner = true;
        }
      }
    }

    if (deleteForEveryone) {
      if (!isSender && !isWorkspaceOwner) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender or project owner can delete message for everyone',
        });
      }

      message.isDeleted = true;
      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      message.content = '🚫 This message was deleted';
      await message.save();

      const io = req.app.get('io') || global.io;
      if (io) {
        const payload = {
          messageId: message._id,
          conversationId: message.conversation,
          deleteForEveryone: true,
        };
        if (message.conversation) {
          io.to(`conversation:${message.conversation}`).emit('message:deleted', payload);
        }
        if (message.recipient) {
          io.to(String(message.recipient)).emit('message_deleted', payload);
        }
        io.to(String(message.sender)).emit('message_deleted', payload);
      }

      return res.status(200).json({ success: true, message: 'Message deleted for everyone', messageId: message._id });
    } else {
      // Delete for caller only
      if (!message.deletedForMe.includes(userId)) {
        message.deletedForMe.push(userId);
        await message.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Message removed from your view',
        messageId: message._id,
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/chats/conversations/:id/read
 * Mark conversation as read for the authenticated user.
 */
chatRouter.post('/conversations/:id/read', protect, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const auth = await verifyConversationAccess(req.user._id, rawId);

    if (!auth.allowed) {
      if (auth.notFound) {
        return res.status(200).json({ success: true, message: 'Conversation read acknowledged' });
      }
      return res.status(403).json({ success: false, message: auth.error });
    }

    const conversationId = auth.conversation?._id || rawId;

    // Mark messages read in DB
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { read: true },
      }
    );

    // Update read cursor in conversation
    await Conversation.updateOne(
      { _id: conversationId, 'readState.user': req.user._id },
      { $set: { 'readState.$.lastReadAt': new Date() } }
    );

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:read', {
        conversationId,
        userId: req.user._id,
        readAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, message: 'Conversation marked as read' });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// BACKWARDS COMPATIBILITY ROUTES FOR PREVIOUS PHASES
// =========================================================================

/**
 * GET /api/v1/chats/messages/:recipientId
 * Legacy direct thread endpoint.
 */
chatRouter.get('/messages/:recipientId', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipientId = req.params.recipientId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ],
      deletedForMe: { $ne: userId },
    })
      .populate('sender', 'name username email avatar avatarUrl role')
      .populate('recipient', 'name username email avatar avatarUrl role')
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/chats/messages
 * Legacy direct message post endpoint.
 */
chatRouter.post('/messages', protect, async (req, res, next) => {
  try {
    const { recipientId, conversationId, text, content, attachments } = req.body;
    const messageText = (content || text || '').trim();

    if (!recipientId && !conversationId) {
      return res.status(400).json({ message: 'Recipient or conversation is required' });
    }

    if (!messageText && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    if (!validateAttachments(attachments)) {
      return res.status(400).json({ message: 'Invalid attachment format or unsafe attachment URL' });
    }

    if (messageText.length > 4000) {
      return res.status(400).json({ message: 'Message content cannot exceed 4000 characters' });
    }

    let conv;
    if (conversationId) {
      conv = await Conversation.findById(conversationId);
    } else {
      conv = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [req.user._id, recipientId], $size: 2 },
      });

      if (!conv) {
        conv = await Conversation.create({
          type: 'direct',
          participants: [req.user._id, recipientId],
          title: '',
        });
      }
    }

    const newMessage = await Message.create({
      conversation: conv?._id,
      sender: req.user._id,
      recipient: recipientId || undefined,
      content: messageText,
      attachments: attachments || [],
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    if (conv) {
      conv.lastMessage = {
        text: messageText,
        sender: req.user._id,
        createdAt: new Date(),
      };
      conv.lastMessageDate = new Date();
      await conv.save();
    }

    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'name username email avatar avatarUrl role')
      .populate('recipient', 'name username email avatar avatarUrl role');

    const io = req.app.get('io') || global.io;
    if (io) {
      if (conv) {
        io.to(`conversation:${conv._id}`).emit('message:new', populated);
      }
      if (recipientId) {
        io.to(String(recipientId)).emit('message:new', populated);
      }
    }

    return res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

export default chatRouter;
