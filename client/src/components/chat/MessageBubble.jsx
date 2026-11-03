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
} from 'lucide-react';

// WhatsApp group sender distinct accent colors
const SENDER_COLORS = [
  'text-emerald-600 dark:text-emerald-400',
  'text-sky-600 dark:text-sky-400',
  'text-purple-600 dark:text-purple-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-teal-600 dark:text-teal-400',
  'text-indigo-600 dark:text-indigo-400',
];

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
  showAvatar = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || message.text || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const senderId = String(message.sender?._id || message.sender?.id || message.sender || '');
  const isMe = senderId === String(currentUserId) || message.isMe;

  const senderName = message.sender?.name || (isMe ? 'You' : 'Member');
  const senderAvatar = message.sender?.avatar || message.sender?.avatarUrl;
  const isDeleted = Boolean(message.isDeleted);
  const isEdited = Boolean(message.isEdited);

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Now';

  // Read status: check if read by any other recipient
  const isRead =
    Array.isArray(message.readBy) &&
    message.readBy.some((rb) => String(rb.user?._id || rb.user) !== String(currentUserId));

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
    if (window.confirm('Delete this message for everyone in the chat?')) {
      onDeleteMessage?.(message._id || message.id, { deleteForEveryone: true });
      setShowDropdown(false);
    }
  };

  const handleDeleteForMe = () => {
    if (window.confirm('Delete this message for yourself?')) {
      onDeleteMessage?.(message._id || message.id, { deleteForEveryone: false });
      setShowDropdown(false);
    }
  };

  return (
    <div
      className={`group relative flex items-end gap-2 my-1 px-1 sm:px-2 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Sender Avatar for incoming group messages */}
      {!isMe && showAvatar && (
        <Avatar
          src={senderAvatar}
          name={senderName}
          size="xs"
          className="shrink-0 mb-0.5 shadow-xs"
        />
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* The WhatsApp Message Bubble */}
        <div
          className={`relative px-3 py-2 text-[13.5px] leading-relaxed transition-all shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
            isMe
              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-xs'
              : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-xs'
          } ${isDeleted ? 'opacity-75 italic text-slate-500 dark:text-slate-400' : ''}`}
        >
          {/* Sender Name in group / multi-user chats */}
          {!isMe && senderName && !isDeleted && (
            <div className={`text-[12px] font-bold pb-0.5 leading-tight select-none ${getSenderColor(senderName)}`}>
              {senderName}
            </div>
          )}

          {/* Edit Box Mode */}
          {isEditing ? (
            <div className="space-y-2 min-w-[220px] py-1">
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
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#111b21] text-[#111b21] dark:text-white border border-[#00a884] focus:outline-none resize-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 text-xs rounded bg-[#00a884] hover:bg-[#008f6f] text-white font-bold flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Message Content */}
              <div className="whitespace-pre-wrap break-words pr-2">
                {isDeleted ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">🚫</span>
                    <span>This message was deleted</span>
                  </span>
                ) : (
                  <span>{message.content || message.text}</span>
                )}
              </div>

              {/* Attachments if any */}
              {Array.isArray(message.attachments) && message.attachments.length > 0 && !isDeleted && (
                <div className="mt-2 space-y-1.5">
                  {message.attachments.map((att, idx) => (
                    <a
                      key={att._id || idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                        isMe
                          ? 'bg-black/5 hover:bg-black/10 dark:bg-black/20 dark:hover:bg-black/30 border-emerald-300/40 dark:border-emerald-700/40 text-slate-800 dark:text-slate-100'
                          : 'bg-[#f0f2f5] hover:bg-[#e4e6eb] dark:bg-[#182229] dark:hover:bg-[#111b21] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00a884] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{att.fileName || 'Document'}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{att.fileType || 'file'}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* Timestamp & Receipts: WhatsApp signature inline float */}
              <div className="float-right ml-3 -mb-0.5 mt-1 flex items-center gap-1 text-[11px] text-[#667781] dark:text-[#8696a0] select-none">
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
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown((prev) => !prev);
                }}
                className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300"
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
              className={`absolute top-6 ${
                isMe ? 'right-0' : 'left-0'
              } z-30 w-44 rounded-xl bg-white dark:bg-[#233138] shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-scale-in select-none`}
            >
              {onReplyMessage && (
                <button
                  type="button"
                  onClick={() => {
                    onReplyMessage?.(message);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] text-left transition-colors"
                >
                  <CornerUpLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reply</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] text-left transition-colors"
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
                  className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] text-left transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

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
                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182229] text-left transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Delete for me</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
