import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ShareModal } from "../ui/ShareModal";
import { TechnologyIcon } from "../skills/TechnologyIcon";
import {
  Lightbulb,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  FileText,
  Image as ImageIcon,
  Rocket,
  ExternalLink,
  Check,
  Send,
  BarChart2,
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Sparkles,
  X,
  Target,
  Briefcase,
  Maximize2,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  CheckCircle2,
  Flag,
  UploadCloud,
  Plus,
  HelpCircle,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  Tag,
  Clock,
  Award,
  Repeat2,
} from "lucide-react";
import { useAuthStore } from "../../store";
import { communityService } from "../../services/communityService";
import { IDEA_CATEGORIES } from "../community/IdeaPitchModal";

const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const isProdHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const apiBase = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
    ? import.meta.env.VITE_API_URL
    : (isProdHost ? 'https://dev-quox-community-bb6g.vercel.app/api/v1' : 'http://localhost:5000');
  const cleanBase = apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
  return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

const isImageAttachment = (att) => {
  if (!att) return false;
  const fileType = (att.fileType || "").toLowerCase();
  if (fileType === "image" || fileType.startsWith("image/")) return true;
  const name = (att.name || "").toLowerCase();
  const url = (att.url || att.previewUrl || (typeof att === "string" ? att : "")).toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif") ||
    name.endsWith(".svg") ||
    name.endsWith(".bmp") ||
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes(".png") ||
    url.includes(".webp") ||
    url.includes(".gif") ||
    url.includes(".svg") ||
    url.startsWith("data:image/") ||
    url.startsWith("blob:")
  );
};

export const IdeaCard = ({ idea, onIdeaUpdated, onIdeaDeleted }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const ideaId = idea._id || idea.id;
  const author = idea.author || {};
  const authorId = author._id || author.id;
  const authorName = author.name || "Community Creator";
  const authorAvatar = author.avatar || author.avatarUrl;
  const authorHeadline = author.headline || (author.role === "client" ? "Project Lead / Founder" : "Software Developer");
  const authorRole = (author.role || "").toLowerCase();
  const ideaTitle = idea.title || "Community Project Idea";
  const ideaDescription = idea.content || idea.description || "";
  const ideaCategory = idea.category || idea.ideaDetails?.category || "Web Development";

  // Strict ownership check
  const isAuthor = Boolean(
    currentUserId && (
      String(authorId || author) === String(currentUserId) ||
      (currentUser?.email && author.email && currentUser.email === author.email)
    )
  );

  const [upvotes, setUpvotes] = useState(idea.upvotes ?? idea.likeCount ?? (idea.likes?.length || 0));
  const [hasLiked, setHasLiked] = useState(
    Boolean(
      idea.hasLiked ||
      idea.hasReacted ||
      (Array.isArray(idea.likes) && currentUserId && idea.likes.some((l) => String(l._id || l) === String(currentUserId)))
    )
  );
  const [repostCount, setRepostCount] = useState(
    idea.repostCount ?? (Array.isArray(idea.repostedBy) ? idea.repostedBy.length : 0)
  );
  const [hasReposted, setHasReposted] = useState(
    Boolean(
      idea.isReposted ||
      (Array.isArray(idea.repostedBy) && currentUserId && idea.repostedBy.some((r) => String(r._id || r) === String(currentUserId)))
    )
  );
  const [isBookmarked, setIsBookmarked] = useState(
    Boolean(
      idea.isBookmarked ||
      idea.isSaved ||
      (Array.isArray(idea.savedBy) && currentUserId && idea.savedBy.some((s) => String(s._id || s) === String(currentUserId)))
    )
  );
  const [commentsCount, setCommentsCount] = useState(idea.commentsCount ?? idea.commentCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (idea.upvotes !== undefined || idea.likeCount !== undefined) {
      setUpvotes(idea.upvotes ?? idea.likeCount ?? (idea.likes?.length || 0));
    }
    if (idea.hasLiked !== undefined || idea.hasReacted !== undefined) {
      setHasLiked(Boolean(idea.hasLiked || idea.hasReacted));
    }
    if (idea.repostCount !== undefined) {
      setRepostCount(idea.repostCount);
    }
    if (idea.isReposted !== undefined) {
      setHasReposted(Boolean(idea.isReposted));
    }
    if (idea.commentsCount !== undefined || idea.commentCount !== undefined) {
      setCommentsCount(idea.commentsCount ?? idea.commentCount ?? 0);
    }
    if (idea.isBookmarked !== undefined || idea.isSaved !== undefined) {
      setIsBookmarked(Boolean(idea.isBookmarked || idea.isSaved));
    }
  }, [idea]);

  // Overflow 3-dot Menu State
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Edit & Delete Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState(ideaTitle);
  const [editCategory, setEditCategory] = useState(ideaCategory);
  const [editContent, setEditContent] = useState(ideaDescription);
  const [editTargetAudience, setEditTargetAudience] = useState(idea.ideaDetails?.targetAudience || "");
  const [editFeedbackPrompt, setEditFeedbackPrompt] = useState(
    Array.isArray(idea.ideaDetails?.feedbackQuestions) && idea.ideaDetails.feedbackQuestions[0]
      ? idea.ideaDetails.feedbackQuestions[0]
      : ""
  );
  const [editSkills, setEditSkills] = useState(
    idea.ideaDetails?.rolesNeeded || idea.tags || ["React", "Node.js"]
  );
  const [editSkillInput, setEditSkillInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Full Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // LinkedIn-style Telemetry & Impressions
  const [impressions, setImpressions] = useState(idea.impressionsCount || 0);
  const [views, setViews] = useState(idea.viewsCount || 0);
  const [clicks, setClicks] = useState(idea.clicksCount || 0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  // Auto-record impression telemetry
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      communityService
        .trackImpression(ideaId)
        .then((res) => {
          if (isMounted && res.data?.impressionsCount) {
            setImpressions(res.data.impressionsCount);
            if (res.data.viewsCount) setViews(res.data.viewsCount);
          }
        })
        .catch(() => {});
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ideaId]);

  const postedDate = idea.createdAt
    ? new Date(idea.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Recent";

  // Lightbox modal state for full image preview
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);

  // Consolidate attachments & media across idea fields
  const rawAttachments = [
    ...(idea.coverImage ? [{ url: idea.coverImage, name: "Cover Image", fileType: "image" }] : []),
    ...(idea.ideaDetails?.coverImage ? [{ url: idea.ideaDetails.coverImage, name: "Cover Image", fileType: "image" }] : []),
    ...(Array.isArray(idea.mediaUrls)
      ? idea.mediaUrls.map((u) => (typeof u === "string" ? { url: u, name: "Image Attachment", fileType: "image" } : u))
      : []),
    ...(Array.isArray(idea.ideaDetails?.attachments) ? idea.ideaDetails.attachments : []),
    ...(Array.isArray(idea.attachments) ? idea.attachments : []),
  ];

  // Deduplicate attachments
  const uniqueAttachments = [];
  const seenKeys = new Set();
  for (const a of rawAttachments) {
    if (!a) continue;
    const key = a.url || a.previewUrl || a.name;
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueAttachments.push(a);
    }
  }

  const imageAttachments = uniqueAttachments.filter(isImageAttachment);
  const documentAttachments = uniqueAttachments.filter((a) => !isImageAttachment(a));
  const attachments = uniqueAttachments;

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const nextState = !hasLiked;
    setHasLiked(nextState);
    setUpvotes((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await communityService.togglePostReaction(ideaId, "like");
      const d = res.data?.data || res.data;
      if (d) {
        if (d.hasLiked !== undefined) setHasLiked(Boolean(d.hasLiked));
        if (d.upvotes !== undefined) setUpvotes(d.upvotes);
        else if (d.likeCount !== undefined) setUpvotes(d.likeCount);
      }
      if (onIdeaUpdated) {
        onIdeaUpdated({
          ...idea,
          hasLiked: nextState,
          upvotes: nextState ? upvotes + 1 : Math.max(0, upvotes - 1),
        });
      }
      communityService.trackClick(ideaId).catch(() => {});
    } catch (err) {
      console.warn("Toggle like failed:", err);
      setHasLiked(!nextState);
      setUpvotes((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleRepost = async (e) => {
    e?.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const nextState = !hasReposted;
    setHasReposted(nextState);
    setRepostCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const res = await communityService.repostPost(ideaId);
      const d = res.data?.data || res.data;
      if (d) {
        if (d.isReposted !== undefined) setHasReposted(Boolean(d.isReposted));
        if (d.repostCount !== undefined) setRepostCount(d.repostCount);
      }
      if (onIdeaUpdated) {
        onIdeaUpdated({
          ...idea,
          isReposted: nextState,
          repostCount: nextState ? repostCount + 1 : Math.max(0, repostCount - 1),
        });
      }
    } catch (err) {
      console.warn("Repost failed:", err);
      setHasReposted(!nextState);
      setRepostCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleBookmark = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setIsBookmarked(!isBookmarked);
    try {
      await communityService.toggleSavePost(ideaId);
      communityService.trackClick(ideaId).catch(() => {});
    } catch {
      setIsBookmarked(isBookmarked);
    }
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/communities?post=${ideaId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setMenuOpen(false);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShare = (e) => {
    e?.stopPropagation();
    communityService.trackClick(ideaId).catch(() => {});
    setShowShareModal(true);
    setMenuOpen(false);
  };

  const loadCommentsIfEmpty = async () => {
    if (commentsList.length === 0) {
      setLoadingComments(true);
      try {
        const res = await communityService.getComments(ideaId);
        const list = res.data?.data || res.data || [];
        setCommentsList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleToggleComments = async (e) => {
    e.stopPropagation();
    communityService.trackClick(ideaId).catch(() => {});
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      await loadCommentsIfEmpty();
    }
  };

  const handleOpenDetails = (e) => {
    if (e) e.stopPropagation();
    communityService.trackClick(ideaId).catch(() => {});
    setShowDetailsModal(true);
    loadCommentsIfEmpty();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;
    setSubmittingComment(true);
    try {
      const res = await communityService.addComment(ideaId, { content: commentInput.trim() });
      const newComment = res.data?.data || res.data;
      if (newComment) {
        setCommentsList((prev) => [...prev, newComment]);
        setCommentsCount((prev) => prev + 1);
        setCommentInput("");
        communityService.trackClick(ideaId).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Convert idea into a live project posting (Author only)
  const handleLaunchProject = (e) => {
    if (e) e.stopPropagation();
    if (!isAuthor) return;
    communityService.trackClick(ideaId).catch(() => {});

    navigate("/projects/create", {
      state: {
        fromIdea: {
          id: ideaId,
          title: ideaTitle,
          description: ideaDescription,
          skills: idea.ideaDetails?.rolesNeeded || idea.tags || [],
          category: ideaCategory,
          attachments: attachments,
        },
      },
    });
  };

  // Delete Idea
  const handleDeleteIdea = async (e) => {
    if (e) e.stopPropagation();
    setDeleting(true);
    try {
      await communityService.deletePost(ideaId);
      setShowDeleteConfirm(false);
      if (onIdeaDeleted) {
        onIdeaDeleted(ideaId);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete idea.");
    } finally {
      setDeleting(false);
    }
  };

  // Edit Idea Form Handlers
  const handleAddEditSkill = () => {
    const clean = editSkillInput.trim().replace(/^#/, "");
    if (clean && !editSkills.includes(clean) && editSkills.length < 8) {
      setEditSkills([...editSkills, clean]);
      setEditSkillInput("");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError("Idea title cannot be empty.");
      return;
    }
    if (!editContent.trim()) {
      setEditError("Idea description cannot be empty.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const payload = {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        tags: editSkills.map((s) => s.toLowerCase()),
        ideaDetails: {
          ...idea.ideaDetails,
          category: editCategory,
          targetAudience: editTargetAudience.trim() || undefined,
          rolesNeeded: editSkills,
          feedbackQuestions: editFeedbackPrompt.trim() ? [editFeedbackPrompt.trim()] : [],
        },
      };

      const res = await communityService.updatePost(ideaId, payload);
      const updatedIdea = res.data?.data || res.data;

      setShowEditModal(false);
      if (onIdeaUpdated) {
        onIdeaUpdated(updatedIdea || { ...idea, ...payload });
      }
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update idea.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Extract skills/tags for display
  const displaySkills = Array.isArray(idea.ideaDetails?.rolesNeeded) && idea.ideaDetails.rolesNeeded.length > 0
    ? idea.ideaDetails.rolesNeeded
    : Array.isArray(idea.tags) && idea.tags.length > 0
    ? idea.tags
    : [];

  return (
    <>
      <Card
        onClick={handleOpenDetails}
        className="glass-card p-3.5 sm:p-5 border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col group shadow-xs hover:shadow-md relative cursor-pointer rounded-2xl"
      >
        <div className="space-y-3.5">
          {/* Header Row: Owner Avatar & Info, Status Pill, Bookmark, More Menu */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Link to={authorId ? `/profile/${authorId}` : "#"} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                <Avatar src={authorAvatar} name={authorName} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                {/* Line 1: Author Name */}
                <Link
                  to={authorId ? `/profile/${authorId}` : "#"}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors truncate block"
                >
                  {authorName}
                </Link>

                {/* Line 2: Creator Role Badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {authorRole === "client" ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 whitespace-nowrap">
                      <Briefcase className="w-2.5 h-2.5 shrink-0" />
                      <span>Client / Founder</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 whitespace-nowrap">
                      <span>💻 Developer</span>
                    </span>
                  )}
                </div>

                {/* Line 3: Headline and Date */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 min-w-0">
                  {authorHeadline && (
                    <>
                      <span className="truncate max-w-[120px] sm:max-w-[200px]">{authorHeadline}</span>
                      <span className="shrink-0">•</span>
                    </>
                  )}
                  <span className="shrink-0 font-medium">{postedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span><span className="hidden sm:inline">Project </span>Idea</span>
              </span>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                title={isBookmarked ? "Remove Bookmark" : "Save Idea"}
                aria-label={isBookmarked ? "Remove from bookmarks" : "Bookmark idea"}
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
                  aria-label="More idea options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {isAuthor ? (
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
                          <span>Idea Analytics</span>
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
                          <span>Edit Idea</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Idea</span>
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpen(false);
                        handleShare(e);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Idea</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Idea Title & Link */}
          <div>
            <div onClick={handleOpenDetails} className="block group/title">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover/title:text-primary-500 transition-colors line-clamp-1 flex items-center justify-between">
                <span>{ideaTitle}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover/title:text-primary-500 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {ideaDescription}
            </p>
          </div>

          {/* Required Skills & Tech Stack Badges */}
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.slice(0, 5).map((skill) => {
                const isHashtag =
                  skill.startsWith("#") ||
                  ["idea", "brainstorm", "concept", "feedback"].includes(skill.toLowerCase());
                return (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50"
                  >
                    {isHashtag ? (
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                    ) : (
                      <TechnologyIcon name={skill} size="xs" />
                    )}
                    <span>{skill.startsWith("#") ? skill.slice(1) : skill}</span>
                  </span>
                );
              })}
              {displaySkills.length > 5 && (
                <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 self-center">
                  +{displaySkills.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Image Attachment (Sleek Banner Preview - perfectly proportioned) */}
          {imageAttachments.length > 0 && (
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
              {imageAttachments.length === 1 ? (
                <div
                  className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900/5 h-44 cursor-pointer group/img shadow-2xs"
                  onClick={() => setSelectedLightboxImage(resolveMediaUrl(imageAttachments[0].url || imageAttachments[0].previewUrl))}
                >
                  <img
                    src={resolveMediaUrl(imageAttachments[0].url || imageAttachments[0].previewUrl)}
                    alt={imageAttachments[0].name || "Idea attachment"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                    <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View Attachment</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {imageAttachments.slice(0, 2).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900/5 h-36 cursor-pointer group/img shadow-2xs"
                      onClick={() => setSelectedLightboxImage(resolveMediaUrl(img.url || img.previewUrl))}
                    >
                      <img
                        src={resolveMediaUrl(img.url || img.previewUrl)}
                        alt={img.name || `Attachment ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      {idx === 1 && imageAttachments.length > 2 ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xs">
                          +{imageAttachments.length - 2} more
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                          <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Document / File Attachments (if any) */}
          {documentAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
              {documentAttachments.slice(0, 3).map((att, idx) => (
                <a
                  key={idx}
                  href={resolveMediaUrl(att.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  onClick={() => communityService.trackClick(ideaId).catch(() => {})}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-primary-500 hover:border-primary-500/50 transition-colors shadow-2xs text-[11px] font-semibold"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[140px]">{att.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                </a>
              ))}
              {documentAttachments.length > 3 && (
                <span className="text-[10px] text-slate-400 font-semibold self-center">
                  +{documentAttachments.length - 3} more files
                </span>
              )}
            </div>
          )}

          {/* Metadata Quad-Grid: Category, Pitch Concept, Target Audience, Reviews */}
          <div className="grid grid-cols-2 gap-2.5 py-2.5 px-3 border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={ideaCategory}>
                {ideaCategory}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate" title="Pitch Concept">Pitch Concept</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate" title={idea.ideaDetails?.targetAudience || "Peer Review"}>
                {idea.ideaDetails?.targetAudience || "Peer Review"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate" title={`${commentsCount} ${commentsCount === 1 ? "Review" : "Reviews"}`}>
                {commentsCount} {commentsCount === 1 ? "Review" : "Reviews"}
              </span>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Footer (Engagement Metrics + Actions Row) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Engagement Summary Counts Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
            <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
              {upvotes > 0 ? (
                <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                  <span className="text-xs">💡</span>
                  <span>{upvotes}</span>
                </span>
              ) : (
                <span className="text-slate-400">Be first to react</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
              <button
                type="button"
                onClick={handleToggleComments}
                className="hover:text-primary-500 transition-colors shrink-0"
              >
                {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
              </button>
              {repostCount > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                    {repostCount} {repostCount === 1 ? "repost" : "reposts"}
                  </span>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnalyticsModal(true);
                }}
                className="hover:text-primary-500 transition-colors shrink-0 hidden sm:inline"
                title="View Performance Analytics"
              >
                {impressions} impressions
              </button>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3" />
                {views} views
              </span>
            </div>
          </div>

          {/* Engagement Actions Row */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-2.5 border-t border-slate-100/90 dark:border-slate-800/80 flex flex-col gap-2.5"
          >
            {/* Row 1: Social Actions (React, Comment, Repost, Share) */}
            <div className="flex items-center justify-between gap-1 w-full text-slate-500 dark:text-slate-400">
              {/* React Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  hasLiked
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={hasLiked ? "Unlike" : "React"}
              >
                <Heart className={`w-4 h-4 shrink-0 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>React</span>
                {upvotes > 0 && <span className="text-xs font-bold ml-0.5">{upvotes}</span>}
              </button>

              {/* Comment / Review Button */}
              <button
                type="button"
                onClick={handleToggleComments}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  showComments
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Comment"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Comment</span>
                {commentsCount > 0 && <span className="text-xs font-bold ml-0.5">{commentsCount}</span>}
              </button>

              {/* Repost Button */}
              <button
                type="button"
                onClick={handleToggleRepost}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  hasReposted
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={hasReposted ? "Undo Repost" : "Repost Idea to your network"}
              >
                <Repeat2 className="w-4 h-4 shrink-0" />
                <span>{hasReposted ? "Reposted" : "Repost"}</span>
                {repostCount > 0 && <span className="text-xs font-bold ml-0.5">{repostCount}</span>}
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Share Idea"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Share</span>
              </button>
            </div>

            {/* Row 2: Action CTAs (Details + Review / Launch Project) */}
            <div className="flex items-center gap-2 w-full pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenDetails}
                className="text-xs h-8.5 flex-1 rounded-xl font-bold"
              >
                Details
              </Button>

              {idea.convertedToProject ? (
                <Link to={`/projects/${idea.convertedToProject._id || idea.convertedToProject}`} className="flex-1">
                  <Button size="sm" variant="success" className="shadow-xs text-xs h-8.5 gap-1.5 w-full rounded-xl font-bold">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Project Active</span>
                  </Button>
                </Link>
              ) : isAuthor ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleLaunchProject}
                  className="shadow-xs text-xs h-8.5 gap-1.5 bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-700 hover:to-rose-700 text-white font-bold flex-1 rounded-xl"
                  title="Launch this idea into a live project posting"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Launch Project</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleToggleComments}
                  className="shadow-xs text-xs h-8.5 gap-1.5 flex-1 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Review</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Inline Reviews/Comments Section */}
        {showComments && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150"
          >
            <form onSubmit={handleAddComment} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={isAuthor ? "Reply to reviewers or share updates..." : "Share feedback, suggest tech stack or express interest..."}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <Button size="xs" type="submit" variant="primary" disabled={submittingComment || !commentInput.trim()} className="h-7 px-2.5">
                <Send className="w-3 h-3" />
              </Button>
            </form>

            {loadingComments ? (
              <p className="text-[10px] text-slate-400 text-center py-1">Loading reviews...</p>
            ) : commentsList.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {commentsList.map((c, i) => (
                  <div key={c._id || i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.author?.name || "Reviewer"}:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{c.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 text-center py-1">
                {isAuthor
                  ? "No reviews yet. Share your pitch with friends to get feedback!"
                  : "No reviews yet. Be the first to share constructive feedback!"}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* EDIT IDEA MODAL (Author Only) */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Edit Project Idea
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update your idea specifications, tech stack, and questions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Idea Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {IDEA_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Idea Concept & Problem Solved <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Audience (Optional)
                </label>
                <input
                  type="text"
                  value={editTargetAudience}
                  onChange={(e) => setEditTargetAudience(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack & Skills
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {editSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      <TechnologyIcon name={s} size="xs" />
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setEditSkills(editSkills.filter((item) => item !== s))}
                        className="hover:text-rose-500 ml-1 text-slate-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {editSkills.length < 8 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tech skill (e.g. React, Docker)..."
                      value={editSkillInput}
                      onChange={(e) => setEditSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddEditSkill();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <Button type="button" size="xs" variant="outline" onClick={handleAddEditSkill}>
                      Add
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Review Prompt / Feedback Question
                </label>
                <input
                  type="text"
                  value={editFeedbackPrompt}
                  onChange={(e) => setEditFeedbackPrompt(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingEdit}
                  disabled={savingEdit || !editTitle.trim() || !editContent.trim()}
                  className="font-bold bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Project Idea?
                </h3>
                <p className="text-xs text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white font-bold">"{ideaTitle}"</strong>? All associated comments and peer reviews will also be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleDeleteIdea}
                isLoading={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Yes, Delete Idea
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL IDEA DETAILS MODAL */}
      {/* ========================================================================= */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-cardDark shrink-0">
              <Link
                to={authorId ? `/profile/${authorId}` : "/profile"}
                className="flex items-center gap-3 group/author min-w-0"
                title={`View ${authorName}'s Profile`}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={authorAvatar}
                    name={authorName}
                    size="md"
                    className="rounded-full ring-2 ring-primary-500/20 group-hover/author:ring-primary-500/50 transition-all"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover/author:text-primary-600 transition-colors truncate">
                      {authorName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {authorRole === "client" ? "Founder" : "Developer"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {authorHeadline} • Posted on {postedDate}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70 whitespace-nowrap">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                  <span className="hidden sm:inline">Project Idea & Pitch</span>
                  <span className="sm:hidden">Idea</span>
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60"
                  title="Share this Idea"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Pitch Content Body */}
            <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Category & Title */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {ideaCategory}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                  {ideaTitle}
                </h2>
                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {ideaDescription}
                </div>
              </div>

              {/* Idea Specs (Target Audience, Feedback Question, Roles) */}
              {(idea.ideaDetails?.targetAudience ||
                (Array.isArray(idea.ideaDetails?.feedbackQuestions) && idea.ideaDetails.feedbackQuestions.length > 0) ||
                displaySkills.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  {idea.ideaDetails?.targetAudience && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-primary-500" />
                        Target Audience
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {idea.ideaDetails.targetAudience}
                      </p>
                    </div>
                  )}

                  {Array.isArray(idea.ideaDetails?.feedbackQuestions) && idea.ideaDetails.feedbackQuestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                        Feedback Requested
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {idea.ideaDetails.feedbackQuestions[0]}
                      </p>
                    </div>
                  )}

                  {displaySkills.length > 0 && (
                    <div className="sm:col-span-2 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary-500" />
                        Tech Stack & Project Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {displaySkills.map((r) => {
                          const isGeneric = ["idea", "brainstorm", "concept", "feedback"].includes(r.toLowerCase());
                          return isGeneric ? (
                            <span
                              key={r}
                              className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              #{r}
                            </span>
                          ) : (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            >
                              <TechnologyIcon name={r} size="xs" />
                              <span>{r}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Embedded Images in Details Modal (Un-cropped, Full-size Responsive) */}
              {imageAttachments.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    Attached Images & Mockups ({imageAttachments.length})
                  </span>

                  {imageAttachments.length === 1 ? (
                    <div
                      className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer group/img relative shadow-xs p-2 flex items-center justify-center max-h-[520px]"
                      onClick={() => setSelectedLightboxImage(resolveMediaUrl(imageAttachments[0].url || imageAttachments[0].previewUrl))}
                    >
                      <img
                        src={resolveMediaUrl(imageAttachments[0].url || imageAttachments[0].previewUrl)}
                        alt={imageAttachments[0].name || "Attached Mockup"}
                        className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-xs transition-transform duration-200 group-hover/img:scale-[1.01]"
                        loading="lazy"
                      />
                      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Click to view full size</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {imageAttachments.map((img, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer group/img relative shadow-xs p-2 flex items-center justify-center max-h-72"
                          onClick={() => setSelectedLightboxImage(resolveMediaUrl(img.url || img.previewUrl))}
                        >
                          <img
                            src={resolveMediaUrl(img.url || img.previewUrl)}
                            alt={img.name || `Image ${idx + 1}`}
                            className="max-h-68 w-auto max-w-full rounded-xl object-contain transition-transform duration-200 group-hover/img:scale-[1.02]"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <Maximize2 className="w-3 h-3" />
                            <span>Enlarge</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Document Attachments in Details Modal */}
              {documentAttachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary-500" />
                    Attached Documents ({documentAttachments.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documentAttachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={resolveMediaUrl(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.name}
                        onClick={() => communityService.trackClick(ideaId).catch(() => {})}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors group/att"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover/att:text-primary-600">
                              {att.name}
                            </p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {att.fileType || "Document"} {att.size > 0 ? `• ${(att.size / 1024).toFixed(0)} KB` : ""}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/att:text-primary-600 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Reviews & Discussions Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-500" />
                    <span>Community Reviews & Peer Feedback ({commentsCount})</span>
                  </h4>
                </div>

                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                  <input
                    id={`details-review-input-${ideaId}`}
                    type="text"
                    placeholder={isAuthor ? "Share updates or reply to reviewers..." : "Provide constructive architectural feedback, suggest tech stack..."}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={submittingComment || !commentInput.trim()} className="font-bold h-9 px-4">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>Submit</span>
                  </Button>
                </form>

                {loadingComments ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading reviews...</div>
                ) : commentsList.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {commentsList.map((c, i) => (
                      <div key={c._id || i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {c.author?.name || "Reviewer"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50/60 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No community feedback posted yet. Be the first to share your review!
                  </p>
                )}
              </div>
            </div>

            {/* Pinned Modal Bottom Action Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasLiked ? "text-rose-500 font-bold" : "hover:text-rose-500"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{upvotes} Upvotes</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleRepost}
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasReposted ? "text-emerald-500 font-bold" : "hover:text-emerald-500"
                  }`}
                  title={hasReposted ? "Undo Repost" : "Repost this idea"}
                >
                  <Repeat2 className={`w-4 h-4 ${hasReposted ? "text-emerald-500" : ""}`} />
                  <span>{repostCount} Reposts</span>
                </button>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <BarChart2 className="w-4 h-4 text-slate-400" />
                  <span>{impressions} Impressions</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{views} Viewers</span>
                </span>
              </div>

              {idea.convertedToProject ? (
                <Link to={`/projects/${idea.convertedToProject._id || idea.convertedToProject}`}>
                  <Button variant="primary" size="sm" className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Rocket className="w-4 h-4" />
                    <span>View Live Project Posting ↗</span>
                  </Button>
                </Link>
              ) : isAuthor ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunchProject}
                  className="gap-2 font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-glow-primary"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch this Idea as a Project</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const inputEl = document.getElementById(`details-review-input-${ideaId}`);
                    if (inputEl) inputEl.focus();
                  }}
                  className="gap-2 font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-glow-primary text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Write a Review</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowAnalyticsModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Post Performance Analytics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {ideaTitle}
              </p>
              <p className="text-[11px] text-slate-400">
                Performance metrics measured across community feed & algorithm ranking
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Feed Impressions</span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-primary-500" />
                  {impressions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unique Viewers</span>
                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  {views}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Interactions / Reviews</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  {commentsCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Engagement Rate</span>
                <span className="text-lg font-black text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                  {impressions > 0
                    ? (((upvotes + commentsCount + clicks) / impressions) * 100).toFixed(1) + "%"
                    : "0%"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAnalyticsModal(false)}
                className="text-xs"
              >
                Close
              </Button>
              {!idea.convertedToProject && isAuthor && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleLaunchProject}
                  className="text-xs gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Launch as Project</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universal Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={`${window.location.origin}/communities?post=${ideaId}`}
        title={ideaTitle}
        description={ideaDescription}
        type="idea"
      />

      {/* Lightbox Image Preview Modal */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-11 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedLightboxImage}
              alt="Expanded preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default IdeaCard;
