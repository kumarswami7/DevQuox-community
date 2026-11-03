import React from 'react';

export const TypingIndicator = ({ typingUsers = [], className = '' }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  let label = 'typing...';
  if (typingUsers.length === 1) {
    const name = typingUsers[0].name || typingUsers[0].userName;
    label = name ? `${name} is typing...` : 'typing...';
  } else if (typingUsers.length === 2) {
    const name1 = typingUsers[0].name || typingUsers[0].userName || 'Member';
    const name2 = typingUsers[1].name || typingUsers[1].userName || 'Member';
    label = `${name1} and ${name2} are typing...`;
  } else {
    label = `${typingUsers.length} people are typing...`;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 text-xs text-[#00a884] dark:text-[#25d366] font-medium animate-fade-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] dark:bg-[#25d366] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] dark:bg-[#25d366] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] dark:bg-[#25d366] animate-bounce" />
      </div>
      <span className="text-[11px] italic tracking-wide">{label}</span>
    </div>
  );
};

export default TypingIndicator;
