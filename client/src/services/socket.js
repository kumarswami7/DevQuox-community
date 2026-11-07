import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

let socket = null;
const joinedConversations = new Set();
const joinedProjects = new Set();

/**
 * Get or initialize the singleton Socket.IO connection.
 * Connects with authenticated user's JWT token.
 */
export const getSocket = () => {
  const token = useAuthStore.getState().token;

  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket) {
    // If socket exists but disconnected or token changed, reconnect
    if (!socket.connected && !socket.connecting) {
      socket.auth = { token };
      socket.connect();
    }
    return socket;
  }

  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // Vercel serverless functions do not support continuous WebSocket / Socket.IO connections.
  // Unless an explicit dedicated WebSocket server (VITE_SOCKET_URL) is configured,
  // skip socket connection in production to avoid console spam and failed handshakes.
  if (isProd && !import.meta.env.VITE_SOCKET_URL) {
    return null;
  }

  let socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

  try {
    const parsed = new URL(socketUrl, window.location.origin);
    socketUrl = `${parsed.protocol}//${parsed.host}`;
  } catch (err) {
    console.debug('Socket URL parse fallback', err);
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    // Re-establish authorized conversation and project subscriptions after reconnect
    joinedConversations.forEach((convId) => {
      socket.emit('join_conversation', { conversationId: convId });
    });
    joinedProjects.forEach((projId) => {
      socket.emit('join_project_workspace', { projectId: projId });
    });
  });

  socket.on('connect_error', (err) => {
    // Log friendly warning without exposing auth secrets
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Socket] Connection status:', err.message);
    }
  });

  return socket;
};

/**
 * Join an authorized conversation room.
 */
export const joinConversationRoom = (conversationId, ack) => {
  if (!conversationId) return;
  joinedConversations.add(conversationId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_conversation', { conversationId }, ack);
  }
};

/**
 * Leave a conversation room.
 */
export const leaveConversationRoom = (conversationId) => {
  if (!conversationId) return;
  joinedConversations.delete(conversationId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('leave_conversation', { conversationId });
  }
};

/**
 * Join an authorized project workspace room.
 */
export const joinProjectWorkspaceRoom = (projectId, ack) => {
  if (!projectId) return;
  joinedProjects.add(projectId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_project_workspace', { projectId }, ack);
  }
};

/**
 * Leave a project workspace room.
 */
export const leaveProjectWorkspaceRoom = (projectId) => {
  if (!projectId) return;
  joinedProjects.delete(projectId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('leave_project_workspace', { projectId });
  }
};

/**
 * Send real-time chat message.
 */
export const sendSocketMessage = (payload, ack) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('send_message', payload, ack);
    return true;
  }
  return false;
};

/**
 * Emit typing indicators.
 */
export const emitTyping = (conversationId, isTyping) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  }
};

/**
 * Emit read status update.
 */
export const emitMessageRead = (conversationId) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('message:read', { conversationId });
  }
};

/**
 * Disconnect and tear down active socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  joinedConversations.clear();
  joinedProjects.clear();
};

export default {
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  joinProjectWorkspaceRoom,
  leaveProjectWorkspaceRoom,
  sendSocketMessage,
  emitTyping,
  emitMessageRead,
  disconnectSocket,
};
