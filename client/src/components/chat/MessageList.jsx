import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2, ArrowUpCircle, Lock, MessageSquare } from 'lucide-react';

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
  onReactMessage,
  onStarMessage,
  onLoadOlder,
  hasOlderMessages = false,
  isLoadingOlder = false,
  wallpaper = 'devquox', // 'devquox' | 'matrix' | 'clean' | 'crimson'
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Clean deduplicated messages (deduplicate by unique ID & filter rapid twin-dispatches)
  const cleanMessages = messages.filter((msg, idx, arr) => {
    const id = String(msg._id || msg.id || '');
    if (id && arr.findIndex((m) => String(m._id || m.id || '') === id) !== idx) {
      return false;
    }
    // Filter legacy twin-dispatch duplicates if same sender, identical text within 3 seconds
    if (idx > 0) {
      const prev = arr[idx - 1];
      const prevSender = String(prev.sender?._id || prev.sender?.id || prev.sender || '');
      const currSender = String(msg.sender?._id || msg.sender?.id || msg.sender || '');
      const prevContent = (prev.content || prev.text || '').trim();
      const currContent = (msg.content || msg.text || '').trim();
      if (
        prevSender &&
        prevSender === currSender &&
        prevContent &&
        prevContent === currContent
      ) {
        const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt));
        if (!isNaN(timeDiff) && timeDiff < 3000) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div
      ref={containerRef}
      className={`flex-1 p-3 sm:p-5 overflow-y-auto space-y-3.5 scroll-smooth transition-colors ${
        wallpaper === 'matrix'
          ? 'bg-slate-950 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]'
          : wallpaper === 'crimson'
          ? 'bg-primary-950/10 dark:bg-primary-950/30 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px]'
          : wallpaper === 'clean'
          ? 'bg-white dark:bg-slate-900'
          : 'bg-slate-50/70 dark:bg-[#0c1319] bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px] opacity-95'
      }`}
    >
      {/* Load Older Messages Pill */}
      {hasOlderMessages && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-50"
          >
            {isLoadingOlder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
            ) : (
              <ArrowUpCircle className="w-3.5 h-3.5 text-primary-600" />
            )}
            <span>Load older messages</span>
          </button>
        </div>
      )}

      {/* Devquox End-to-End Encryption Security Pill */}
      <div className="flex justify-center my-2">
        <div className="max-w-md px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-[11px] text-center flex items-center justify-center gap-2 shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          <span className="leading-snug">
            Messages are end-to-end encrypted with Devquox Socket protocols.
          </span>
        </div>
      </div>

      {/* Empty State */}
      {cleanMessages.length === 0 ? (
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/40 dark:to-slate-800 border border-primary-200/60 dark:border-primary-800/40 shadow-md flex items-center justify-center text-primary-600 dark:text-primary-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No messages yet
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Send a message, voice note, or code snippet to start this conversation.
            </p>
          </div>
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
                  <span className="px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-600 dark:text-slate-300 text-[10.5px] font-bold tracking-wider uppercase shadow-2xs border border-slate-200/80 dark:border-slate-700/80">
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
                onReactMessage={onReactMessage}
                onStarMessage={onStarMessage}
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
