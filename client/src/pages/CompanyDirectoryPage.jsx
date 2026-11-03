import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  Search,
  Globe,
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Filter,
  CheckCircle2,
  Loader2,
  AlertCircle,
  TrendingUp,
  X,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { companyService } from "../services/companyService";
import { Button } from "../components/ui/Button";

const POPULAR_INDUSTRIES = [
  "All Industries",
  "Technology & Software",
  "FinTech & Payments",
  "Internet & AI",
  "Software & Cloud",
  "E-Commerce & Retail",
  "Healthcare & Biotech",
  "Media & Entertainment",
  "Telecommunications",
];

const POPULAR_COUNTRIES = [
  "All Countries",
  "India",
  "United States",
  "United Kingdom",
  "Singapore",
  "Germany",
  "Canada",
];

/**
 * Company Logo with 4-tier Fallback
 * 1. Jobiwork Proxied Logo / Direct Logo
 * 2. Domain Favicon
 * 3. Initials Gradient Badge
 * 4. Generic Building Icon
 */
const CompanyLogo = ({ company, className = "w-12 h-12" }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [company?.logoUrl, company?.domain]);

  const cleanDomain = company?.domain
    ? company.domain.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "").trim()
    : "";

  // Prioritize proxied API logo if jobiworkId exists, else direct logo, else domain favicon
  const effectiveSrc =
    !imgFailed &&
    (company?.jobiworkId
      ? `/api/v1/companies/${company._id || company.jobiworkId}/logo`
      : company?.logoUrl || (cleanDomain ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : ""));

  const initials = (company?.initials || (company?.name ? company.name.slice(0, 3) : "CO")).toUpperCase();

  const getGradient = (str) => {
    const gradients = [
      "from-blue-600 to-indigo-700 text-white",
      "from-violet-600 to-purple-800 text-white",
      "from-emerald-600 to-teal-700 text-white",
      "from-rose-600 to-red-700 text-white",
      "from-amber-600 to-orange-700 text-white",
      "from-cyan-600 to-blue-800 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < (str || "").length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (effectiveSrc && !imgFailed) {
    return (
      <div
        className={`${className} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}
      >
        <img
          src={effectiveSrc}
          alt={company?.name ? `${company.name} logo` : "Company logo"}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  if (initials) {
    return (
      <div
        className={`${className} rounded-2xl bg-gradient-to-br ${getGradient(
          company?.name
        )} flex items-center justify-center font-bold tracking-wider shrink-0 shadow-xs text-xs select-none`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 select-none shadow-xs`}
    >
      <Building2 className="w-5 h-5" />
    </div>
  );
};

export const CompanyDirectoryPage = () => {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [hiringOnly, setHiringOnly] = useState(false);

  // Selected Detail Modal
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Manual Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    website: "",
    country: "India",
    city: "",
    state: "",
    industry: "Technology & Software",
    registrationNumber: "",
    description: "",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState(null);

  // Enrichment Loading state map (by company ID)
  const [enrichingId, setEnrichingId] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await companyService.search({
        q: searchQuery,
        industry: selectedIndustry !== "All Industries" ? selectedIndustry : "",
        country: selectedCountry !== "All Countries" ? selectedCountry : "",
        hiring: hiringOnly,
        page,
        limit: 18,
      });

      const data = res.data?.data || res.data?.companies || [];
      setCompanies(data);
      setTotal(res.data?.total || data.length);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.warn("[CompanyDirectory] fetch error:", err.message);
      setApiError("Unable to load company records. Please tap retry.");
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedIndustry, selectedCountry, hiringOnly, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 280);

    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  // Handle Live Jobiwork Enrichment
  const handleEnrich = async (company) => {
    const compId = company._id || company.jobiworkId;
    if (!compId) return;

    setEnrichingId(compId);
    try {
      const res = await companyService.enrich(compId);
      const updated = res.data?.data;
      if (updated) {
        setCompanies((prev) =>
          prev.map((c) => ((c._id && c._id === updated._id) || c.jobiworkId === updated.jobiworkId ? updated : c))
        );
        if (selectedCompany && (selectedCompany._id === updated._id || selectedCompany.jobiworkId === updated.jobiworkId)) {
          setSelectedCompany(updated);
        }
      }
    } catch (err) {
      console.warn("[CompanyDirectory] enrichment error:", err.message);
    } finally {
      setEnrichingId(null);
    }
  };

  // Handle Manual Submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError("Company name is required");
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);

    try {
      const res = await companyService.create(addForm);
      if (res.data?.data) {
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          website: "",
          country: "India",
          city: "",
          state: "",
          industry: "Technology & Software",
          registrationNumber: "",
          description: "",
        });
        fetchCompanies();
      }
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || "Failed to add company");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-cardDark/40 pb-20">
      {/* Top Banner Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-cardDark px-4 sm:px-6 lg:px-8 py-8 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-[#0091ff] border border-blue-200/60 dark:border-blue-800/60">
                <Building2 className="w-3 h-3" />
                Jobiwork Corporate Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Worldwide Company Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Explore verified company profiles, corporate registration records, official websites, and live hiring
                insights powered by the Jobiwork Company Data API.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 shrink-0 shadow-md shadow-[#0091ff]/20 font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Suggest Company
            </Button>
          </div>

          {/* Search Bar & Filters Tray */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search companies by name, domain, CIN, or industry..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]/30 focus:border-[#0091ff] shadow-xs transition-all"
              />
            </div>

            {/* Industry Filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => {
                setSelectedIndustry(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]/30 shadow-xs shrink-0"
            >
              {POPULAR_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]/30 shadow-xs shrink-0"
            >
              {POPULAR_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Hiring Toggle */}
            <button
              type="button"
              onClick={() => {
                setHiringOnly(!hiringOnly);
                setPage(1);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
                hiringOnly
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Hiring Only</span>
              {hiringOnly && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Results Counter & Active Query Notice */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{companies.length}</strong> of{" "}
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong> verified company records
          </span>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-[#0091ff]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Syncing company intelligence...
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && companies.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#0091ff] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Querying Jobiwork Corporate Intelligence...
            </p>
            <p className="text-xs text-slate-400">Matching enterprise datasets and official registries</p>
          </div>
        ) : apiError ? (
          /* Error State */
          <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3 max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">API Notice</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{apiError}</p>
            <Button variant="primary" size="sm" onClick={() => fetchCompanies()} className="mx-auto font-bold text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Connection
            </Button>
          </div>
        ) : companies.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center space-y-3 max-w-md mx-auto p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Companies Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No matching records found for "{searchQuery}". You can suggest a company or clear your filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedIndustry("All Industries");
                setSelectedCountry("All Countries");
                setHiringOnly(false);
              }}
              className="text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Companies Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {companies.map((comp) => {
              const isEnriching = enrichingId === (comp._id || comp.jobiworkId);

              return (
                <div
                  key={comp._id || comp.jobiworkId || comp.name}
                  onClick={() => {
                    setSelectedCompany(comp);
                    setIsDetailModalOpen(true);
                  }}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark p-5 hover:border-blue-400/80 dark:hover:border-blue-600/60 hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Row: Logo + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo company={comp} className="w-12 h-12" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0091ff] transition-colors">
                              {comp.name}
                            </h3>
                            {comp.verificationStatus === "verified" ? (
                              <span title="Verified in Jobiwork Corporate Registry">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                title="Pending Review"
                              >
                                Unverified
                              </span>
                            )}
                          </div>
                          {comp.legalName && comp.legalName !== comp.name && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{comp.legalName}</p>
                          )}
                        </div>
                      </div>

                      {/* Hiring Status Pill */}
                      {comp.hiring?.isHiring && comp.hiring?.openJobs > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {comp.hiring.openJobs} Openings
                        </span>
                      )}
                    </div>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      {(comp.city || comp.country) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {[comp.city, comp.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {comp.industry && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{comp.industry}</span>
                        </span>
                      )}
                      {comp.companySize && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{comp.companySize}</span>
                        </span>
                      )}
                    </div>

                    {/* Description or Registry CIN */}
                    {comp.description ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">{comp.description}</p>
                    ) : comp.registrationNumber ? (
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1 truncate">
                        Reg: {comp.registrationNumber}
                      </p>
                    ) : null}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    {comp.website ? (
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#0091ff] hover:underline font-medium"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{comp.domain || "Website"}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No website listed</span>
                    )}

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={isEnriching}
                        onClick={() => handleEnrich(comp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0091ff] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Enrich fresh corporate metadata via Jobiwork"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin text-[#0091ff]" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-bold"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs font-bold"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* 1. Company Detail Modal */}
      {isDetailModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <CompanyLogo company={selectedCompany} className="w-16 h-16" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {selectedCompany.name}
                  </h2>
                  {selectedCompany.verificationStatus === "verified" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {selectedCompany.status && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                      {selectedCompany.status}
                    </span>
                  )}
                </div>
                {selectedCompany.legalName && (
                  <p className="text-xs text-slate-500 font-medium">{selectedCompany.legalName}</p>
                )}
                {selectedCompany.jobiworkId && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    ID: {selectedCompany.jobiworkId}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Industry</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedCompany.industry || "General"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Company Size</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedCompany.companySize || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Hiring</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                  {selectedCompany.hiring?.isHiring
                    ? `${selectedCompany.hiring.openJobs} Active Roles`
                    : "No Current Openings"}
                </p>
              </div>
            </div>

            {/* Corporate Registration & Legal Identifiers */}
            {(selectedCompany.registrationNumber || selectedCompany.listing?.tickers?.length > 0) && (
              <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Registry & Market Details
                </span>
                {selectedCompany.registrationNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Registration / CIN:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCompany.registrationNumber} ({selectedCompany.registryName || "MCA"})
                    </span>
                  </div>
                )}
                {selectedCompany.listing?.tickers?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Stock Tickers:</span>
                    <div className="flex gap-1">
                      {selectedCompany.listing.tickers.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedCompany.description && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">About</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCompany.description}
                </p>
              </div>
            )}

            {/* Location & Website */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              {(selectedCompany.city || selectedCompany.state || selectedCompany.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[selectedCompany.city, selectedCompany.state, selectedCompany.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {selectedCompany.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={selectedCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0091ff] hover:underline"
                  >
                    {selectedCompany.website}
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">
                Source: {selectedCompany.source || "Jobiwork"} • Synced:{" "}
                {selectedCompany.lastSyncAt ? new Date(selectedCompany.lastSyncAt).toLocaleDateString() : "Recent"}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleEnrich(selectedCompany)}
                disabled={enrichingId === (selectedCompany._id || selectedCompany.jobiworkId)}
                className="font-bold text-xs gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    enrichingId === (selectedCompany._id || selectedCompany.jobiworkId) ? "animate-spin" : ""
                  }`}
                />
                Sync with Jobiwork
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Suggest Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0091ff] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Suggest a Company</h3>
                <p className="text-xs text-slate-500">Add an employer or partner to the platform directory.</p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies Private Limited"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://acme.com"
                    value={addForm.website}
                    onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Industry</label>
                  <select
                    value={addForm.industry}
                    onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  >
                    {POPULAR_INDUSTRIES.filter((i) => i !== "All Industries").map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={addForm.country}
                    onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration / CIN Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. U72200KA2020PTC123456"
                  value={addForm.registrationNumber}
                  onChange={(e) => setAddForm({ ...addForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0091ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmittingAdd} className="font-bold">
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDirectoryPage;

