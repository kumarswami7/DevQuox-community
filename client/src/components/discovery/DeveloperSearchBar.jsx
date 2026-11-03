import React from "react";
import { Search, X } from "lucide-react";

export const DeveloperSearchBar = ({
  searchQuery,
  onSearchChange,
  onClear,
  placeholder = "Search developers by name, headline, bio, or role...",
  className = "",
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default DeveloperSearchBar;
