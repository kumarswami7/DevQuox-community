import React, { useState } from "react";
import { Filter, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "All Experience Levels" },
  { value: "entry", label: "Entry Level (0-1 yrs)" },
  { value: "junior", label: "Junior (1-3 yrs)" },
  { value: "mid", label: "Mid-Level (3-5 yrs)" },
  { value: "senior", label: "Senior (5-8 yrs)" },
  { value: "lead", label: "Lead / Principal (8+ yrs)" },
];

const AVAILABILITY_OPTIONS = [
  { value: "", label: "All Availability" },
  { value: "available", label: "Available Now" },
  { value: "open_to_offers", label: "Open to Offers" },
  { value: "busy", label: "Busy on Projects" },
  { value: "not_available", label: "Not Available" },
];

const OPEN_TO_OPTIONS = [
  { value: "", label: "All Work Types" },
  { value: "full_time", label: "Full-Time Roles" },
  { value: "contract", label: "Contract / Freelance" },
  { value: "part_time", label: "Part-Time" },
  { value: "open_source", label: "Open Source Collaboration" },
  { value: "mentorship", label: "Mentorship" },
];

const RATING_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: "4.5", label: "★ 4.5 & Above" },
  { value: "4.0", label: "★ 4.0 & Above" },
  { value: "3.5", label: "★ 3.5 & Above" },
  { value: "3.0", label: "★ 3.0 & Above" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Sort: Relevance / Match" },
  { value: "rating", label: "Sort: Highest Rating" },
  { value: "projects_count", label: "Sort: Most Completed Projects" },
  { value: "recently_updated", label: "Sort: Recently Active" },
];

export const DeveloperFilterPanel = ({
  category = "",
  onCategoryChange,
  categories = [],
  experienceLevel = "",
  onExperienceLevelChange,
  availability = "",
  onAvailabilityChange,
  openTo = "",
  onOpenToChange,
  minRating = "",
  onMinRatingChange,
  sort = "relevance",
  onSortChange,
  onResetFilters,
  className = "",
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const activeFiltersCount = [
    Boolean(category),
    Boolean(experienceLevel),
    Boolean(availability),
    Boolean(openTo),
    Boolean(minRating),
  ].filter(Boolean).length;

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-cardDark/70 glass-card space-y-2.5 sm:space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Filters & Sorting
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary-600 text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {onResetFilters && activeFiltersCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResetFilters}
              className="text-[11px] gap-1 h-7 px-2 text-rose-500 hover:text-rose-600 font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}

          <button
            type="button"
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="md:hidden inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>{isOpenMobile ? "Hide" : activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Filters"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpenMobile ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className={`${isOpenMobile ? "grid" : "hidden md:grid"} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-0.5`}>
        {/* 1. Skill Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Skill Category
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Experience Level Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Experience Level
          </label>
          <select
            value={experienceLevel}
            onChange={(e) =>
              onExperienceLevelChange && onExperienceLevelChange(e.target.value)
            }
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Availability Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Work Availability
          </label>
          <select
            value={availability}
            onChange={(e) =>
              onAvailabilityChange && onAvailabilityChange(e.target.value)
            }
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Open-To Work Preference Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Work Type
          </label>
          <select
            value={openTo}
            onChange={(e) => onOpenToChange && onOpenToChange(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            {OPEN_TO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Minimum Rating Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Minimum Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => onMinRatingChange && onMinRatingChange(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >
            {RATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Sort Order */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Sort Order
          </label>
          <select
            value={sort}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500 font-medium"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DeveloperFilterPanel;
