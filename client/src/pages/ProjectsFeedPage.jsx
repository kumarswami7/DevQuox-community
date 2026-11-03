import React, { useEffect, useState, useCallback, useRef } from "react";
import { ProjectCard } from "../components/cards/ProjectCard";
import { ProjectFeedComposer } from "../components/feed/ProjectFeedComposer";
import {
  Search,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  X,
  Bookmark,
  Briefcase,
  Layers,
  TrendingUp,
  FolderKanban,
  BarChart3,
  Compass,
  Flame,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Link, useSearchParams } from "react-router-dom";
import { discoveryService } from "../services/discoveryService";
import { projectService } from "../services/projectService";
import { dashboardService } from "../services/dashboardService";
import { useAuthStore } from "../store";

const CATEGORIES = [
  "All Projects",
  "Web Development",
  "AI & ML",
  "FinTech",
  "Mobile Development",
  "Cloud & DevOps",
];

const FEED_TABS = [
  { id: "for-you", label: "For You", icon: Sparkles, desc: "Personalized by your skills & stack" },
  { id: "following", label: "Following", icon: Users, desc: "Projects & reposts from your network" },
  { id: "latest", label: "Latest", icon: Clock, desc: "Newest posted projects" },
  { id: "trending", label: "Trending", icon: Flame, desc: "Most discussed & engaged projects" },
];

export const ProjectsFeedPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [activeTab, setActiveTab] = useState("for-you");
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Recommendations and Collaborators
  const [recommendations, setRecommendations] = useState([]);
  const [suggestedCollaborators, setSuggestedCollaborators] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);

  // Search, Category, and Sorting State
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [selectedSort, setSelectedSort] = useState("relevance");

  // Sync URL search params when changed externally (e.g. from RightSidebar trending tech stack click or category click)
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam !== null && qParam !== searchQuery) {
      setSearchQuery(qParam);
      setDebouncedQuery(qParam);
      setPage(1);
    }
    const catParam = searchParams.get("category");
    if (catParam !== null && catParam !== selectedCategory) {
      setSelectedCategory(catParam || "All Projects");
      setPage(1);
    }
  }, [searchParams]);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch projects from projectService with active tab and filters
  const fetchProjects = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const categoryParam = selectedCategory !== "All Projects" ? selectedCategory : undefined;
        const res = await projectService.getProjects({
          tab: activeTab,
          q: debouncedQuery.trim() || undefined,
          category: categoryParam,
          sort: selectedSort !== "relevance" ? selectedSort : undefined,
          page: targetPage,
          limit: 10,
        });

        const projectList = res.data?.projects || res.data?.data || [];
        const total = res.data?.total ?? projectList.length;
        const pages = res.data?.totalPages || 1;

        if (append) {
          setProjects((prev) => [...prev, ...projectList]);
        } else {
          setProjects(projectList);
        }

        setTotalCount(total);
        setTotalPages(pages);
      } catch (err) {
        console.warn("Direct project feed fetch fallback:", err);
        try {
          const fallback = await projectService.getAllProjects();
          const list = Array.isArray(fallback.data) ? fallback.data : fallback.data?.data || [];
          setProjects(list);
          setTotalCount(list.length);
        } catch (e) {
          console.error("Projects fetch error:", e);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, debouncedQuery, selectedCategory, selectedSort]
  );

  // Re-fetch on filter or tab change
  useEffect(() => {
    setPage(1);
    fetchProjects(1, false);
  }, [fetchProjects]);

  // Load secondary data: recommendations, collaborators, platform stats
  useEffect(() => {
    if (isAuthenticated) {
      discoveryService
        .getProjectRecommendations()
        .then((data) => setRecommendations(data || []))
        .catch(() => {});

      discoveryService
        .getDeveloperRecommendations()
        .then((data) => setSuggestedCollaborators(data || []))
        .catch(() => {});
    }

    projectService
      .getProjectStats()
      .then((res) => {
        if (res.data?.stats) setPlatformStats(res.data.stats);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Handle Load More
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProjects(nextPage, true);
    }
  };

  // Prepend on new project published via composer
  const handleProjectCreated = (newProject) => {
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      setTotalCount((c) => c + 1);
      if (platformStats) {
        setPlatformStats((prev) => ({
          ...prev,
          totalProjects: (prev.totalProjects || 0) + 1,
          openProjects: (prev.openProjects || 0) + 1,
        }));
      }
    }
  };

  // Remove on project deletion
  const handleProjectDeleted = (deletedId) => {
    setProjects((prev) => prev.filter((p) => (p._id || p.id) !== deletedId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  const userSkills = currentUser?.skills || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Projects Feed
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              {totalCount} Active Listings
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Atlas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verified software projects and developer collaboration opportunities powered live by MongoDB Atlas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchProjects(1, false).finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
            className="gap-1.5 text-xs"
            title="Refresh feed from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary-500" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Atlas"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setSeeding(true);
              try {
                await dashboardService.seedDatabase();
                await fetchProjects(1, false);
              } catch (e) {
                console.error("Seeding error:", e);
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding || refreshing}
            className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            title="Populate MongoDB with verified real benchmark projects"
          >
            <Sparkles className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
            <span>{seeding ? "Seeding..." : "Seed Real Data"}</span>
          </Button>

          <Link to="/projects/create">
            <Button variant="accent" size="sm" className="gap-2 shadow-glow-accent text-xs">
              <Plus className="w-4 h-4" />
              <span>Post New Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 3-COLUMN PROFESSIONAL LAYOUT ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* ── LEFT SIDEBAR (Col 3 on lg) ───────────────────────────────────── */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          {/* User Profile Mini-Card */}
          {isAuthenticated && currentUser ? (
            <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <Avatar
                  src={currentUser.avatar || currentUser.avatarUrl}
                  name={currentUser.name || "Me"}
                  size="md"
                />
                <div className="min-w-0">
                  <Link
                    to="/profile"
                    className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate block"
                  >
                    {currentUser.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.headline || "Verified Member"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Role</span>
                <span className="font-bold text-primary-600 dark:text-primary-400 capitalize text-[11px]">
                  {currentUser.role || "Developer"}
                </span>
              </div>

              {/* Skills & Interests Tags */}
              {userSkills.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    My Skills & Interests
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {userSkills.slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="glass-card p-4 text-center space-y-2 border-slate-200/90 dark:border-slate-800/80">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Join DevConnect</p>
              <p className="text-[11px] text-slate-500">
                Log in to apply for projects, submit proposals, and showcase your portfolio.
              </p>
              <Link to="/login" className="block pt-1">
                <Button size="sm" variant="primary" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
            </Card>
          )}

          {/* Quick Navigation Shortcuts */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Project Navigation
            </p>
            <Link
              to="/projects"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400"
            >
              <Layers className="w-4 h-4 text-primary-500" />
              <span>Projects Feed</span>
            </Link>
            <Link
              to="/discover-projects"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Advanced Discovery</span>
            </Link>
            <Link
              to="/my-projects"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <FolderKanban className="w-4 h-4" />
              <span>My Posted Projects</span>
            </Link>
            <Link
              to="/applications"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>My Applications</span>
            </Link>
            <Link
              to="/bookmarks"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Projects</span>
            </Link>
          </Card>

          {/* Domains & Focus (Left Sidebar Category Navigation) */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between px-2.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Domains & Focus
              </span>
              {selectedCategory !== "All Projects" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All Projects");
                    setPage(1);
                  }}
                  className="text-[10px] font-bold text-primary-500 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1 pt-0.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count =
                  cat === "All Projects"
                    ? platformStats?.totalProjects ?? totalCount
                    : (platformStats?.topCategories || []).find((c) => c.category === cat)?.count;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                          isSelected
                            ? "bg-white"
                            : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary-400"
                        }`}
                      />
                      <span className="truncate">{cat}</span>
                    </div>
                    {typeof count === "number" && count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* ── CENTER FEED (Col 6 on lg, Col 9 on 2xl) ────────────────────── */}
        <main className="col-span-12 lg:col-span-6 2xl:col-span-9 space-y-4">
          {/* Feed Tabs Bar: For You, Following, Latest, Trending */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-cardDark/80 border border-slate-200/90 dark:border-slate-800/80 shadow-sm overflow-x-auto scrollbar-none">
            {FEED_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                  }`}
                  title={tab.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-400 dark:text-primary-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.id === "trending" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Inline Project Composer */}
          <ProjectFeedComposer onProjectCreated={handleProjectCreated} />

          {/* Search Bar & Sort Dropdown */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-cardDark/70 glass-card flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by title, requirement, or stack (e.g. Next.js, Redis, Fastify)..."
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto font-medium"
              >
                <option value="relevance">Sort: Relevance / Match</option>
                <option value="newest">Sort: Recently Posted</option>
                <option value="trending">Sort: Highest Trending</option>
                <option value="most_discussed">Sort: Most Discussed</option>
                <option value="budget_desc">Sort: Highest Budget</option>
              </select>
            </div>
          </div>

          {/* Active Domain Filter Badge (when selected on left sidebar) */}
          {selectedCategory !== "All Projects" && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary-50/70 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-900/30 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Active Category:{" "}
                <strong className="text-primary-600 dark:text-primary-400 font-bold">
                  {selectedCategory}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All Projects");
                  setPage(1);
                }}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <span>Clear filter</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recommended Projects Strip (when on For You tab) */}
          {activeTab === "for-you" && isAuthenticated && recommendations.length > 0 && (
            <Card className="p-4 border-primary-500/30 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-transparent relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-primary-500 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Recommended Projects For Your Skills
                  </h2>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Ranked by match</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.slice(0, 2).map((rec, idx) => {
                  const proj = rec.project || rec.item;
                  if (!proj) return null;
                  const matchPct = rec.matchPercentage || rec.score || 85;
                  return (
                    <div
                      key={proj._id || idx}
                      className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-cardDark/90 flex flex-col justify-between hover:shadow-sm transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/projects/${proj._id}`}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 line-clamp-1"
                          >
                            {proj.title}
                          </Link>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20 shrink-0">
                            {matchPct}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {proj.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {proj.budget}
                        </span>
                        <Link
                          to={`/projects/${proj._id}`}
                          className="text-[11px] font-bold text-primary-500 flex items-center gap-1 hover:underline"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Project Cards Feed Grid */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((sk) => (
                <Card
                  key={sk}
                  className="glass-card p-6 border-slate-200/80 dark:border-slate-800 space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-2 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-8 w-full bg-slate-100 dark:bg-slate-900 rounded-xl" />
                </Card>
              ))}
            </div>
          ) : activeTab === "following" && !isAuthenticated ? (
            <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800">
              <Users className="w-10 h-10 text-primary-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Follow Creators & Collaborators
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sign in to view software projects and reposts from developers and founders you follow in your personal network.
              </p>
              <Link to="/login" className="inline-block pt-1">
                <Button size="sm" variant="primary">
                  Sign In to Connect
                </Button>
              </Link>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id || project._id}
                  project={{
                    ...project,
                    matchingScore: project.matchingScore,
                  }}
                  onProjectDeleted={handleProjectDeleted}
                />
              ))}

              {/* Load More Pagination */}
              {page < totalPages && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="gap-2 text-xs"
                  >
                    {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />}
                    <span>{loadingMore ? "Loading More..." : "Load More Projects"}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : activeTab === "following" ? (
            <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Projects from Following Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You are not currently following any creators who have posted or reposted software projects. Follow creators in the community to personalize your network feed!
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setActiveTab("for-you")}
                  className="text-xs"
                >
                  Explore For You Feed
                </Button>
                <Link to="/developers">
                  <Button size="sm" variant="outline" className="text-xs">
                    Discover Developers
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-500">
                No software projects found matching your search criteria.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Projects");
                  setSelectedSort("relevance");
                  setActiveTab("for-you");
                }}
                variant="outline"
                size="sm"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR (Col 3 on lg, hidden on 2xl to avoid duplicate with global RightSidebar) ── */}
        <aside className="col-span-12 lg:col-span-3 2xl:hidden space-y-4">
          {/* Real Platform Statistics */}
          <Card className="glass-card p-4 border-slate-200/90 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Platform Activity
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {platformStats?.totalProjects ?? totalCount}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">
                  Hiring
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {platformStats?.openProjects ?? projects.filter((p) => p.status === "open").length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-50/60 dark:bg-primary-950/20 border border-primary-200/40 dark:border-primary-900/30">
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold block uppercase">
                  In Progress
                </span>
                <span className="text-base font-black text-primary-600 dark:text-primary-400">
                  {platformStats?.inProgressProjects ?? 2}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Done</span>
                <span className="text-base font-black text-slate-700 dark:text-slate-300">
                  {platformStats?.completedProjects ?? 1}
                </span>
              </div>
            </div>
          </Card>

          {/* Trending Tech Stacks (Real Data) */}
          <Card className="glass-card p-4 border-slate-200/90 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Trending Tech Stacks
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {platformStats?.trendingSkills && platformStats.trendingSkills.length > 0 ? (
                platformStats.trendingSkills.map((sk) => (
                  <button
                    key={sk.skill}
                    type="button"
                    onClick={() => {
                      setSearchQuery(sk.skill);
                      setPage(1);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1"
                  >
                    <span>{sk.skill}</span>
                    <span className="text-slate-400 font-normal">({sk.count})</span>
                  </button>
                ))
              ) : (
                ["React", "Node.js", "MongoDB", "Python", "FastAPI", "TypeScript", "TailwindCSS"].map(
                  (sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => {
                        setSearchQuery(sk);
                        setPage(1);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {sk}
                    </button>
                  )
                )
              )}
            </div>
          </Card>

          {/* Suggested Collaborators */}
          {suggestedCollaborators.length > 0 && (
            <Card className="glass-card p-4 border-slate-200/90 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Suggested Collaborators
                  </h3>
                </div>
                <Link
                  to="/developers"
                  className="text-[10px] font-bold text-primary-500 hover:underline flex items-center gap-0.5"
                >
                  All <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="space-y-2.5 pt-1">
                {suggestedCollaborators.slice(0, 3).map((collab, idx) => {
                  const dev = collab.item || collab;
                  if (!dev) return null;
                  return (
                    <div
                      key={dev._id || dev.id || idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={dev.avatar || dev.avatarUrl}
                          name={dev.name || "Developer"}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${dev._id || dev.id}`}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate block"
                          >
                            {dev.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 truncate">
                            {dev.headline || dev.role || "Developer"}
                          </p>
                        </div>
                      </div>

                      <Link to={`/profile/${dev._id || dev.id}`}>
                        <Button size="xs" variant="outline" className="text-[10px] px-2 h-7 shrink-0">
                          View
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Hiring Tip Card */}
          <Card className="glass-card p-4 border-slate-200/90 dark:border-slate-800/80 space-y-2 bg-gradient-to-br from-primary-500/5 to-transparent">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary-500" />
              <span>Project Success Tip</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Detailed technical stacks and clear budget ranges attract 3x more senior engineer
              proposals within the first 24 hours of posting.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default ProjectsFeedPage;
