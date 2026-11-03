import React, { useState, useEffect, useRef } from "react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ShareModal } from "../ui/ShareModal";
import { TechnologyIcon } from "../skills/TechnologyIcon";
import {
  Bookmark,
  Clock,
  Users,
  DollarSign,
  Award,
  ArrowUpRight,
  Sparkles,
  Send,
  X,
  Check,
  MessageSquare,
  Repeat2,
  Share2,
  Eye,
  CheckCircle2,
  MoreVertical,
  BarChart3,
  Edit3,
  Trash2,
  Flag,
  Github,
  ExternalLink,
  Briefcase,
  Lightbulb,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { projectService } from "../../services/projectService";
import { useAuthStore, useProjectStore } from "../../store";
import { ProjectReactionPicker, REACTION_CONFIG } from "../feed/ProjectReactionPicker";
import { ProjectCommentSection } from "../feed/ProjectCommentSection";
import { ProjectRepostModal } from "../feed/ProjectRepostModal";
import { ProjectAnalyticsModal } from "../feed/ProjectAnalyticsModal";
import { ReportDialog } from "../community/ReportDialog";

export const ProjectCard = ({ project, onProjectUpdated, onProjectDeleted }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toggleStoreBookmark = useProjectStore((state) => state.toggleBookmark);

  const projectId = project._id || project.id;
  const isClient = currentUser?.role === "client";
  const owner = project.owner || {};
  const ownerId = owner._id || owner.id;
  const ownerRole = (owner.role || "").toLowerCase();
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwner = currentUser && String(ownerId) === String(currentUserId);
  const isAcceptedMember =
    (Array.isArray(project.members) &&
      project.members.some(
        (m) =>
          String(m.user?._id || m.user || m) === String(currentUserId) &&
          (m.status === "active" || !m.status)
      )) ||
    project.myApplication?.status === "accepted" ||
    project.isMember === true;
  const canAccessProjectChat = Boolean(isOwner || isAcceptedMember);
  const isAdmin = currentUser?.role === "admin";

  // Engagement state
  const [userReaction, setUserReaction] = useState(project.userReaction || null);
  const [reactionsCount, setReactionsCount] = useState(Number(project.reactionsCount) || 0);
  const [reactionBreakdown, setReactionBreakdown] = useState(project.reactionBreakdown || {});
  const [commentsCount, setCommentsCount] = useState(Number(project.commentsCount) || 0);
  const [repostsCount, setRepostsCount] = useState(Number(project.repostsCount) || 0);
  const [hasReposted, setHasReposted] = useState(!!project.hasReposted);
  const [viewsCount, setViewsCount] = useState(Number(project.viewsCount) || 0);
  const [isBookmarked, setIsBookmarked] = useState(!!project.isBookmarked);

  // UI state
  const [showComments, setShowComments] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [proposedRate, setProposedRate] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // View tracking guard: track only once per mount
  const hasTrackedViewRef = useRef(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!hasTrackedViewRef.current && projectId) {
      hasTrackedViewRef.current = true;
      projectService
        .trackProjectView(projectId)
        .then((res) => {
          if (res.data?.viewsCount) {
            setViewsCount(res.data.viewsCount);
          }
        })
        .catch(() => {});
    }
  }, [projectId]);

  // Sync state if project prop updates
  useEffect(() => {
    if (project.userReaction !== undefined) setUserReaction(project.userReaction);
    if (project.reactionsCount !== undefined) setReactionsCount(Number(project.reactionsCount) || 0);
    if (project.reactionBreakdown) setReactionBreakdown(project.reactionBreakdown);
    if (project.commentsCount !== undefined) setCommentsCount(Number(project.commentsCount) || 0);
    if (project.repostsCount !== undefined) setRepostsCount(Number(project.repostsCount) || 0);
    if (project.hasReposted !== undefined) setHasReposted(!!project.hasReposted);
    if (project.isBookmarked !== undefined) setIsBookmarked(!!project.isBookmarked);
  }, [project]);

  // Bookmark toggle with optimistic update & rollback
  const handleToggleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);
    toggleStoreBookmark(projectId);

    try {
      if (previousState) {
        await projectService.unbookmarkProject(projectId);
      } else {
        await projectService.bookmarkProject(projectId);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      setIsBookmarked(previousState);
      toggleStoreBookmark(projectId);
    }
  };

  // Reaction select with optimistic update & rollback
  const handleSelectReaction = async (type) => {
    if (!isAuthenticated) return;
    const prevReaction = userReaction;
    const prevCount = reactionsCount;
    const prevBreakdown = { ...reactionBreakdown };

    // Optimistic calculation
    const isSwitching = prevReaction && prevReaction !== type;
    const newCount = prevReaction ? prevCount : prevCount + 1;
    const newBreakdown = { ...prevBreakdown };
    if (prevReaction) newBreakdown[prevReaction] = Math.max(0, (newBreakdown[prevReaction] || 1) - 1);
    newBreakdown[type] = (newBreakdown[type] || 0) + 1;

    setUserReaction(type);
    setReactionsCount(newCount);
    setReactionBreakdown(newBreakdown);

    try {
      const res = await projectService.reactToProject(projectId, type);
      if (res.data) {
        setUserReaction(res.data.userReaction);
        setReactionsCount(res.data.reactionsCount ?? newCount);
        if (res.data.reactionBreakdown) setReactionBreakdown(res.data.reactionBreakdown);
      }
    } catch (err) {
      console.error("Reaction failed:", err);
      setUserReaction(prevReaction);
      setReactionsCount(prevCount);
      setReactionBreakdown(prevBreakdown);
    }
  };

  // Reaction remove with optimistic update & rollback
  const handleRemoveReaction = async () => {
    if (!isAuthenticated || !userReaction) return;
    const prevReaction = userReaction;
    const prevCount = reactionsCount;
    const prevBreakdown = { ...reactionBreakdown };

    const newCount = Math.max(0, prevCount - 1);
    const newBreakdown = { ...prevBreakdown };
    if (prevReaction) newBreakdown[prevReaction] = Math.max(0, (newBreakdown[prevReaction] || 1) - 1);

    setUserReaction(null);
    setReactionsCount(newCount);
    setReactionBreakdown(newBreakdown);

    try {
      const res = await projectService.removeReaction(projectId);
      if (res.data) {
        setUserReaction(null);
        setReactionsCount(res.data.reactionsCount ?? newCount);
        if (res.data.reactionBreakdown) setReactionBreakdown(res.data.reactionBreakdown);
      }
    } catch (err) {
      console.error("Remove reaction failed:", err);
      setUserReaction(prevReaction);
      setReactionsCount(prevCount);
      setReactionBreakdown(prevBreakdown);
    }
  };

  // Share Modal handler
  const handleShare = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowShareModal(true);
  };

  // Quick Apply submit
  const handleQuickApply = async (e) => {
    e.preventDefault();
    setIsApplying(true);
    try {
      await projectService.applyToProject(projectId, {
        proposedRate: proposedRate || "Standard Rate",
        coverLetter: coverNote || "Excited to build this project with your team!",
      });
      setApplied(true);
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (err) {
      console.error(err);
      setApplied(true);
      setTimeout(() => setIsModalOpen(false), 1200);
    } finally {
      setIsApplying(false);
    }
  };

  // Delete project handler
  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await projectService.deleteProject(projectId);
      if (onProjectDeleted) onProjectDeleted(projectId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete project");
    }
  };

  const ownerName = owner.name || "Project Owner";
  const ownerHeadline = owner.headline || "Verified Project Lead";
  const ownerAvatar = owner.avatar || owner.avatarUrl;
  const postedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Recent";

  // Compute top reaction emojis for visual summary pill
  const activeReactionEntries = Object.entries(reactionBreakdown).filter(([_, count]) => count > 0);
  const topEmojis = activeReactionEntries
    .slice(0, 3)
    .map(([type]) => REACTION_CONFIG[type]?.emoji || "👍");

  return (
    <>
      <Card className="glass-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden border-slate-200/90 dark:border-slate-800/80 shadow-md hover:shadow-glow-subtle p-5">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

        {/* Repost Attribution Banner */}
        {project.repostInfo && (
          <div className="flex items-center gap-2 px-3 py-1.5 -mt-2 -mx-2 mb-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium rounded-xl">
            <Repeat2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              <strong>{project.repostInfo.repostedBy?.name || "A developer"}</strong> reposted
              {project.repostInfo.isQuote && project.repostInfo.commentary && (
                <span className="italic text-slate-600 dark:text-slate-300 ml-1">
                  "{project.repostInfo.commentary}"
                </span>
              )}
            </span>
          </div>
        )}

        <div className="space-y-3.5">
          {/* Header Row: Owner Avatar & Info, Status Pill, Bookmark, More Menu */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link to={ownerId ? `/profile/${ownerId}` : "#"} onClick={(e) => e.stopPropagation()}>
                <Avatar src={ownerAvatar} name={ownerName} size="md" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to={ownerId ? `/profile/${ownerId}` : "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate"
                  >
                    {ownerName}
                  </Link>
                  {/* Creator Role Badge: Client/Founder vs Developer */}
                  {ownerRole === "client" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                      <Briefcase className="w-2.5 h-2.5" />
                      <span>Client / Founder</span>
                    </span>
                  ) : ownerRole === "developer" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                      <span>💻 Developer</span>
                    </span>
                  ) : ownerRole ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                      <span>{ownerRole}</span>
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {ownerHeadline} • <span className="font-medium">{postedDate}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {project.originIdeaPost && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800" title="Project launched from a Community Idea & Pitch">
                  <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                  <span>Idea</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {project.status === "in_progress"
                  ? "In Progress"
                  : project.status === "completed"
                  ? "Completed"
                  : "Hiring"}
              </span>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                title={isBookmarked ? "Remove Bookmark" : "Save Project"}
                aria-label={isBookmarked ? "Remove from bookmarks" : "Bookmark project"}
              >
                <Bookmark
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isBookmarked ? "fill-amber-500 text-amber-500" : ""
                  }`}
                />
              </button>

              {/* 3-Dots Overflow Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="More actions"
                  aria-label="More project options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {(isOwner || isAdmin) && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setShowAnalyticsModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-primary-500" />
                          <span>Project Analytics</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate(`/projects/${projectId}`);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Manage / Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            handleDeleteProject();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Project</span>
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpen(false);
                        handleShare(e);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowReportDialog(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Report Project</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Title & Link */}
          <div>
            <Link to={`/projects/${projectId}`} className="block group/title">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover/title:text-primary-500 transition-colors line-clamp-1 flex items-center justify-between">
                <span>{project.title}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/title:text-primary-500 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
              </h3>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Skill Matching Pill (if authenticated & matching score available) */}
          {project.matchingScore && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent-500/10 border border-accent-500/20 text-[11px] font-bold text-accent-600 dark:text-accent-400">
              <Sparkles className="w-3.5 h-3.5 text-accent-500 shrink-0" />
              <span>{project.matchingScore.matchPercentage}% Skill Match</span>
              {project.matchingScore.matchedSkills?.length > 0 && (
                <span className="text-slate-400 font-normal truncate">
                  ({project.matchingScore.matchedSkills.slice(0, 3).join(", ")})
                </span>
              )}
            </div>
          )}

          {/* Required Skills Badges */}
          <div className="flex flex-wrap gap-1.5">
            {(project.requiredSkills || []).slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50"
              >
                <TechnologyIcon name={skill} size="xs" />
                <span>{skill}</span>
              </span>
            ))}
            {(project.requiredSkills || []).length > 5 && (
              <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400">
                +{(project.requiredSkills || []).length - 5} more
              </span>
            )}
          </div>

          {/* External Repos & Demos */}
          {(project.githubRepoUrl || project.liveDemoUrl) && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {project.githubRepoUrl && (
                <a
                  href={project.githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-primary-500 hover:border-primary-500/50 transition-colors shadow-2xs"
                >
                  <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span>GitHub Repo</span>
                </a>
              )}
              {project.liveDemoUrl && (
                <a
                  href={project.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          )}

          {/* Metadata Quad-Grid: Budget, Duration, Seniority, Team Capacity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3 border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {project.budget || "Negotiable / Flexible"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate">{project.duration || "1 - 2 Months"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="capitalize truncate">
                {project.experienceLevel === "all" ? "All Levels" : (project.experienceLevel || "All Levels")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                {project.acceptedApplicantsCount || 0}/{project.teamSize || 1} seats filled
              </span>
            </div>
          </div>
        </div>

        {/* Engagement Summary Counts Bar */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            {reactionsCount > 0 ? (
              <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex -space-x-1 select-none">
                  {topEmojis.map((emoji, idx) => (
                    <span key={idx} className="text-xs">
                      {emoji}
                    </span>
                  ))}
                </span>
                <span>{reactionsCount}</span>
              </span>
            ) : (
              <span>Be the first to react</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="hover:text-primary-500 transition-colors"
            >
              {commentsCount} comments
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowRepostModal(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              {repostsCount} reposts
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewsCount} views
            </span>
          </div>
        </div>

        {/* Engagement Actions Row */}
        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            {/* Reaction Picker */}
            <ProjectReactionPicker
              userReaction={userReaction}
              onSelectReaction={handleSelectReaction}
              onRemoveReaction={handleRemoveReaction}
              disabled={!isAuthenticated}
            />

            {/* Comment Trigger */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                showComments
                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comment</span>
            </button>

            {/* Repost Trigger */}
            <button
              type="button"
              onClick={() => setShowRepostModal(true)}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hasReposted
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              } ${!isAuthenticated ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Repeat2 className="w-4 h-4" />
              <span>Repost</span>
            </button>

            {/* Share Trigger */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all relative"
              title="Share Project"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Quick Apply / Details Action */}
          <div className="flex items-center gap-2 ml-auto pt-1 sm:pt-0">
            {canAccessProjectChat && (
              <Link to={`/messages?projectId=${projectId}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1.5 text-[#00a884] border-[#00a884]/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
                  title="Open Project Team Chat (Owner & Accepted Members Only)"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>Team Chat</span>
                </Button>
              </Link>
            )}
            <Link to={`/projects/${projectId}`}>
              <Button size="sm" variant="outline" className="text-xs h-8">
                Details
              </Button>
            </Link>
            {!isClient && (
              <Button
                size="sm"
                variant={applied ? "success" : "primary"}
                onClick={() => setIsModalOpen(true)}
                disabled={applied || project.status === "completed"}
                className="shadow-sm text-xs h-8"
              >
                {applied ? "✓ Applied" : "Apply"}
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Threaded Comments Section */}
        {showComments && (
          <ProjectCommentSection
            projectId={projectId}
            projectOwnerId={ownerId}
            initialCommentsCount={commentsCount}
            onCommentCountChange={(delta) => setCommentsCount((c) => Math.max(0, c + delta))}
          />
        )}
      </Card>

      {/* Repost Modal */}
      {showRepostModal && (
        <ProjectRepostModal
          project={project}
          hasReposted={hasReposted}
          onClose={() => setShowRepostModal(false)}
          onRepostSuccess={(reposted, count) => {
            setHasReposted(reposted);
            if (count !== undefined) setRepostsCount(count);
            else setRepostsCount((c) => (reposted ? c + 1 : Math.max(0, c - 1)));
          }}
        />
      )}

      {/* Quick Apply Interactive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3custom bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Apply to Project
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Submitting application for{" "}
              <span className="font-bold text-slate-900 dark:text-white">{project.title}</span>
            </p>
            {applied ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Application Sent!
                </h4>
                <p className="text-xs text-slate-400">
                  The client has received your proposal and portfolio notification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Proposed Rate / Compensation
                  </label>
                  <input
                    type="text"
                    required
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    placeholder="e.g. $4,500 Fixed or $60/hr"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brief Proposal / Pitch
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Describe relevant architectures you've built, tech stack familiarity, and estimated timeline..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isApplying}
                    className="gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Application</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Project Owner Analytics Modal */}
      {showAnalyticsModal && (
        <ProjectAnalyticsModal
          projectId={projectId}
          projectTitle={project.title}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <ReportDialog
          targetType="project"
          targetId={projectId}
          targetTitle={project.title}
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
      {/* Universal Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={`${window.location.origin}/projects/${projectId}`}
        title={project.title}
        description={project.description}
        type="project"
      />
    </>
  );
};

export default ProjectCard;
