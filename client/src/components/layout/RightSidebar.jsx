import { useEffect, useState, useMemo } from "react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Check,
  Plus,
  Globe2,
  BarChart3,
  ExternalLink,
  Sparkles,
  Lightbulb,
  Filter,
  Layers,
  Tag,
  Briefcase,
  Compass,
  MessageSquare,
  X,
  Code2,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  Flame,
  Bookmark,
  Settings,
  User,
  FolderGit2,
  SlidersHorizontal,
  ArrowRight,
  Lock,
  Bell,
  FileText,
  Award,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { discoveryService } from "../../services/discoveryService";
import { communityService } from "../../services/communityService";
import { projectService } from "../../services/projectService";
import { useAuthStore, useUIStore } from "../../store";

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  const isClient = currentUser?.role === "client";

  const currentPath = location.pathname;

  // Granular page context detection matching left sidebar navigation
  const isWorkspace = currentPath.includes("/workspace");
  const isProjectDetails = !isWorkspace && /^\/projects\/[a-zA-Z0-9_-]+$/.test(currentPath);
  const isProjectsFeed = !isWorkspace && !isProjectDetails && (currentPath.startsWith("/projects") || currentPath.startsWith("/discover-projects"));
  const isCommunities = currentPath.startsWith("/communities");
  const isDevelopers = currentPath.startsWith("/developers") || currentPath.startsWith("/saved-developers");
  const isMyProjects = currentPath.startsWith("/my-projects");
  const isApplications = currentPath.startsWith("/applications");
  const isAnalytics = currentPath.startsWith("/analytics") || currentPath.startsWith("/creator-analytics");
  const isBookmarks = currentPath.startsWith("/bookmarks") || currentPath.startsWith("/saved-projects");
  const isProfile = currentPath.startsWith("/profile");
  const isSettings = currentPath.startsWith("/settings");
  const isDashboard = currentPath === "/" || currentPath === "/dashboard";

  // Data states
  const [platformStats, setPlatformStats] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarData = async () => {
      try {
        const [statsRes, collabRes, commRes] = await Promise.allSettled([
          projectService.getProjectStats(),
          discoveryService.getDeveloperRecommendations
            ? discoveryService.getDeveloperRecommendations()
            : discoveryService.searchDevelopers({ limit: 4 }),
          communityService.getCommunities(),
        ]);

        if (isMounted && statsRes.status === "fulfilled" && statsRes.value?.stats) {
          setPlatformStats(statsRes.value.stats);
        }

        if (isMounted && collabRes.status === "fulfilled") {
          const list =
            collabRes.value?.recommendations ||
            collabRes.value?.developers ||
            collabRes.value?.data?.developers ||
            collabRes.value?.data?.data ||
            collabRes.value?.data ||
            [];
          setCollaborators(Array.isArray(list) ? list.slice(0, 3) : []);
        }

        if (isMounted && commRes.status === "fulfilled") {
          const commList =
            commRes.value?.data?.communities ||
            commRes.value?.data?.data ||
            commRes.value?.data ||
            [];
          setCommunities(Array.isArray(commList) ? commList.slice(0, 4) : []);
        }
      } catch (err) {
        console.warn("Sidebar data fetch error:", err);
      }
    };

    fetchSidebarData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleJoin = (id) => {
    setJoinedCommunities((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to update query params cleanly on the active page
  const updateQuery = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "All" || value === "All Projects" || value === "All Hubs" || value === "All Developers") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    const targetPath = location.pathname.startsWith('/communities') ? '/communities' : location.pathname;
    navigate(`${targetPath}?${nextParams.toString()}`);
  };

  const clearFilters = () => {
    navigate(location.pathname);
  };

  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-16 bottom-0 z-30 p-4 overflow-y-auto border-l border-slate-200/90 bg-white/95 dark:bg-cardDark/95 backdrop-blur-xl space-y-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      {/* ========================================================================= */}
      {/* 1. PROJECTS FEED CONTEXT FILTERS (/projects)                              */}
      {/* ========================================================================= */}
      {isProjectsFeed && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-primary-500" />
              <span>Project Filters</span>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <Link to="/projects/create" className="block">
            <Button
              variant="primary"
              className="w-full justify-center gap-2 shadow-md shadow-primary-500/20 text-xs py-2.5 font-bold bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Project</span>
            </Button>
          </Link>

          {/* Project Domains / Categories */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Filter by Domain
            </span>
            <div className="space-y-1">
              {[
                "All Projects",
                "Web Development",
                "AI & Machine Learning",
                "FinTech",
                "Mobile Development",
                "Cloud & DevOps",
                "Cybersecurity",
              ].map((cat) => {
                const active =
                  (searchParams.get("category") || "All Projects").toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => updateQuery("category", cat === "All Projects" ? "" : cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      active
                        ? "bg-primary-500 text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{cat}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Project Status */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Application Status
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "All Status" },
                { id: "open", label: "Hiring" },
                { id: "in-progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((st) => {
                const active = (searchParams.get("status") || "all") === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => updateQuery("status", st.id === "all" ? "" : st.id)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold text-center transition-all border ${
                      active
                        ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                        : "border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* In-Demand Skills for Projects */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Filter by Tech Stack
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["React", "Node.js", "Python", "MongoDB", "TypeScript", "AWS", "Docker", "Tailwind"].map((sk) => {
                const active = (searchParams.get("q") || "").toLowerCase().includes(sk.toLowerCase());
                return (
                  <button
                    key={sk}
                    onClick={() => updateQuery("q", active ? "" : sk)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      active
                        ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-primary-400"
                    }`}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROJECT DETAILS CONTEXT (/projects/:id)                                */}
      {/* ========================================================================= */}
      {isProjectDetails && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Briefcase className="w-3.5 h-3.5 text-primary-500" />
            <span>Project Overview</span>
          </div>

          <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Squad Collaboration</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When accepted into this squad, you gain direct access to the team chat, kanban boards, and milestone tracking.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Sprint Duration:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">1 – 2 Months</span>
            </div>
          </Card>

          <Card className="glass-card p-3.5 space-y-2.5 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Shortcuts
            </span>
            <div className="space-y-1.5">
              <Link
                to="/projects"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-slate-800"
              >
                <span>Browse All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/developers"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-slate-800"
              >
                <span>Find Teammates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WORKSPACE CONTEXT (/projects/:id/workspace)                           */}
      {/* ========================================================================= */}
      {isWorkspace && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Workspace Sprint Hub</span>
          </div>

          <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sprint Health
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Task boards and milestones synchronize in real-time with team members. Keep deliverables updated.
            </p>
            <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              💡 Tip: Move tasks to "In Review" when submitting pull requests.
            </div>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Team Shortcuts
            </span>
            <div className="space-y-1.5">
              <Link
                to="/messages"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 hover:bg-emerald-100/60 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Team Chat</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMMUNITIES & IDEAS FEED CONTEXT (/communities)                        */}
      {/* ========================================================================= */}
      {isCommunities && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Community & Ideas</span>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => useUIStore.getState().openModal("idea_modal")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
            >
              <Lightbulb className="w-4 h-4 fill-white/20" />
              <span>Pitch Your Idea</span>
            </button>
          </div>

          {/* Post Type Selector */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Feed Types
            </span>
            <div className="space-y-1">
              {[
                { id: "all", label: "🌐 All Community Posts", icon: Compass },
                { id: "idea", label: "💡 Project Ideas & Pitches", icon: Lightbulb },
                { id: "question", label: "❓ Questions & Help", icon: MessageSquare },
                { id: "knowledge", label: "📚 Tutorials & Architecture", icon: BookOpenIcon },
                { id: "showcase", label: "✨ Project Showcases", icon: Sparkles },
              ].map((pt) => {
                const active = (searchParams.get("type") || "all") === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => updateQuery("type", pt.id === "all" ? "" : pt.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      active
                        ? "bg-amber-500 text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{pt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Database Guilds */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Guild Hubs
            </span>
            <div className="space-y-1">
              {["All Hubs", "MERN Stack", "Artificial Intelligence", "UI/UX", "DevOps"].map((gh) => {
                const active = (searchParams.get("guild") || "All Hubs") === gh;
                return (
                  <button
                    key={gh}
                    onClick={() => updateQuery("guild", gh === "All Hubs" ? "" : gh)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      active
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{gh}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Popular Community Tags */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Trending Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["idea", "ai", "react", "architecture", "careers", "web3", "opensource"].map((tag) => {
                const active = searchParams.get("tag") === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => updateQuery("tag", active ? "" : tag)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border ${
                      active
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-amber-400"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEVELOPER DIRECTORY CONTEXT (/developers)                              */}
      {/* ========================================================================= */}
      {isDevelopers && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-primary-500" />
              <span>Talent Filters</span>
            </div>
            {Array.from(searchParams.keys()).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Developer Role / Category */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Engineering Domain
            </span>
            <div className="space-y-1">
              {[
                "All Developers",
                "Frontend",
                "Backend",
                "Full Stack",
                "AI / Machine Learning",
                "Mobile",
                "DevOps & Cloud",
              ].map((role) => {
                const active = (searchParams.get("category") || "All Developers") === role;
                return (
                  <button
                    key={role}
                    onClick={() => updateQuery("category", role === "All Developers" ? "" : role)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      active
                        ? "bg-primary-500 text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{role}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Availability Filter */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Availability
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "Any Status" },
                { id: "available", label: "Open to Hire" },
                { id: "busy", label: "In Sprint" },
                { id: "mentoring", label: "Mentoring" },
              ].map((av) => {
                const active = (searchParams.get("availability") || "all") === av.id;
                return (
                  <button
                    key={av.id}
                    onClick={() => updateQuery("availability", av.id === "all" ? "" : av.id)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold text-center transition-all border ${
                      active
                        ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                        : "border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {av.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Skills Filter */}
          <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Filter by Skill
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["TypeScript", "Python", "React", "Node.js", "Docker", "AWS", "GraphQL", "Tailwind"].map((sk) => {
                const active = (searchParams.get("skill") || "").toLowerCase() === sk.toLowerCase();
                return (
                  <button
                    key={sk}
                    onClick={() => updateQuery("skill", active ? "" : sk)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      active
                        ? "bg-primary-500 text-white border-primary-500 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-primary-400"
                    }`}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MY PROJECTS CONTEXT (/my-projects)                                     */}
      {/* ========================================================================= */}
      {isMyProjects && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-primary-500" />
              <span>Project Management</span>
            </div>
          </div>

          <Link to="/projects/create" className="block">
            <Button
              variant="primary"
              className="w-full justify-center gap-2 shadow-md shadow-primary-500/20 text-xs py-2.5 font-bold bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Project</span>
            </Button>
          </Link>

          {/* Candidate Proposals Alert */}
          <Card className="glass-card p-4 space-y-2.5 border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Candidate Proposals
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Review developer applications, assess technical compatibility, and accept candidates to your squad.
            </p>
            <Link to="/applications" className="block pt-1">
              <Button size="xs" variant="outline" className="w-full text-xs font-bold justify-between">
                <span>View Proposal Pipeline</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </Card>

          {/* Workspace Tips */}
          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Lead Responsibilities
            </span>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Keep sprint milestones clearly defined</li>
              <li>Close applications when capacity is reached</li>
              <li>Provide feedback to applicants promptly</li>
            </ul>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PROPOSAL PIPELINE CONTEXT (/applications)                             */}
      {/* ========================================================================= */}
      {isApplications && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Proposal Pipeline</span>
          </div>

          <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                How Applications Work
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When accepted into a team, you automatically gain access to that project's private Team Chat and Sprint Workspace.
            </p>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>1. Under Review:</span>
                <span className="font-semibold text-amber-500">Pending Lead</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>2. Accepted:</span>
                <span className="font-semibold text-emerald-500">Join Team & Chat</span>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Explore More Squads
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Apply to active engineering projects that match your skills.
            </p>
            <Link to="/projects" className="block pt-1">
              <Button size="xs" variant="primary" className="w-full text-xs font-bold justify-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Projects Feed</span>
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CREATOR ANALYTICS CONTEXT (/analytics, /creator-analytics)              */}
      {/* ========================================================================= */}
      {isAnalytics && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <BarChart3 className="w-3.5 h-3.5 text-primary-500" />
            <span>Growth & Reach Insights</span>
          </div>

          <Card className="glass-card p-4 space-y-2.5 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                How to Boost Engagement
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              • Project ideas with clear problem statements and mockups receive 3.5x more peer reviews.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              • Listing 3–5 specific tech stack tags boosts discovery recommendations.
            </p>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Content Actions
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => useUIStore.getState().openModal("idea_modal")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/40 hover:bg-amber-500/20 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pitch New Idea</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link
                to="/projects/create"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-300/40 hover:bg-primary-500/20 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary-500" />
                  <span>Post Project Listing</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. BOOKMARKS CONTEXT (/bookmarks, /saved-projects)                        */}
      {/* ========================================================================= */}
      {isBookmarks && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span>Saved Collections</span>
          </div>

          <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Private Bookmarks
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your bookmarks are completely private. Save active projects and concept pitches to review architectures or apply later.
            </p>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Discover Content to Save
            </span>
            <div className="space-y-1.5">
              <Link
                to="/projects"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
              >
                <span>Live Projects Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/communities?type=idea"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
              >
                <span>Project Ideas Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PROFILE CONTEXT (/profile, /profile/:id)                              */}
      {/* ========================================================================= */}
      {isProfile && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <User className="w-3.5 h-3.5 text-primary-500" />
            <span>Profile & Credentials</span>
          </div>

          <Card className="glass-card p-4 space-y-3 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Developer Standing
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Completing your technical skills, college/university, and linking your GitHub profile increases your score in talent recommendations.
            </p>
            <Link to="/settings" className="block pt-1">
              <Button size="xs" variant="outline" className="w-full text-xs font-bold justify-between">
                <span>Account Settings</span>
                <Settings className="w-3 h-3" />
              </Button>
            </Link>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Portfolio Jump
            </span>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/projects/create"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
              >
                <span>+ Launch New Project</span>
                <Plus className="w-3.5 h-3.5 text-primary-500" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SETTINGS CONTEXT (/settings)                                          */}
      {/* ========================================================================= */}
      {isSettings && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-3.5 h-3.5 text-primary-500" />
            <span>Preferences & Security</span>
          </div>

          <Card className="glass-card p-4 space-y-2.5 border-slate-200/90 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Account Security
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keep your credentials and two-factor recovery keys updated. Password changes take effect across all active browser sessions.
            </p>
          </Card>

          <Card className="glass-card p-3.5 space-y-2 border-slate-200/90 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Help & Resources
            </span>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/communities"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
              >
                <span>Community Guidelines</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. DASHBOARD / DEFAULT HUB CONTEXT (/dashboard, /)                      */}
      {/* ========================================================================= */}
      {(isDashboard || (!isProjectsFeed && !isProjectDetails && !isWorkspace && !isCommunities && !isDevelopers && !isMyProjects && !isApplications && !isAnalytics && !isBookmarks && !isProfile && !isSettings)) && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Link to="/projects/create" className="block">
              <Button
                variant="primary"
                className="w-full justify-center gap-2 shadow-md shadow-primary-500/20 text-xs py-2.5 font-bold bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Project</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => useUIStore.getState().openModal("idea_modal")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/20 border border-amber-400/80 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 font-bold text-xs transition-all shadow-xs"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500/30" />
              <span>Pitch Your Idea</span>
            </button>
          </div>

          {/* Platform Activity */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <BarChart3 className="w-3.5 h-3.5 text-primary-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Platform Activity
              </h3>
            </div>
            <Card className="glass-card p-3 space-y-2 border-slate-200/90 dark:border-slate-800/80">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {platformStats?.totalProjects ?? 6}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/30">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">
                    Hiring
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {platformStats?.openProjects ?? 5}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-primary-50/60 dark:bg-primary-950/20 border border-primary-200/40 dark:border-primary-900/30">
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold block uppercase">
                    In Progress
                  </span>
                  <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                    {platformStats?.inProgressProjects ?? 1}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Done</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                    {platformStats?.completedProjects ?? 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Trending Tech Stacks */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Trending Tech Stacks
              </h3>
            </div>
            <Card className="glass-card p-3 border-slate-200/90 dark:border-slate-800/80">
              <div className="flex flex-wrap gap-1.5">
                {["MongoDB", "TypeScript", "AWS", "Docker", "Express", "React", "Node.js"].map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => navigate(`/projects?q=${encodeURIComponent(sk)}`)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {sk}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Suggested Collaborators */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Suggested Collaborators
                </h3>
              </div>
              <Link
                to="/developers"
                className="text-[11px] font-bold text-primary-500 hover:underline flex items-center gap-0.5"
              >
                All <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            <Card className="space-y-2 p-2.5 glass-card border-slate-200/90 dark:border-slate-800/80">
              {collaborators.length > 0 ? (
                collaborators.map((collab, idx) => {
                  const dev = collab.item || collab.user || collab;
                  const name = dev.name || "Developer";
                  const headline = dev.headline || dev.title || dev.role || "Developer";
                  const id = dev._id || dev.id;
                  return (
                    <div
                      key={id || idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={dev.avatar || dev.avatarUrl}
                          name={name}
                          size="sm"
                          status="online"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${id}`}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate block"
                          >
                            {name}
                          </Link>
                          <p className="text-[10px] text-slate-400 truncate">{headline}</p>
                        </div>
                      </div>
                      <Link to={`/profile/${id}`}>
                        <Button size="xs" variant="outline" className="text-[10px] px-2 h-6 shrink-0">
                          View
                        </Button>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">No developer recommendations yet.</p>
              )}
            </Card>
          </div>

          {/* Database Guilds (Communities) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Globe2 className="w-3.5 h-3.5 text-accent-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Database Guilds
                </h3>
              </div>
              <Link to="/communities" className="text-[11px] font-bold text-primary-500 hover:underline">
                Explore
              </Link>
            </div>
            <Card className="space-y-2.5 p-3 glass-card border-slate-200/90 dark:border-slate-800/80">
              {communities.length > 0 ? (
                communities.map((comm) => {
                  const id = comm._id || comm.id;
                  const isJoined = !!joinedCommunities[id];
                  return (
                    <div key={id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xs shrink-0">
                          <Globe2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/communities"
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 truncate block transition-colors"
                          >
                            {comm.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 truncate">{comm.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleJoin(id)}
                        className={`p-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          isJoined
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-primary-500/10 hover:bg-primary-500 text-primary-500 hover:text-white"
                        }`}
                        title={isJoined ? "Joined" : "Join"}
                      >
                        {isJoined ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">No community guilds available yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </aside>
  );
};

// Simple BookOpen helper icon for community
const BookOpenIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export default RightSidebar;
