import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Globe,
  GraduationCap,
  ExternalLink,
  Check,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  PlusCircle,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { universityService } from '../../services/universityService';

const POPULAR_COUNTRIES = [
  'All Countries',
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'Netherlands',
  'France',
  'Switzerland',
  'Japan',
];

export const UniversitySelector = ({
  value = null, // Can be string institution or object { institution, university, universityCountry, universityLogoUrl, universityDomain }
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Search worldwide university by name...',
  className = '',
}) => {
  // Current selection state
  const [selectedUniversity, setSelectedUniversity] = useState(() => {
    if (!value) return null;
    if (typeof value === 'object' && (value.institution || value.universityName)) {
      return {
        institution: value.institution || value.universityName,
        universityId: value.university || value._id || null,
        country: value.universityCountry || value.country || '',
        logoUrl: value.universityLogoUrl || value.logoUrl || '',
        domain: value.universityDomain || value.domains?.[0] || '',
        isVerified: Boolean(value.isVerifiedUniversity || value.isVerified),
      };
    }
    if (typeof value === 'string' && value.trim()) {
      return {
        institution: value.trim(),
        universityId: null,
        country: '',
        logoUrl: '',
        domain: '',
        isVerified: false,
      };
    }
    return null;
  });

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Manual entry mode toggle
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCountry, setManualCountry] = useState('India');
  const [manualWebsite, setManualWebsite] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync internal selection with external value prop
  useEffect(() => {
    if (!value) {
      setSelectedUniversity(null);
      return;
    }
    if (typeof value === 'object') {
      setSelectedUniversity({
        institution: value.institution || value.universityName || '',
        universityId: value.university || value._id || null,
        country: value.universityCountry || value.country || '',
        logoUrl: value.universityLogoUrl || value.logoUrl || '',
        domain: value.universityDomain || value.domains?.[0] || '',
        isVerified: Boolean(value.isVerifiedUniversity || value.isVerified),
      });
    } else if (typeof value === 'string') {
      setSelectedUniversity((prev) => {
        if (prev?.institution === value) return prev;
        return {
          institution: value,
          universityId: null,
          country: '',
          logoUrl: '',
          domain: '',
          isVerified: false,
        };
      });
    }
  }, [value]);

  // Debounced search logic
  useEffect(() => {
    if (!isOpen || isManualMode) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await universityService.search({
          query: query.trim(),
          country: countryFilter !== 'All Countries' ? countryFilter : undefined,
          limit: 15,
        });

        if (response.data?.success) {
          setResults(response.data.data || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.warn('University search failed, falling back:', err.message);
        setApiError('Unable to connect to university catalog. You can type manually.');
        setResults([]);
      } finally {
        setIsLoading(false);
        setHighlightedIndex(-1);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, countryFilter, isOpen, isManualMode]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle university selection
  const handleSelect = (item) => {
    const selected = {
      institution: item.universityName,
      universityId: item._id,
      country: item.country,
      countryCode: item.countryCode,
      logoUrl: item.logoUrl,
      domain: item.domains?.[0] || '',
      website: item.websites?.[0] || '',
      isVerified: Boolean(item.isVerified),
    };

    setSelectedUniversity(selected);
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);

    if (onChange) {
      onChange({
        institution: selected.institution,
        university: selected.universityId,
        universityCountry: selected.country,
        universityLogoUrl: selected.logoUrl,
        universityDomain: selected.domain,
        isVerifiedUniversity: selected.isVerified,
      });
    }
  };

  // Clear current selection
  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedUniversity(null);
    setQuery('');
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();

    if (onChange) {
      onChange({
        institution: '',
        university: null,
        universityCountry: '',
        universityLogoUrl: '',
        universityDomain: '',
        isVerifiedUniversity: false,
      });
    }
  };

  // Submit manual university
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setIsSubmittingManual(true);
    try {
      const res = await universityService.createManual({
        universityName: manualName.trim(),
        country: manualCountry.trim() || 'Worldwide',
        website: manualWebsite.trim(),
      });

      const created = res.data?.data || {
        _id: null,
        universityName: manualName.trim(),
        country: manualCountry.trim(),
        logoUrl: '',
        domains: [],
        isVerified: false,
      };

      handleSelect(created);
      setIsManualMode(false);
      setManualName('');
      setManualWebsite('');
    } catch {
      // Fallback local selection without API
      handleSelect({
        _id: null,
        universityName: manualName.trim(),
        country: manualCountry.trim(),
        logoUrl: '',
        domains: [],
        isVerified: false,
      });
      setIsManualMode(false);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className={`relative w-full text-left font-sans ${className}`} ref={containerRef}>
      {/* ── 1. SELECTED UNIVERSITY PREVIEW DISPLAY ── */}
      {selectedUniversity && !isOpen ? (
        <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 transition-all hover:border-blue-300">
          <div className="flex items-center gap-3 min-w-0">
            {/* University Logo / Favicon with fallback */}
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {selectedUniversity.logoUrl ? (
                <img
                  src={selectedUniversity.logoUrl}
                  alt={selectedUniversity.institution}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full items-center justify-center text-[#0a66c2] dark:text-sky-400 ${
                  selectedUniversity.logoUrl ? 'hidden' : 'flex'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            {/* University Details */}
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[280px] sm:max-w-[340px]">
                  {selectedUniversity.institution}
                </span>
                {selectedUniversity.isVerified && (
                  <span
                    title="Verified Educational Institution"
                    className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedUniversity.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>{selectedUniversity.country}</span>
                  </span>
                )}
                {selectedUniversity.domain && (
                  <span className="text-slate-400 font-mono text-[10px]">
                    • {selectedUniversity.domain}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action: Clear or Change */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0a66c2] dark:text-sky-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remove selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── 2. SEARCH & AUTOCOMPLETE INPUT ── */
        <div className="space-y-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>

              <input
                ref={inputRef}
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40 transition-all shadow-xs"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Country Filter Selector */}
            <div className="relative shrink-0 sm:w-44">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40 cursor-pointer shadow-xs appearance-none pr-8"
              >
                {POPULAR_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ── 3. AUTOCOMPLETE DROPDOWN RESULTS ── */}
          {isOpen && !isManualMode && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#151f28] border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in duration-150">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0a66c2] dark:text-sky-400" />
                  <span>
                    {countryFilter === 'All Countries'
                      ? 'Worldwide Directory'
                      : `${countryFilter} Directory`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className="text-xs font-semibold text-[#0a66c2] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Enter Manually</span>
                </button>
              </div>

              {/* List items */}
              <div ref={dropdownRef} className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <div className="flex items-center justify-center p-6 gap-2.5 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0a66c2]" />
                    <span>Searching worldwide universities...</span>
                  </div>
                ) : apiError ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{apiError}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsManualMode(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                    >
                      Enter College Manually
                    </button>
                  </div>
                ) : results.length > 0 ? (
                  results.map((item, idx) => (
                    <div
                      key={item._id || item.universityName + idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors text-left ${
                        highlightedIndex === idx
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Favicon or fallback */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.logoUrl ? (
                            <img
                              src={item.logoUrl}
                              alt="logo"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full items-center justify-center text-slate-400 ${
                              item.logoUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.universityName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{item.country}</span>
                            {item.stateProvince && <span>• {item.stateProvince}</span>}
                            {item.domains?.[0] && (
                              <span className="font-mono text-slate-400">
                                • {item.domains[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.isVerified && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shrink-0">
                          Verified
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No colleges found matching "{query}".
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Can't find your educational institution in the database?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualName(query);
                        setIsManualMode(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-[#0a66c2] dark:text-sky-400 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Enter "{query || 'Your College'}" Manually</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4. MANUAL COLLEGE ENTRY FORM MODAL/INLINE ── */}
          {isOpen && isManualMode && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#151f28] border border-blue-200 dark:border-blue-900 shadow-2xl p-4 animate-in fade-in duration-150 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <GraduationCap className="w-4 h-4 text-[#0a66c2]" />
                  <span>Manual Institution Entry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Back to Search
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / University Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RGUKT Ongole or Oxford College of Engineering"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. India or United States"
                      value={manualCountry}
                      onChange={(e) => setManualCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.rguktong.ac.in"
                      value={manualWebsite}
                      onChange={(e) => setManualWebsite(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsManualMode(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual || !manualName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingManual && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Select</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversitySelector;

