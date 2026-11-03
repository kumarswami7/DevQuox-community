import React from 'react';
import { TechnologyIcon } from '../skills/TechnologyIcon';

const PROFICIENCY_COLORS = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  intermediate: 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/25',
  advanced: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
  expert: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
};

/**
 * Standard SkillBadge Component
 * Displays the official technology icon, skill name, optional proficiency, and remove button.
 */
export const SkillBadge = ({
  name,
  category,
  proficiency,
  yearsOfExperience,
  onRemove,
  showDetails = false,
  size = 'sm',
  className = '',
}) => {
  const profKey = (proficiency || 'intermediate').toLowerCase();
  const colorClass = PROFICIENCY_COLORS[profKey] || PROFICIENCY_COLORS.intermediate;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-xl font-semibold border transition-all select-none ${sizeClasses} ${colorClass} ${className}`}
    >
      <TechnologyIcon name={name} size={size === 'xs' ? 'xs' : 'sm'} />
      <span className="truncate">{name}</span>

      {showDetails && proficiency && (
        <span className="text-[10px] opacity-80 uppercase tracking-wider font-bold">
          • {proficiency}
        </span>
      )}

      {showDetails && yearsOfExperience && (
        <span className="text-[10px] opacity-75">
          ({yearsOfExperience}y)
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(name);
          }}
          className="ml-0.5 p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 hover:text-red-500 transition-colors focus:outline-none cursor-pointer"
          aria-label={`Remove ${name}`}
          title={`Remove ${name}`}
        >
          <span className="text-sm leading-none font-bold">×</span>
        </button>
      )}
    </span>
  );
};

export default SkillBadge;
