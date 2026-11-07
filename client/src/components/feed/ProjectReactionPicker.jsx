import React, { useState, useRef, useEffect } from "react";
import { ThumbsUp, Sparkles, HeartHandshake, Lightbulb, HelpCircle } from "lucide-react";

export const REACTION_CONFIG = {
  like: {
    label: "Like",
    icon: ThumbsUp,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    emoji: "👍",
    border: "border-blue-200 dark:border-blue-900",
  },
  celebrate: {
    label: "Celebrate",
    icon: Sparkles,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    emoji: "👏",
    border: "border-emerald-200 dark:border-emerald-900",
  },
  support: {
    label: "Support",
    icon: HeartHandshake,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    emoji: "🤝",
    border: "border-purple-200 dark:border-purple-900",
  },
  insightful: {
    label: "Insightful",
    icon: Lightbulb,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    emoji: "💡",
    border: "border-amber-200 dark:border-amber-900",
  },
  curious: {
    label: "Curious",
    icon: HelpCircle,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    emoji: "🤔",
    border: "border-teal-200 dark:border-teal-900",
  },
};

export const ProjectReactionPicker = ({
  userReaction,
  onSelectReaction,
  onRemoveReaction,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  const handleMainButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (userReaction) {
      onRemoveReaction();
    } else {
      onSelectReaction("like");
    }
  };

  const handleReactionClick = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setShowPicker(false);
    if (userReaction === type) {
      onRemoveReaction();
    } else {
      onSelectReaction(type);
    }
  };

  // Close picker on outside click (for mobile)
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const activeConfig = userReaction ? REACTION_CONFIG[userReaction] || REACTION_CONFIG.like : null;
  const ActiveIcon = activeConfig ? activeConfig.icon : ThumbsUp;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating LinkedIn-style Reaction Popover */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1.5 p-1.5 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md"
          role="toolbar"
          aria-label="Choose a reaction"
        >
          {Object.entries(REACTION_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = userReaction === key;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => handleReactionClick(e, key)}
                className={`group relative p-2 rounded-full transition-all duration-200 hover:scale-125 active:scale-95 ${
                  isSelected
                    ? `${config.bg} ${config.color} ring-2 ring-primary-500`
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
                title={config.label}
                aria-label={config.label}
              >
                <span className="text-xl leading-none select-none" role="img" aria-hidden="true">
                  {config.emoji}
                </span>
                {/* Micro tooltip */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={handleMainButtonClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPicker(!showPicker);
        }}
        disabled={disabled}
        className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none w-full sm:w-auto ${
          activeConfig
            ? `${activeConfig.color} ${activeConfig.bg} font-bold`
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={userReaction ? `Reacted: ${activeConfig?.label}. Click to remove.` : "React to project"}
      >
        {activeConfig ? (
          <>
            <span className="text-sm leading-none">{activeConfig.emoji}</span>
            <span className="hidden sm:inline">{activeConfig.label}</span>
          </>
        ) : (
          <>
            <ThumbsUp className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">React</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProjectReactionPicker;

