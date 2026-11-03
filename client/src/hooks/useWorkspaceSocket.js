import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinProjectWorkspaceRoom, leaveProjectWorkspaceRoom } from '../services/socket';

/**
 * Custom React hook for robust, real-time WebSocket communication in Protected Project Workspaces.
 *
 * Provides:
 * - Connection status tracking ('connected' | 'reconnecting' | 'offline')
 * - Automatic room joining and leaving
 * - Live presence synchronization (online members tracking)
 * - Event deduplication using a bounded eventId ring buffer
 * - Automatic cleanup of all event listeners on unmount
 * - Authorization revocation handling ('workspace:revoked')
 *
 * @param {Object} options
 * @param {string} options.projectId - The ID of the project workspace
 * @param {Function} [options.onTaskEvent] - Callback for task events (task:created, task:updated, etc.)
 * @param {Function} [options.onMilestoneEvent] - Callback for milestone events
 * @param {Function} [options.onProjectEvent] - Callback for project setting/status events
 * @param {Function} [options.onMemberEvent] - Callback for member joined/removed/role events
 * @param {Function} [options.onActivityEvent] - Callback for activity feed events
 * @param {Function} [options.onPresenceUpdate] - Callback for online user presence updates
 * @param {Function} [options.onRevoked] - Callback when user's workspace access is revoked
 */
export function useWorkspaceSocket({
  projectId,
  onTaskEvent,
  onMilestoneEvent,
  onProjectEvent,
  onMemberEvent,
  onActivityEvent,
  onPresenceUpdate,
  onRevoked,
}) {
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'connected' | 'reconnecting' | 'offline'
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Bounded LRU-style set of processed event IDs to prevent duplicate processing
  const processedEventIdsRef = useRef(new Set());
  const maxEventHistory = 200;

  // Keep latest callbacks in refs to avoid re-binding socket listeners on render
  const callbacksRef = useRef({
    onTaskEvent,
    onMilestoneEvent,
    onProjectEvent,
    onMemberEvent,
    onActivityEvent,
    onPresenceUpdate,
    onRevoked,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTaskEvent,
      onMilestoneEvent,
      onProjectEvent,
      onMemberEvent,
      onActivityEvent,
      onPresenceUpdate,
      onRevoked,
    };
  });

  // Check and record event ID for deduplication
  const isDuplicateEvent = useCallback((eventId) => {
    if (!eventId) return false;
    if (processedEventIdsRef.current.has(eventId)) {
      return true;
    }
    processedEventIdsRef.current.add(eventId);
    if (processedEventIdsRef.current.size > maxEventHistory) {
      // Evict oldest entries
      const iterator = processedEventIdsRef.current.values();
      for (let i = 0; i < 50; i++) {
        const val = iterator.next().value;
        if (val) processedEventIdsRef.current.delete(val);
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    if (!socket) {
      setConnectionStatus('offline');
      return;
    }

    // Set initial connection status
    setConnectionStatus(socket.connected ? 'connected' : 'reconnecting');

    // Join the project workspace room
    joinProjectWorkspaceRoom(projectId, (ack) => {
      if (ack && ack.success) {
        setConnectionStatus('connected');
        if (ack.members) {
          setOnlineUsers(ack.members);
          callbacksRef.current.onPresenceUpdate?.(ack.members);
        }
      }
    });

    // Connection lifecycle listeners
    const handleConnect = () => {
      setConnectionStatus('connected');
      joinProjectWorkspaceRoom(projectId);
    };

    const handleDisconnect = (reason) => {
      setConnectionStatus(reason === 'io client disconnect' ? 'offline' : 'reconnecting');
    };

    const handleConnectError = () => {
      setConnectionStatus('reconnecting');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Presence listener
    const handlePresenceUpdated = (payload) => {
      if (String(payload?.projectId) !== String(projectId)) return;
      const members = payload.members || [];
      setOnlineUsers(members);
      callbacksRef.current.onPresenceUpdate?.(members);
    };
    socket.on('presence:updated', handlePresenceUpdated);

    // Revocation listener
    const handleWorkspaceRevoked = (payload) => {
      if (String(payload?.projectId) === String(projectId)) {
        callbacksRef.current.onRevoked?.(payload);
      }
    };
    socket.on('workspace:revoked', handleWorkspaceRevoked);

    // Task event handler
    const taskEvents = [
      'task:created',
      'task:updated',
      'task:deleted',
      'task:assigned',
      'task:statusChanged',
      'task:reviewRequested',
      'task:approved',
      'task:reopened',
    ];

    const taskListenerMap = {};
    taskEvents.forEach((eventName) => {
      taskListenerMap[eventName] = (payload) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        if (isDuplicateEvent(payload?.eventId)) return;
        callbacksRef.current.onTaskEvent?.({
          type: eventName,
          ...payload,
        });
      };
      socket.on(eventName, taskListenerMap[eventName]);
    });

    // Milestone event handler
    const milestoneEvents = [
      'milestone:created',
      'milestone:updated',
      'milestone:deleted',
      'milestone:completed',
    ];

    const milestoneListenerMap = {};
    milestoneEvents.forEach((eventName) => {
      milestoneListenerMap[eventName] = (payload) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        if (isDuplicateEvent(payload?.eventId)) return;
        callbacksRef.current.onMilestoneEvent?.({
          type: eventName,
          ...payload,
        });
      };
      socket.on(eventName, milestoneListenerMap[eventName]);
    });

    // Project event handler
    const projectEvents = [
      'project:settingsUpdated',
      'project:statusChanged',
      'project:updated',
    ];

    const projectListenerMap = {};
    projectEvents.forEach((eventName) => {
      projectListenerMap[eventName] = (payload) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        if (isDuplicateEvent(payload?.eventId)) return;
        callbacksRef.current.onProjectEvent?.({
          type: eventName,
          ...payload,
        });
      };
      socket.on(eventName, projectListenerMap[eventName]);
    });

    // Member event handler
    const memberEvents = [
      'member:joined',
      'member:removed',
      'member:roleChanged',
    ];

    const memberListenerMap = {};
    memberEvents.forEach((eventName) => {
      memberListenerMap[eventName] = (payload) => {
        if (String(payload?.projectId) !== String(projectId)) return;
        if (isDuplicateEvent(payload?.eventId)) return;
        callbacksRef.current.onMemberEvent?.({
          type: eventName,
          ...payload,
        });
      };
      socket.on(eventName, memberListenerMap[eventName]);
    });

    // Activity feed event handler
    const handleActivityNew = (payload) => {
      const payloadProjId = payload?.data?.project || payload?.projectId;
      if (String(payloadProjId) !== String(projectId)) return;
      if (isDuplicateEvent(payload?.eventId)) return;
      callbacksRef.current.onActivityEvent?.(payload.data || payload);
    };
    socket.on('activity:new', handleActivityNew);

    // Teardown and cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('presence:updated', handlePresenceUpdated);
      socket.off('workspace:revoked', handleWorkspaceRevoked);
      socket.off('activity:new', handleActivityNew);

      taskEvents.forEach((eventName) => {
        socket.off(eventName, taskListenerMap[eventName]);
      });

      milestoneEvents.forEach((eventName) => {
        socket.off(eventName, milestoneListenerMap[eventName]);
      });

      projectEvents.forEach((eventName) => {
        socket.off(eventName, projectListenerMap[eventName]);
      });

      memberEvents.forEach((eventName) => {
        socket.off(eventName, memberListenerMap[eventName]);
      });

      leaveProjectWorkspaceRoom(projectId);
    };
  }, [projectId, isDuplicateEvent]);

  const reconnect = useCallback(() => {
    const socket = getSocket();
    if (socket && !socket.connected) {
      setConnectionStatus('reconnecting');
      socket.connect();
    }
  }, []);

  return {
    connectionStatus,
    onlineUsers,
    reconnect,
  };
}

export default useWorkspaceSocket;

