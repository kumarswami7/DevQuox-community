import React from 'react';

export const UnreadBadge = ({ count, className = '' }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold leading-none text-white bg-[#25d366] dark:bg-[#00a884] rounded-full shadow-xs ${className}`}
      aria-label={`${count} unread messages`}
    >
      {displayCount}
    </span>
  );
};

export default UnreadBadge;
