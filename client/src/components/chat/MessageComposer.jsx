import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Paperclip,
  Smile,
  Mic,
  X,
  FileText,
  Image as ImageIcon,
  Code2,
  Check,
} from 'lucide-react';

const COMMON_EMOJIS = [
  '😀', '😂', '😍', '🙌', '👍', '👎', '❤️', '🔥',
  '🚀', '🎉', '💡', '✨', '👏', '🙏', '💯', '😊',
  '😎', '🤔', '👀', '💻', '⚡', '🛠️', '📦', '🎯',
  '🏆', '🌟', '🤝', '💪', '🥳', '🤩', '👋', '☕',
];

export const MessageComposer = ({
  onSendMessage,
  onTypingChange,
  replyingTo = null,
  onCancelReply,
  placeholder = 'Type a message',
  disabled = false,
  isSending = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachType, setAttachType] = useState(null); // 'url' | 'code' | null
  const [attachUrl, setAttachUrl] = useState('');
  const [attachName, setAttachName] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= 4000) {
      setText(val);
    }

    // Typing status emitter
    if (onTypingChange) {
      if (!typingTimeoutRef.current && val.trim().length > 0) {
        onTypingChange(true);
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleAddUrlAttachment = (e) => {
    e.preventDefault();
    if (!attachUrl.trim()) return;

    const trimmedUrl = attachUrl.trim();
    const fileName = attachName.trim() || trimmedUrl.split('/').pop() || 'Attachment';
    let fileType = 'link';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl)) fileType = 'image';
    else if (/\.(pdf)$/i.test(trimmedUrl)) fileType = 'pdf';
    else if (/\.(zip|tar|gz)$/i.test(trimmedUrl)) fileType = 'archive';

    setAttachments((prev) => [
      ...prev,
      {
        url: trimmedUrl,
        fileName,
        fileType,
        fileSize: 0,
      },
    ]);

    setAttachUrl('');
    setAttachName('');
    setAttachType(null);
    setShowAttachMenu(false);
  };

  const handleAddCodeSnippet = (e) => {
    e.preventDefault();
    if (!codeSnippet.trim()) return;

    // Append code snippet to message with markdown formatting
    const formatted = `\`\`\`${codeLanguage}\n${codeSnippet.trim()}\n\`\`\``;
    setText((prev) => (prev ? `${prev}\n${formatted}` : formatted));
    setCodeSnippet('');
    setAttachType(null);
    setShowAttachMenu(false);
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || disabled || isSending) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      onTypingChange?.(false);
    }

    onSendMessage(trimmed, attachments);
    setText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setAttachType(null);
    onCancelReply?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="relative border-t border-slate-200/90 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#202c33] transition-colors">
      {/* WhatsApp Replying Preview Bar */}
      {replyingTo && (
        <div className="p-2.5 px-4 bg-slate-100 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs animate-slide-up">
          <div className="border-l-4 border-[#00a884] pl-2.5 min-w-0">
            <p className="font-bold text-[#00a884] text-[11px]">
              Replying to {replyingTo.sender?.name || 'Member'}
            </p>
            <p className="truncate text-slate-600 dark:text-slate-300 text-xs">
              {replyingTo.content || replyingTo.text || 'Attachment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Pills Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 pb-0">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#2a3942] shadow-xs text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
              <span className="truncate max-w-[160px] font-medium">{att.fileName}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="hover:text-rose-500 rounded p-0.5 ml-1"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Sub-Modals (URL or Code) */}
      {attachType === 'url' && (
        <form
          onSubmit={handleAddUrlAttachment}
          className="m-2.5 p-3 rounded-xl bg-white dark:bg-[#2a3942] shadow-md border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 animate-fade-in"
        >
          <input
            type="url"
            required
            placeholder="Document or file URL (https://...)"
            value={attachUrl}
            onChange={(e) => setAttachUrl(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#182229] border border-slate-300 dark:border-slate-600 text-[#111b21] dark:text-white focus:outline-none focus:border-[#00a884]"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={attachName}
            onChange={(e) => setAttachName(e.target.value)}
            className="w-40 px-3 py-1.5 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#182229] border border-slate-300 dark:border-slate-600 text-[#111b21] dark:text-white focus:outline-none focus:border-[#00a884]"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold shadow-xs"
            >
              Attach
            </button>
            <button
              type="button"
              onClick={() => setAttachType(null)}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {attachType === 'code' && (
        <form
          onSubmit={handleAddCodeSnippet}
          className="m-2.5 p-3 rounded-xl bg-white dark:bg-[#2a3942] shadow-md border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#00a884]" />
              <span>Insert Code Snippet</span>
            </span>
            <select
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-[#f0f2f5] dark:bg-[#182229] border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <textarea
            rows={4}
            required
            placeholder="Paste code snippet here..."
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="w-full font-mono text-xs p-2 rounded-lg bg-[#f0f2f5] dark:bg-[#182229] border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#00a884]"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAttachType(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Code</span>
            </button>
          </div>
        </form>
      )}

      {/* Main WhatsApp Composer Row */}
      <div className="flex items-center gap-2 p-2.5 sm:px-4">
        {/* Left Action: Emoji Picker Toggle */}
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachMenu(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showEmojiPicker
                ? 'text-[#00a884] bg-black/5 dark:bg-white/5'
                : 'text-slate-500 dark:text-[#8696a0] hover:text-[#00a884]'
            }`}
            title="Emoji drawer"
            aria-label="Emoji drawer"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* WhatsApp Style Emoji Drawer Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-40 w-64 p-3 rounded-2xl bg-white dark:bg-[#233138] shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-in">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Quick Reactions & Emojis
              </p>
              <div className="grid grid-cols-8 gap-1.5 text-lg">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-[#182229] rounded-lg transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left Action: Paperclip Attachment Toggle */}
        <div className="relative" ref={attachRef}>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showAttachMenu || attachments.length > 0
                ? 'text-[#00a884] bg-black/5 dark:bg-white/5'
                : 'text-slate-500 dark:text-[#8696a0] hover:text-[#00a884]'
            }`}
            title="Attach file or code"
            aria-label="Attach file or code"
          >
            <Paperclip className="w-5 h-5 rotate-45" />
          </button>

          {/* WhatsApp Style Attachment Circle Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 z-40 w-48 py-2 rounded-2xl bg-white dark:bg-[#233138] shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-in space-y-1">
              <button
                type="button"
                onClick={() => {
                  setAttachType('url');
                  setShowAttachMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#182229] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Document / URL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachType('code');
                  setShowAttachMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-[#182229] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <span>Code Snippet</span>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Pill Input Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none max-h-32 min-h-[40px] px-4 py-2.5 text-sm rounded-lg bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] border-none focus:outline-none focus:ring-1 focus:ring-[#00a884] shadow-xs leading-normal"
          />
        </div>

        {/* Right Button: Mic when empty, WhatsApp Emerald Send when filled */}
        {hasContent ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || isSending}
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white flex items-center justify-center shadow-md transition-all shrink-0"
            title="Send message"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Subtle prompt for voice notes
              alert('Voice notes are simulated. Type your text message or attach a link to send!');
            }}
            className="w-10 h-10 rounded-full text-slate-500 dark:text-[#8696a0] hover:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
            title="Voice note"
            aria-label="Voice note"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Character limit counter if lengthy */}
      {text.length > 3000 && (
        <div className="px-4 pb-1 flex justify-end text-[10px]">
          <span className={text.length > 3900 ? 'text-rose-500 font-bold' : 'text-amber-500 font-medium'}>
            {text.length}/4000
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageComposer;
