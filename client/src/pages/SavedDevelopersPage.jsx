import React, { useState, useEffect } from "react";
import { Bookmark, Search, Loader2, ArrowLeft, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DeveloperCard } from "../components/cards/DeveloperCard";
import { SaveDeveloperButton } from "../components/portfolio/SaveDeveloperButton";
import { discoveryService } from "../services/discoveryService";
import { useAuthStore } from "../store";

export const SavedDevelopersPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSavedDevelopers = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await discoveryService.getBookmarks(page, 20);
      setDevelopers(res.developers || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch saved developers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedDevelopers();
  }, [page, isAuthenticated]);

  const handleUnsave = (developerId) => {
    setDevelopers((prev) => prev.filter((d) => (d._id || d.id) !== developerId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  const filteredDevelopers = developers.filter((dev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dev.name?.toLowerCase().includes(q) ||
      dev.headline?.toLowerCase().includes(q) ||
      dev.bio?.toLowerCase().includes(q) ||
      dev.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link to="/developers" className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Saved Developers</span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {totalCount}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-none">
              Your private roster of bookmarked engineers and collaborators.
            </p>
          </div>
        </div>

        <Link to="/developers">
          <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8 px-3 rounded-xl self-start sm:self-auto whitespace-nowrap">
            <Users className="w-3.5 h-3.5" /> <span>Discover More</span>
          </Button>
        </Link>
      </div>

      {/* Search in Saved */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter your saved developers by name or skill..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading your saved developers...</p>
        </div>
      ) : filteredDevelopers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDevelopers.map((dev) => {
            const devId = dev._id || dev.id;
            return (
              <div key={devId} className="relative group">
                <DeveloperCard
                  developer={{
                    _id: devId,
                    id: devId,
                    name: dev.name || "Developer",
                    avatar: dev.avatarUrl || dev.avatar,
                    title: dev.headline || "Software Engineer",
                    about: dev.bio || "Devquox community member.",
                    availability: dev.availability || "Available",
                    rating: dev.rating || 5,
                    skills: dev.skills || [],
                    completedProjects: dev.completedProjectsCount || 0,
                    location: dev.location || "",
                  }}
                />

                <div className="absolute top-4 right-4 z-10">
                  <SaveDeveloperButton
                    developerId={devId}
                    initialSaved={true}
                    onToggle={(isSaved) => {
                      if (!isSaved) handleUnsave(devId);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center glass-card space-y-3 border-dashed">
          <p className="text-sm font-semibold text-slate-500">
            {searchQuery
              ? "No saved developers match your search query."
              : "You haven't bookmarked any developers yet."}
          </p>
          <Link to="/developers">
            <Button size="sm" variant="primary">
              Browse Developer Discovery
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default SavedDevelopersPage;
