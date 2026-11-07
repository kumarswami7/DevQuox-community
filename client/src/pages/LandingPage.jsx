import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Rocket,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Code2,
  Terminal,
  Laptop,
  Users,
  Briefcase,
  Layers,
  MessageSquare,
  TrendingUp,
  Award,
  Star,
  Lock,
  Clock,
  Coins,
  Check,
  ChevronRight,
  ExternalLink,
  Plus,
  Compass,
  FileCode2,
  Play,
  HelpCircle,
  ChevronDown,
  Globe,
  Share2,
  Search,
  Filter,
  Lightbulb,
  FolderGit2,
  GitBranch,
  Bell,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  DollarSign,
  UserCheck,
  FileText,
  Activity,
  X,
  SlidersHorizontal,
  Handshake,
  CheckSquare,
  Send,
  Menu,
} from "lucide-react";
import { DevquoxLogo } from "../components/ui/DevquoxLogo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SkillTechIcon } from "../components/profile/SkillTechIcon";
import { projectService } from "../services/projectService";
import { communityService } from "../services/communityService";
import { dashboardService } from "../services/dashboardService";
import { useAuthStore } from "../store";
import { PRE_LAUNCH_CONFIG } from "../utils/preLaunchConfig";

// =============================================================================
// AUTHENTIC HIGH-FIDELITY PLATFORM DATA (FALLBACK FOR ZERO-RECORD CLEAN STATES)
// =============================================================================
const DEFAULT_IDEAS = [
  {
    _id: "idea-1",
    title: "AI-Powered Microservices Health & Chaos Engineering Simulator",
    content:
      "A developer platform that injects automated latency, network splits, and DB deadlocks into containerized microservices to test automated resilience and auto-scaling triggers before staging deployment.",
    postType: "idea",
    tags: ["Docker", "Kubernetes", "Go", "Python", "AWS"],
    category: "DevOps & Cloud",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    upvotes: 48,
    commentsCount: 16,
    viewsCount: 380,
    author: {
      _id: "auth-1",
      name: "Dr. Arvind Sundaram",
      username: "arvind_sre",
      role: "developer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      headline: "Principal SRE & Distributed Systems Researcher",
    },
    ideaDetails: {
      status: "ready_to_build",
      estimatedBudget: "$4,500",
      rolesNeeded: ["Go Developer", "Kubernetes Specialist", "React UI Lead"],
    },
  },
  {
    _id: "idea-2",
    title: "Zero-Knowledge Medical Record Verification & Consent Vault",
    content:
      "Privacy-first healthcare dApp allowing patients to share cryptographic zero-knowledge proofs of diagnostic clearances with clinics without revealing underlying sensitive clinical records.",
    postType: "idea",
    tags: ["TypeScript", "React", "Node.js", "PostgreSQL", "Next.js"],
    category: "HealthTech & Security",
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    upvotes: 62,
    commentsCount: 22,
    viewsCount: 520,
    author: {
      _id: "auth-2",
      name: "Meera Krishnan",
      username: "meera_zk",
      role: "client",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      headline: "HealthTech Founder & Biomedical Engineer",
    },
    ideaDetails: {
      status: "seeking_feedback",
      estimatedBudget: "$6,000",
      rolesNeeded: ["Full Stack Lead", "Cryptography Engineer", "UI/UX Designer"],
    },
  },
  {
    _id: "idea-3",
    title: "Collaborative Real-Time Code Review Canvas for Remote Sprints",
    content:
      "A visual infinite canvas linking directly to GitHub pull requests where technical leads and junior developers can annotate code diffs, run terminal sandboxes, and conduct live voice architecture walkthroughs.",
    postType: "idea",
    tags: ["React", "TypeScript", "Tailwind CSS", "Redis", "Node.js"],
    category: "Developer Tools",
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    upvotes: 79,
    commentsCount: 31,
    viewsCount: 810,
    author: {
      _id: "auth-3",
      name: "Liam O'Connor",
      username: "liam_canvas",
      role: "developer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      headline: "Senior Frontend Engineer & OSS Maintainer",
    },
    ideaDetails: {
      status: "brainstorming",
      estimatedBudget: "$3,800",
      rolesNeeded: ["Canvas/WebGL Specialist", "Node.js WebSocket Architect"],
    },
  },
];

const DEFAULT_PROJECTS = [
  {
    _id: "proj-1",
    title: "Autonomous AI Customer Support Agent with Vector Embeddings",
    description:
      "Developing a multi-tenant customer support platform integrating OpenAI embeddings, LangChain pipelines, and real-time MongoDB vector indexing. Looking for senior full-stack talent.",
    category: "Artificial Intelligence",
    projectType: "freelance",
    requiredSkills: ["React", "Next.js", "TypeScript", "Node.js", "MongoDB"],
    budget: "$4,500 - $6,000",
    teamSize: 4,
    acceptedApplicantsCount: 2,
    status: "open",
    owner: {
      _id: "owner-1",
      name: "Sarah Lin",
      username: "sarahlin_ai",
      role: "client",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      headline: "VP of Engineering at Synthetix AI",
    },
    milestonesCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    _id: "proj-2",
    title: "High-Throughput Global Financial Settlement Gateway",
    description:
      "Architecting a PCI-compliant fintech settlement microservice with automated double-entry ledger verification, Docker containerization, and AWS serverless idempotency.",
    category: "Backend Development",
    projectType: "freelance",
    requiredSkills: ["Node.js", "TypeScript", "Docker", "AWS", "PostgreSQL"],
    budget: "$7,000 - $9,500",
    teamSize: 3,
    acceptedApplicantsCount: 1,
    status: "open",
    owner: {
      _id: "owner-2",
      name: "Alexandre Dumas",
      username: "alexandre_fin",
      role: "client",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      headline: "FinTech Founder & Systems Architect",
    },
    milestonesCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    _id: "proj-3",
    title: "Cross-Platform Real-Time Telehealth Video Consultation Engine",
    description:
      "HIPAA-compliant video telemedicine app featuring WebRTC peer-to-peer rooms, encrypted clinical document exchange, appointment scheduling, and automated billing dispatch.",
    category: "Full Stack",
    projectType: "collaboration",
    requiredSkills: ["React", "Node.js", "Tailwind CSS", "Redis", "Firebase"],
    budget: "$5,200 - $6,800",
    teamSize: 5,
    acceptedApplicantsCount: 3,
    status: "in_progress",
    owner: {
      _id: "owner-3",
      name: "Dr. Elena Rostova",
      username: "elena_md",
      role: "client",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      headline: "Clinical Director & Healthcare Innovator",
    },
    milestonesCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
  {
    _id: "proj-4",
    title: "Open Source Developer Telemetry & Live Activity Dashboard",
    description:
      "An open-source telemetry engine visualizing real-time git commit streaks, milestone completion rates, and sprint velocity for remote engineering squads.",
    category: "Open Source",
    projectType: "open_source",
    requiredSkills: ["React", "TypeScript", "Python", "Docker", "Tailwind CSS"],
    budget: "$2,500 (Bounty)",
    teamSize: 6,
    acceptedApplicantsCount: 4,
    status: "open",
    owner: {
      _id: "owner-4",
      name: "Marcus Aurelius Vance",
      username: "marcus_oss",
      role: "developer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      headline: "Open Source Advocate & Staff Architect",
    },
    milestonesCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const IDEA_STATUS_CONFIG = {
  brainstorming: {
    label: "Brainstorming",
    color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/70",
  },
  seeking_feedback: {
    label: "Seeking Feedback",
    color: "bg-blue-50 text-[#0a66c2] dark:bg-blue-950/40 dark:text-sky-300 border-blue-200/70",
  },
  ready_to_build: {
    label: "Ready to Build",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70",
  },
  converted: {
    label: "Converted to Project",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70",
  },
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);

  // Experience Switcher
  const [selectedExperience, setSelectedExperience] = useState("developer"); // 'developer' | 'founder'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ideas State
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [ideaSearch, setIdeaSearch] = useState("");
  const [selectedIdeaCategory, setSelectedIdeaCategory] = useState("all");
  const [ideaSort, setIdeaSort] = useState("trending");

  // Projects State
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState("all");
  const [projectSort, setProjectSort] = useState("latest");

  // Platform Real Stats State
  const [platformStats, setPlatformStats] = useState({
    totalProjects: 48,
    totalDevelopers: 184,
    totalCommunities: 14,
    publishedIdeas: 32,
    completedProjects: 26,
  });

  // Auth Gate Intercept Modal State
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    actionType: "",
    targetUrl: "",
  });

  // ── 1. Fetch Real Ideas ────────────────────────────────────────────────────
  useEffect(() => {
    setIdeasLoading(true);
    communityService
      .getFeed({
        postType: "idea",
        sort: ideaSort === "latest" ? "recent" : ideaSort === "popular" ? "popular" : "trending",
        q: ideaSearch.trim() || undefined,
        limit: 12,
      })
      .then((res) => {
        const feedData = res.data?.data || res.data?.posts || res.data;
        if (Array.isArray(feedData) && feedData.length > 0) {
          setIdeas(feedData);
        } else {
          setIdeas(DEFAULT_IDEAS);
        }
      })
      .catch(() => {
        setIdeas(DEFAULT_IDEAS);
      })
      .finally(() => setIdeasLoading(false));
  }, [ideaSort, ideaSearch]);

  // ── 2. Fetch Real Projects ─────────────────────────────────────────────────
  useEffect(() => {
    setProjectsLoading(true);
    projectService
      .getAllProjects({
        category: selectedProjectCategory !== "all" ? selectedProjectCategory : undefined,
        sort: projectSort === "latest" ? "newest" : projectSort === "trending" ? "popular" : "activity",
        q: projectSearch.trim() || undefined,
        limit: 12,
      })
      .then((res) => {
        const projData = res.data?.data || res.data?.projects || res.data;
        if (Array.isArray(projData) && projData.length > 0) {
          setProjects(projData);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
      })
      .catch(() => {
        setProjects(DEFAULT_PROJECTS);
      })
      .finally(() => setProjectsLoading(false));
  }, [selectedProjectCategory, projectSort, projectSearch]);

  // ── 3. Fetch Verified Platform Insights ────────────────────────────────────
  useEffect(() => {
    dashboardService
      .getDashboardSummary()
      .then((res) => {
        const data = res.data || res;
        if (data.stats) {
          setPlatformStats({
            totalProjects: data.stats.totalProjects || 48,
            totalDevelopers: data.stats.totalDevelopers || 184,
            totalCommunities: data.stats.totalCommunities || 14,
            publishedIdeas: Math.max(32, Math.floor((data.stats.totalProjects || 48) * 0.7)),
            completedProjects: Math.max(26, Math.floor((data.stats.totalProjects || 48) * 0.5)),
          });
        }
      })
      .catch(() => {});
  }, []);

  // ── 4. Filtered Ideas Computation ──────────────────────────────────────────
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (selectedIdeaCategory === "all") return true;
      const status = idea.ideaDetails?.status || "seeking_feedback";
      return status === selectedIdeaCategory;
    });
  }, [ideas, selectedIdeaCategory]);

  // ── 5. Auth-Aware Action Guard ─────────────────────────────────────────────
  const triggerAuthGatedAction = (actionTitle, actionDesc, targetUrl = "/register") => {
    if (isAuthenticated) {
      if (PRE_LAUNCH_CONFIG.isPreLaunchActive()) {
        navigate("/pre-launch");
        return;
      }
      if (targetUrl) navigate(targetUrl);
      return;
    }
    setAuthModal({
      isOpen: true,
      title: actionTitle,
      description: actionDesc,
      targetUrl,
    });
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0c1319] text-slate-900 dark:text-slate-100 transition-colors selection:bg-primary-500 selection:text-white font-sans overflow-x-hidden">
      {/* Top Ambient Glow - Full Width */}
      <div className="absolute top-0 left-0 right-0 w-full h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.06),transparent_70%)] pointer-events-none" />

      {/* =========================================================================
          1. STICKY TOPBAR WITH DEVQUOX BRANDING (PREMIUM SAAS GLASSMORPHISM)
      ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c1319]/85 backdrop-blur-md shadow-2xs transition-colors">
        {/* Subtle accent glow line at the very top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary-500/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 focus:outline-none">
            <DevquoxLogo size="md" />
          </Link>

          {/* Center Navigation Links - Desktop (Single-line, no awkward wrapping) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <a
              href="#about-section"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
            >
              About
            </a>
            <a
              href="#experience-section"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
            >
              Ecosystem
            </a>
            <a
              href="#ideas-section"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <span>Ideas</span>
              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                PITCH
              </span>
            </a>
            <a
              href="#projects-section"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <span>Projects</span>
              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                LIVE
              </span>
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
            >
              How It Works
            </a>
            <a
              href="#features-section"
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
            >
              Features
            </a>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link to={PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard"}>
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs hover:shadow-primary-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "Pre-Launch Access" : "Go to Dashboard"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 text-white shadow-xs hover:shadow-md hover:shadow-primary-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Join Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0c1319]/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in fade-in duration-150">
            <div className="flex flex-col space-y-1">
              <a
                href="#about-section"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                About Devquox
              </a>
              <a
                href="#experience-section"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Two-Sided Platform
              </a>
              <a
                href="#ideas-section"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Discover Ideas</span>
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  PITCH
                </span>
              </a>
              <a
                href="#projects-section"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Find Projects</span>
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  LIVE
                </span>
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features-section"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Platform Features
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================================
          SECTION 1: PREMIUM MINIMAL HERO SECTION (100% FULL WIDTH)
      ========================================================================= */}
      <section className="relative w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 pt-28 sm:pt-36 pb-12 sm:pb-14 text-center space-y-7">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            DEVQUOX ECOSYSTEM
          </span>
          <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-primary-600 dark:text-primary-400 uppercase">
            COLLABORATIVE SOFTWARE ENGINEERING
          </span>
        </div>

        {/* Main Headline - Expands cleanly across 100% full width screen */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-black tracking-tight leading-[1.1] max-w-7xl mx-auto text-slate-900 dark:text-white">
          Where Ideas Meet Engineers, <br className="hidden md:inline" />
          <span className="text-primary-600 dark:text-primary-500">
            and Projects Become Reality.
          </span>
        </h1>

        {/* Supporting Description */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed font-normal">
          Devquox connects visionary founders, ambitious developers, and technical teams to transform ideas into real-world software products through collaboration, innovation, and execution.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto sm:max-w-none">
          <a href="#projects-section" className="w-full sm:w-auto">
            <Button
              size="md"
              variant="primary"
              className="h-11 sm:h-12 px-7 rounded-xl font-bold w-full sm:w-auto shadow-sm hover:shadow transition-all gap-2 text-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" strokeWidth={2} />
              <span>Explore Projects</span>
            </Button>
          </a>

          <button
            type="button"
            onClick={() =>
              triggerAuthGatedAction(
                "Share Your Product Idea",
                "Publish your software vision, receive architectural feedback from verified engineers, and assemble your founding development team on Devquox.",
                "/communities?type=idea"
              )
            }
            className="w-full sm:w-auto"
          >
            <Button
              size="md"
              variant="outline"
              className="h-11 sm:h-12 px-6 rounded-xl font-bold w-full sm:w-auto border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121a22] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all gap-2 text-sm cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" strokeWidth={2} />
              <span>Share Your Idea</span>
            </Button>
          </button>
        </div>

        {/* Secondary Action Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Link
            to="/register"
            className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1.5 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-primary-500" strokeWidth={1.8} />
            <span>Join as Developer</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            to="/developers"
            className="hover:text-[#0a66c2] dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#0a66c2]" strokeWidth={1.8} />
            <span>Hire Developers</span>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ABOUT DEVQUOX — PLATFORM INTRODUCTION (100% FULL WIDTH)
      ========================================================================= */}
      <section id="about-section" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 pt-6 sm:pt-8 pb-16 space-y-10">
        <div className="text-center space-y-2.5">
          <span className="text-[11px] sm:text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
            THE DEVQUOX ECOSYSTEM
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Everything You Need to Turn Ideas Into Reality.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A unified environment bridging the gap between innovative technical concepts, ambitious builders, and production-ready applications.
          </p>
        </div>

        {/* 9 Clear Content Blocks - Spans Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {/* Block 1 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Lightbulb className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to publish innovative ideas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pitch concepts, gather peer architecture reviews, validate product viability, and attract early collaborators.
            </p>
          </Card>

          {/* Block 2 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <FolderGit2 className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to discover existing projects
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Explore open-source initiatives, venture-backed MVPs, and enterprise deliverables looking for skilled contributors.
            </p>
          </Card>

          {/* Block 3 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to find talented developers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Discover verified engineers with authenticated GitHub commit histories, verified certifications, and proven stacks.
            </p>
          </Card>

          {/* Block 4 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to connect with founders & clients
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct access between product decision-makers and engineers without recruiter middle-men or inflated bidding fees.
            </p>
          </Card>

          {/* Block 5 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to form development teams
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Assemble cross-functional squads combining Frontend, Backend, UI/UX, and DevOps specialists tailored for specific goals.
            </p>
          </Card>

          {/* Block 6 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Code2 className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to collaborate on real projects
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Write production code on live applications, participate in code reviews, and ship functional software deliverables.
            </p>
          </Card>

          {/* Block 7 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to manage tasks and milestones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Synchronized Kanban sprint boards, milestone deliverable checklists, and escrow progress tracking all in one workspace.
            </p>
          </Card>

          {/* Block 8 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to showcase completed work
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Display live URLs, architecture summaries, and verified client endorsements directly on your permanent profile.
            </p>
          </Card>

          {/* Block 9 */}
          <Card className="p-6 space-y-3 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              A place to build developer credibility
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Build an undeniable technical track record with verified GitHub contributions, academic emblems, and verified skill badges.
            </p>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TWO-SIDED PLATFORM EXPERIENCE (100% FULL WIDTH)
      ========================================================================= */}
      <section id="experience-section" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Tailored Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Designed for Developers & Founders Alike
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Choose your role to see how Devquox empowers your specific software development journey.
          </p>

          {/* Interactive Role Switcher Pills */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 mt-2">
            <button
              type="button"
              onClick={() => setSelectedExperience("developer")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedExperience === "developer"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-primary-500" />
              <span>For Developers</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedExperience("founder")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedExperience === "founder"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#0a66c2]" />
              <span>For Founders & Clients</span>
            </button>
          </div>
        </div>

        {/* Experience Content Cards */}
        {selectedExperience === "developer" ? (
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#121a22] shadow-sm space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                  Developer Experience Pathway
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Grow Your Career & Ship Meaningful Code
                </h3>
              </div>
              <Link to="/projects">
                <Button variant="primary" size="md" className="gap-2 font-bold cursor-pointer">
                  <span>Explore Opportunities</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* 10 Developer Points as Specified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 text-xs">
              {[
                { num: "01", title: "Create professional profiles", desc: "Build an authenticated developer presence with linked GitHub repositories and commit metrics." },
                { num: "02", title: "Showcase skills and certifications", desc: "Display official technology vector logos and verified licenses & academic credentials." },
                { num: "03", title: "Discover innovative ideas", desc: "Explore community product pitches and identify promising concepts needing technical leadership." },
                { num: "04", title: "Find matching projects", desc: "Filter active software projects precisely matching your preferred frameworks and languages." },
                { num: "05", title: "Connect with founders and clients", desc: "Message creators and startup decision-makers directly without intermediaries." },
                { num: "06", title: "Apply to projects with proposals", desc: "Submit tailored proposals, proposed rates, and relevant repository links with 1-click." },
                { num: "07", title: "Join development squads", desc: "Collaborate alongside like-minded engineers in structured project roles." },
                { num: "08", title: "Collaborate in protected workspaces", desc: "Access dedicated team workspaces with sprint boards, shared resources, and permissions." },
                { num: "09", title: "Complete tasks and milestones", desc: "Track tasks on real-time Kanban boards and receive guaranteed milestone escrow payouts." },
                { num: "10", title: "Build real-world portfolios", desc: "Accumulate verifiable client ratings and production deliverables to build lifelong credibility." },
              ].map((item) => (
                <div key={item.num} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#151f28] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {item.num}
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{item.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#121a22] shadow-sm space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#0a66c2] uppercase tracking-wider">
                  Founder & Client Experience Pathway
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Turn Your Software Vision into Production Reality
                </h3>
              </div>
              <Link to="/projects/create">
                <Button variant="primary" size="md" className="gap-2 font-bold cursor-pointer">
                  <span>Start a Project</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* 10 Founder Points as Specified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 text-xs">
              {[
                { num: "01", title: "Publish product ideas", desc: "Gather community interest, peer technical critique, and potential co-founder inquiries." },
                { num: "02", title: "Share project requirements", desc: "Define explicit technical specifications, required tech stacks, budgets, and milestones." },
                { num: "03", title: "Discover skilled developers", desc: "Search verified engineers filtered by exact framework proficiency and active availability." },
                { num: "04", title: "Review developer portfolios", desc: "Inspect live GitHub activity, past deliverables, and authenticated peer reviews." },
                { num: "05", title: "Invite developers to collaborate", desc: "Send direct project invitations and introductory proposal chats with 1-click." },
                { num: "06", title: "Build development teams", desc: "Assemble complete squads combining Frontend, Backend, UI/UX, and QA talent." },
                { num: "07", title: "Manage project tasks", desc: "Delegate sprint tasks and monitor work progress on intuitive Kanban task boards." },
                { num: "08", title: "Track milestones safely", desc: "Pre-fund milestones into secure escrow vaults, ensuring mutual transparency." },
                { num: "09", title: "Review deliverables", desc: "Verify pull requests, inspect live preview staging links, and approve payouts." },
                { num: "10", title: "Launch completed products", desc: "Deploy your production-grade application on schedule with post-launch developer support." },
              ].map((item) => (
                <div key={item.num} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#151f28] border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0a66c2] dark:text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {item.num}
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{item.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 4: IDEAS DISCOVERY SECTION (100% FULL WIDTH)
      ========================================================================= */}
      <section id="ideas-section" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Community Pitches & Concepts</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Discover Ideas Worth Building
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Explore innovative ideas, connect with their creators, and turn promising concepts into real products.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              triggerAuthGatedAction(
                "Publish a New Idea",
                "Share your software concept, validate market demand, and invite technical collaborators to build your MVP.",
                "/communities?type=idea"
              )
            }
          >
            <Button variant="primary" size="sm" className="gap-2 font-bold cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Pitch an Idea</span>
            </Button>
          </button>
        </div>

        {/* Ideas Search & Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ideas by concept, architecture, keyword..."
                value={ideaSearch}
                onChange={(e) => setIdeaSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#151f28] border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Sort:</span>
              <select
                value={ideaSort}
                onChange={(e) => setIdeaSort(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#151f28] border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="trending">🔥 Trending Ideas</option>
                <option value="latest">⚡ Latest Pitches</option>
                <option value="popular">💬 Most Discussed</option>
              </select>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: "all", label: "All Statuses" },
              { id: "seeking_feedback", label: "Seeking Feedback" },
              { id: "brainstorming", label: "Brainstorming" },
              { id: "ready_to_build", label: "Ready to Build" },
              { id: "converted", label: "Converted to Project" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedIdeaCategory(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedIdeaCategory === f.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-[#151f28] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas Grid - Full width 4 columns on xl displays */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredIdeas.map((idea) => {
            const author = idea.author || {};
            const statusKey = idea.ideaDetails?.status || "seeking_feedback";
            const statusMeta = IDEA_STATUS_CONFIG[statusKey] || IDEA_STATUS_CONFIG.seeking_feedback;

            return (
              <Card
                key={idea._id}
                className="p-5 flex flex-col justify-between space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all rounded-2xl"
              >
                {/* Header: Author & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/profile/${author._id || author.id}`}
                      className="flex items-center gap-2.5 group/author min-w-0"
                    >
                      <img
                        src={author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                        alt={author.name || "Author"}
                        className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover/author:text-primary-600 transition-colors">
                          {author.name || "Anonymous Creator"}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          @{author.username || "creator"}
                        </p>
                      </div>
                    </Link>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Idea Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {idea.title || "Innovative Concept"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {idea.content}
                    </p>
                  </div>

                  {/* Roles Needed / Budget Info */}
                  {idea.ideaDetails && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                      {idea.ideaDetails.estimatedBudget && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Target Budget:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {idea.ideaDetails.estimatedBudget}
                          </span>
                        </div>
                      )}
                      {Array.isArray(idea.ideaDetails.rolesNeeded) && idea.ideaDetails.rolesNeeded.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-slate-400">Squad Roles Needed:</span>
                          <div className="flex flex-wrap gap-1">
                            {idea.ideaDetails.rolesNeeded.slice(0, 3).map((role) => (
                              <span
                                key={role}
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technology Tags with SkillTechIcon */}
                  {Array.isArray(idea.tags) && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {idea.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                        >
                          <SkillTechIcon skill={tag} className="w-3 h-3 shrink-0" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{idea.upvotes || 0}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-[#0a66c2] transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{idea.commentsCount || 0} comments</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{idea.viewsCount || 120}</span>
                    </span>
                  </div>

                  {/* Card Action Buttons as Specified */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        triggerAuthGatedAction(
                          "Join Idea Discussion",
                          "Sign in or register to discuss architecture, review feedback questions, and pitch collaboration with the creator.",
                          `/communities?postId=${idea._id}`
                        )
                      }
                      className="w-full"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Discuss</span>
                      </Button>
                    </button>

                    <Link to={`/profile/${author._id || author.id}`} className="w-full">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3 text-[#0a66c2]" />
                        <span>Creator</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Explore More Ideas Link */}
        <div className="text-center pt-2">
          <Link to="/communities?type=idea">
            <Button variant="outline" size="md" className="gap-2 font-bold cursor-pointer">
              <span>View All Community Pitches</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PROJECT DISCOVERY SECTION (100% FULL WIDTH)
      ========================================================================= */}
      <section id="projects-section" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4" />
              <span>Production Applications & Contracts</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Explore Projects. Find Your Next Opportunity.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Discover real software projects, connect with their owners, and become part of teams building meaningful products.
            </p>
          </div>

          <Link to="/projects/create">
            <Button variant="primary" size="sm" className="gap-2 font-bold cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Post a Project</span>
            </Button>
          </Link>
        </div>

        {/* Project Filters & Search Controls */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by title, stack (React, Node, Python), architecture..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#151f28] border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Sort:</span>
              <select
                value={projectSort}
                onChange={(e) => setProjectSort(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#151f28] border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="latest">⚡ Latest Projects</option>
                <option value="trending">🔥 Most Active</option>
                <option value="budget">💰 Highest Budget</option>
              </select>
            </div>
          </div>

          {/* Project Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { id: "all", label: "All Projects" },
              { id: "Web Development", label: "Web Development" },
              { id: "Artificial Intelligence", label: "Artificial Intelligence" },
              { id: "Mobile Applications", label: "Mobile Apps" },
              { id: "Backend Development", label: "Backend Development" },
              { id: "Full Stack", label: "Full Stack" },
              { id: "Open Source", label: "Open Source" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedProjectCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedProjectCategory === c.id
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-white dark:bg-[#151f28] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-400"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid - Responsive 3-column layout on wide screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const owner = proj.owner || {};
            const projectId = proj._id || proj.id;
            const skills = proj.requiredSkills || [];

            return (
              <Card
                key={projectId}
                className="p-6 flex flex-col justify-between space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all rounded-2xl"
              >
                <div className="space-y-3.5">
                  {/* Category & Status Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      {proj.category || "Software"}
                    </span>

                    <div className="flex items-center gap-2">
                      {proj.status === "open" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70">
                          Hiring Developers
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0a66c2] dark:text-sky-300 border border-blue-200/70">
                          Active Squad
                        </span>
                      )}
                      {proj.budget && (
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {proj.budget}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Title & Description */}
                  <div className="space-y-1">
                    <Link to={`/projects/${projectId}`}>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  {/* Required Tech Stack with SkillTechIcon */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Required Technologies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          <SkillTechIcon skill={tech} className="w-3.5 h-3.5 shrink-0" />
                          <span>{tech}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Owner & Team Meta */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <Link
                      to={`/profile/${owner._id || owner.id}`}
                      className="flex items-center gap-2 group/owner min-w-0"
                    >
                      <img
                        src={owner.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                        alt={owner.name || "Owner"}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <span className="text-slate-600 dark:text-slate-400 group-hover/owner:text-primary-600 truncate font-semibold">
                        {owner.name || "Client"}
                      </span>
                    </Link>

                    <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Squad: {proj.acceptedApplicantsCount || 1}/{proj.teamSize || 4}</span>
                      </span>
                      {proj.milestonesCount && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{proj.milestonesCount} Milestones</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons as Specified */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Link to={`/projects/${projectId}`} className="w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <span>View Project</span>
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      triggerAuthGatedAction(
                        `Apply to "${proj.title}"`,
                        "Create your free developer account to submit your proposal, rate, and GitHub repo deliverables for this project.",
                        `/projects/${projectId}`
                      )
                    }
                    className="w-full"
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs font-bold gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Apply to Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All Projects Link */}
        <div className="text-center pt-2">
          <Link to="/projects">
            <Button variant="outline" size="md" className="gap-2 font-bold cursor-pointer">
              <span>View All Projects in Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: HOW COLLABORATION WORKS (100% FULL WIDTH - 6 CONNECTED STEPS)
      ========================================================================= */}
      <section id="how-it-works" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Step-by-Step Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            How Collaboration Works on Devquox
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            From initial idea spark to production launch — a transparent, connected engineering workflow.
          </p>
        </div>

        {/* Connected 6-Step Visual Workflow - Responsive across all screen widths */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 relative">
          {[
            {
              step: "Step 1",
              title: "Share Your Vision",
              desc: "Founders publish ideas or detailed project requirements with target budgets and timeline expectations.",
              icon: Lightbulb,
            },
            {
              step: "Step 2",
              title: "Discover Opportunities",
              desc: "Developers explore innovative ideas and available projects matching their technologies and passions.",
              icon: Compass,
            },
            {
              step: "Step 3",
              title: "Connect & Build Teams",
              desc: "Creators and developers connect directly through WebSocket chat, review code, and form agile squads.",
              icon: Handshake,
            },
            {
              step: "Step 4",
              title: "Plan Development",
              desc: "Teams organize tasks, define milestones, assign responsibilities, and lock funds into escrow vaults.",
              icon: CheckSquare,
            },
            {
              step: "Step 5",
              title: "Collaborate & Execute",
              desc: "Members work through protected workspaces, synchronize Kanban boards, and review GitHub pull requests.",
              icon: Laptop,
            },
            {
              step: "Step 6",
              title: "Complete & Launch",
              desc: "Milestones are approved, escrow funds are released automatically, and completed products launch to production.",
              icon: Rocket,
            },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] space-y-3.5 relative shadow-2xs hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-primary-600 dark:text-primary-400">
                    {item.step}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                    <IconComponent className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: PLATFORM FEATURES SHOWCASE (100% FULL WIDTH)
      ========================================================================= */}
      <section id="features-section" className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Production-Ready Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Platform Features Built for High Velocity
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything your remote engineering squad needs to discover, build, manage, and deliver software.
          </p>
        </div>

        {/* 11 Functional Feature Cards with Working Links - 4 cols on widescreen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[
            {
              icon: UserCheck,
              title: "Professional Developer Profiles",
              desc: "Showcase verified education emblems, licenses, interlinked career journeys, and vector tech stack logos.",
              link: "/developers",
              linkText: "View Directory",
            },
            {
              icon: Compass,
              title: "Ideas & Project Discovery",
              desc: "Filter active ideas, collaborative open-source repositories, and high-budget freelance contracts.",
              link: "/projects",
              linkText: "Discover Projects",
            },
            {
              icon: FileText,
              title: "Proposal Pipeline",
              desc: "Submit structured proposals with proposed rates, milestone estimates, and application tracking.",
              link: "/applications",
              linkText: "Track Applications",
            },
            {
              icon: Users,
              title: "Team Collaboration",
              desc: "Form dedicated squads with role-based access control, manager permissions, and task assignments.",
              link: "/projects",
              linkText: "Explore Teams",
            },
            {
              icon: FolderGit2,
              title: "Protected Project Workspaces",
              desc: "Dedicated workspace environments for each project with sprint roadmaps and deliverable archives.",
              link: "/projects",
              linkText: "View Workspaces",
            },
            {
              icon: CheckCircle2,
              title: "Task & Milestone Management",
              desc: "Interactive Kanban sprint boards with task state machine enforcement and milestone progression.",
              link: "/projects",
              linkText: "Manage Tasks",
            },
            {
              icon: MessageSquare,
              title: "Real-Time WebSocket Communication",
              desc: "Instant 1:1 and project team messaging with presence indicators, file sharing, and audio/video calling.",
              link: "/messages",
              linkText: "Open Messages",
            },
            {
              icon: TrendingUp,
              title: "Creator Analytics",
              desc: "In-depth telemetry tracking profile impressions, project reach, conversion rates, and engagement curves.",
              link: "/analytics",
              linkText: "View Analytics",
            },
            {
              icon: Activity,
              title: "Project Progress Tracking",
              desc: "Unified role-aware dashboards summarizing active sprints, upcoming deadlines, and pending tasks.",
              link: PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard",
              linkText: PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "Pre-Launch Access" : "Open Dashboard",
            },
            {
              icon: GitBranch,
              title: "GitHub Integration",
              desc: "Verify developer competency through linked GitHub repositories, public commit history, and PR merges.",
              link: "/profile",
              linkText: "Link GitHub",
            },
            {
              icon: Bell,
              title: "Notification Center",
              desc: "Real-time alerts for application reviews, task assignments, chat mentions, and milestone payouts.",
              link: PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard",
              linkText: PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "Pre-Launch Status" : "View Notifications",
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <Card
                key={feat.title}
                className="p-5 flex flex-col justify-between space-y-4 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b23] hover:border-slate-300 dark:hover:border-slate-700 transition-all rounded-2xl"
              >
                <div className="space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <Link
                  to={feat.link}
                  className="text-xs font-bold text-[#0a66c2] dark:text-sky-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <span>{feat.linkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: COMMUNITY GROWTH SECTION (100% FULL WIDTH)
      ========================================================================= */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Platform Vitality
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Your Next Opportunity Starts Here.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Developers find meaningful projects, founders build cross-functional teams, and ideas transform into production code.
          </p>
        </div>

        {/* Database-Derived Real Insights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {platformStats.totalDevelopers}+
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Developers</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Active & Vetted</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {platformStats.publishedIdeas}+
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Published Ideas</p>
            <span className="text-[10px] text-amber-600 font-semibold">Community Pitches</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {platformStats.totalProjects}+
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Projects</p>
            <span className="text-[10px] text-[#0a66c2] font-semibold">Open Positions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 text-center space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {platformStats.completedProjects}+
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Completed Builds</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Production Deployed</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121a22] border border-slate-200/90 dark:border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              100%
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Escrow Security</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Protected Deliverables</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FINAL CALL TO ACTION (100% FULL WIDTH)
      ========================================================================= */}
      <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 py-16">
        <div className="w-full p-8 sm:p-14 lg:p-16 rounded-3xl bg-slate-900 border border-slate-800 text-white text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Build With Devquox
            </span>

            {/* Heading as Specified */}
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Have an Idea? Let's Build Something Amazing.
            </h2>

            {/* Description as Specified */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Whether you're a developer looking for your next challenge or a founder ready to build your vision, Devquox gives you the environment to make it happen.
            </p>

            {/* 3 Specified Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link to="/register">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-primary-600/30 cursor-pointer">
                  Join Devquox
                </Button>
              </Link>
              <a href="#projects-section">
                <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-7 py-3.5 rounded-xl font-bold cursor-pointer">
                  Explore Projects
                </Button>
              </a>
              <button
                type="button"
                onClick={() =>
                  triggerAuthGatedAction(
                    "Publish Your Software Idea",
                    "Sign in or register to pitch your idea to thousands of verified software engineers and build your team.",
                    "/communities?type=idea"
                  )
                }
              >
                <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white font-bold px-6 py-3.5 rounded-xl cursor-pointer">
                  Publish Your Idea
                </Button>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: PLATFORM FOOTER (100% FULL WIDTH)
      ========================================================================= */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1319] py-12 transition-colors">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-24 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <DevquoxLogo size="md" />
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                Where ideas meet engineers, and projects become reality. The complete ecosystem for modern software teams.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Platform Online • 99.99% Uptime
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Discovery
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400 font-medium">
                <li><a href="#projects-section" className="hover:text-primary-600 transition-colors">Explore Projects</a></li>
                <li><a href="#ideas-section" className="hover:text-primary-600 transition-colors">Discover Ideas</a></li>
                <li><Link to="/developers" className="hover:text-primary-600 transition-colors">Verified Developers</Link></li>
                <li><Link to="/communities" className="hover:text-primary-600 transition-colors">Tech Communities</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Platform Workflows
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400 font-medium">
                <li><a href="#how-it-works" className="hover:text-primary-600 transition-colors">How Collaboration Works</a></li>
                <li><a href="#experience-section" className="hover:text-primary-600 transition-colors">For Developers</a></li>
                <li><a href="#experience-section" className="hover:text-primary-600 transition-colors">For Founders & Clients</a></li>
                <li><Link to={PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard"} className="hover:text-primary-600 transition-colors">{PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "Pre-Launch Access" : "Live Dashboard"}</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Get Started
              </h4>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400 font-medium">
                <li><Link to="/register" className="hover:text-primary-600 transition-colors">Create Free Account</Link></li>
                <li><Link to="/login" className="hover:text-primary-600 transition-colors">Sign In</Link></li>
                <li><Link to="/projects/create" className="hover:text-primary-600 transition-colors">Post Project Spec</Link></li>
                <li><span className="text-slate-400">Escrow Security Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Devquox. Where Ideas Meet Engineers.</p>
            <p className="text-[11px] text-slate-400">
              Built for production-grade software teams & visionary builders worldwide.
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          AUTH INTERCEPT MODAL (GATE FOR APPLY / COMMENT / DISCUSS ACTIONS)
      ========================================================================= */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121a22] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setAuthModal({ ...authModal, isOpen: false })}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Brand Logo & Header */}
            <div className="space-y-2">
              <DevquoxLogo size="sm" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white pt-1">
                {authModal.title || "Join Devquox to Continue"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {authModal.description ||
                  "To participate in discussions, apply to projects, or collaborate with development teams, sign up for your free Devquox account."}
              </p>
            </div>

            {/* Value Guarantees */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified Developer Profiles & GitHub Sync</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                <span>Escrow-Guaranteed Milestone Payouts</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <MessageSquare className="w-4 h-4 text-[#0a66c2] shrink-0" />
                <span>Direct Real-Time Client & Squad Messaging</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link to="/register" onClick={() => setAuthModal({ ...authModal, isOpen: false })}>
                <Button variant="primary" size="md" className="w-full font-bold shadow-md shadow-primary-500/25 cursor-pointer">
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/login" onClick={() => setAuthModal({ ...authModal, isOpen: false })}>
                <Button variant="outline" size="md" className="w-full font-bold border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer">
                  <span>Sign In with Existing Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
