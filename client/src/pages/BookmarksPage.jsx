import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { ProjectCard } from "../components/cards/ProjectCard";
import { DeveloperCard } from "../components/cards/DeveloperCard";
import { PostCard } from "../components/community/PostCard";
import {
  Bookmark,
  Search,
  Loader2,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles,
  RefreshCw,
  FolderHeart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { projectService } from "../services/projectService";
import { discoveryService } from "../services/discoveryService";
import { communityService } from "../services/communityService";
import { useAuthStore } from "../store";

export const BookmarksPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedProjects, setSavedProjects] = useState([]);
  const [savedDevelopers, setSavedDevelopers] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const fetchSavedData = async () => {
    try {
      const [projRes, devRes, postRes] = await Promise.allSettled([
        projectService.getSavedProjects(),
        discoveryService.getBookmarks(1, 50),
        communityService.getSavedPosts(),
      ]);

      // 1. Projects
      if (projRes.status === "fulfilled") {
        const list =
          projRes.value?.data?.projects ||
          projRes.value?.data?.bookmarks?.map((b) => b.project || b) ||
          (Array.isArray(projRes.value?.data) ? projRes.value.data : []);
        setSavedProjects(list.filter(Boolean));
      }

      // 2. Developers / Talent
      if (devRes.status === "fulfilled") {
        const list =
          devRes.value?.developers ||
          devRes.value?.data?.developers ||
          (Array.isArray(devRes.value) ? devRes.value : []);
        setSavedDevelopers(list.filter(Boolean));
      }

      // 3. Community Posts
      if (postRes.status === "fulfilled") {
        const list =
          postRes.value?.data?.posts ||
          postRes.value?.data?.data ||
          (Array.isArray(postRes.value?.data) ? postRes.value.data : []);
        setSavedPosts(list.filter(Boolean));
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSavedData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedData();
  };

  // Handle live removal from local state if unbookmarked
  const handleProjectUnbookmarked = (projectId) => {
    setSavedProjects((prev) =>
      prev.filter((p) => String(p._id || p.id) !== String(projectId))
    );
  };

  const handlePostSavedToggled = (post) => {
    const postId = post._id || post.id;
    const isStillSaved =
      Array.isArray(post.savedBy) &&
      post.savedBy.some((id) => String(id?._id || id) === String(currentUserId));
    if (!isStillSaved) {
      setSavedPosts((prev) =>
        prev.filter((p) => String(p._id || p.id) !== String(postId))
      );
    }
  };

  // Filter with search query
  const query = searchQuery.trim().toLowerCase();

  const filteredProjects = savedProjects.filter((p) => {
    if (!query) return true;
    return (
      p.title?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.requiredSkills?.some((s) => s.toLowerCase().includes(query))
    );
  });

  const filteredDevelopers = savedDevelopers.filter((d) => {
    if (!query) return true;
    const name = d.user?.name || d.name || "";
    const title = d.title || d.headline || "";
    const skills = d.skills || [];
    return (
      name.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query) ||
      skills.some((s) => s.toLowerCase().includes(query))
    );
  });

  const filteredPosts = savedPosts.filter((post) => {
    if (!query) return true;
    return (
      post.title?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.tags?.some((t) => t.toLowerCase().includes(query))
    );
  });

  const totalSaved =
    savedProjects.length + savedDevelopers.length + savedPosts.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shrink-0">
              <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Bookmarks</span>
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                  {totalSaved} Saved
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Access your starred project specifications, talent bookmarks, and community knowledge.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="gap-1.5 flex-1 sm:flex-none h-8 sm:h-9 text-xs rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link to="/projects" className="flex-1 sm:flex-none">
            <Button variant="primary" size="sm" className="w-full gap-2 shadow-sm h-8 sm:h-9 text-xs font-bold rounded-xl whitespace-nowrap">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Explore Projects</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-cardDark/70 glass-card">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: "all", label: `All Items (${totalSaved})`, icon: FolderHeart },
            { id: "projects", label: `Projects (${savedProjects.length})`, icon: Briefcase },
            { id: "developers", label: `Talent (${savedDevelopers.length})`, icon: Users },
            { id: "posts", label: `Posts (${savedPosts.length})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within saved items..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            Fetching your saved items live from MongoDB...
          </p>
        </div>
      ) : totalSaved === 0 ? (
        <div className="text-center py-20 space-y-4 glass-card rounded-2xl p-8 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center mx-auto text-amber-500 shadow-sm">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No Bookmarked Items Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bookmark interesting projects, talented engineers, and helpful community posts to access them here anytime.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link to="/projects">
              <Button size="sm" variant="primary" className="gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Explore Projects</span>
              </Button>
            </Link>
            <Link to="/developers">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Find Developers</span>
              </Button>
            </Link>
            <Link to="/communities">
              <Button size="sm" variant="outline" className="gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Community Feed</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* SECTION 1: PROJECTS */}
          {(activeCategory === "all" || activeCategory === "projects") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary-500" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Bookmarked Projects ({filteredProjects.length})
                  </h2>
                </div>
                <Link to="/projects" className="text-xs font-bold text-primary-500 hover:underline">
                  Browse All Projects →
                </Link>
              </div>

              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project._id || project.id}
                      project={project}
                      onBookmarkChange={handleProjectUnbookmarked}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    {searchQuery
                      ? "No saved projects match your search."
                      : "No projects bookmarked yet."}
                  </p>
                  <Link to="/projects">
                    <Button variant="outline" size="sm">
                      Discover Projects
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: DEVELOPERS / TALENT */}
          {(activeCategory === "all" || activeCategory === "developers") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Starred Engineers & Talent ({filteredDevelopers.length})
                  </h2>
                </div>
                <Link to="/developers" className="text-xs font-bold text-primary-500 hover:underline">
                  Discover Developers →
                </Link>
              </div>

              {filteredDevelopers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDevelopers.map((dev) => {
                    const devUser = dev.developer || dev.user || dev;
                    return (
                      <DeveloperCard
                        key={dev._id || dev.id}
                        developer={{
                          _id: devUser._id || devUser.id || dev._id,
                          id: devUser._id || devUser.id || dev._id,
                          userId: devUser._id || devUser.id,
                          name: devUser.name || "Developer",
                          username: devUser.username,
                          avatar: devUser.avatar || devUser.avatarUrl,
                          title: dev.title || devUser.headline || "Fullstack Engineer",
                          headline: devUser.headline,
                          about: dev.about || devUser.bio || "Passionate engineer on DevConnect.",
                          availability: dev.availability || "available",
                          rating: dev.rating || 5,
                          skills: dev.skills || devUser.skills || ["JavaScript", "React"],
                          techStack: dev.techStack || ["Node.js", "MongoDB"],
                          followersCount: dev.followersCount || 0,
                          followingCount: dev.followingCount || 0,
                          completedProjects: dev.completedProjectsCount || 0,
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    {searchQuery
                      ? "No saved developers match your search."
                      : "No developers saved yet."}
                  </p>
                  <Link to="/developers">
                    <Button variant="outline" size="sm">
                      Find Developers
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: COMMUNITY POSTS */}
          {(activeCategory === "all" || activeCategory === "posts") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Saved Community Posts ({filteredPosts.length})
                  </h2>
                </div>
                <Link to="/communities" className="text-xs font-bold text-primary-500 hover:underline">
                  Visit Community Hub →
                </Link>
              </div>

              {filteredPosts.length > 0 ? (
                <div className="space-y-4 max-w-3xl">
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post._id || post.id}
                      post={post}
                      onUpdate={handlePostSavedToggled}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    {searchQuery
                      ? "No saved posts match your search."
                      : "No community posts saved yet."}
                  </p>
                  <Link to="/communities">
                    <Button variant="outline" size="sm">
                      Explore Community Posts
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
