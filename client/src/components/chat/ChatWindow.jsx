import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui/Avatar';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { CallModal } from './CallModal';
import { chatService } from '../../services/chatService';
import {
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  emitTyping,
  emitMessageRead,
} from '../../services/socket';
import { useAuthStore } from '../../store';
import {
  Briefcase,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
  Phone,
  Video,
  MoreVertical,
  X,
  Lock,
  Palette,
  Shield,
  Star,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChatWindow = ({
  conversation,
  onConversationUpdated,
  className = '',
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // WhatsApp-level Features
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [wallpaper, setWallpaper] = useState('devquox'); // 'devquox' | 'matrix' | 'clean' | 'crimson'
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState('voice'); // 'voice' | 'video'

  const conversationId = conversation?._id || conversation?.id;
  const isProject = conversation?.type === 'project' || Boolean(conversation?.project);
  const title =
    conversation?.title ||
    conversation?.user?.name ||
    conversation?.project?.title ||
    'Chat';

  const subtitle = isProject
    ? `Squad Workspace Room • ${conversation?.project?.category || 'Devquox'}`
    : 'Active now';

  // 1. Fetch message history & join Socket.IO room
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setTypingUsers([]);
    setReplyingTo(null);
    setShowInChatSearch(false);
    setInChatSearchQuery('');

    const fetchMessages = async () => {
      try {
        const res = await chatService.getConversationMessages(conversationId, { limit: 50 });
        if (isMounted) {
          const list = res.data?.messages || res.data || [];
          setMessages(Array.isArray(list) ? list : []);
          setHasOlderMessages(Boolean(res.data?.pagination?.hasMore));
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[ChatWindow] Message fetch status notice:', err.response?.status);
          if (err.response?.status === 403) {
            setError({
              type: 'forbidden',
              message: '🔒 Private Project Workspace: You must be an accepted team member or project owner to view this team chat.',
              projectId: conversation?.project?._id || conversation?.project,
            });
          } else if (err.response?.status === 404) {
            setError({
              type: 'not_found',
              message: 'This conversation or project is no longer available.',
            });
          } else {
            setError({
              type: 'network',
              message: 'Unable to load message history. Please check connection.',
            });
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();

    // Mark conversation read
    chatService.markConversationRead(conversationId).catch(() => {});
    emitMessageRead(conversationId);

    // Join Socket Room
    joinConversationRoom(conversationId);

    const socket = getSocket();
    if (socket) {
      setIsConnected(socket.connected);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      // Handle incoming messages cleanly (No Duplicates!)
      const handleNewMessage = (newMsg) => {
        if (!isMounted) return;
        const msgConvId = String(newMsg.conversation?._id || newMsg.conversation);
        if (msgConvId === String(conversationId)) {
          setMessages((prev) => {
            // Check if exact ID already in list
            const exactExists = prev.some(
              (m) => String(m._id || m.id) === String(newMsg._id || newMsg.id)
            );
            if (exactExists) return prev;

            // If incoming message was sent by me, check if there's a pending temp- message to replace
            const senderId = String(newMsg.sender?._id || newMsg.sender?.id || newMsg.sender || '');
            if (senderId === String(currentUserId)) {
              const pendingIdx = prev.findIndex(
                (m) =>
                  String(m._id).startsWith('temp-') &&
                  (m.content === newMsg.content || (m.content || '').trim() === (newMsg.content || '').trim())
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = { ...newMsg, isMe: true };
                return next;
              }
            }

            return [...prev, { ...newMsg, isMe: senderId === String(currentUserId) }];
          });
          onConversationUpdated?.(newMsg);
        }
      };

      const handleMessageUpdated = (updatedMsg) => {
        if (!isMounted) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(updatedMsg._id || updatedMsg.id) ? updatedMsg : m
          )
        );
      };

      const handleMessageDeleted = (data) => {
        if (!isMounted) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (String(m._id || m.id) === String(data.messageId)) {
              return {
                ...m,
                isDeleted: true,
                content: '🚫 This message was deleted',
                text: '🚫 This message was deleted',
              };
            }
            return m;
          })
        );
      };

      const handleTypingStatus = (data) => {
        if (!isMounted) return;
        if (String(data.conversationId) === String(conversationId)) {
          if (String(data.userId) === String(currentUserId)) return;
          if (data.isTyping) {
            setTypingUsers((prev) => (prev.includes(data.userName) ? prev : [...prev, data.userName]));
          } else {
            setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
          }
        }
      };

      const handleConversationRead = (data) => {
        if (!isMounted) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (String(m.sender?._id || m.sender) === String(currentUserId)) {
              const alreadyRead = Array.isArray(m.readBy) && m.readBy.some((r) => String(r.user) === String(data.userId));
              if (!alreadyRead) {
                return {
                  ...m,
                  readBy: [...(m.readBy || []), { user: data.userId, readAt: data.readAt }],
                };
              }
            }
            return m;
          })
        );
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('message:new', handleNewMessage);
      socket.on('message:updated', handleMessageUpdated);
      socket.on('message:deleted', handleMessageDeleted);
      socket.on('typing:status', handleTypingStatus);
      socket.on('conversation:read', handleConversationRead);

      return () => {
        isMounted = false;
        leaveConversationRoom(conversationId);
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('message:new', handleNewMessage);
        socket.off('message:updated', handleMessageUpdated);
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('typing:status', handleTypingStatus);
        socket.off('conversation:read', handleConversationRead);
      };
    }

    return () => {
      isMounted = false;
      leaveConversationRoom(conversationId);
    };
  }, [conversationId, currentUserId]);

  // 2. Load older messages (Pagination)
  const handleLoadOlder = async () => {
    if (!messages.length || isLoadingOlder) return;
    const oldestId = messages[0]._id || messages[0].id;
    setIsLoadingOlder(true);

    try {
      const res = await chatService.getConversationMessages(conversationId, {
        limit: 30,
        before: oldestId,
      });
      const olderList = res.data?.messages || [];
      if (olderList.length > 0) {
        setMessages((prev) => [...olderList, ...prev]);
        setHasOlderMessages(Boolean(res.data?.pagination?.hasMore));
      } else {
        setHasOlderMessages(false);
      }
    } catch (err) {
      console.error('[ChatWindow] Error loading older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // 3. Send message - Single REST request (Prevents duplicate messages!)
  const handleSendMessage = async (payload) => {
    if (!payload.content && (!payload.attachments || !payload.attachments.length)) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: currentUser,
      content: payload.content || '',
      messageType: payload.messageType || 'text',
      voiceMetadata: payload.voiceMetadata || undefined,
      attachments: payload.attachments || [],
      replyTo: replyingTo || undefined,
      reactions: [],
      createdAt: new Date().toISOString(),
      isMe: true,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      // Send single REST call (server automatically emits 'message:new' to socket room)
      const res = await chatService.sendMessageToConversation(conversationId, {
        content: payload.content || '',
        messageType: payload.messageType || 'text',
        voiceMetadata: payload.voiceMetadata,
        attachments: payload.attachments || [],
        replyTo: replyingTo?._id || replyingTo?.id,
      });

      const savedMessage = res.data?.message || res.data?.data || res.data;
      if (savedMessage) {
        setMessages((prev) => {
          // Check if socket already added it
          const alreadyInList = prev.some(
            (m) => String(m._id || m.id) === String(savedMessage._id || savedMessage.id)
          );
          if (alreadyInList) {
            return prev.filter((m) => m._id !== tempId);
          }
          return prev.map((m) => (m._id === tempId ? { ...savedMessage, isMe: true } : m));
        });
        onConversationUpdated?.(savedMessage);
      }
    } catch (err) {
      console.error('[ChatWindow] Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      alert('Failed to deliver message: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
      setReplyingTo(null);
    }
  };

  // 4. Edit message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const res = await chatService.editMessage(messageId, { content: newContent });
      const updated = res.data?.message || res.data;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (String(m._id || m.id) === String(messageId) ? updated : m))
        );
      }
    } catch (err) {
      console.error('[ChatWindow] Edit message error:', err);
      alert('Could not edit message: ' + (err.response?.data?.message || err.message));
    }
  };

  // 5. Delete message
  const handleDeleteMessage = async (messageId, options = {}) => {
    try {
      await chatService.deleteMessage(messageId, options);
      if (options.deleteForEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(messageId)
              ? {
                  ...m,
                  isDeleted: true,
                  content: '🚫 This message was deleted',
                  text: '🚫 This message was deleted',
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.filter((m) => String(m._id || m.id) !== String(messageId))
        );
      }
    } catch (err) {
      console.error('[ChatWindow] Delete message error:', err);
      alert('Could not delete message: ' + (err.response?.data?.message || err.message));
    }
  };

  // 6. Toggle Emoji Reaction on message
  const handleReactMessage = (messageId, emoji) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id || m.id) === String(messageId)) {
          const currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
          const existingIdx = currentReactions.findIndex(
            (r) => String(r.user?._id || r.user) === String(currentUserId) && r.emoji === emoji
          );

          if (existingIdx >= 0) {
            currentReactions.splice(existingIdx, 1);
          } else {
            currentReactions.push({ user: currentUser, emoji, createdAt: new Date() });
          }
          return { ...m, reactions: currentReactions };
        }
        return m;
      })
    );
  };

  // 7. Toggle Star message
  const handleStarMessage = (messageId) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id || m.id) === String(messageId)) {
          return { ...m, isStarred: !m.isStarred };
        }
        return m;
      })
    );
  };

  const handleTypingChange = (isTyping) => {
    emitTyping(conversationId, isTyping);
  };

  // Filter messages if search is active
  const displayedMessages = inChatSearchQuery.trim()
    ? messages.filter((m) =>
        (m.content || m.text || '')
          .toLowerCase()
          .includes(inChatSearchQuery.trim().toLowerCase())
      )
    : messages;

  if (!conversation) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-md text-slate-400 select-none ${className}`}
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 shadow-xl flex items-center justify-center text-3xl mb-4 text-primary-500">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Devquox Collaboration Hub
        </h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1.5 leading-relaxed">
          Select a conversation from the left to start encrypted real-time messaging, voice notes, and project squad calls.
        </p>
        <div className="flex items-center gap-1.5 mt-8 text-[11px] text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-primary-500" />
          <span>Secured with end-to-end Socket encryption</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 dark:bg-[#0c1319] transition-colors relative ${className}`}
    >
      {/* 1. Devquox Top Header Bar */}
      <div className="h-16 px-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 select-none z-10 shadow-2xs">
        {/* Contact / Team Profile Info */}
        <div className="flex items-center gap-3 min-w-0">
          {isProject ? (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/60 dark:to-slate-800 border border-primary-200/80 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
          ) : (
            <Avatar
              src={conversation?.user?.avatar || conversation?.user?.avatarUrl}
              name={conversation?.user?.name || 'Contact'}
              size="md"
              status="online"
              className="rounded-full ring-1 ring-slate-200 dark:ring-slate-700"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                {title}
              </h3>
              {isProject && (
                <span className="px-1.5 py-0.2 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                  SQUAD
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5 flex items-center gap-1.5 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : subtitle}</span>
            </p>
          </div>
        </div>

        {/* Top Right Action Controls in Devquox Brand Styling */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          {/* Audio Call */}
          <button
            type="button"
            onClick={() => {
              setCallType('voice');
              setCallModalOpen(true);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 transition-colors"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            type="button"
            onClick={() => {
              setCallType('video');
              setCallModalOpen(true);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* In-Chat Search Button */}
          <button
            type="button"
            onClick={() => setShowInChatSearch((prev) => !prev)}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              showInChatSearch ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40' : ''
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Project Workspace Link */}
          {isProject && conversation.project?._id && (
            <Link
              to={`/projects/${conversation.project._id}/workspace`}
              className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 text-primary-600 dark:text-primary-400 transition-colors"
              title="Open Project Workspace"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {/* More Menu & Wallpaper Options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-11 w-52 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs text-slate-700 dark:text-slate-200 z-30 animate-scale-in">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Theme Canvas
                </div>
                <div className="grid grid-cols-2 gap-1 p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  {[
                    { id: 'devquox', label: 'Devquox Glass' },
                    { id: 'matrix', label: 'Matrix Dark' },
                    { id: 'clean', label: 'Clean Slate' },
                    { id: 'crimson', label: 'Devquox Red' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setWallpaper(w.id);
                        setShowHeaderMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors ${
                        wallpaper === w.id
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowInChatSearch(true);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search in conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all messages from your local view?')) {
                      setMessages([]);
                    }
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear chat view</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. In-Chat Message Search Bar */}
      {showInChatSearch && (
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-slide-up shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search loaded messages in this conversation..."
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            className="flex-1 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
            autoFocus
          />
          {inChatSearchQuery && (
            <span className="text-[11px] font-semibold text-primary-600">
              {displayedMessages.length} results
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowInChatSearch(false);
              setInChatSearchQuery('');
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Error Banner (Handles 403 Forbidden with friendly workspace action) */}
      {error && (
        <div className="p-3 px-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">{error.message || error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {error.projectId && (
              <Link
                to={`/projects/${error.projectId}`}
                className="px-2.5 py-1 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors text-[11px]"
              >
                View Project
              </Link>
            )}
            <button
              onClick={() => setError(null)}
              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Chat Messages List Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading conversation messages...</span>
        </div>
      ) : (
        <MessageList
          messages={displayedMessages}
          currentUserId={currentUserId}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={(msg) => setReplyingTo(msg)}
          onReactMessage={handleReactMessage}
          onStarMessage={handleStarMessage}
          onLoadOlder={handleLoadOlder}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
          wallpaper={wallpaper}
        />
      )}

      {/* 5. Typing Indicator */}
      <div className="px-4 py-0.5 min-h-[22px] bg-transparent">
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* 6. Message Composer (Solidly pinned to bottom) */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder={isProject ? `Message squad in #${title}` : 'Type a message...'}
        isSending={isSending}
      />

      {/* 7. WhatsApp Audio / Video Call Interactive Modal */}
      <CallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        contact={conversation}
        callType={callType}
      />
    </div>
  );
};

export default ChatWindow;
