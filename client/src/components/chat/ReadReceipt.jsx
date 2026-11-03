import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export const ReadReceipt = ({
  isRead = false,
  isDelivered = true,
  className = '',
}) => {
  // WhatsApp Read: Double Cyan/Blue Ticks (#53bdeb)
  if (isRead) {
    return (
      <span
        title="Read"
        aria-label="Read"
        className={`inline-flex items-center text-[#53bdeb] dark:text-[#53bdeb] ${className}`}
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
      </span>
    );
  }

  // WhatsApp Delivered: Double Gray Ticks
  if (isDelivered) {
    return (
      <span
        title="Delivered"
        aria-label="Delivered"
        className={`inline-flex items-center text-slate-400 dark:text-slate-400 ${className}`}
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
      </span>
    );
  }

  // WhatsApp Sent: Single Gray Tick
  return (
    <span
      title="Sent"
      aria-label="Sent"
      className={`inline-flex items-center text-slate-400 dark:text-slate-400 ${className}`}
    >
      <Check className="w-3.5 h-3.5 stroke-[2]" />
    </span>
  );
};

export default ReadReceipt;
