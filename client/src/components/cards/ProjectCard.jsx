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
  XCircle,
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
import { ProjectDetailsEditModal } from "../workspace/ProjectDetailsEditModal";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [localAppStatus, setLocalAppStatus] = useState(project.applicationStatus || "open");
  const [localStatus, setLocalStatus] = useState(project.status || "open");

  useEffect(() => {
    if (project.applicationStatus !== undefined) setLocalAppStatus(project.applicationStatus);
    if (project.status !== undefined) setLocalStatus(project.status);
  }, [project.applicationStatus, project.status]);

  const isAppOpen = localAppStatus === "open" && localStatus === "open";

  const handleToggleApplicationStatus = async () => {
    if (!projectId) return;
    const nextStatus = isAppOpen ? "closed" : "open";
    try {
      setLocalAppStatus(nextStatus);
      if (nextStatus === "open" && localStatus === "paused") {
        setLocalStatus("open");
      }
      const res = await projectService.toggleProjectApplicationStatus(projectId, nextStatus);
      if (onProjectUpdated && res.data?.project) {
        onProjectUpdated(res.data.project);
      }
    } catch (err) {
      setLocalAppStatus(isAppOpen ? "open" : "closed");
      console.error("Failed to toggle project application status:", err);
    }
  };

  const handleSaveProjectEdit = async (payload) => {
    try {
      setIsUpdatingProject(true);
      const res = await projectService.updateProject(projectId, payload);
      const updatedProj = res.data?.project || res.data?.data || res.data;
      if (onProjectUpdated && updatedProj) {
        onProjectUpdated(updatedProj);
      }
      setShowEditModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setIsUpdatingProject(false);
    }
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(Boolean(project.hasApplied || project.applied));
  const [applyError, setApplyError] = useState("");
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [selectedSkills, setSelectedSkills] = useState(
    Array.isArray(project.requiredSkills) ? [...project.requiredSkills] : []
  );
  const [coverNote, setCoverNote] = useState("");
  const [availability, setAvailability] = useState("10 - 20 hrs / week");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
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
    if (project.hasApplied !== undefined) setApplied(Boolean(project.hasApplied));
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

  // Project Requirements Tailored Apply submit
  const handleQuickApply = async (e) => {
    e.preventDefault();
    if (!isAppOpen) {
      setApplyError("Applications for this project are currently closed.");
      return;
    }
    setIsApplying(true);
    setApplyError("");
    try {
      const portfolioLinks = [];
      if (githubUrl.trim()) portfolioLinks.push(githubUrl.trim());
      if (portfolioUrl.trim()) portfolioLinks.push(portfolioUrl.trim());

      await projectService.applyToProject(projectId, {
        coverLetter: coverNote.trim() || `Excited to contribute to ${project.title} as a ${selectedRole}!`,
        relevantRole: selectedRole,
        relevantSkills: selectedSkills.length > 0 ? selectedSkills : (project.requiredSkills || []),
        portfolioLinks,
        availability,
        relevantExperience: `Role: ${selectedRole} | Matched Skills: ${(selectedSkills.length > 0 ? selectedSkills : project.requiredSkills || []).join(', ')}`,
      });
      setApplied(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setApplied(false);
      }, 1600);
    } catch (err) {
      console.error("Apply error:", err);
      setApplyError(err.response?.data?.message || "Failed to submit application. Please check requirements.");
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
      <Card className="glass-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col group relative overflow-hidden border-slate-200/90 dark:border-slate-800/80 shadow-md hover:shadow-glow-subtle p-3.5 sm:p-5 w-full">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

        {/* Repost Attribution Banner */}
        {project.repostInfo && (
          <div className="flex items-center gap-2 px-3 py-1.5 -mt-1 -mx-1 sm:-mt-2 sm:-mx-2 mb-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium rounded-xl">
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
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Link to={ownerId ? `/profile/${ownerId}` : "#"} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                <Avatar src={ownerAvatar} name={ownerName} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                {/* Line 1: Owner Name */}
                <Link
                  to={ownerId ? `/profile/${ownerId}` : "#"}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate block"
                >
                  {ownerName}
                </Link>

                {/* Line 2: Creator Role Badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {ownerRole === "client" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 whitespace-nowrap">
                      <Briefcase className="w-2.5 h-2.5 shrink-0" />
                      <span>Client / Founder</span>
                    </span>
                  ) : ownerRole === "developer" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 whitespace-nowrap">
                      <span>💻 Developer</span>
                    </span>
                  ) : ownerRole ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize whitespace-nowrap">
                      <span>{ownerRole}</span>
                    </span>
                  ) : null}
                </div>

                {/* Line 3: Headline and Date */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 min-w-0">
                  {ownerHeadline && (
                    <>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{ownerHeadline}</span>
                      <span className="shrink-0">•</span>
                    </>
                  )}
                  <span className="shrink-0 font-medium">{postedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {project.originIdeaPost && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 whitespace-nowrap shrink-0" title="Project launched from a Community Idea & Pitch">
                  <Lightbulb className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">Idea</span>
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap shrink-0 ${
                  isAppOpen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAppOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span>{isAppOpen ? "Applications Open" : "Applications Closed"}</span>
              </span>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
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
                  className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Edit Project</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            handleToggleApplicationStatus();
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                            isAppOpen
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {isAppOpen ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-500" />
                              <span>Close Applications</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Open Applications</span>
                            </>
                          )}
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

          {/* Metadata Grid: Category/Type, Duration, Seniority, Team Capacity */}
          <div className="grid grid-cols-2 gap-2.5 py-2.5 px-3 border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={project.category || "Community Project"}>
                {project.category || (project.projectType === "collaboration" ? "Community Project" : "Developer Squad")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate" title={project.duration || "1 - 2 Months"}>
                {project.duration || "1 - 2 Months"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="capitalize truncate" title={project.experienceLevel === "all" ? "All Levels" : (project.experienceLevel || "All Levels")}>
                {project.experienceLevel === "all" ? "All Levels" : (project.experienceLevel || "All Levels")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate" title={`${project.acceptedApplicantsCount || 0}/${project.teamSize || 1} seats filled`}>
                {project.acceptedApplicantsCount || 0}/{project.teamSize || 1} seats filled
              </span>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Footer (Engagement Metrics + Actions Row) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Engagement Summary Counts Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
            <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
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
                <span className="text-slate-400">Be first to react</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className="hover:text-primary-500 transition-colors shrink-0"
              >
                {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
              </button>
              {repostsCount > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setShowRepostModal(true)}
                    className="hover:text-emerald-500 transition-colors font-semibold shrink-0"
                  >
                    {repostsCount} {repostsCount === 1 ? "repost" : "reposts"}
                  </button>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3" />
                {viewsCount} views
              </span>
            </div>
          </div>

          {/* Engagement Actions Row */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-2.5 border-t border-slate-100/90 dark:border-slate-800/80 flex flex-col gap-2.5"
          >
            {/* Social Actions (Reaction Picker, Comment, Repost, Share) */}
            <div className="flex items-center justify-between gap-1 w-full text-slate-500 dark:text-slate-400">
              {/* Reaction Picker */}
              <div className="flex-1">
                <ProjectReactionPicker
                  userReaction={userReaction}
                  onSelectReaction={handleSelectReaction}
                  onRemoveReaction={handleRemoveReaction}
                  disabled={!isAuthenticated}
                />
              </div>

              {/* Comment Trigger */}
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  showComments
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Comment"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">Comment</span>
                {commentsCount > 0 && <span className="text-xs font-bold">{commentsCount}</span>}
              </button>

              {/* Repost Trigger (Icon + Count only, no extra text) */}
              <button
                type="button"
                onClick={() => setShowRepostModal(true)}
                disabled={!isAuthenticated}
                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  hasReposted
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${!isAuthenticated ? "opacity-60 cursor-not-allowed" : ""}`}
                title={hasReposted ? "Undo Repost" : "Repost Project to your network"}
              >
                <Repeat2 className="w-4 h-4 shrink-0" />
                {repostsCount > 0 && <span className="text-xs font-bold">{repostsCount}</span>}
              </button>

              {/* Share Trigger (Icon only) */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                title="Share Project"
              >
                <Share2 className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Quick Apply / Details Action */}
            <div className="flex items-center gap-2 w-full pt-1">
              {canAccessProjectChat && (
                <Link to={`/messages?projectId=${projectId}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8.5 gap-1.5 text-[#00a884] border-[#00a884]/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold w-full rounded-xl"
                    title="Open Project Team Chat (Owner & Accepted Members Only)"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#00a884]" />
                    <span>Team Chat</span>
                  </Button>
                </Link>
              )}
              <Link to={`/projects/${projectId}`} className="flex-1">
                <Button size="sm" variant="outline" className="text-xs h-8.5 w-full rounded-xl font-bold">
                  Details
                </Button>
              </Link>
              {isOwner ? (
                <Link to={`/projects/${projectId}/workspace`} className="flex-1">
                  <Button size="sm" variant="primary" className="shadow-sm text-xs h-8.5 gap-1 font-bold w-full rounded-xl">
                    Workspace
                  </Button>
                </Link>
              ) : applied ? (
                <span className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-2xs select-none flex-1 h-8.5">
                  ✓ Applied
                </span>
              ) : (
                <Button
                  size="sm"
                  variant={!isAppOpen ? "secondary" : "primary"}
                  onClick={() => setIsModalOpen(true)}
                  disabled={!isAppOpen}
                  className="shadow-sm text-xs h-8.5 flex-1 rounded-xl font-bold"
                >
                  {!isAppOpen ? "Closed" : "Apply"}
                </Button>
              )}
            </div>
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

      {/* Project Requirements Tailored Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-6">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Apply to {project.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Led by <span className="font-semibold text-slate-700 dark:text-slate-300">{ownerName}</span> • {project.category || "Development"} • {project.experienceLevel || "All Levels"}
                </p>
              </div>
            </div>

            {applied ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">
                  Application Submitted! 🎉
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your tailored proposal and skill profile have been sent to <strong>{ownerName}</strong>. You will be notified when they review your application.
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickApply} className="space-y-4">
                {applyError && (
                  <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                    {applyError}
                  </div>
                )}

                {/* 1. Project Requirements & Skills Match */}
                {Array.isArray(project.requiredSkills) && project.requiredSkills.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Project Tech Requirements
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Select skills you bring
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredSkills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              setSelectedSkills((prev) =>
                                isSelected ? prev.filter((s) => s !== skill) : [...prev, skill]
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                              isSelected
                                ? "bg-primary-600 text-white border-primary-600 shadow-2xs"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400"
                            }`}
                          >
                            <TechnologyIcon name={skill} size="xs" />
                            <span>{skill}</span>
                            {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Target Role / Contribution Area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Target Role / Contribution Focus
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 cursor-pointer font-medium"
                  >
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Mobile App Developer">Mobile App Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                    <option value="QA / Test Automation">QA / Test Automation</option>
                    <option value="Technical Contributor">Technical Contributor</option>
                  </select>
                </div>

                {/* 3. Pitch / Technical Approach */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Your Approach & Contribution Proposal <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {coverNote.length}/2000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder={`Describe your familiarity with ${project.requiredSkills?.slice(0, 3).join(', ') || 'the tech stack'}, relevant architectures you've built, and how you will help complete this project...`}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 leading-relaxed"
                  />
                </div>

                {/* 4. Availability Commitment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Time Commitment & Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 cursor-pointer font-medium"
                  >
                    <option value="Immediate / Flexible">Immediate / Flexible</option>
                    <option value="5 - 10 hrs / week">Part-Time (5 - 10 hrs / week)</option>
                    <option value="10 - 20 hrs / week">Dedicated (10 - 20 hrs / week)</option>
                    <option value="20 - 35 hrs / week">Major Commitment (20 - 35 hrs / week)</option>
                    <option value="Full-Time (35 - 40 hrs / week)">Full-Time (35 - 40 hrs / week)</option>
                  </select>
                </div>

                {/* 5. Links (Explicitly Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>GitHub Profile / Repo</span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/project"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Live Portfolio / Demo</span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://portfolio.dev"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                    className="gap-2 shadow-glow-primary"
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
      {/* Project Details Edit Modal (Owner Authority) */}
      {showEditModal && (
        <ProjectDetailsEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          project={project}
          onSave={handleSaveProjectEdit}
          isProcessing={isUpdatingProject}
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
