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
  MapPin,
  School,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { collegeService } from '../../services/collegeService';

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

const INSTITUTION_TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'University', value: 'university' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Medical', value: 'medical' },
  { label: 'Arts & Science', value: 'arts_science' },
  { label: 'Research Institute', value: 'research_institute' },
];

/**
 * 4-Tier College Logo / Avatar Badge
 * 1. Official Logo
 * 2. Domain Favicon
 * 3. Initials-based avatar badge
 * 4. Generic Institute SVG icon
 */
export const CollegeLogoBadge = ({
  logoUrl,
  domain,
  name = '',
  initials = '',
  className = 'w-10 h-10',
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Re-enable image if logoUrl or domain changes
  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl, domain]);

  const cleanDomain = domain ? domain.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').trim() : '';
  const effectiveSrc = !imgFailed && (logoUrl || (cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : ''));

  // Calculate clean initials if not supplied
  const displayInitials = (initials || (name ? name.split(/\s+/).map((w) => w[0]).join('').slice(0, 4) : 'CLG')).toUpperCase();

  // Deterministic background color based on name
  const getBadgeColor = (str) => {
    const gradients = [
      'from-blue-600 to-indigo-700 text-white',
      'from-emerald-600 to-teal-700 text-white',
      'from-violet-600 to-purple-800 text-white',
      'from-rose-600 to-red-700 text-white',
      'from-amber-600 to-orange-700 text-white',
      'from-cyan-600 to-blue-800 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (effectiveSrc && !imgFailed) {
    return (
      <div
        className={`${className} rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}
      >
        <img
          src={effectiveSrc}
          alt={name ? `${name} logo` : 'College logo'}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // Tier 3: Initials Avatar
  if (displayInitials && displayInitials !== 'CLG') {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br ${getBadgeColor(name)} flex items-center justify-center font-bold tracking-wider shrink-0 shadow-xs select-none ${
          size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base font-extrabold' : 'text-xs'
        }`}
      >
        {displayInitials}
      </div>
    );
  }

  // Tier 4: Generic Institute Icon
  return (
    <div
      className={`${className} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 select-none shadow-xs`}
    >
      <Building2 className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
    </div>
  );
};

export const CollegeSelector = ({
  value = null,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Search worldwide colleges, engineering, medical & universities...',
  className = '',
}) => {
  // Current Selected Institution
  const [selectedCollege, setSelectedCollege] = useState(() => {
    if (!value) return null;
    if (typeof value === 'object') {
      return {
        collegeId: value.college || value.collegeId || value._id || null,
        name: value.collegeName || value.name || value.institution || '',
        country: value.collegeCountry || value.country || '',
        state: value.collegeState || value.state || '',
        city: value.collegeCity || value.city || '',
        website: value.collegeWebsite || value.website || '',
        domain: value.domain || '',
        logoUrl: value.collegeLogoUrl || value.logoUrl || '',
        logoSource: value.collegeLogoSource || value.logoSource || 'favicon',
        initials: value.collegeInitials || value.initials || '',
        institutionType: value.institutionType || 'college',
        isVerified: Boolean(value.isVerifiedCollege || value.isVerified),
      };
    }
    if (typeof value === 'string' && value.trim()) {
      return {
        collegeId: null,
        name: value.trim(),
        country: '',
        state: '',
        city: '',
        website: '',
        domain: '',
        logoUrl: '',
        logoSource: 'initials',
        initials: '',
        institutionType: 'college',
        isVerified: false,
      };
    }
    return null;
  });

  // Query & Filter States
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Manual Suggestion Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    country: 'India',
    state: '',
    city: '',
    website: '',
    institutionType: 'college',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (!value) {
      setSelectedCollege(null);
      return;
    }
    if (typeof value === 'object') {
      setSelectedCollege({
        collegeId: value.college || value.collegeId || value._id || null,
        name: value.collegeName || value.name || value.institution || '',
        country: value.collegeCountry || value.country || '',
        state: value.collegeState || value.state || '',
        city: value.collegeCity || value.city || '',
        website: value.collegeWebsite || value.website || '',
        domain: value.domain || '',
        logoUrl: value.collegeLogoUrl || value.logoUrl || '',
        logoSource: value.collegeLogoSource || value.logoSource || 'favicon',
        initials: value.collegeInitials || value.initials || '',
        institutionType: value.institutionType || 'college',
        isVerified: Boolean(value.isVerifiedCollege || value.isVerified),
      });
    }
  }, [value]);

  // Debounced Search Handler
  const executeSearch = useCallback(
    async (searchTerm, country, instType, city) => {
      setIsLoading(true);
      setApiError(null);

      try {
        const res = await collegeService.search({
          query: searchTerm,
          country: country !== 'All Countries' ? country : '',
          institutionType: instType !== 'all' ? instType : '',
          city: city || '',
          limit: 20,
        });

        const data = res.data?.data || res.data?.colleges || [];
        setResults(data);
        setHighlightedIndex(-1);
      } catch (err) {
        console.warn('[CollegeSelector] search error:', err.message);
        setApiError('Unable to load colleges. Tap retry or enter manually.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      executeSearch(query, countryFilter, typeFilter, cityFilter);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, countryFilter, typeFilter, cityFilter, isOpen, executeSearch]);

  // Click Outside to Dismiss Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelectCollege(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle Selection
  const handleSelectCollege = (college) => {
    const formatted = {
      collegeId: college._id || college.collegeId || null,
      name: college.name || college.institution || '',
      country: college.country || '',
      state: college.state || '',
      city: college.city || '',
      website: college.website || (college.domain ? `https://${college.domain}` : ''),
      domain: college.domain || '',
      logoUrl: college.logoUrl || '',
      logoSource: college.logoSource || 'favicon',
      initials: college.initials || '',
      institutionType: college.institutionType || 'college',
      isVerified: Boolean(college.verificationStatus === 'verified' || college.isVerified),
    };

    setSelectedCollege(formatted);
    setIsOpen(false);
    setQuery('');

    if (onChange) {
      onChange({
        institution: formatted.name,
        college: formatted.collegeId,
        collegeName: formatted.name,
        collegeCountry: formatted.country,
        collegeState: formatted.state,
        collegeCity: formatted.city,
        collegeWebsite: formatted.website,
        collegeLogoUrl: formatted.logoUrl,
        collegeLogoSource: formatted.logoSource,
        collegeInitials: formatted.initials,
        institutionType: formatted.institutionType,
        isVerifiedCollege: formatted.isVerified,
      });
    }
  };

  // Handle Clear
  const handleClearSelection = (e) => {
    e.stopPropagation();
    setSelectedCollege(null);
    setQuery('');
    if (onChange) {
      onChange({
        institution: '',
        college: null,
        collegeName: '',
        collegeCountry: '',
        collegeState: '',
        collegeCity: '',
        collegeWebsite: '',
        collegeLogoUrl: '',
        collegeLogoSource: 'favicon',
        collegeInitials: '',
        institutionType: 'college',
        isVerifiedCollege: false,
      });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle Manual Submission
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      setManualError('College or institution name is required');
      return;
    }
    if (!manualForm.country.trim()) {
      setManualError('Country is required');
      return;
    }

    setIsSubmittingManual(true);
    setManualError(null);

    try {
      const res = await collegeService.createManual(manualForm);
      const created = res.data?.data;
      if (created) {
        handleSelectCollege(created);
        setIsManualModalOpen(false);
        setManualForm({
          name: '',
          country: 'India',
          state: '',
          city: '',
          website: '',
          institutionType: 'college',
        });
      }
    } catch (err) {
      setManualError(err.response?.data?.message || err.message || 'Failed to submit college');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* 1. Selected State Preview Card */}
      {selectedCollege && selectedCollege.name ? (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 backdrop-blur-xs transition-all hover:border-blue-300 dark:hover:border-blue-800 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <CollegeLogoBadge
              logoUrl={selectedCollege.logoUrl}
              domain={selectedCollege.domain}
              name={selectedCollege.name}
              initials={selectedCollege.initials}
              className="w-11 h-11"
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {selectedCollege.name}
                </span>
                {selectedCollege.isVerified ? (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    title="Verified Institution in Registry"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    title="User suggested institution"
                  >
                    Community Listed
                  </span>
                )}
                {selectedCollege.institutionType && (
                  <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                    {selectedCollege.institutionType.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                {(selectedCollege.city || selectedCollege.country) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {[selectedCollege.city, selectedCollege.state, selectedCollege.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
                {selectedCollege.website && (
                  <a
                    href={selectedCollege.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[#0091ff] hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              aria-label="Remove college"
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* 2. Search Autocomplete Input */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-24 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]/30 focus:border-[#0091ff] transition-all shadow-xs"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {isLoading && <Loader2 className="w-4 h-4 text-[#0091ff] animate-spin" />}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  showAdvancedFilters || countryFilter !== 'All Countries' || typeFilter !== 'all'
                    ? 'text-[#0091ff] bg-blue-50 dark:bg-blue-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Filters (Country, City, Type)"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Optional Filter Bar */}
          {showAdvancedFilters && (
            <div className="mt-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center gap-2 text-xs">
              {/* Country Select */}
              <div className="flex items-center gap-1 min-w-[140px]">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#0091ff]"
                >
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Institution Type Select */}
              <div className="flex items-center gap-1 min-w-[130px]">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#0091ff]"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Input Filter */}
              <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City (e.g. Mumbai)"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#0091ff]"
                />
              </div>

              {(countryFilter !== 'All Countries' || typeFilter !== 'all' || cityFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setCountryFilter('All Countries');
                    setTypeFilter('all');
                    setCityFilter('');
                  }}
                  className="text-red-500 hover:underline text-[11px]"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden backdrop-blur-md">
              <div ref={dropdownRef} className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading && results.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0091ff]" />
                    <span className="text-xs">Searching worldwide colleges...</span>
                  </div>
                ) : apiError ? (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium mb-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{apiError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => executeSearch(query, countryFilter, typeFilter, cityFilter)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry Search
                    </button>
                  </div>
                ) : results.length > 0 ? (
                  results.map((col, idx) => (
                    <div
                      key={col._id || `${col.name}-${idx}`}
                      onClick={() => handleSelectCollege(col)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        highlightedIndex === idx
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CollegeLogoBadge
                          logoUrl={col.logoUrl}
                          domain={col.domain}
                          name={col.name}
                          initials={col.initials}
                          className="w-9 h-9"
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {col.name}
                            </span>
                            {col.verificationStatus === 'verified' && (
                              <ShieldCheck
                                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                                title="Verified Institute"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            {(col.city || col.country) && (
                              <span>{[col.city, col.country].filter(Boolean).join(', ')}</span>
                            )}
                            {col.institutionType && (
                              <span className="capitalize px-1.5 py-0.2 rounded-sm bg-slate-100 dark:bg-slate-800 text-[10px]">
                                {col.institutionType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {col.website && (
                        <a
                          href={col.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-400 hover:text-[#0091ff] rounded-md transition-colors shrink-0 ml-2"
                          title="Open official website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      No matching colleges found {query ? `for "${query}"` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualForm((prev) => ({
                          ...prev,
                          name: query || '',
                          country: countryFilter !== 'All Countries' ? countryFilter : 'India',
                        }));
                        setIsManualModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0091ff] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add "{query || 'Your College'}" Manually
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Quick-Action Footer */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] text-slate-400">Press ↑↓ to navigate, Enter to select</span>
                <button
                  type="button"
                  onClick={() => {
                    setManualForm((prev) => ({
                      ...prev,
                      name: query || '',
                      country: countryFilter !== 'All Countries' ? countryFilter : 'India',
                    }));
                    setIsManualModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0091ff] hover:underline"
                >
                  <PlusCircle className="w-3 h-3" />
                  Add College Manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Manual College Suggestion Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0091ff] flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Add Missing College / University
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submit your institution to the worldwide directory.
                </p>
              </div>
            </div>

            {manualError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Institute of Technology"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={manualForm.country}
                    onChange={(e) => setManualForm({ ...manualForm, country: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution Type
                  </label>
                  <select
                    value={manualForm.institutionType}
                    onChange={(e) => setManualForm({ ...manualForm, institutionType: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  >
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="engineering">Engineering College</option>
                    <option value="medical">Medical College</option>
                    <option value="arts_science">Arts & Science</option>
                    <option value="research_institute">Research Institute</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={manualForm.city}
                    onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={manualForm.state}
                    onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Website
                </label>
                <input
                  type="text"
                  placeholder="https://www.college.edu"
                  value={manualForm.website}
                  onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0091ff] hover:bg-[#0080e6] rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingManual && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSelector;

