import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, X, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { TechnologyIcon } from './TechnologyIcon';
import {
  CANONICAL_SKILLS,
  searchCanonicalSkills,
  normalizeSkillKey,
  findSkillByNameOrAlias,
} from '../../constants/skillRegistry';
import { discoveryService } from '../../services/discoveryService';

// Curated top technologies for quick one-click picking
const POPULAR_QUICK_PICKS = [
  'React',
  'Node.js',
  'TypeScript',
  'JavaScript',
  'MongoDB',
  'Python',
  'Docker',
  'Next.js',
  'AWS',
  'PostgreSQL',
  'Express.js',
  'Git',
  'Figma',
  'Kubernetes',
];

/**
 * SkillSelector Component
 * Integrated searchable skill selection with official technology icons,
 * duplicate prevention, category grouping, and quick-pick options.
 */
export const SkillSelector = ({
  selectedSkills = [],
  onAddSkill,
  onRemoveSkill,
  placeholder = 'Search technologies (e.g. React, Docker, Python)...',
  maxSkills = 30,
  showQuickPicks = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search skills from backend or canonical registry
  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setSuggestions(CANONICAL_SKILLS.slice(0, 10));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Query discovery backend
      const apiResults = await discoveryService.suggestSkills(searchTerm.trim());
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        setSuggestions(apiResults);
      } else {
        // Fallback to canonical registry
        const localMatches = searchCanonicalSkills(searchTerm.trim(), 10);
        setSuggestions(localMatches);
      }
    } catch {
      const localMatches = searchCanonicalSkills(searchTerm.trim(), 10);
      setSuggestions(localMatches);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setErrorMsg('');

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 200);
  };

  const isAlreadySelected = (skillName) => {
    const targetKey = normalizeSkillKey(skillName);
    return selectedSkills.some((s) => {
      const existingName = typeof s === 'string' ? s : s?.name;
      return normalizeSkillKey(existingName) === targetKey;
    });
  };

  const handleSelectSkill = (skillItem) => {
    const nameToAdd = typeof skillItem === 'string' ? skillItem : skillItem?.name;
    if (!nameToAdd || !nameToAdd.trim()) return;

    // Check duplicate
    if (isAlreadySelected(nameToAdd)) {
      setErrorMsg(`"${nameToAdd}" is already in your skills list.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (selectedSkills.length >= maxSkills) {
      setErrorMsg(`Maximum of ${maxSkills} skills reached.`);
      return;
    }

    // Canonical resolution
    const canonical = findSkillByNameOrAlias(nameToAdd);
    const finalName = canonical ? canonical.name : nameToAdd.trim();

    if (onAddSkill) {
      onAddSkill(finalName);
    }

    setQuery('');
    setIsOpen(false);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleSelectSkill(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`space-y-2.5 w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 transition-all focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 shadow-2xs">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (!suggestions.length) fetchSuggestions(query);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full py-2.5 pr-20 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />

          <div className="pr-2 flex items-center gap-1">
            {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleSelectSkill(query.trim())}
                className="px-2.5 py-1 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
        </div>

        {/* Error / Duplicate Notice */}
        {errorMsg && (
          <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1 animate-fade-in">
            <AlertCircle className="w-3 h-3" /> {errorMsg}
          </p>
        )}

        {/* Dropdown Suggestions */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{query ? 'Matched Technologies' : 'Popular Developer Skills'}</span>
              <span>Press Enter to select</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Custom add row if user typed query not in top results */}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectSkill(query.trim())}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-500 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Add custom skill: <span className="text-primary-500 font-extrabold">"{query.trim()}"</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Custom or niche tool</p>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-primary-500 opacity-60 group-hover:opacity-100 shrink-0" />
                </button>
              )}

              {/* Suggestions list */}
              {suggestions.length > 0 ? (
                suggestions.map((skill) => {
                  const sName = skill.name || skill;
                  const selected = isAlreadySelected(sName);

                  return (
                    <button
                      key={sName}
                      type="button"
                      disabled={selected}
                      onClick={() => handleSelectSkill(sName)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                        selected
                          ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <TechnologyIcon name={sName} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sName}
                          </span>
                          {skill.category && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {skill.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {selected ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Added
                        </span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-primary-500 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : !query.trim() ? null : (
                <div className="p-3 text-center text-xs text-slate-400">
                  <p>No exact technology match found for "{query}"</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Click "Add custom skill" above to add it anyway.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Picks for Rapid Multi-Selection */}
      {showQuickPicks && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Add Recommended Technologies:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_QUICK_PICKS.map((tech) => {
              const selected = isAlreadySelected(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  disabled={selected}
                  onClick={() => handleSelectSkill(tech)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 active:scale-95 shadow-2xs'
                  }`}
                >
                  <TechnologyIcon name={tech} size="xs" />
                  <span>{tech}</span>
                  {selected ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <Plus className="w-2.5 h-2.5 text-slate-400 group-hover:text-primary-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillSelector;

