/**
 * Centralized Real-time WebSocket Event Dispatcher
 *
 * Implements Phase 12 standardized event payloads, room-targeted broadcasting,
 * and user permission synchronization across the DevConnect platform.
 */

/**
 * Creates an authoritative, standardized event payload matching Phase 5 specification:
 * - eventId: unique string
 * - projectId: string
 * - resourceId: string | null
 * - actor: { _id, name, avatar, role }
 * - eventType: string
 * - timestamp: ISO string
 * - data: payload object
 */
export const createEventPayload = ({
  projectId,
  resourceId = null,
  actor = null,
  eventType,
  data = null,
}) => ({
  eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  projectId: projectId ? String(projectId) : null,
  resourceId: resourceId ? String(resourceId) : null,
  actor: actor
    ? {
        _id: String(actor._id || actor.id),
        name: actor.name || 'Team Member',
        avatar: actor.avatar || actor.avatarUrl || '',
        role: actor.role || 'member',
      }
    : null,
  eventType,
  timestamp: new Date().toISOString(),
  data,
});

/**
 * Broadcasts an authoritative event to a project-specific room (`project:${projectId}`).
 *
 * @param {string|ObjectId} projectId - Project identifier
 * @param {string} eventType - Event name (e.g. 'task:created', 'task:statusChanged')
 * @param {Object} data - Resource payload
 * @param {Object} options - { actor, resourceId, excludeSocketId }
 * @returns {Object|null} Emitted payload or null if socket is not available
 */
export const emitToProject = (
  projectId,
  eventType,
  data,
  { actor = null, resourceId = null, excludeSocketId = null } = {}
) => {
  const io = global.io;
  if (!io || !projectId) return null;

  const payload = createEventPayload({
    projectId,
    resourceId,
    actor,
    eventType,
    data,
  });

  const room = `project:${projectId}`;

  if (excludeSocketId) {
    io.to(room).except(excludeSocketId).emit(eventType, payload);
  } else {
    io.to(room).emit(eventType, payload);
  }

  return payload;
};

/**
 * Emits an event directly to a user's personal channel (`user:${userId}`).
 *
 * @param {string|ObjectId} userId - User identifier
 * @param {string} eventType - Event name (e.g. 'notification:new', 'workspace:revoked')
 * @param {Object} data - Resource payload
 * @param {Object} options - { actor, resourceId, projectId }
 * @returns {Object|null} Emitted payload
 */
export const emitToUser = (
  userId,
  eventType,
  data,
  { actor = null, resourceId = null, projectId = null } = {}
) => {
  const io = global.io;
  if (!io || !userId) return null;

  const payload = createEventPayload({
    projectId,
    resourceId,
    actor,
    eventType,
    data,
  });

  const uIdStr = String(userId);
  io.to(`user:${uIdStr}`).emit(eventType, payload);
  io.to(uIdStr).emit(eventType, payload);

  return payload;
};

/**
 * Revokes workspace room access for a member who has been removed or has left.
 * Emits 'workspace:revoked' and cleans up socket room membership.
 *
 * @param {string|ObjectId} userId - Removed user
 * @param {string|ObjectId} projectId - Project identifier
 * @param {string} reason - Reason for revocation
 */
export const revokeUserProjectAccess = async (userId, projectId, reason = '') => {
  const io = global.io;
  const uIdStr = String(userId);
  const projIdStr = String(projectId);

  if (io) {
    // Notify the user directly
    emitToUser(uIdStr, 'workspace:revoked', {
      projectId: projIdStr,
      reason: reason || 'Access to this workspace has been revoked.',
    });

    // Make all active sockets for this user leave the project room
    try {
      io.in(`user:${uIdStr}`).socketsLeave(`project:${projIdStr}`);
    } catch (err) {
      // In-memory fallback if socketsLeave is not supported
      console.debug('[Socket] socketsLeave notice:', err.message);
    }
  }
};

