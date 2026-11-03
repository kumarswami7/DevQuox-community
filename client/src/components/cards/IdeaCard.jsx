import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ShareModal } from "../ui/ShareModal";
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
  DollarSign,
  Briefcase,
  Maximize2,
} from "lucide-react";
import { useAuthStore } from "../../store";
import { communityService } from "../../services/communityService";

export const IdeaCard = ({ idea, onIdeaUpdated, onIdeaDeleted }) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const ideaId = idea._id || idea.id;
  const author = idea.author || {};
  const authorId = author._id || author.id;
  const authorName = author.name || "Community Creator";
  const authorAvatar = author.avatar || author.avatarUrl;
  const authorHeadline = author.headline || (author.role === "client" ? "Project Creator" : "Developer");
  const authorRole = (author.role || "").toLowerCase();
  const ideaTitle = idea.title || "Community Project Idea";
  const ideaDescription = idea.content || idea.description || "";

  // Strict ownership check: only the author can launch their idea
  const isAuthor = Boolean(
    currentUserId && (
      String(authorId || author) === String(currentUserId) ||
      (currentUser?.email && author.email && currentUser.email === author.email)
    )
  );

  const [upvotes, setUpvotes] = useState(idea.upvotes || idea.likes?.length || 0);
  const [hasLiked, setHasLiked] = useState(
    Array.isArray(idea.likes) && currentUserId
      ? idea.likes.some((l) => String(l._id || l) === String(currentUserId))
      : false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    Array.isArray(idea.savedBy) && currentUserId
      ? idea.savedBy.some((s) => String(s._id || s) === String(currentUserId))
      : false
  );
  const [commentsCount, setCommentsCount] = useState(idea.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Full Details Modal State (opens when clicking card or title)
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // LinkedIn-style Telemetry & Impressions
  const [impressions, setImpressions] = useState(idea.impressionsCount || 0);
  const [views, setViews] = useState(idea.viewsCount || 0);
  const [clicks, setClicks] = useState(idea.clicksCount || 0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

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

  const attachments = idea.ideaDetails?.attachments || idea.attachments || [];

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
      await communityService.toggleVote(ideaId);
      communityService.trackClick(ideaId).catch(() => {});
    } catch {
      setHasLiked(!nextState);
      setUpvotes((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
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

  const handleShare = (e) => {
    e?.stopPropagation();
    communityService.trackClick(ideaId).catch(() => {});
    setShowShareModal(true);
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

  // Only the author can convert their idea into a project
  const handleLaunchProject = (e) => {
    if (e) e.stopPropagation();
    if (!isAuthor) return;
    communityService.trackClick(ideaId).catch(() => {});

    navigate("/projects/create", {
      state: {
        fromIdea: {
          id: ideaId,
          title: idea.title || "",
          description: idea.content || "",
          skills: idea.ideaDetails?.rolesNeeded || idea.tags || [],
          category: "Web Development",
          budget: idea.ideaDetails?.estimatedBudget || "",
          attachments: attachments,
        },
      },
    });
  };

  return (
    <>
      <Card
        onClick={handleOpenDetails}
        className="glass-card p-5 border-slate-200/90 dark:border-slate-800/80 hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md relative cursor-pointer"
      >
        <div className="space-y-3">
          {/* Top Header: Author with Clickable Profile + Idea Pill + Bookmark */}
          <div className="flex items-start justify-between gap-3">
            <Link
              to={authorId ? `/profile/${authorId}` : "/profile"}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2.5 min-w-0 group/author hover:opacity-90"
              title={`View ${authorName}'s Profile`}
            >
              <Avatar
                src={authorAvatar}
                name={authorName}
                size="sm"
                status="online"
                className="ring-2 ring-amber-500/20 group-hover/author:ring-amber-500/50 transition-all"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover/author:text-amber-600 transition-colors">
                    {authorName}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    {authorRole === "client" ? "Founder" : "Developer"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {authorHeadline} • {postedDate}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70">
                <Lightbulb className="w-3 h-3 text-amber-500 fill-amber-500/30" />
                <span>Project Idea</span>
              </span>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors ${
                  isBookmarked ? "text-amber-500 fill-amber-500" : ""
                }`}
                title="Save Idea"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Title and Content (Clicking opens full detail view) */}
          <div className="space-y-1.5">
            {idea.title && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors flex items-center justify-between gap-1">
                <span>{idea.title}</span>
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </h3>
            )}
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {idea.content}
            </p>
          </div>

          {/* Attachments (PDF / Doc / Images preview) */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              {attachments.slice(0, 2).map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  onClick={() => communityService.trackClick(ideaId).catch(() => {})}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium transition-colors"
                >
                  {att.fileType === "image" ? (
                    <ImageIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[130px]">{att.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ))}
              {attachments.length > 2 && (
                <span className="text-[10px] text-slate-400 font-semibold self-center">
                  +{attachments.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {Array.isArray(idea.tags) && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {idea.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* LinkedIn-style Analytics Telemetry Bar (Visible to Author) */}
        {isAuthor && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-2.5 mt-2.5 px-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60"
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200">{impressions}</strong> impressions • <strong className="text-slate-800 dark:text-slate-200">{views}</strong> views • <strong className="text-slate-800 dark:text-slate-200">{commentsCount}</strong> reviews
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalyticsModal(true)}
              className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Analytics</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {/* Footer Row: Actions & Engagement matching ProjectCard */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3 ${!isAuthor ? "pt-3.5" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: Like & Comment Metrics + Subtle Impression Count */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  hasLiked ? "text-rose-500 font-bold" : "text-slate-500 hover:text-rose-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{upvotes}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleComments}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-500 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{commentsCount}</span>
              </button>

              {/* Reach indicator */}
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400" title="Total Community Reach">
                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{impressions}</span>
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-0.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Share Idea"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Action Buttons with strict Author/Visitor logic & beautiful UI */}
            <div className="flex items-center gap-2">
              {idea.convertedToProject ? (
                <Link to={`/projects/${idea.convertedToProject._id || idea.convertedToProject}`}>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-2xs hover:bg-emerald-100 transition-all">
                    <Rocket className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Project Active ↗</span>
                  </span>
                </Link>
              ) : isAuthor ? (
                /* AUTHOR CONTROLS: Review counter + Launch as Project */
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleToggleComments}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-2xs"
                  >
                    Reviews ({commentsCount})
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={handleLaunchProject}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25 transition-all flex items-center"
                    title="Launch this idea into a live project posting"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Launch as Project</span>
                  </Button>
                </div>
              ) : (
                /* NON-AUTHOR / VISITOR CONTROLS: Only feedback allowed, no launching other people's ideas */
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={handleToggleComments}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold gap-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-primary-600 hover:text-white transition-all shadow-xs flex items-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Give Feedback</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Inline Comments Thread if expanded */}
          {showComments && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
              <form onSubmit={handleAddComment} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={isAuthor ? "Reply to reviewers or share updates..." : "Share feedback, suggest tech stack or express interest..."}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Button size="xs" type="submit" variant="primary" disabled={submittingComment || !commentInput.trim()}>
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
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* FULL IDEA DETAILS PAGE / MODAL (Shows ALL full details when card is clicked) */}
      {/* ========================================================================= */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Author + Badges + Close */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Link
                to={authorId ? `/profile/${authorId}` : "/profile"}
                className="flex items-center gap-3 group/author"
                title={`View ${authorName}'s Profile`}
              >
                <Avatar
                  src={authorAvatar}
                  name={authorName}
                  size="md"
                  status="online"
                  className="ring-2 ring-amber-500/30 group-hover/author:ring-amber-500/60 transition-all"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover/author:text-amber-600 transition-colors">
                      {authorName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                      {authorRole === "client" ? "Founder" : "Developer"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {authorHeadline} • Posted on {postedDate}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                  <span>Project Idea & Pitch</span>
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Share this Idea"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Title & Complete Un-truncated Pitch Content */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                {idea.title}
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {idea.content}
              </div>
            </div>

            {/* Idea Specs (Target Audience, Budget, Roles Needed) if provided */}
            {(idea.ideaDetails?.targetAudience ||
              idea.ideaDetails?.estimatedBudget ||
              (Array.isArray(idea.ideaDetails?.rolesNeeded) && idea.ideaDetails.rolesNeeded.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                {idea.ideaDetails?.targetAudience && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      Target Audience
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {idea.ideaDetails.targetAudience}
                    </p>
                  </div>
                )}

                {idea.ideaDetails?.estimatedBudget && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      Estimated Budget / Funding
                    </span>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {idea.ideaDetails.estimatedBudget}
                    </p>
                  </div>
                )}

                {Array.isArray(idea.ideaDetails?.rolesNeeded) && idea.ideaDetails.rolesNeeded.length > 0 && (
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      Roles / Skills Looking For
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {idea.ideaDetails.rolesNeeded.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document & Image Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary-500" />
                  Attached Documents & Mockups ({attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.name}
                      onClick={() => communityService.trackClick(ideaId).catch(() => {})}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors group/att"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {att.fileType === "image" ? (
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover/att:text-primary-600">
                            {att.name}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {att.fileType} {att.size > 0 ? `• ${(att.size / 1024).toFixed(0)} KB` : ""}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/att:text-primary-600 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {Array.isArray(idea.tags) && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Metrics & Launch Action Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-between flex-wrap gap-3">
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
                  <Button variant="primary" size="sm" className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Rocket className="w-4 h-4" />
                    <span>View Live Project Posting ↗</span>
                  </Button>
                </Link>
              ) : isAuthor ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunchProject}
                  className="gap-2 font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch this Idea as a Project</span>
                </Button>
              ) : null}
            </div>

            {/* Community Reviews & Discussions Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-500" />
                  <span>Community Reviews & Feedback ({commentsCount})</span>
                </h4>
              </div>

              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isAuthor ? "Share updates or reply to reviewers..." : "Provide constructive architectural feedback, suggest tech stack..."}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button type="submit" variant="primary" size="sm" disabled={submittingComment || !commentInput.trim()} className="font-bold">
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
                <p className="text-xs text-slate-400 text-center py-4">
                  No community feedback posted yet. Be the first to share your review!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn-style Post Performance & Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
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
                {idea.title || "Project Idea Pitch"}
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

            {/* LinkedIn-style algorithm status */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary-500/10 via-amber-500/10 to-transparent border border-primary-500/20 text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Algorithm Velocity: Active Feed Distribution
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Pitched ideas with 3+ reviews and high viewer retention receive 3.5x higher reach on the main Discover feed.
              </p>
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
                  className="text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
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
    </>
  );
};

export default IdeaCard;
