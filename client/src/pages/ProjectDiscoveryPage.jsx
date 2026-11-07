import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, Loader2, Sparkles, FolderGit2, DollarSign, Calendar, Tag, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { discoveryService } from "../services/discoveryService";
import { useAuthStore } from "../store";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "All Categories",
  "Web Development",
  "Mobile Apps",
  "AI & Machine Learning",
  "Cloud & DevOps",
  "UI/UX Design",
  "Cybersecurity",
];

export const ProjectDiscoveryPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      const project = rec.item || rec.project || rec;
      if (!project) return false;
      const ownerId = project.owner?._id || project.owner;
      if (currentUserId && String(ownerId) === String(currentUserId)) return false;
      if (project.hasApplied) return false;
      return true;
    });
  }, [recommendations, currentUserId]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [skillFilter, setSkillFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== "All Categories" ? selectedCategory : undefined;
      const res = await discoveryService.searchProjectsWithMatch({
        q: searchQuery.trim() || undefined,
        category: categoryParam,
        skills: skillFilter.trim() || undefined,
        minBudget: minBudget ? parseFloat(minBudget) : undefined,
        maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
        page,
        limit: 12,
      });

      setProjects(res.projects || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch discovery projects:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, skillFilter, minBudget, maxBudget, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    discoveryService
      .getProjectRecommendations()
      .then((data) => setRecommendations(data || []))
      .catch(() => {});
  }, []);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSkillFilter("");
    setMinBudget("");
    setMaxBudget("");
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <FolderGit2 className="w-7 h-7 text-primary-500" />
              Project Discovery
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              {totalCount} Open Projects
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover active projects actively looking for developers, team contributors, and specialists.
          </p>
        </div>

        <Link to="/developers">
          <Button size="sm" variant="outline" className="text-xs gap-1.5 self-start sm:self-auto">
            Switch to Developer Directory →
          </Button>
        </Link>
      </div>

      {/* ── RECOMMENDATIONS ───────────────────────────────────────────────── */}
      {filteredRecommendations.length > 0 && (
        <Card className="p-5 border-primary-500/30 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-transparent relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Featured Collaboration Opportunities
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              High match based on community activity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRecommendations.slice(0, 3).map((rec, idx) => {
              const project = rec.item || rec.project || rec;
              if (!project) return null;
              return (
                <div
                  key={project._id || idx}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-cardDark/80 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/projects/${project._id}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 line-clamp-1"
                      >
                        {project.title}
                      </Link>
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 shrink-0">
                        {project.category || "Community Project"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {project.category}
                    </span>
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-[11px] font-bold text-primary-500 hover:underline flex items-center gap-1"
                    >
                      Apply Now <ArrowRight className="w-3 h-3" />
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
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search open projects by title, scope, deliverables..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25"
                  : "bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-cardDark/70 glass-card">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Required Skill
              </label>
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => {
                  setSkillFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. React, Node.js, GraphQL"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Min Budget ($)
              </label>
              <input
                type="number"
                min="0"
                value={minBudget}
                onChange={(e) => {
                  setMinBudget(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Max Budget ($)
              </label>
              <input
                type="number"
                min="0"
                value={maxBudget}
                onChange={(e) => {
                  setMaxBudget(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs text-slate-500 h-9"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROJECTS GRID ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading open collaboration projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {projects.map((proj) => (
              <Card
                key={proj._id}
                className="p-5 glass-card flex flex-col hover:shadow-md transition-all duration-300 border-slate-200/90 dark:border-slate-800/80"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 uppercase tracking-wider">
                      {proj.category || "General"}
                    </span>
                    <Badge variant="success" className="text-xs font-bold">
                      ${proj.budget?.toLocaleString() || "Open"}
                    </Badge>
                  </div>

                  <div>
                    <Link
                      to={`/projects/${proj._id}`}
                      className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary-500 transition-colors line-clamp-1"
                    >
                      {proj.title}
                    </Link>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  {proj.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.requiredSkills.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {skill}
                        </span>
                      ))}
                      {proj.requiredSkills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-lg text-[10px] text-slate-400">
                          +{proj.requiredSkills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{proj.duration || "Flexible"}</span>
                  </div>

                  <Link to={`/projects/${proj._id}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      View Details →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({totalCount} total projects)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-8">
          <p className="text-sm font-semibold text-slate-500">
            No active open projects match your criteria.
          </p>
          <Button onClick={handleResetFilters} variant="outline" size="sm">
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectDiscoveryPage;
