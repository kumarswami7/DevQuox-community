import { useEffect, useState, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { ProjectCard } from "../components/cards/ProjectCard";
import { IdeaCard } from "../components/cards/IdeaCard";
import { DeveloperCard } from "../components/cards/DeveloperCard";
import {
  Briefcase,
  Users,
  FolderGit2,
  Layers,
  TrendingUp,
  Sparkles,
  PlusCircle,
  MessageSquare,
  Compass,
  Activity,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Clock,
  Check,
  X,
  Globe,
  Code2,
  FileText,
  Share2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Rocket,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  Target,
  DollarSign,
  Eye,
  Send,
  Plus,
  BarChart3,
  Flame,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { dashboardService } from "../services/dashboardService";
import { projectService } from "../services/projectService";
import { communityService } from "../services/communityService";
import { PostCard } from "../components/community/PostCard";
import { useAuthStore, useUIStore } from "../store";
import { PRE_LAUNCH_CONFIG } from "../utils/preLaunchConfig";

export const DashboardPage = () => {
  const currentUser = useAuthStore((state) => state.user);

  // Strict Pre-Launch Holding Gate: If pre-launch is active, lock dashboard access
  if (PRE_LAUNCH_CONFIG.isPreLaunchActive(currentUser)) {
    return <Navigate to="/pre-launch" replace />;
  }
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const [summaryData, setSummaryData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Interactive UI States
  const [activeTab, setActiveTab] = useState("feed");
  const [feedFilter, setFeedFilter] = useState("all"); // "all", "projects", "ideas"
  const [feedSortAlgorithm, setFeedSortAlgorithm] = useState("trending"); // "trending" (LinkedIn Algorithm), "recent", "feedback"
  const [projectSearch, setProjectSearch] = useState("");
  const [myHistoryData, setMyHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [actionProcessingId, setActionProcessingId] = useState(null);

  // Idea Pitching Modal States
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaContent, setIdeaContent] = useState("");
  const [ideaTargetAudience, setIdeaTargetAudience] = useState("");
  const [ideaBudget, setIdeaBudget] = useState("");
  const [ideaRoles, setIdeaRoles] = useState([]);
  const [ideaRoleInput, setIdeaRoleInput] = useState("");
  const [ideaFeedbackPrompt, setIdeaFeedbackPrompt] = useState("");
  const [ideaTags, setIdeaTags] = useState(["idea", "brainstorm"]);
  const [ideaTagInput, setIdeaTagInput] = useState("");
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [ideaModalError, setIdeaModalError] = useState("");
  const [ideaAttachments, setIdeaAttachments] = useState([]);

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (ideaAttachments.length >= 5) return;
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isDoc = file.name.endsWith(".doc") || file.name.endsWith(".docx");

      const fileType = isImg ? "image" : isPdf ? "pdf" : isDoc ? "document" : "file";

      const reader = new FileReader();
      reader.onload = () => {
        setIdeaAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            fileType,
            size: file.size,
            url: reader.result,
            previewUrl: isImg ? reader.result : null,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx) => {
    setIdeaAttachments((prev) => prev.filter((_, i) => i !== idx));
  };
  const [ideaSuccessToast, setIdeaSuccessToast] = useState("");

  const handleAddIdeaRole = (e) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = ideaRoleInput.trim();
    if (clean && !ideaRoles.includes(clean) && ideaRoles.length < 5) {
      setIdeaRoles([...ideaRoles, clean]);
      setIdeaRoleInput("");
    }
  };

  const handleRemoveIdeaRole = (roleToRemove) => {
    setIdeaRoles(ideaRoles.filter((r) => r !== roleToRemove));
  };

  const handleAddIdeaTag = (e) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = ideaTagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean && !ideaTags.includes(clean) && ideaTags.length < 5) {
      setIdeaTags([...ideaTags, clean]);
      setIdeaTagInput("");
    }
  };

  const handleRemoveIdeaTag = (tagToRemove) => {
    setIdeaTags(ideaTags.filter((t) => t !== tagToRemove));
  };

  const handlePublishIdea = async (e) => {
    e.preventDefault();
    if (!ideaContent.trim()) {
      setIdeaModalError("Please explain your project idea in detail.");
      return;
    }
    setSubmittingIdea(true);
    setIdeaModalError("");
    try {
      const res = await communityService.createPost({
        postType: "idea",
        title: ideaTitle.trim() || undefined,
        content: ideaContent.trim(),
        tags: ideaTags,
        ideaDetails: {
          targetAudience: ideaTargetAudience.trim(),
          estimatedBudget: ideaBudget.trim(),
          rolesNeeded: ideaRoles,
          feedbackQuestions: ideaFeedbackPrompt.trim() ? [ideaFeedbackPrompt.trim()] : [],
          attachments: ideaAttachments,
          status: "seeking_feedback",
        },
        attachments: ideaAttachments,
      });

      if (res.data?.data) {
        const newPost = res.data.data;
        setPosts((prev) => [newPost, ...prev]);
        setShowIdeaModal(false);
        setIdeaTitle("");
        setIdeaContent("");
        setIdeaTargetAudience("");
        setIdeaBudget("");
        setIdeaRoles([]);
        setIdeaFeedbackPrompt("");
        setIdeaTags(["idea", "brainstorm"]);
        setIdeaAttachments([]);
        setIdeaSuccessToast("🎉 Your idea was successfully shared with the community! Fellow developers can now explore, review, and collaborate.");
        setActiveTab("ideas");
        setTimeout(() => setIdeaSuccessToast(""), 6000);
      }
    } catch (err) {
      setIdeaModalError(err.response?.data?.message || err.message || "Failed to publish idea.");
    } finally {
      setSubmittingIdea(false);
    }
  };

  const role = currentUser?.role || summaryData?.role || "developer";
  const displayName = currentUser?.name || summaryData?.user?.name || "Developer";

  const ideaPosts = useMemo(() => {
    return posts.filter((p) => p.postType === "idea" || p.ideaDetails);
  }, [posts]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await dashboardService.seedDatabase();
      await fetchDashboard(true);
    } catch (err) {
      console.error("Failed to seed real test data:", err);
    } finally {
      setSeeding(false);
    }
  };

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sumRes, anaRes] = await Promise.allSettled([
        dashboardService.getDashboardSummary(),
        dashboardService.getDashboardAnalytics(),
      ]);

      let summary = null;
      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        summary = sumRes.value.data;
        setSummaryData(summary);

        if (Array.isArray(summary.recentProjects) && summary.recentProjects.length > 0) {
          setProjects(summary.recentProjects);
        } else if (Array.isArray(summary.recommendedProjects)) {
          setProjects(summary.recommendedProjects);
        }

        if (Array.isArray(summary.myProjects)) {
          setMyProjects(summary.myProjects);
        }

        if (Array.isArray(summary.talentShowcase)) {
          setDevelopers(summary.talentShowcase);
        }

        if (Array.isArray(summary.recentApplications)) {
          setApplications(summary.recentApplications);
        }

        if (Array.isArray(summary.recentPosts)) {
          setPosts(summary.recentPosts);
        }

        if (Array.isArray(summary.communities)) {
          setCommunities(summary.communities);
        }

        if (Array.isArray(summary.recentActivities)) {
          setActivities(summary.recentActivities);
        }
      }

      if (anaRes.status === "fulfilled" && anaRes.value?.data) {
        setAnalyticsData(anaRes.value.data);
      }

      // Fallback: If projects list is empty, fetch directly via projectService
      if (!summary || !summary.recentProjects || summary.recentProjects.length === 0) {
        try {
          const directProjects = await projectService.getProjects({ limit: 12 });
          const projList = directProjects.data?.projects || directProjects.data || [];
          if (Array.isArray(projList) && projList.length > 0) {
            setProjects(projList);
          }
        } catch (e) {
          console.warn("[DashboardPage] Fallback project fetch warning:", e.message);
        }
      }

      // Fallback: If posts list is empty, fetch directly via communityService
      if (!summary || !summary.recentPosts || summary.recentPosts.length === 0) {
        try {
          const feedRes = await communityService.getFeed({ limit: 10 });
          const feedList = feedRes.data?.data || feedRes.data?.posts || [];
          if (Array.isArray(feedList) && feedList.length > 0) {
            setPosts(feedList);
          }
        } catch (e) {
          console.warn("[DashboardPage] Fallback post fetch warning:", e.message);
        }
      }

      setLastRefreshed(new Date());
    } catch (error) {
      console.error("[DashboardPage] Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await communityService.getMyHistory();
      if (res.data?.data) {
        setMyHistoryData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to load user history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    fetchUserHistory();
  }, [currentUser]);

  // Handle Reviewing Collaborator Join Request / Application
  const handleReviewApplication = async (applicationId, status) => {
    if (!applicationId || actionProcessingId) return;
    setActionProcessingId(applicationId);

    try {
      await dashboardService.updateQuickAction({
        actionType: "review_application",
        entityId: applicationId,
        status,
      });

      setApplications((prev) =>
        prev.map((app) =>
          (app._id || app.id) === applicationId ? { ...app, status } : app
        )
      );
    } catch (err) {
      console.error("[DashboardPage] Error updating application status:", err);
    } finally {
      setActionProcessingId(null);
    }
  };

  // Filtered Projects for Community Feed
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !projectSearch.trim() ||
        (p.title && p.title.toLowerCase().includes(projectSearch.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase())) ||
        (Array.isArray(p.requiredSkills) &&
          p.requiredSkills.some((s) => s.toLowerCase().includes(projectSearch.toLowerCase()))) ||
        (Array.isArray(p.tags) &&
          p.tags.some((t) => t.toLowerCase().includes(projectSearch.toLowerCase())));

      const matchCategory =
        selectedCategory === "all" ||
        (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchSearch && matchCategory;
    });
  }, [projects, projectSearch, selectedCategory]);

  // Mixed feed: projects and idea posts TRULY RANDOMIZED (not 1:1 alternating)
  const mixedFeed = useMemo(() => {
    // 1. Map all projects
    const projectItems = projects.map((p) => ({
      feedType: "project",
      data: p,
      id: p._id || p.id,
      title: p.title || "",
      description: p.description || "",
      tags: p.tags || [],
      skills: p.requiredSkills || [],
    }));

    // 2. Map all idea posts
    const ideaItems = ideaPosts.map((i) => ({
      feedType: "idea",
      data: i,
      id: i._id || i.id,
      title: i.title || "",
      description: i.content || "",
      tags: i.tags || [],
      skills: i.ideaDetails?.rolesNeeded || [],
    }));

    // Combine all
    const allItems = [...projectItems, ...ideaItems];

    // LinkedIn-style Telemetry & Engagement Algorithm Calculation
    const calculateScore = (item) => {
      const upvotes = item.data?.upvotes || item.data?.likes?.length || 0;
      const comments = item.data?.commentsCount || item.data?.commentCount || 0;
      const impressions = item.data?.impressionsCount || (item.feedType === "project" ? 120 : 60);
      const clicks = item.data?.clicksCount || 0;
      const created = item.data?.createdAt ? new Date(item.data.createdAt).getTime() : Date.now();
      const hoursSince = Math.max(1, (Date.now() - created) / (1000 * 60 * 60));
      const recencyBoost = Math.max(0, 50 - hoursSince * 0.4);
      return impressions * 0.2 + upvotes * 4.0 + comments * 6.0 + clicks * 2.0 + recencyBoost;
    };

    let sorted = [...allItems];
    if (feedSortAlgorithm === "trending") {
      // Trending via LinkedIn-style Algorithm score
      sorted.sort((a, b) => calculateScore(b) - calculateScore(a));
    } else if (feedSortAlgorithm === "recent") {
      // Newest first
      sorted.sort((a, b) => {
        const dateA = a.data?.createdAt ? new Date(a.data.createdAt).getTime() : 0;
        const dateB = b.data?.createdAt ? new Date(b.data.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (feedSortAlgorithm === "feedback") {
      // Most commented/reviewed
      sorted.sort((a, b) => {
        const countA = a.data?.commentsCount || a.data?.commentCount || 0;
        const countB = b.data?.commentsCount || b.data?.commentCount || 0;
        return countB - countA;
      });
    }

    // Apply search filter if user types query
    if (!projectSearch.trim()) {
      return sorted;
    }

    const q = projectSearch.toLowerCase().trim();
    return randomized.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q))) ||
        (Array.isArray(item.skills) && item.skills.some((s) => s.toLowerCase().includes(q)))
      );
    });
  }, [projects, ideaPosts, projectSearch, feedSortAlgorithm]);

  // Filtered Applications for My Projects
  const filteredApplications = useMemo(() => {
    if (applicationFilter === "all") return applications;
    return applications.filter((app) => app.status === applicationFilter);
  }, [applications, applicationFilter]);

  const stats = summaryData?.stats || {};
  const completeness = summaryData?.completeness || { score: 100, missingTips: [] };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Idea Published Success Toast */}
      {ideaSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{ideaSuccessToast}</span>
          </div>
          <button onClick={() => setIdeaSuccessToast("")} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LINKEDIN-STYLE QUICK PROJECT & POST LAUNCHER BAR */}
      {/* ========================================================================= */}
      <Card className="glass-card p-4 border-slate-200/90 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Avatar
            src={currentUser?.avatar || summaryData?.user?.avatar}
            name={displayName}
            size="md"
          />
          <Link
            to="/projects/create"
            className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors flex items-center gap-2 border border-slate-200/80 dark:border-slate-700/80"
          >
            <PlusCircle className="w-4 h-4 text-primary-500" />
            <span>Have a project idea, open-source build, or seeking collaborators? Post a project...</span>
          </Link>
        </div>

        <div className="flex items-center justify-around mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setShowIdeaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 hover:text-amber-600 transition-colors font-bold"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Post Your Idea</span>
          </button>

          <Link
            to="/projects/create"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-primary-500/10 hover:text-primary-500 transition-colors font-semibold"
          >
            <FolderGit2 className="w-4 h-4 text-primary-500" />
            <span>Post Project</span>
          </Link>

          <Link
            to="/discover-projects"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-accent-500/10 hover:text-accent-500 transition-colors font-semibold"
          >
            <Sparkles className="w-4 h-4 text-accent-500" />
            <span>Discover Ideas</span>
          </Link>

          <Link
            to="/developers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors font-semibold"
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Find Collaborators</span>
          </Link>

          <Link
            to="/communities"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors font-semibold"
          >
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>Tech Hubs</span>
          </Link>
        </div>
      </Card>



      {/* ========================================================================= */}
      {/* 4. CENTRAL INTERACTIVE HUB (Projects, My Projects, Developers, Communities) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Tab Content Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-9 h-9 text-primary-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Fetching real-time data from MongoDB Atlas...</p>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: COMMUNITY PROJECTS FEED */}
            {/* ========================================================= */}
            {activeTab === "feed" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Clean Search Bar (Filters removed per user request) */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search community projects and idea pitches by keyword, tech stack or title..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                  />
                  {projectSearch && (
                    <button
                      onClick={() => setProjectSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mixed Stream Grid: Interleaved Projects & Idea Pitches */}
                {mixedFeed.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {mixedFeed.map((item) => {
                      if (item.feedType === "idea") {
                        return (
                          <IdeaCard
                            key={`idea-${item.id}`}
                            idea={item.data}
                            onIdeaUpdated={(updated) =>
                              setPosts((prev) =>
                                prev.map((p) =>
                                  (p._id || p.id) === (updated._id || updated.id) ? updated : p
                                )
                              )
                            }
                            onIdeaDeleted={(deletedId) =>
                              setPosts((prev) =>
                                prev.filter((p) => (p._id || p.id) !== deletedId)
                              )
                            }
                          />
                        );
                      }

                      return (
                        <ProjectCard
                          key={`project-${item.id}`}
                          project={item.data}
                          onProjectUpdated={(updated) =>
                            setProjects((prev) =>
                              prev.map((p) =>
                                (p._id || p.id) === (updated._id || updated.id) ? updated : p
                              )
                            )
                          }
                          onProjectDeleted={(deletedId) =>
                            setProjects((prev) =>
                              prev.filter((p) => (p._id || p.id) !== deletedId)
                            )
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-6 border-slate-200/90 dark:border-slate-800/80">
                    <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No community projects or idea pitches match your filter.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProjectSearch("");
                          setSelectedCategory("all");
                          setFeedFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowIdeaModal(true)}
                        className="gap-1 text-amber-700 dark:text-amber-300 border-amber-500/40"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Post Your Idea</span>
                      </Button>
                      <Link to="/projects/create">
                        <Button variant="accent" size="sm" className="gap-1.5">
                          <PlusCircle className="w-4 h-4" />
                          <span>Post New Project</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: COMMUNITY PROJECT IDEAS & PITCHES */}
            {/* ========================================================= */}
            {activeTab === "ideas" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Community Project Ideas & Early Pitches ({ideaPosts.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Raw concepts, feature brainstorms, and early pitches seeking community feedback, architectural review, and co-builders
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowIdeaModal(true)}
                      className="text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post Your Idea</span>
                    </Button>
                    <Link to="/communities">
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <span>Explore All Hubs ↗</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Ideas Reach & Feedback Metrics Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-slate-900 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Ideas Pitched</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">{ideaPosts.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Feedback & Reviews</span>
                    <span className="text-xl font-black text-primary-500">
                      {ideaPosts.reduce((acc, p) => acc + (p.commentsCount || p.commentCount || 0), 0)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Reactions & Support</span>
                    <span className="text-xl font-black text-rose-500">
                      {ideaPosts.reduce((acc, p) => acc + (p.likeCount || p.upvotes || 0), 0)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Converted to Projects</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {ideaPosts.filter((p) => p.convertedToProject).length}
                    </span>
                  </div>
                </div>

                {/* Ideas Feed */}
                {ideaPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {ideaPosts.map((idea) => (
                      <IdeaCard
                        key={idea._id || idea.id}
                        idea={idea}
                        onIdeaUpdated={(updated) =>
                          setPosts((prev) =>
                            prev.map((p) =>
                              (p._id || p.id) === (updated._id || updated.id) ? updated : p
                            )
                          )
                        }
                        onIdeaDeleted={(deletedId) =>
                          setPosts((prev) =>
                            prev.filter((p) => (p._id || p.id) !== deletedId)
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-6 border-slate-200/90 dark:border-slate-800/80">
                    <Lightbulb className="w-12 h-12 text-amber-500/40 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No project ideas pitched yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Have an app, startup, or open-source idea? Pitch it to the community to validate demand, receive constructive feedback, and find passionate co-developers!
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowIdeaModal(true)}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>Pitch Your First Idea</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: MY POSTS & IDEAS HISTORY WITH LINKEDIN ANALYTICS */}
            {/* ========================================================= */}
            {activeTab === "history" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span>My Pitched Ideas & Posts History ({myHistoryData?.stats?.totalPosts || 0})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track reach, profile views, feedback reviews, and launch your ideas into verified community projects
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/analytics">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Dedicated Analytics Studio</span>
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowIdeaModal(true)}
                      className="text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post New Idea</span>
                    </Button>
                  </div>
                </div>

                {/* LinkedIn-style Analytics Hero Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/40">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      Total Impressions
                    </span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                      <Eye className="w-4 h-4 text-blue-500" />
                      {myHistoryData?.stats?.totalImpressions || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      Unique Viewers
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <Users className="w-4 h-4 text-primary-500" />
                      {myHistoryData?.stats?.totalViews || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      Reviews & Feedback
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      {myHistoryData?.stats?.totalComments || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      Engagement Rate
                    </span>
                    <span className="text-xl font-black text-primary-500 flex items-center gap-1.5 mt-0.5">
                      <TrendingUp className="w-4 h-4 text-primary-500" />
                      {myHistoryData?.stats?.averageEngagementRate || "0%"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      Launched Projects
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Rocket className="w-4 h-4 text-emerald-500" />
                      {myHistoryData?.stats?.convertedCount || 0}
                    </span>
                  </div>
                </div>

                {/* History Items Feed */}
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-2">
                    <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
                    <p className="text-xs text-slate-400">Loading your post analytics & history...</p>
                  </div>
                ) : myHistoryData?.posts && myHistoryData.posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {myHistoryData.posts.map((post) => (
                      <IdeaCard
                        key={post._id || post.id}
                        idea={post}
                        onIdeaUpdated={(updated) => {
                          setMyHistoryData((prev) => ({
                            ...prev,
                            posts: (prev?.posts || []).map((p) =>
                              (p._id || p.id) === (updated._id || updated.id) ? updated : p
                            ),
                          }));
                          fetchDashboard();
                        }}
                        onIdeaDeleted={(deletedId) => {
                          setMyHistoryData((prev) => ({
                            ...prev,
                            posts: (prev?.posts || []).filter((p) => (p._id || p.id) !== deletedId),
                          }));
                          fetchDashboard();
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-6 border-slate-200/90 dark:border-slate-800/80">
                    <BarChart3 className="w-12 h-12 text-blue-500/30 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No posts or ideas published yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Pitch an innovative concept, feature idea, or architectural question. Once posted, you will be able to track live impressions, reader engagement, and convert it into a real project posting!
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowIdeaModal(true)}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Your First Idea</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: COMMUNITY DISCUSSIONS & POSTS */}
            {/* ========================================================= */}
            {activeTab === "posts" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Community Discussions & Engineering Updates ({posts.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time technical discussions, architecture write-ups, and developer showcases
                    </p>
                  </div>
                  <Link to="/communities">
                    <Button variant="accent" size="sm" className="text-xs gap-1.5 shadow-glow-accent">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Start a Discussion</span>
                    </Button>
                  </Link>
                </div>

                {posts.length > 0 ? (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id || post.id}
                        post={post}
                        currentUserId={currentUser?._id || currentUser?.id}
                        currentUserRole={currentUser?.role}
                        onPostUpdated={(updated) =>
                          setPosts((prev) =>
                            prev.map((p) =>
                              (p._id || p.id) === (updated._id || updated.id) ? updated : p
                            )
                          )
                        }
                        onPostDeleted={(deletedId) =>
                          setPosts((prev) =>
                            prev.filter((p) => (p._id || p.id) !== deletedId)
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-6 border-slate-200/90 dark:border-slate-800/80">
                    <MessageSquare className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No community posts found.
                    </p>
                    <Link to="/communities">
                      <Button variant="accent" size="sm" className="gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        <span>Be the First to Post</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: MY PROJECTS & COLLABORATOR REQUESTS */}
            {/* ========================================================= */}
            {activeTab === "my-projects" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Projects Created By User */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Projects Created by You ({myProjects.length})
                      </h3>
                      <p className="text-xs text-slate-500">Projects you posted for community collaboration</p>
                    </div>

                    <Link to="/projects/create">
                      <Button size="sm" variant="accent" className="gap-1.5 text-xs">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Post New Project</span>
                      </Button>
                    </Link>
                  </div>

                  {myProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myProjects.map((proj) => (
                        <Card
                          key={proj._id || proj.id}
                          className="glass-card p-5 border-slate-200/90 dark:border-slate-800/80 space-y-3 hover:border-primary-500/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                to={`/projects/${proj._id || proj.id}`}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors"
                              >
                                {proj.title}
                              </Link>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {proj.description}
                              </p>
                            </div>
                            <Badge variant={proj.status === "open" ? "success" : "default"}>
                              {proj.status || "open"}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                            {proj.requiredSkills?.slice(0, 4).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-400">
                              Category: <strong className="text-slate-700 dark:text-slate-300">{proj.category || "General"}</strong>
                            </span>
                            <Link to={`/projects/${proj._id || proj.id}`}>
                              <Button size="sm" variant="ghost" className="text-xs h-7">
                                View Project
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card p-8 text-center space-y-3 border-slate-200/90 dark:border-slate-800/80">
                      <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        You haven't posted any projects yet.
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Share your startup build, open-source repository, or hackathon idea and invite other developers to collaborate!
                      </p>
                      <Link to="/projects/create">
                        <Button variant="accent" size="sm" className="gap-2">
                          <PlusCircle className="w-4 h-4" />
                          <span>Post Your First Project</span>
                        </Button>
                      </Link>
                    </Card>
                  )}
                </div>

                {/* 2. Collaborator Requests / Applications Received */}
                <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Collaborator Requests & Applications ({applications.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Developers who requested to join or collaborate on projects
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {["all", "pending", "accepted", "rejected"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setApplicationFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                            applicationFilter === st
                              ? "bg-primary-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredApplications.length > 0 ? (
                    <div className="space-y-3">
                      {filteredApplications.map((app) => {
                        const appId = app._id || app.id;
                        const proj = app.project || {};
                        const applicant = app.applicant || {};
                        const isPending = !app.status || app.status === "pending";

                        return (
                          <Card
                            key={appId}
                            className="glass-card p-4 hover:border-primary-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-slate-200/90 dark:border-slate-800/80"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              <Avatar
                                src={applicant.avatar}
                                name={applicant.name || "Developer"}
                                size="md"
                              />

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {applicant.name || "Developer"}
                                  </span>
                                  <span className="text-xs text-slate-400">applied to collaborate on</span>
                                  <Link
                                    to={`/projects/${proj._id || proj.id || proj}`}
                                    className="text-xs font-bold text-primary-500 hover:underline"
                                  >
                                    {proj.title || "Project"}
                                  </Link>
                                  <Badge
                                    variant={
                                      app.status === "accepted"
                                        ? "success"
                                        : app.status === "rejected"
                                        ? "danger"
                                        : "accent"
                                    }
                                  >
                                    {app.status || "Pending Review"}
                                  </Badge>
                                </div>

                                {app.coverLetter && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                    "{app.coverLetter}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: 1-click Accept / Decline */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={actionProcessingId === appId}
                                    onClick={() => handleReviewApplication(appId, "accepted")}
                                    className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionProcessingId === appId}
                                    onClick={() => handleReviewApplication(appId, "rejected")}
                                    className="text-xs h-8 gap-1 text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Decline</span>
                                  </Button>
                                </>
                              )}

                              <Link to="/messages">
                                <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Message</span>
                                </Button>
                              </Link>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No collaborator requests in this filter.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: DEVELOPER NETWORK */}
            {/* ========================================================= */}
            {activeTab === "talent" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Connect with Developers & Creators
                    </h3>
                    <p className="text-xs text-slate-500">
                      Discover engineers to team up with for your next project or startup
                    </p>
                  </div>
                  <Link to="/developers">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <span>View All Developers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {developers.length > 0 ? (
                    developers.map((dev) => (
                      <DeveloperCard
                        key={dev._id || dev.id}
                        developer={{
                          _id: dev._id || dev.id,
                          id: dev._id || dev.id,
                          userId: dev.userId || dev.user?._id || dev._id || dev.id,
                          name: dev.user?.name || dev.name || "Software Architect",
                          avatar: dev.user?.avatar || dev.avatar,
                          title: dev.title || "Full Stack & Cloud Engineer",
                          about: dev.about || "Passionate engineer delivering high-scale systems and microservices.",
                          availability: dev.availability || "Available",
                          rating: dev.rating || 5,
                          skills: dev.skills && dev.skills.length > 0 ? dev.skills : ["React", "Node.js", "MongoDB", "TypeScript"],
                          techStack: dev.techStack || ["AWS", "Docker"],
                          followersCount: dev.followersCount || 0,
                          followingCount: dev.followingCount || 0,
                          completedProjects: dev.completedProjectsCount || 3,
                          portfolio: dev.portfolio || [],
                          experience: dev.experience || [],
                          education: dev.education || [],
                          certifications: dev.certifications || [],
                          reviews: dev.reviews || [],
                          achievements: dev.achievements || [],
                          recentActivity: dev.recentActivity || [],
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 col-span-2 text-center py-12">
                      No developer profiles found.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: TECH COMMUNITIES & HUBS */}
            {/* ========================================================= */}
            {activeTab === "communities" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Explore Tech Communities & Hubs
                    </h3>
                    <p className="text-xs text-slate-500">
                      Join discussions, share code, and collaborate in specialized domain groups
                    </p>
                  </div>
                  <Link to="/communities">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <span>Browse All Hubs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(communities.length > 0
                    ? communities
                    : [
                        { name: "Web Development Hub", topic: "React, Node.js, Next.js & modern UI", membersCount: 142, icon: "🌐" },
                        { name: "AI & Machine Learning", topic: "LLMs, PyTorch, LangChain & agentic systems", membersCount: 98, icon: "🧠" },
                        { name: "Cloud & DevOps Guild", topic: "Docker, Kubernetes, AWS & CI/CD", membersCount: 76, icon: "☁️" },
                        { name: "Mobile App Creators", topic: "React Native, Flutter & mobile UX", membersCount: 65, icon: "📱" },
                        { name: "Open Source Builders", topic: "Contribute to libraries and repositories", membersCount: 110, icon: "🚀" },
                        { name: "Cybersecurity & Web3", topic: "Smart contracts, auth & cloud security", membersCount: 52, icon: "🛡️" },
                      ]
                  ).map((hub, idx) => (
                    <Card
                      key={idx}
                      className="glass-card p-5 border-slate-200/90 dark:border-slate-800/80 hover:border-primary-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{hub.icon || "💻"}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/10 text-primary-500">
                            {hub.membersCount || 80}+ Members
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {hub.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {hub.description || hub.topic || "Connect and discuss latest innovations with domain peers."}
                        </p>
                      </div>

                      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Link to="/communities" className="w-full">
                          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                            <span>Join Discussion</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: LIVE ACTIVITY STREAM */}
            {/* ========================================================= */}
            {activeTab === "activity" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {activities.length > 0 ? (
                  activities.map((act, index) => (
                    <Card
                      key={act._id || index}
                      className="glass-card p-4 flex items-center justify-between gap-4 border-slate-200/90 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={act.user?.avatar}
                          name={act.user?.name || "Member"}
                          size="md"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            <span className="font-bold text-primary-500">{act.user?.name || "Member"}</span>{" "}
                            {act.action?.replace(/_/g, " ")} on{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {act.project?.title || "Community Project"}
                            </span>
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {act.action || "Community Event"}
                      </span>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-6 border-slate-200/90 dark:border-slate-800/80">
                    <Activity className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No recent activities recorded yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM ECOSYSTEM BREAKDOWN */}
      {/* ========================================================================= */}
      {analyticsData && analyticsData.categoryDistribution?.length > 0 && (
        <Card className="glass-card p-6 border-slate-200/90 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Platform Ecosystem Breakdown
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">Real-time Metrics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {analyticsData.categoryDistribution.map((cat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
                  {cat.category}
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {cat.count}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, cat.count * 15)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* POST YOUR IDEA MODAL */}
      {/* ========================================================================= */}
      {(showIdeaModal || activeModal === "idea_modal") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-6 rounded-3custom bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => { setShowIdeaModal(false); closeModal(); }}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Post Your Project Idea & Pitch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share your raw concept with the DevConnect community to get feedback, review feasibility, and find co-builders.
                </p>
              </div>
            </div>

            {ideaModalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {ideaModalError}
              </div>
            )}

            <form onSubmit={handlePublishIdea} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Idea Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Freelance Invoicing & Tax Estimator"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Explain Your Idea & Problem Solved <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="What is the concept? What pain point does it solve? What features should it have? Invite developers to review and share thoughts..."
                  value={ideaContent}
                  onChange={(e) => setIdeaContent(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                />
              </div>

              {/* Document / Mockup / Image Attachments (Replaces Budget, Audience, Roles) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                    <span>Attach Documents or Mockups (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF, DOC, DOCX, PNG, JPG (Max 5 files)</span>
                </label>

                {/* Upload Dropzone Button */}
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/70 dark:bg-slate-800/50 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <UploadCloud className="w-4 h-4 text-amber-500" />
                  <span>Upload specification documents, PDF proposals, or design mockups</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileAttach}
                    className="hidden"
                  />
                </label>

                {/* Attachments Preview Grid */}
                {ideaAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {ideaAttachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {file.fileType === "image" ? (
                            file.previewUrl ? (
                              <img src={file.previewUrl} alt="preview" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                            )
                          ) : (
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px] max-w-[140px]">
                              {file.name}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {file.fileType} • {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 hover:text-rose-500 text-slate-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Questions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  💡 What review or feedback do you want from developers? (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Would you use this? What tech stack would you recommend? Is scope realistic?"
                  value={ideaFeedbackPrompt}
                  onChange={(e) => setIdeaFeedbackPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {ideaTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveIdeaTag(tag)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {ideaTags.length < 5 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. ai, saas, mobile)..."
                      value={ideaTagInput}
                      onChange={(e) => setIdeaTagInput(e.target.value)}
                      onKeyDown={handleAddIdeaTag}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddIdeaTag}
                      className="text-xs"
                    >
                      Add Tag
                    </Button>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowIdeaModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingIdea || !ideaContent.trim()}
                  isLoading={submittingIdea}
                  className="gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-primary-600 hover:from-amber-600 hover:to-primary-700 text-white font-bold shadow-md shadow-amber-500/20"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Share Idea to Community</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
