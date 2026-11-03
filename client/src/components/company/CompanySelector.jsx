import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Building2,
  Check,
  X,
  Loader2,
  Plus,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import {
  BADGE_GRADIENTS,
  getGradientForString,
  KNOWN_COMPANY_DOMAINS,
  resolveDomainFromName,
} from './companyUtils';

/**
 * 4-Tier Company Logo / Avatar Badge:
 * 1. Jobiwork / Official direct logo URL
 * 2. Google Favicon (from domain, website, or inferred root domain)
 * 3. Initials-based vibrant gradient avatar
 * 4. Corporate Building2 fallback icon
 */
export const CompanyLogoBadge = ({
  logoUrl,
  domain,
  name = '',
  initials = '',
  className = 'w-7 h-7',
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl, domain, name]);

  const cleanDomain = domain
    ? domain.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').trim()
    : resolveDomainFromName(name);

  const effectiveSrc =
    !imgFailed &&
    (logoUrl ||
      (cleanDomain
        ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
        : ''));

  const displayInitials = (
    initials ||
    (name
      ? name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
      : 'CO')
  ).toUpperCase();

  if (effectiveSrc && !imgFailed) {
    return (
      <div
        className={`${className} rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}
      >
        <img
          src={effectiveSrc}
          alt={name ? `${name} logo` : 'Company logo'}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-lg bg-gradient-to-br ${getGradientForString(
        name || 'company'
      )} flex items-center justify-center shrink-0 font-bold tracking-tight shadow-2xs select-none`}
      style={{ fontSize: size === 'sm' ? '9px' : size === 'lg' ? '13px' : '10px' }}
      title={name}
    >
      {displayInitials || <Building2 className="w-3.5 h-3.5" />}
    </div>
  );
};

// Popular curated tech / enterprise companies for fast one-click picking
const POPULAR_COMPANIES = [
  { name: 'Google', domain: 'google.com', logoUrl: 'https://www.google.com/s2/favicons?domain=google.com&sz=128', industry: 'Technology & Cloud', country: 'United States' },
  { name: 'Microsoft', domain: 'microsoft.com', logoUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128', industry: 'Enterprise Software & Cloud', country: 'United States' },
  { name: 'Tata Consultancy Services', domain: 'tcs.com', logoUrl: 'https://www.google.com/s2/favicons?domain=tcs.com&sz=128', industry: 'IT Services & Consulting', country: 'India' },
  { name: 'Infosys', domain: 'infosys.com', logoUrl: 'https://www.google.com/s2/favicons?domain=infosys.com&sz=128', industry: 'IT Services & Consulting', country: 'India' },
  { name: 'Razorpay', domain: 'razorpay.com', logoUrl: 'https://www.google.com/s2/favicons?domain=razorpay.com&sz=128', industry: 'Fintech & Payments', country: 'India' },
  { name: 'Amazon', domain: 'amazon.com', logoUrl: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128', industry: 'E-Commerce & Cloud (AWS)', country: 'United States' },
  { name: 'Stripe', domain: 'stripe.com', logoUrl: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128', industry: 'Financial Infrastructure', country: 'United States' },
  { name: 'Meta', domain: 'meta.com', logoUrl: 'https://www.google.com/s2/favicons?domain=meta.com&sz=128', industry: 'Social Technology & AI', country: 'United States' },
];

/**
 * CompanySelector Component
 * Integrated company autocomplete with real-time Jobiwork & database resolution.
 * Auto-resolves company logo, domain, and location.
 */
export const CompanySelector = ({
  value = '',
  logoUrl = '',
  domain = '',
  onChange,
  placeholder = 'e.g. Google, Microsoft, Stripe, or your startup...',
  error,
}) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(
    value ? { name: value, logoUrl, domain } : null
  );

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value !== (selectedCompany?.name || '')) {
      if (value) {
        setSelectedCompany({
          name: value,
          logoUrl: logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : ''),
          domain,
        });
        setQuery(value);
      } else {
        setSelectedCompany(null);
        setQuery('');
      }
    }
  }, [value, logoUrl, domain]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search API caller
  const searchCompanies = useCallback(async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setResults(POPULAR_COMPANIES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await companyService.searchCompanies({ q: searchTerm.trim(), limit: 8 });
      const items = res?.data || [];
      setResults(items);
    } catch {
      // Fallback local filter on popular companies
      const qLower = searchTerm.toLowerCase();
      const filtered = POPULAR_COMPANIES.filter(
        (c) => c.name.toLowerCase().includes(qLower) || c.domain.toLowerCase().includes(qLower)
      );
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle typing input
  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);

    if (selectedCompany && selectedCompany.name !== text) {
      setSelectedCompany(null);
    }

    // Inform parent of current text value
    if (onChange) {
      onChange({
        company: text,
        companyLogo: text ? `https://www.google.com/s2/favicons?domain=${text.toLowerCase().replace(/\s+/g, '')}.com&sz=128` : '',
        companyDomain: '',
        companyWebsite: '',
      });
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      searchCompanies(text);
    }, 240);
  };

  // Select an indexed company
  const handleSelect = (item) => {
    const logo =
      item.logoUrl ||
      (item.domain ? `https://www.google.com/s2/favicons?domain=${item.domain}&sz=128` : '');

    const companyData = {
      name: item.name,
      logoUrl: logo,
      domain: item.domain || '',
      website: item.website || '',
      location: item.city ? `${item.city}, ${item.country}` : (item.country || ''),
      companyId: item._id || null,
    };

    setSelectedCompany(companyData);
    setQuery(item.name);
    setIsOpen(false);

    if (onChange) {
      onChange({
        company: item.name,
        companyLogo: logo,
        companyDomain: item.domain || '',
        companyWebsite: item.website || '',
        location: companyData.location,
        companyId: item._id || null,
      });
    }
  };

  // Select custom / non-listed company
  const handleUseCustom = (customName) => {
    const trimmed = (customName || query).trim();
    if (!trimmed) return;

    // Detect if domain-like (e.g. gatenevo.com or stripe)
    const isDomain = trimmed.includes('.') && !trimmed.includes(' ');
    const domainPart = isDomain ? trimmed : `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const derivedLogo = `https://www.google.com/s2/favicons?domain=${domainPart}&sz=128`;

    const companyData = {
      name: trimmed,
      logoUrl: derivedLogo,
      domain: isDomain ? trimmed : '',
      website: isDomain ? `https://${trimmed}` : '',
    };

    setSelectedCompany(companyData);
    setQuery(trimmed);
    setIsOpen(false);

    if (onChange) {
      onChange({
        company: trimmed,
        companyLogo: derivedLogo,
        companyDomain: companyData.domain,
        companyWebsite: companyData.website,
      });
    }
  };

  const handleClear = () => {
    setSelectedCompany(null);
    setQuery('');
    setResults(POPULAR_COMPANIES);
    if (onChange) {
      onChange({
        company: '',
        companyLogo: '',
        companyDomain: '',
        companyWebsite: '',
        companyId: null,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container */}
      <div
        className={`relative flex items-center rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 transition-all ${error
            ? 'border-rose-400 dark:border-rose-600 focus-within:ring-2 focus-within:ring-rose-500/20'
            : 'border-slate-200 dark:border-slate-700 focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20'
          }`}
      >
        {/* Leading Logo or Search Icon */}
        <div className="pl-3 pr-2 flex items-center justify-center shrink-0">
          {selectedCompany?.name ? (
            <CompanyLogoBadge
              name={selectedCompany.name}
              logoUrl={selectedCompany.logoUrl}
              domain={selectedCompany.domain}
              className="w-5 h-5"
              size="sm"
            />
          ) : (
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (!results.length) searchCompanies(query);
          }}
          placeholder={placeholder}
          className="w-full py-2.5 pr-8 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />

        {/* Action button: Loading or Clear */}
        <div className="pr-2.5 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Clear company"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in max-h-72 flex flex-col">
          {/* Header indicator */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>{query ? 'Suggested Companies' : 'Top Tech & Enterprise Companies'}</span>
            {query && <span>Press Enter to use custom</span>}
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Custom option if query is non-empty */}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleUseCustom(query)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-red-50/70 dark:hover:bg-red-950/40 transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-100/70 dark:bg-red-950/60 text-primary-500 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    Use <span className="text-primary-500 dark:text-red-400 font-bold">"{query.trim()}"</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Add as custom or startup company</p>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-primary-500 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            )}

            {/* Results list */}
            {results.length > 0 ? (
              results.map((comp, idx) => {
                const isSelected = selectedCompany?.name?.toLowerCase() === comp.name.toLowerCase();
                return (
                  <button
                    key={comp._id || comp.name || idx}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer ${isSelected ? 'bg-red-50/50 dark:bg-red-950/30' : ''
                      }`}
                  >
                    <CompanyLogoBadge
                      name={comp.name}
                      logoUrl={comp.logoUrl}
                      domain={comp.domain}
                      initials={comp.initials}
                      className="w-7 h-7"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {comp.name}
                        </span>
                        {comp.verificationStatus === 'verified' && (
                          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" title="Verified" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                        {comp.industry && <span>{comp.industry}</span>}
                        {(comp.city || comp.country) && (
                          <span className="flex items-center gap-0.5">
                            • <MapPin className="w-2.5 h-2.5" />
                            {[comp.city, comp.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-500 dark:text-red-400 shrink-0" />}
                  </button>
                );
              })
            ) : !query.trim() ? null : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                <p>No verified companies matching "{query}"</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Click "Use '{query}'" above to use your custom company name.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;

