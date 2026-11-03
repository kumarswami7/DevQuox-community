import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
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
  Flame
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { discoveryService } from "../../services/discoveryService";
import { communityService } from "../../services/communityService";
import { projectService } from "../../services/projectService";
import { useUIStore } from "../../store";

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentPath = location.pathname;
  const isProjects = currentPath.startsWith("/projects") || currentPath.startsWith("/discover-projects");
  const isCommunities = currentPath.startsWith("/communities");
  const isDevelopers = currentPath.startsWith("/developers");
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
          setCommunities(Array.isArray(commList) ? commList.slice(0, 3) : []);
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
    if (!value || value === "all" || value === "All" || value === "All Projects" || value === "All Hubs") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    navigate(`${location.pathname}?${nextParams.toString()}`);
  };

  const clearFilters = () => {
    navigate(location.pathname);
  };

  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-16 bottom-0 z-30 p-4 overflow-y-auto border-l border-slate-200/90 bg-white/95 dark:bg-cardDark/95 backdrop-blur-xl space-y-4">
      {/* ========================================================================= */}
      {/* 1. PROJECTS FEED CONTEXT FILTERS */}
      {/* ========================================================================= */}
      {isProjects && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header & Quick Action */}
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
              className="w-full justify-center gap-2 shadow-md shadow-primary-500/20 text-xs py-2.5 font-bold"
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
                "AI & ML",
                "FinTech",
                "Mobile Development",
                "Cloud & DevOps",
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
              Project Status
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
      {/* 2. COMMUNITIES CONTEXT FILTERS */}
      {/* ========================================================================= */}
      {isCommunities && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Community Navigation</span>
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
                { id: "all", label: "All Community Posts", icon: Compass },
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

          {/* Guild Hubs */}
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
      {/* 3. DEVELOPER DIRECTORY CONTEXT FILTERS */}
      {/* ========================================================================= */}
      {isDevelopers && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-primary-500" />
              <span>Talent Directory Filters</span>
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
      {/* 4. DASHBOARD & DEFAULT PAGE CONTEXT (Standard Hub View) */}
      {/* ========================================================================= */}
      {(isDashboard || (!isProjects && !isCommunities && !isDevelopers)) && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Link to="/projects/create" className="block">
              <Button
                variant="primary"
                className="w-full justify-center gap-2 shadow-md shadow-primary-500/20 text-xs py-2.5 font-bold"
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
              <span>Post Your Idea</span>
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
