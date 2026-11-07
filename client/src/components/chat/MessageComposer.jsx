import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  Code2,
  Check,
  Trash2,
  CornerUpLeft,
} from 'lucide-react';
import { CodeSnippetModal } from './CodeSnippetModal';

const EMOJI_CATEGORIES = {
  Recent: ['❤️', '🔥', '👍', '😂', '🚀', '✨', '👏', '🙏'],
  Smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😎', '🥳', '🤔', '🤫', '🤗', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  DevTech: ['💻', '⚡', '🛠️', '📦', '🎯', '🏆', '🌟', '🤝', '💪', '🚀', '🔥', '💡', '✨', '☕', '🧠', '🤖', '📊', '📈', '⚙️', '🔍', '📱', '🖥️', '⌨️', '🖱️', '🔌', '💾', '🛡️', '🔒'],
  Gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '👏', '🙌', '👐', '🤲'],
  Objects: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '📌', '📍', '📝', '📄', '📁', '📂', '📑', '📊', '📋', '📅', '📆', '🔔', '📢', '📣'],
};

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
  const [activeEmojiTab, setActiveEmojiTab] = useState('Recent');
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Voice Note Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);
  const recordingTimerRef = useRef(null);

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

  // Recording timer effect
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecordingVoice]);

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

  const handleStartVoiceRecording = () => {
    setIsRecordingVoice(true);
  };

  const handleCancelVoiceRecording = () => {
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleSendVoiceNote = () => {
    const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60)
      .toString()
      .padStart(2, '0')}`;
    
    onSendMessage({
      content: `🎙️ Voice Note (${durationStr})`,
      messageType: 'audio',
      voiceMetadata: {
        duration: recordingSeconds || 5,
        waveform: [30, 50, 75, 40, 90, 60, 80, 45, 70, 85, 40, 65, 50],
      },
      replyTo: replyingTo?._id || replyingTo?.id,
    });

    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    if (onCancelReply) onCancelReply();
  };

  const handleSendCodeSnippet = (codeData) => {
    onSendMessage({
      content: `\`\`\`${codeData.language}\n${codeData.code}\n\`\`\``,
      messageType: 'code',
      codeSnippet: codeData.code,
      codeLanguage: codeData.language,
      replyTo: replyingTo?._id || replyingTo?.id,
    });
    if (onCancelReply) onCancelReply();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result;
        setAttachments((prev) => [
          ...prev,
          {
            url: fileUrl,
            fileName: file.name,
            fileType: file.type || 'file',
            fileSize: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    setShowAttachMenu(false);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!text.trim() && !attachments.length) || disabled || isSending) return;

    onSendMessage({
      content: text.trim(),
      attachments,
      replyTo: replyingTo?._id || replyingTo?.id,
    });

    setText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    if (onCancelReply) onCancelReply();
    if (onTypingChange) onTypingChange(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatSecs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 relative z-20">
      {/* 1. WhatsApp Quoted Reply Preview Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2 min-w-0 border-l-4 border-primary-500 pl-2.5">
            <CornerUpLeft className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 block truncate">
                Replying to {replyingTo.sender?.name || 'Member'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {replyingTo.content || replyingTo.text || 'Attachment'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Attachments Previews Bar */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 flex items-center gap-2 overflow-x-auto border-b border-slate-200/60 dark:border-slate-800">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate max-w-[130px] font-medium">{att.fileName}</span>
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                className="p-0.5 hover:text-rose-500 text-slate-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. Main Input Bar or Voice Recording Bar */}
      {isRecordingVoice ? (
        /* Voice Recording Mode Bar */
        <div className="px-4 py-3 flex items-center justify-between gap-3 animate-fade-in bg-rose-50/80 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              Recording Voice Note {formatSecs(recordingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelVoiceRecording}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary-600/25 transition-transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Voice Note</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Message Typing Bar */
        <form onSubmit={handleSubmit} className="p-3 sm:px-4 flex items-center gap-2">
          {/* Emoji Picker Button */}
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker((p) => !p);
                setShowAttachMenu(false);
              }}
              className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                showEmojiPicker ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Insert Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Categorized WhatsApp Emoji Drawer */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-40 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 animate-scale-in">
                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 overflow-x-auto text-[11px] font-bold">
                  {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveEmojiTab(cat)}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                        activeEmojiTab === cat
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold shadow-xs'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Emojis Grid */}
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                  {EMOJI_CATEGORIES[activeEmojiTab].map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddEmoji(emoji)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-base hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachments Button */}
          <div className="relative" ref={attachRef}>
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu((p) => !p);
                setShowEmojiPicker(false);
              }}
              className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                showAttachMenu ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Attach media, code or documents"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* WhatsApp Attach Menu */}
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 z-40 w-52 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 animate-scale-in text-xs font-semibold text-slate-700 dark:text-slate-200">
                <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span>Photos & Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Document or PDF</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.zip,.json"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowCodeModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <span>Share Code Snippet</span>
                </button>
              </div>
            )}
          </div>

          {/* Textarea Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending}
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200/60 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none max-h-28 transition-all"
            />
          </div>

          {/* Right Action: Send Button OR Voice Note Button */}
          {text.trim() || attachments.length > 0 ? (
            <button
              type="submit"
              disabled={disabled || isSending}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white flex items-center justify-center transition-transform active:scale-90 shadow-md shadow-primary-600/30 shrink-0"
              title="Send Message (Enter)"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartVoiceRecording}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-all shadow-xs shrink-0"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      )}

      {/* Code Snippet Modal */}
      {showCodeModal && (
        <CodeSnippetModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          onSendCode={handleSendCodeSnippet}
        />
      )}
    </div>
  );
};

export default MessageComposer;
