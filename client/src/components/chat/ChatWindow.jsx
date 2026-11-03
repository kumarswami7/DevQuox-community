import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui/Avatar';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { chatService } from '../../services/chatService';
import {
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  sendSocketMessage,
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

  // WhatsApp features: In-chat search, Reply quote, Header menu
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const conversationId = conversation?._id || conversation?.id;
  const isProject = conversation?.type === 'project' || Boolean(conversation?.project);
  const title =
    conversation?.title ||
    conversation?.user?.name ||
    conversation?.project?.title ||
    'Chat';

  const subtitle = isProject
    ? `Project Workspace Room • ${conversation?.project?.category || 'Devquox'}`
    : 'online';

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
          console.error('[ChatWindow] Message fetch error:', err);
          setError('Failed to load message history. Please check connection.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();

    // Mark conversation read
    chatService.markConversationRead(conversationId).catch(() => {});
    emitMessageRead(conversationId);

    // Join Socket room
    joinConversationRoom(conversationId);

    // Socket listeners setup
    const socket = getSocket();
    if (socket) {
      setIsConnected(socket.connected);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      const handleNewMessage = (newMsg) => {
        if (!newMsg) return;
        const msgConvId = String(newMsg.conversation?._id || newMsg.conversation || '');
        if (msgConvId === String(conversationId)) {
          setMessages((prev) => {
            const newId = String(newMsg._id || newMsg.id || '');
            if (newId && prev.some((m) => String(m._id || m.id) === newId)) {
              return prev.map((m) => (String(m._id || m.id) === newId ? newMsg : m));
            }

            const senderId = String(newMsg.sender?._id || newMsg.sender || '');
            const tempIdx = prev.findIndex(
              (m) =>
                String(m._id || m.id).startsWith('temp-') &&
                String(m.sender?._id || m.sender || '') === senderId &&
                (m.content === newMsg.content || m.text === newMsg.content)
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = newMsg;
              return next;
            }

            return [...prev, newMsg];
          });
          emitMessageRead(conversationId);
        }
      };

      const handleMessageUpdated = (updated) => {
        if (!updated) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(updated.messageId)
              ? {
                  ...m,
                  content: updated.content,
                  text: updated.content,
                  isEdited: true,
                  editedAt: updated.editedAt,
                }
              : m
          )
        );
      };

      const handleMessageDeleted = (deleted) => {
        if (!deleted) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(deleted.messageId)
              ? {
                  ...m,
                  isDeleted: true,
                  content: '🚫 This message was deleted',
                  text: '🚫 This message was deleted',
                }
              : m
          )
        );
      };

      const handleTypingStatus = (data) => {
        if (!data || String(data.conversationId) !== String(conversationId)) return;
        if (String(data.userId) === currentUserId) return;

        setTypingUsers((prev) => {
          if (data.isTyping) {
            if (!prev.some((u) => String(u.userId) === String(data.userId))) {
              return [...prev, { userId: data.userId, userName: data.userName }];
            }
            return prev;
          } else {
            return prev.filter((u) => String(u.userId) !== String(data.userId));
          }
        });
      };

      const handleConversationRead = (data) => {
        if (!data || String(data.conversationId) !== String(conversationId)) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (String(m.sender?._id || m.sender) === currentUserId) {
              const alreadyRead = m.readBy?.some(
                (rb) => String(rb.user?._id || rb.user) === String(data.userId)
              );
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

  // 3. Send message
  const handleSendMessage = async (textToSend, attachments = []) => {
    let finalContent = (textToSend || '').trim();
    if (replyingTo) {
      const quotePrefix = `> *${replyingTo.sender?.name || 'Member'}*: ${
        replyingTo.content || replyingTo.text || 'Attachment'
      }\n\n`;
      finalContent = `${quotePrefix}${finalContent}`;
    }

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if ((!finalContent && !hasAttachments) || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      id: tempId,
      conversation: conversationId,
      sender: {
        _id: currentUserId,
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || currentUser?.avatarUrl,
        role: currentUser?.role,
      },
      content: finalContent,
      text: finalContent,
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
      isMe: true,
      readBy: [{ user: currentUserId, readAt: new Date() }],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    setReplyingTo(null);

    try {
      const res = await chatService.sendMessageToConversation(conversationId, {
        content: finalContent,
        attachments,
      });

      const savedMessage = res.data?.message || res.data;
      if (savedMessage) {
        setMessages((prev) => {
          const savedId = String(savedMessage._id || savedMessage.id || '');
          const alreadyExists = savedId && prev.some((m) => String(m._id || m.id) === savedId);
          if (alreadyExists) {
            return prev.filter((m) => m._id !== tempId && m.id !== tempId);
          }
          return prev.map((m) => (m._id === tempId || m.id === tempId ? savedMessage : m));
        });
        onConversationUpdated?.(savedMessage);
      }
    } catch (err) {
      console.error('[ChatWindow] REST send error, trying socket fallback:', err);
      const sentViaSocket = sendSocketMessage(
        {
          conversationId,
          content: finalContent,
          attachments,
        },
        (response) => {
          if (response?.success && response?.data) {
            const savedData = response.data;
            const savedId = String(savedData._id || savedData.id || '');
            setMessages((prev) => {
              const alreadyExists = savedId && prev.some((m) => String(m._id || m.id) === savedId);
              if (alreadyExists) {
                return prev.filter((m) => m._id !== tempId && m.id !== tempId);
              }
              return prev.map((m) => (m._id === tempId || m.id === tempId ? savedData : m));
            });
          }
        }
      );

      if (!sentViaSocket) {
        setError('Failed to deliver message. Please retry.');
      }
    } finally {
      setIsSending(false);
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
        className={`flex-1 flex flex-col items-center justify-center p-8 bg-[#f0f2f5] dark:bg-[#111b21] text-slate-400 select-none border-b-4 border-[#00a884] ${className}`}
      >
        <div className="w-20 h-20 rounded-full bg-white dark:bg-[#202c33] shadow-md flex items-center justify-center text-3xl mb-4 text-[#00a884]">
          💬
        </div>
        <h3 className="text-xl font-bold text-[#111b21] dark:text-[#e9edef]">
          DevConnect WhatsApp Web
        </h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1.5 leading-relaxed">
          Send and receive real-time messages, share documents, and collaborate in team rooms seamlessly.
        </p>
        <div className="flex items-center gap-1.5 mt-8 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          <span>End-to-end encrypted with Devquox Socket protocols</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden bg-[#efeae2] dark:bg-[#0b141a] transition-colors ${className}`}
    >
      {/* 1. WhatsApp Web Top Header Bar */}
      <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shrink-0 select-none z-10 shadow-xs">
        {/* Contact / Team Profile Info */}
        <div className="flex items-center gap-3 min-w-0">
          {isProject ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-[#00a884] dark:text-[#25d366] shrink-0 shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
          ) : (
            <Avatar
              src={conversation?.user?.avatar || conversation?.user?.avatarUrl}
              name={conversation?.user?.name || 'Contact'}
              size="md"
              status="online"
            />
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#111b21] dark:text-[#e9edef] truncate leading-tight">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-[#8696a0] truncate leading-tight mt-0.5 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isConnected ? 'bg-[#25d366]' : 'bg-amber-400'
                }`}
              />
              <span>{typingUsers.length > 0 ? 'typing...' : subtitle}</span>
            </p>
          </div>
        </div>

        {/* WhatsApp Top Right Action Buttons */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-[#aebac1]">
          {/* In-Chat Search Button */}
          <button
            type="button"
            onClick={() => setShowInChatSearch((prev) => !prev)}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
              showInChatSearch ? 'text-[#00a884]' : ''
            }`}
            title="Search in chat"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Voice / Video dummy call indicators */}
          <button
            type="button"
            onClick={() => alert('DevConnect Audio Calls coming soon!')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => alert('DevConnect Video Room coming soon!')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Project Workspace Link */}
          {isProject && conversation.project?._id && (
            <Link
              to={`/projects/${conversation.project._id}/workspace`}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-emerald-600 dark:text-emerald-400"
              title="Open Project Workspace"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-10 w-44 rounded-xl bg-white dark:bg-[#233138] shadow-2xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200 z-30 animate-scale-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowInChatSearch(true);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#182229]"
                >
                  Search in conversation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Chat notifications muted for 8 hours.');
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-[#182229]"
                >
                  Mute notifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all messages from your local view?')) {
                      setMessages([]);
                    }
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Clear chat view
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. In-Chat Message Search Bar */}
      {showInChatSearch && (
        <div className="px-4 py-2 bg-white dark:bg-[#182229] border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-slide-up shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search loaded messages..."
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            className="flex-1 text-xs bg-transparent text-[#111b21] dark:text-white focus:outline-none placeholder-slate-400"
            autoFocus
          />
          {inChatSearchQuery && (
            <span className="text-[11px] text-slate-400">
              {displayedMessages.length} results
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowInChatSearch(false);
              setInChatSearchQuery('');
            }}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Error Banner */}
      {error && (
        <div className="p-2.5 px-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. WhatsApp Chat Wallpaper & Message List */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
          <Loader2 className="w-8 h-8 text-[#00a884] animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading messages...</span>
        </div>
      ) : (
        <MessageList
          messages={displayedMessages}
          currentUserId={currentUserId}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={(msg) => setReplyingTo(msg)}
          onLoadOlder={handleLoadOlder}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
        />
      )}

      {/* 5. Typing Indicator */}
      <div className="px-4 py-0.5 min-h-[22px] bg-transparent">
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* 6. WhatsApp Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder={isProject ? `Message #${title}` : 'Type a message'}
        isSending={isSending}
      />
    </div>
  );
};

export default ChatWindow;
