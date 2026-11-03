import React from "react";

const AVAILABILITY_CONFIG = {
  available: {
    label: "Available for Hire",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  open_to_offers: {
    label: "Open to Offers",
    dotColor: "bg-primary-500",
    badgeClass: "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20",
  },
  busy: {
    label: "Busy on Projects",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  not_available: {
    label: "Not Available",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

export const AvailabilityIndicator = ({ status = "available", showLabel = true, size = "md" }) => {
  const normStatus = (status || "available").toLowerCase().replace(/\s+/g, "_");
  const config = AVAILABILITY_CONFIG[normStatus] || AVAILABILITY_CONFIG.available;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.badgeClass}`}
      title={config.label}
    >
      <span className={`w-2 h-2 rounded-full animate-pulse ${config.dotColor}`} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export default AvailabilityIndicator;
