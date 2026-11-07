import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../ui/Avatar';
import { ReadReceipt } from './ReadReceipt';
import {
  MoreVertical,
  ChevronDown,
  Edit2,
  Trash2,
  EyeOff,
  Copy,
  Check,
  X,
  FileText,
  Download,
  CornerUpLeft,
  Star,
  Play,
  Pause,
  Mic,
  Code2,
  Smile,
  ExternalLink,
} from 'lucide-react';

// Distinct sender colors for project/group chats
const SENDER_COLORS = [
  'text-primary-600 dark:text-primary-400',
  'text-sky-600 dark:text-sky-400',
  'text-purple-600 dark:text-purple-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-teal-600 dark:text-teal-400',
  'text-indigo-600 dark:text-indigo-400',
];

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🚀'];

const getSenderColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

export const MessageBubble = ({
  message,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onReactMessage,
  onStarMessage,
  showAvatar = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || message.text || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const menuRef = useRef(null);
  const reactionTimerRef = useRef(null);

  const senderId = String(message.sender?._id || message.sender?.id || message.sender || '');
  const isMe = senderId === String(currentUserId) || message.isMe;

  const senderName = message.sender?.name || (isMe ? 'You' : 'Member');
  const senderAvatar = message.sender?.avatar || message.sender?.avatarUrl;
  const isDeleted = Boolean(message.isDeleted);
  const isEdited = Boolean(message.isEdited);
  const isStarred = Boolean(
    message.isStarred ||
    (Array.isArray(message.isStarredBy) &&
      message.isStarredBy.some((id) => String(id?._id || id) === String(currentUserId)))
  );

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Now';

  // Read status: check if read by any other recipient
  const isRead =
    Array.isArray(message.readBy) &&
    message.readBy.some((rb) => String(rb.user?._id || rb.user) !== String(currentUserId));

  // Voice note check
  const isAudioMessage =
    message.messageType === 'audio' ||
    message.voiceMetadata ||
    (Array.isArray(message.attachments) &&
      message.attachments.some((a) => a.fileType === 'audio' || a.url?.includes('.mp3') || a.url?.includes('.webm')));

  // Code snippet check
  const isCodeSnippet =
    message.messageType === 'code' ||
    Boolean(message.codeSnippet) ||
    ((message.content || '').startsWith('```') && (message.content || '').endsWith('```'));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Voice playback animation timer
  useEffect(() => {
    if (!isVoicePlaying) return;
    const interval = setInterval(() => {
      setVoiceProgress((prev) => {
        if (prev >= 100) {
          setIsVoicePlaying(false);
          return 0;
        }
        return prev + 5;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isVoicePlaying]);

  const handleCopy = () => {
    const textToCopy = message.content || message.text || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    setShowDropdown(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEditMessage?.(message._id || message.id, editText.trim());
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.content || message.text || '');
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleDeleteForEveryone = () => {
    if (window.confirm('Delete this message for everyone?')) {
      onDeleteMessage?.(message._id || message.id, { deleteForEveryone: true });
    }
    setShowDropdown(false);
  };

  const handleDeleteForMe = () => {
    onDeleteMessage?.(message._id || message.id, { deleteForEveryone: false });
    setShowDropdown(false);
  };

  const handleSelectReaction = (emoji) => {
    onReactMessage?.(message._id || message.id, emoji);
    setShowQuickReactions(false);
  };

  // Extract reactions list: group by emoji
  const reactionsMap = {};
  if (Array.isArray(message.reactions)) {
    for (const r of message.reactions) {
      if (!r || !r.emoji) continue;
      reactionsMap[r.emoji] = (reactionsMap[r.emoji] || 0) + 1;
    }
  }

  return (
    <div
      className={`group relative flex items-end gap-2 my-1 px-1 sm:px-2 transition-all ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
      onMouseLeave={() => setShowQuickReactions(false)}
    >
      {/* Sender Avatar for incoming group messages */}
      {!isMe && showAvatar && (
        <Avatar
          src={senderAvatar}
          name={senderName}
          size="xs"
          className="shrink-0 mb-1 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
        />
      )}

      {/* Floating WhatsApp Quick Emoji Reactions Bar on Hover */}
      {!isDeleted && !isEditing && (
        <div
          className={`absolute -top-7 ${
            isMe ? 'right-2' : 'left-8 sm:left-10'
          } z-20 flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-700/80 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 duration-150 select-none`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelectReaction(emoji)}
              className="p-1 hover:scale-125 transition-transform text-xs"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onReplyMessage?.(message)}
            className="p-1 hover:text-primary-500 text-slate-400 hover:scale-110 transition-all ml-1 border-l border-slate-200 dark:border-slate-700 pl-1.5"
            title="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* The Premium Message Bubble in Devquox Brand Colors */}
        <div
          className={`relative px-3.5 py-2.5 text-[13.5px] leading-relaxed transition-all shadow-xs ${
            isMe
              ? 'bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white rounded-2xl rounded-br-xs shadow-md shadow-primary-700/20'
              : 'bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl rounded-bl-xs shadow-xs'
          } ${isDeleted ? 'opacity-70 italic text-slate-500 dark:text-slate-400' : ''}`}
        >
          {/* Sender Name in group / multi-user chats */}
          {!isMe && senderName && !isDeleted && (
            <div className={`text-[11.5px] font-black pb-0.5 leading-tight select-none flex items-center justify-between gap-2 ${getSenderColor(senderName)}`}>
              <span>{senderName}</span>
              {message.sender?.role && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
                  {message.sender.role}
                </span>
              )}
            </div>
          )}

          {/* Quoted Message / Replying Banner */}
          {message.replyTo && !isDeleted && (
            <div
              className={`mb-2 p-2 rounded-xl text-xs border-l-4 select-none ${
                isMe
                  ? 'bg-black/15 border-white/60 text-white/90'
                  : 'bg-slate-100/80 dark:bg-slate-900/60 border-primary-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-bold text-[11px] flex items-center gap-1 opacity-90">
                <CornerUpLeft className="w-3 h-3" />
                <span>{message.replyTo.sender?.name || 'Reply to message'}</span>
              </div>
              <p className="line-clamp-1 opacity-80 mt-0.5 text-[11px]">
                {message.replyTo.content || message.replyTo.text || 'Original message'}
              </p>
            </div>
          )}

          {/* Edit Box Mode */}
          {isEditing ? (
            <div className="space-y-2 min-w-[240px] py-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-primary-500 focus:outline-none resize-none shadow-xs"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-xs rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Voice Note / Audio Message Player UI */}
              {isAudioMessage && !isDeleted ? (
                <div className="flex items-center gap-3 py-1.5 pr-2 min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setIsVoicePlaying(!isVoicePlaying)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm shrink-0 ${
                      isMe ? 'bg-white text-primary-700' : 'bg-primary-600 text-white'
                    }`}
                  >
                    {isVoicePlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1 h-5">
                      {[35, 60, 45, 80, 50, 90, 65, 40, 75, 55, 85, 40, 70, 50, 30].map(
                        (h, idx) => {
                          const isActive = (idx / 15) * 100 <= voiceProgress;
                          return (
                            <span
                              key={idx}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                isActive
                                  ? isMe
                                    ? 'bg-white'
                                    : 'bg-primary-600'
                                  : isMe
                                  ? 'bg-white/40'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                          );
                        }
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
                      <span>0:{voiceProgress < 10 ? `0${Math.floor(voiceProgress / 8)}` : Math.floor(voiceProgress / 8)}</span>
                      <span className="flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" />
                        <span>Voice Note</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : isCodeSnippet && !isDeleted ? (
                /* 2. Formatted Code Snippet View */
                <div className="space-y-1 my-1">
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-t-xl bg-slate-950 text-slate-300 text-[11px] font-mono border border-b-0 border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{message.codeLanguage || 'Code'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="hover:text-white flex items-center gap-1"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-300 text-xs font-mono rounded-b-xl border border-slate-800 overflow-x-auto leading-relaxed max-h-60 scrollbar-thin">
                    <code>{message.content?.replace(/```[a-z]*\n?/g, '') || message.text}</code>
                  </pre>
                </div>
              ) : (
                /* 3. Standard Text Message Content */
                <div className="whitespace-pre-wrap break-words pr-2">
                  {isDeleted ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>🚫</span>
                      <span>This message was deleted</span>
                    </span>
                  ) : (
                    <span>{message.content || message.text}</span>
                  )}
                </div>
              )}

              {/* Attachments if any */}
              {Array.isArray(message.attachments) && message.attachments.length > 0 && !isDeleted && (
                <div className="mt-2 space-y-1.5">
                  {message.attachments.map((att, idx) => {
                    const isImg = (att.fileType || '').startsWith('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url);
                    if (isImg) {
                      return (
                        <div key={att._id || idx} className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-60">
                          <img
                            src={att.url}
                            alt={att.fileName || 'Image attachment'}
                            className="w-full h-auto object-cover rounded-xl"
                            loading="lazy"
                          />
                        </div>
                      );
                    }

                    return (
                      <a
                        key={att._id || idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium border transition-colors ${
                          isMe
                            ? 'bg-black/15 hover:bg-black/25 border-white/20 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isMe
                              ? 'bg-white/20 text-white'
                              : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold">{att.fileName || 'Attached Document'}</p>
                          <p className="text-[10px] opacity-75 uppercase">{att.fileType || 'file'}</p>
                        </div>
                        <Download className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Timestamp, Star & Receipts: WhatsApp inline float */}
              <div className="float-right ml-3 -mb-0.5 mt-1 flex items-center gap-1.5 text-[11px] opacity-80 select-none">
                {isStarred && (
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow-xs" />
                )}
                {isEdited && !isDeleted && (
                  <span className="text-[10px] opacity-80 italic">edited</span>
                )}
                <span>{formattedTime}</span>
                {isMe && !isDeleted && (
                  <ReadReceipt isRead={isRead} isDelivered={true} />
                )}
              </div>
            </>
          )}

          {/* WhatsApp Hover Dropdown Trigger Button */}
          {!isDeleted && !isEditing && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown((prev) => !prev);
                }}
                className={`p-0.5 rounded-full transition-colors ${
                  isMe
                    ? 'hover:bg-white/20 text-white/80'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
                title="Message menu"
                aria-label="Message options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* WhatsApp Dropdown Menu */}
          {showDropdown && (
            <div
              ref={menuRef}
              className={`absolute top-7 ${
                isMe ? 'right-0' : 'left-0'
              } z-30 w-44 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-scale-in select-none`}
            >
              {onReplyMessage && (
                <button
                  type="button"
                  onClick={() => {
                    onReplyMessage?.(message);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <CornerUpLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reply</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onStarMessage?.(message._id || message.id);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span>{isStarred ? 'Unstar Message' : 'Star Message'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {isMe && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {isMe && (
                <button
                  type="button"
                  onClick={handleDeleteForEveryone}
                  className="w-full px-3 py-1.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete for everyone</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDeleteForMe}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Delete for me</span>
              </button>
            </div>
          )}
        </div>

        {/* Message Reaction Pills Badges Display */}
        {Object.keys(reactionsMap).length > 0 && !isDeleted && (
          <div className="flex items-center gap-1 mt-1 flex-wrap select-none">
            {Object.entries(reactionsMap).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectReaction(emoji)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:scale-105 transition-transform"
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
