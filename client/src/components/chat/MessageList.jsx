import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2, ArrowUpCircle, Lock } from 'lucide-react';

// Format date into WhatsApp style "TODAY", "YESTERDAY", or "MONTH DAY, YEAR"
const getWhatsAppDateLabel = (dateString) => {
  if (!dateString) return 'TODAY';
  const d = new Date(dateString);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return 'TODAY';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'YESTERDAY';
  }
  return d
    .toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
    .toUpperCase();
};

export const MessageList = ({
  messages = [],
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onLoadOlder,
  hasOlderMessages = false,
  isLoadingOlder = false,
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Clean deduplicated messages
  const cleanMessages = messages.filter((msg, idx, arr) => {
    const id = String(msg._id || msg.id || '');
    if (!id) return true;
    return arr.findIndex((m) => String(m._id || m.id || '') === id) === idx;
  });

  return (
    <div
      ref={containerRef}
      className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 scroll-smooth whatsapp-chat-wallpaper"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.015) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Load Older Messages Pill */}
      {hasOlderMessages && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/90 dark:bg-[#182229]/90 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-white dark:hover:bg-[#202c33] transition-all disabled:opacity-50"
          >
            {isLoadingOlder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00a884]" />
            ) : (
              <ArrowUpCircle className="w-3.5 h-3.5 text-[#00a884]" />
            )}
            <span>Load older messages</span>
          </button>
        </div>
      )}

      {/* WhatsApp End-to-End Encryption Security Banner */}
      <div className="flex justify-center my-3">
        <div className="max-w-md px-3.5 py-1.5 rounded-lg bg-[#ffeecd] dark:bg-[#182229] border border-amber-200/60 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 text-[11px] text-center flex items-center gap-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.1)]">
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="leading-snug">
            Messages are end-to-end encrypted with Devquox real-time sockets. No one outside of this chat can read them.
          </span>
        </div>
      </div>

      {/* Empty State */}
      {cleanMessages.length === 0 ? (
        <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
          <div className="w-14 h-14 rounded-full bg-white dark:bg-[#202c33] shadow-md flex items-center justify-center text-2xl text-[#00a884]">
            💬
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No messages yet
          </p>
          <p className="text-[11px] max-w-xs text-slate-500">
            Send a message to start this real-time conversation.
          </p>
        </div>
      ) : (
        cleanMessages.map((msg, index) => {
          const prevMsg = cleanMessages[index - 1];
          const currDateLabel = getWhatsAppDateLabel(msg.createdAt);
          const prevDateLabel = prevMsg ? getWhatsAppDateLabel(prevMsg.createdAt) : null;
          const showDateDivider = currDateLabel !== prevDateLabel;

          const showAvatar =
            !prevMsg ||
            String(prevMsg.sender?._id || prevMsg.sender) !==
              String(msg.sender?._id || msg.sender);

          return (
            <React.Fragment key={msg._id || msg.id ? `msg-${msg._id || msg.id}` : `msg-idx-${index}`}>
              {/* WhatsApp Floating Date Pill */}
              {showDateDivider && (
                <div className="flex justify-center my-3 select-none">
                  <span className="px-3 py-1 rounded-lg bg-white/95 dark:bg-[#182229]/95 text-[#54656f] dark:text-[#8696a0] text-[11px] font-semibold tracking-wider uppercase shadow-[0_1px_1px_rgba(11,20,26,0.1)] border border-slate-200/50 dark:border-slate-800/40">
                    {currDateLabel}
                  </span>
                </div>
              )}

              <MessageBubble
                message={msg}
                currentUserId={currentUserId}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onReplyMessage={onReplyMessage}
                showAvatar={showAvatar}
              />
            </React.Fragment>
          );
        })
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
