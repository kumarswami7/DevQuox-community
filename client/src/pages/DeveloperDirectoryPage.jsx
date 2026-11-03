import { useEffect, useState, useCallback } from "react";
import { DeveloperCard } from "../components/cards/DeveloperCard";
import { DeveloperSearchBar } from "../components/discovery/DeveloperSearchBar";
import { DeveloperFilterPanel } from "../components/discovery/DeveloperFilterPanel";
import {
  Search,
  Loader2,
  Sparkles,
  Bookmark,
  Star,
  FolderHeart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Users,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { discoveryService } from "../services/discoveryService";
import { useAuthStore } from "../store";
import { Link, useSearchParams } from "react-router-dom";

const POPULAR_SKILLS = [
  "All",
  "React",
  "Node.js",
  "JavaScript",
  "Python",
  "MongoDB",
  "Docker",
  "UI/UX Design",
  "DevOps",
];

export const DeveloperDirectoryPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State (prefilled from URL search params if present)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedSkill, setSelectedSkill] = useState(searchParams.get("skill") || "All");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get("experienceLevel") || "");
  const [availability, setAvailability] = useState(searchParams.get("availability") || "");
  const [openTo, setOpenTo] = useState(searchParams.get("openTo") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [page, setPage] = useState(parseInt(searchParams.get("page"), 10) || 1);

  // Sync URL search params when changed externally (e.g. from RightSidebar filter clicks)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) setSearchQuery(q);
    const skill = searchParams.get("skill");
    if (skill !== null && skill !== selectedSkill) setSelectedSkill(skill);
    const cat = searchParams.get("category");
    if (cat !== null && cat !== category) setCategory(cat);
    const exp = searchParams.get("experienceLevel");
    if (exp !== null && exp !== experienceLevel) setExperienceLevel(exp);
    const avail = searchParams.get("availability");
    if (avail !== null && avail !== availability) setAvailability(avail);
    setPage(1);
  }, [searchParams]);

  // Data & Pagination State
  const [developers, setDevelopers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bookmarks & Saved Searches
  const [bookmarkedDevIds, setBookmarkedDevIds] = useState([]);
  const [isSaveSearchOpen, setIsSaveSearchOpen] = useState(false);
  const [isViewSavedSearchesOpen, setIsViewSavedSearchesOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchSaveName, setSearchSaveName] = useState("");
  const [savedSuccessMsg, setSavedSuccessMsg] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);

  // Load canonical categories
  useEffect(() => {
    discoveryService
      .getSkillCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch developers based on query parameters
  const fetchDevelopers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const skillsParam = selectedSkill !== "All" ? selectedSkill.toLowerCase() : undefined;
      const res = await discoveryService.searchDevelopers({
        q: searchQuery.trim() || undefined,
        skills: skillsParam,
        category: category || undefined,
        experienceLevel: experienceLevel || undefined,
        availability: availability || undefined,
        openTo: openTo || undefined,
        minRating: minRating || undefined,
        sort,
        page,
        limit: 12,
      });

      setDevelopers(res.developers || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching developer directory:", err);
      setFetchError("Unable to load developer directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedSkill,
    category,
    experienceLevel,
    availability,
    openTo,
    minRating,
    sort,
    page,
  ]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  // Load recommendations and user bookmarks
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingRecs(true);
      discoveryService
        .getDeveloperRecommendations()
        .then((data) => setRecommendations(data || []))
        .catch((err) => console.warn("Recommendation fetch notice:", err))
        .finally(() => setLoadingRecs(false));

      discoveryService
        .getBookmarks()
        .then((res) => {
          const list = res.developers || res;
          if (Array.isArray(list)) {
            setBookmarkedDevIds(list.map((b) => b._id || b.id || b));
          }
        })
        .catch(() => {});

      discoveryService
        .getSavedSearches("developer")
        .then((list) => setSavedSearches(list || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleToggleBookmark = async (devId) => {
    if (!isAuthenticated) return;
    const isBookmarked = bookmarkedDevIds.includes(devId);
    try {
      if (isBookmarked) {
        await discoveryService.unbookmarkDeveloper(devId);
        setBookmarkedDevIds((prev) => prev.filter((id) => id !== devId));
      } else {
        await discoveryService.bookmarkDeveloper(devId);
        setBookmarkedDevIds((prev) => [...prev, devId]);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSkill("All");
    setCategory("");
    setExperienceLevel("");
    setAvailability("");
    setOpenTo("");
    setMinRating("");
    setSort("relevance");
    setPage(1);
  };

  const handleSaveSearch = async (e) => {
    e.preventDefault();
    if (!searchSaveName.trim() || !isAuthenticated) return;
    setSavingSearch(true);
    try {
      const newSearch = await discoveryService.saveSearch(
        searchSaveName.trim(),
        "developer",
        {
          q: searchQuery,
          skills: selectedSkill !== "All" ? selectedSkill : undefined,
          category,
          experienceLevel,
          availability,
          openTo,
          minRating,
          sort,
        }
      );

      setSavedSearches((prev) => [newSearch, ...prev]);
      setSavedSuccessMsg("Search preset saved successfully!");
      setTimeout(() => {
        setIsSaveSearchOpen(false);
        setSavedSuccessMsg("");
        setSearchSaveName("");
      }, 1200);
    } catch (err) {
      console.error("Failed to save search:", err);
    } finally {
      setSavingSearch(false);
    }
  };

  const handleApplySavedSearch = (saved) => {
    const f = saved.filters || {};
    setSearchQuery(f.q || "");
    setSelectedSkill(f.skills || "All");
    setCategory(f.category || "");
    setExperienceLevel(f.experienceLevel || "");
    setAvailability(f.availability || "");
    setOpenTo(f.openTo || "");
    setMinRating(f.minRating || "");
    setSort(f.sort || "relevance");
    setPage(1);
    setIsViewSavedSearchesOpen(false);
  };

  const handleDeleteSavedSearch = async (id, e) => {
    e.stopPropagation();
    try {
      await discoveryService.deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => (s._id || s.id) !== id));
    } catch (err) {
      console.error("Failed to delete saved search:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-primary-500" />
              Developer Discovery
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              {totalCount} Verified Engineers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover peer engineers, verified project contributors, and potential collaborators with transparent skill matching.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAuthenticated && (
            <Link to="/bookmarks">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>Saved Developers</span>
              </Button>
            </Link>
          )}

          {isAuthenticated && (
            <>
              {savedSearches.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsViewSavedSearchesOpen(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <FolderHeart className="w-4 h-4 text-slate-500" />
                  <span>Saved Searches ({savedSearches.length})</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsSaveSearchOpen(true)}
                className="gap-1.5 text-xs font-bold shadow-sm"
              >
                <FolderHeart className="w-4 h-4" />
                <span>Save Search</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── RECOMMENDATIONS CAROUSEL ───────────────────────────────────────── */}
      {isAuthenticated && recommendations.length > 0 && (
        <Card className="p-4 sm:p-5 border-primary-500/30 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-transparent relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Recommended Collaborators for You
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Ranked by community delivery track record
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec, idx) => {
              const dev = rec.item || rec.developer;
              if (!dev) return null;
              const completed = dev.completedProjectsCount ?? dev.completedProjects ?? 0;
              return (
                <div
                  key={dev._id || dev.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-cardDark/80 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/profile/${dev._id || dev.id}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 line-clamp-1"
                      >
                        {dev.name}
                      </Link>
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">
                        {dev.availability || "Available"}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {dev.headline || "Full-Stack Engineer"}
                    </p>

                    <div className="text-[10px] text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary-500 shrink-0" />
                      <span className="truncate">{rec.reason}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500" /> {dev.rating || 5}
                      <span className="text-[10px] font-normal text-slate-400">({completed} built)</span>
                    </span>
                    <Link
                      to={`/profile/${dev._id || dev.id}`}
                      className="text-[11px] font-bold text-primary-500 hover:underline"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── FILTER & SEARCH CONTROLS ───────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search Bar */}
        <DeveloperSearchBar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          onClear={() => {
            setSearchQuery("");
            setPage(1);
          }}
        />

        {/* Quick Skill Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => {
                setSelectedSkill(skill);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSkill === skill
                  ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25 font-bold"
                  : "bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Granular Filter Panel */}
        <DeveloperFilterPanel
          category={category}
          onCategoryChange={(cat) => {
            setCategory(cat);
            setPage(1);
          }}
          categories={categories}
          experienceLevel={experienceLevel}
          onExperienceLevelChange={(exp) => {
            setExperienceLevel(exp);
            setPage(1);
          }}
          availability={availability}
          onAvailabilityChange={(avail) => {
            setAvailability(avail);
            setPage(1);
          }}
          openTo={openTo}
          onOpenToChange={(ot) => {
            setOpenTo(ot);
            setPage(1);
          }}
          minRating={minRating}
          onMinRatingChange={(r) => {
            setMinRating(r);
            setPage(1);
          }}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* ── DEVELOPERS GRID ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Fetching verified developer profiles...</p>
        </div>
      ) : fetchError ? (
        <Card className="text-center py-12 p-8 border-rose-200 dark:border-rose-900/40 space-y-3">
          <p className="text-sm font-semibold text-rose-500">{fetchError}</p>
          <Button size="sm" variant="outline" onClick={fetchDevelopers}>
            Try Again
          </Button>
        </Card>
      ) : developers.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {developers.map((dev) => {
              const devId = dev._id || dev.id;
              const isBookmarked = bookmarkedDevIds.includes(devId);
              return (
                <div key={devId} className="h-full">
                  <DeveloperCard
                    developer={{
                      _id: devId,
                      id: devId,
                      name: dev.name || "Developer",
                      username: dev.username || "",
                      avatar: dev.avatarUrl || dev.avatar,
                      headline: dev.headline || dev.title || "Full-Stack Developer",
                      bio: dev.bio || dev.about || "Passionate engineer collaborating on DevConnect.",
                      availability: dev.availability || "available",
                      rating: dev.rating || 5.0,
                      skills: dev.skills || [],
                      completedProjectsCount: dev.completedProjectsCount || dev.completedProjects || 0,
                      experienceLevel: dev.experienceLevel || "mid",
                      location: dev.location || "",
                    }}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={() => handleToggleBookmark(devId)}
                  />
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium">
                Page {page} of {totalPages} ({totalCount} verified developers)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 text-xs font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="text-center py-16 p-8 border-slate-200 dark:border-slate-800 space-y-3 glass-card">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Developers Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No verified engineers matched your current search criteria or active filters. Try resetting your filters to explore all available profiles.
          </p>
          <Button size="sm" variant="primary" onClick={handleResetFilters} className="text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
          </Button>
        </Card>
      )}

      {/* ── SAVE SEARCH MODAL ─────────────────────────────────────────────── */}
      {isSaveSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-primary-500" />
                Save Developer Search
              </h3>
              <button
                onClick={() => setIsSaveSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedSuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
                {savedSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSaveSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preset Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={searchSaveName}
                    onChange={(e) => setSearchSaveName(e.target.value)}
                    placeholder="e.g. Senior MERN Engineers (Available)"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div>Query: <span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery || "None"}</span></div>
                  <div>Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{category || "All"}</span></div>
                  <div>Skill: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedSkill}</span></div>
                  <div>Experience: <span className="font-semibold text-slate-700 dark:text-slate-300">{experienceLevel || "All"}</span></div>
                  <div>Availability: <span className="font-semibold text-slate-700 dark:text-slate-300">{availability || "Any"}</span></div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSaveSearchOpen(false)}
                    disabled={savingSearch}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={savingSearch}
                    className="font-bold"
                  >
                    {savingSearch ? "Saving..." : "Save Filter Preset"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* ── VIEW / APPLY SAVED SEARCHES MODAL ────────────────────────────── */}
      {isViewSavedSearchesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-primary-500" />
                Your Saved Searches
              </h3>
              <button
                onClick={() => setIsViewSavedSearchesOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {savedSearches.length > 0 ? (
                savedSearches.map((saved) => (
                  <div
                    key={saved._id || saved.id}
                    onClick={() => handleApplySavedSearch(saved)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-primary-50/10 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                        {saved.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                        {saved.filters?.q && <span>Query: "{saved.filters.q}"</span>}
                        {saved.filters?.skills && <span>Skill: {saved.filters.skills}</span>}
                        {saved.filters?.category && <span>Category: {saved.filters.category}</span>}
                        {saved.filters?.experienceLevel && (
                          <span>Level: {saved.filters.experienceLevel}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplySavedSearch(saved);
                        }}
                        className="text-[10px] h-7"
                      >
                        Apply
                      </Button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedSearch(saved._id || saved.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete saved search"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No saved searches found. Save your favorite search filters for quick 1-click loading!
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsViewSavedSearchesOpen(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DeveloperDirectoryPage;
