import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Pin,
  MoreVertical,
  Edit2,
  Trash2,
  EyeOff,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Users,
  Briefcase,
  ExternalLink,
  Check,
  Lightbulb,
  Rocket,
  Target,
  DollarSign,
  ArrowRight,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShareModal } from "../ui/ShareModal";
import { CommentThread } from "./CommentThread";
import { ReportDialog } from "./ReportDialog";
import { communityService } from "../../services/communityService";
const TYPE_CONFIG = {
  idea: { label: "Project Idea & Pitch", icon: Lightbulb, color: "text-amber-500", badgeVariant: "warning" },
  general: { label: "Discussion", icon: MessageSquare, color: "text-slate-500", badgeVariant: "secondary" },
  question: { label: "Question", icon: HelpCircle, color: "text-indigo-500", badgeVariant: "primary" },
  knowledge: { label: "Tutorial", icon: BookOpen, color: "text-purple-500", badgeVariant: "accent" },
  showcase: { label: "Showcase", icon: Sparkles, color: "text-emerald-500", badgeVariant: "success" },
  collaboration: { label: "Team-up", icon: Users, color: "text-amber-500", badgeVariant: "warning" },
  career: { label: "Opportunity", icon: Briefcase, color: "text-cyan-500", badgeVariant: "primary" }
};
export const PostCard = ({
  post,
  currentUserId,
  currentUserRole,
  onPostUpdated,
  onPostDeleted
}) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? post.commentCount ?? 0);
  const [hasLiked, setHasLiked] = useState(
    Boolean(
      post.hasLiked ||
      post.hasReacted ||
      post.userReaction === "like" ||
      (currentUserId && post.likes?.some((id) => String(id?._id || id) === String(currentUserId)))
    )
  );
  const [likeCount, setLikeCount] = useState(
    post.likeCount ?? post.reactionCounts?.like ?? post.likes?.length ?? post.upvotes ?? 0
  );
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(
    Boolean(
      post.isSaved ||
      (currentUserId && post.savedBy?.some((id) => String(id?._id || id) === String(currentUserId)))
    )
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const isAuthor = currentUserId && String(post.author?._id || post.author) === String(currentUserId);
  const isModerator = currentUserRole === "admin" || currentUserRole === "moderator";
  const typeInfo = TYPE_CONFIG[post.postType] || TYPE_CONFIG.general;
  const TypeIcon = typeInfo.icon;
  const handleToggleLike = async () => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    setHasLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    try {
      const res = await communityService.togglePostReaction(post._id, "like");
      if (res.data?.data) {
        const d = res.data.data;
        const liked = d.hasLiked !== undefined ? d.hasLiked : d.hasReacted;
        const count = d.reactionCounts?.like !== undefined ? d.reactionCounts.like : (d.likesCount ?? d.upvotes);
        if (liked !== undefined) setHasLiked(Boolean(liked));
        if (count !== undefined) setLikeCount(count);
      }
    } catch {
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };
  const handleToggleSave = async () => {
    if (!currentUserId || isSaving) return;
    setIsSaving(true);
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await communityService.toggleSavePost(post._id);
      if (res.data?.data) {
        setIsSaved(Boolean(res.data.data.isSaved));
      }
    } catch {
      setIsSaved(prev);
    } finally {
      setIsSaving(false);
    }
  };
  const handleShare = (e) => {
    e?.stopPropagation();
    setShowShareModal(true);
  };
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await communityService.deletePost(post._id);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };
  const handleTogglePin = async () => {
    try {
      const res = await communityService.pinPost(post._id, !post.isPinned);
      if (onPostUpdated && res.data?.data) {
        onPostUpdated({ ...post, isPinned: Boolean(res.data.data.isPinned) });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to pin/unpin post");
    }
  };
  const handleToggleHide = async () => {
    const shouldHide = post.status !== "hidden" && !post.isHidden;
    try {
      const res = await communityService.toggleHidePost(post._id, shouldHide);
      const isNowHidden = res.data?.data?.isHidden ?? shouldHide;
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          isHidden: isNowHidden,
          status: isNowHidden ? "hidden" : "active",
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update visibility");
    }
  };
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSubmittingEdit(true);
    try {
      const res = await communityService.updatePost(post._id, {
        title: editTitle.trim() || void 0,
        content: editContent.trim()
      });
      if (res.data?.data) {
        if (onPostUpdated) onPostUpdated(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post");
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  return <div className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">{
    /* Post Header: Author info, Post Type badge, Options */
  }<div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">{post.author?.avatarUrl || post.author?.avatar ? <img
    src={post.author?.avatarUrl || post.author?.avatar}
    alt={post.author?.name}
    className="w-full h-full object-cover"
  /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">{post.author?.name?.charAt(0) || "U"}</div>}</div><div><div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-slate-900 dark:text-white text-sm">{post.author?.name}</span><span className="text-xs text-slate-400">@{post.author?.username}</span>{post.author?.role && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">{post.author.role}</span>}</div><div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5"><span>{new Date(post.createdAt).toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}</span>{post.isEdited && <span className="italic">(edited)</span>}</div></div></div>{
    /* Badges & Options */
  }<div className="flex items-center gap-2">{post.isPinned && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><Pin className="w-3 h-3 fill-amber-500" />
              Pinned
            </span>}<Badge variant={typeInfo.badgeVariant} className="flex items-center gap-1"><TypeIcon className="w-3 h-3" />{typeInfo.label}</Badge>{
    /* Options Dropdown */
  }<div className="relative"><button
    onClick={() => setMenuOpen(!menuOpen)}
    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  ><MoreVertical className="w-4 h-4" /></button>{menuOpen && <div
    className="absolute right-0 mt-1 w-44 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-20 text-xs animate-fadeIn"
    onClick={() => setMenuOpen(false)}
  >{isAuthor && <button
    onClick={() => {
      setIsEditing(true);
      setEditTitle(post.title || "");
      setEditContent(post.content);
    }}
    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
  ><Edit2 className="w-3.5 h-3.5" />
                    Edit Post
                  </button>}{(isAuthor || isModerator) && <button
    onClick={handleDelete}
    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
  ><Trash2 className="w-3.5 h-3.5" />
                    Delete Post
                  </button>}{isModerator && <><button
    onClick={handleTogglePin}
    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
  ><Pin className="w-3.5 h-3.5" />{post.isPinned ? "Unpin from Top" : "Pin to Top"}</button><button
    onClick={handleToggleHide}
    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
  ><EyeOff className="w-3.5 h-3.5" />{post.status === "hidden" ? "Restore Post" : "Hide from Feed"}</button></>}{!isAuthor && <button
    onClick={() => setIsReportOpen(true)}
    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
  ><AlertTriangle className="w-3.5 h-3.5" />
                    Report Post
                  </button>}</div>}</div></div></div>{
    /* Post Content / Inline Edit */
  }{isEditing ? <div className="space-y-3 pt-1"><input
    type="text"
    value={editTitle}
    onChange={(e) => setEditTitle(e.target.value)}
    placeholder="Title (optional)"
    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
  /><textarea
    rows={4}
    value={editContent}
    onChange={(e) => setEditContent(e.target.value)}
    className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y"
  /><div className="flex items-center gap-2"><Button
    size="sm"
    variant="primary"
    onClick={handleSaveEdit}
    isLoading={isSubmittingEdit}
  >
              Save Changes
            </Button><Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button></div></div> : <div className="space-y-2">{post.title && <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">{post.title}</h2>}<p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed break-words">{post.content}</p>{
    /* Media image attachment */
  }{post.mediaUrls && post.mediaUrls.length > 0 && <div className="pt-2 rounded-xl overflow-hidden max-h-96"><img
    src={post.mediaUrls[0]}
    alt="Post attachment"
    className="w-full h-full object-cover rounded-xl border border-slate-100 dark:border-slate-800"
    onError={(e) => {
      e.target.style.display = "none";
    }}
  /></div>}{
    /* Resource Links */
  }{post.links && post.links.length > 0 && <div className="pt-1 flex flex-wrap gap-2">{post.links.map((link, idx) => <a
    key={idx}
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:underline"
  ><ExternalLink className="w-3.5 h-3.5" /><span>{link.title || link.url}</span></a>)}</div>}{
    /* Tags */
  }{post.tags && post.tags.length > 0 && <div className="flex flex-wrap gap-1.5 pt-2">{post.tags.map((tag) => <span
    key={tag}
    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
  >
                  #{tag}</span>)}</div>}

  {/* Attached Documents or Images */}
  {Array.isArray(post.ideaDetails?.attachments || post.attachments) &&
    (post.ideaDetails?.attachments || post.attachments).length > 0 && (
      <div className="pt-2 flex flex-wrap gap-2">
        {(post.ideaDetails?.attachments || post.attachments).map((att, idx) => (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
          >
            {att.fileType === "image" ? (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span className="truncate max-w-[160px]">{att.name}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        ))}
      </div>
    )}</div>}{
    /* Action Controls Bar */
  }<div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500"><div className="flex items-center gap-4">{
    /* Reaction Button */
  }<button
    onClick={handleToggleLike}
    className={`flex items-center gap-1.5 font-medium transition-colors ${hasLiked ? "text-rose-500" : "hover:text-rose-500"}`}
  ><Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} /><span>{likeCount}</span></button>{
    /* Comments Button */
  }<button
    onClick={() => setShowComments(!showComments)}
    className={`flex items-center gap-1.5 font-medium transition-colors ${showComments ? "text-primary-500" : "hover:text-primary-500"}`}
  ><MessageSquare className="w-4 h-4" /><span>{commentCount}</span></button>{
    /* Save / Bookmark Button */
  }<button
    onClick={handleToggleSave}
    className={`flex items-center gap-1.5 font-medium transition-colors ${isSaved ? "text-amber-500" : "hover:text-amber-500"}`}
  ><Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} /><span>{isSaved ? "Saved" : "Save"}</span></button></div>{
    /* Idea Launch / Active Button */
  }{(post.postType === "idea" || post.ideaDetails) && (
    post.convertedToProject ? (
      <Link to={`/projects/${post.convertedToProject._id || post.convertedToProject}`}>
        <Button size="xs" variant="outline" className="text-[11px] gap-1 font-bold text-emerald-600 border-emerald-500/40">
          <Rocket className="w-3 h-3 text-emerald-500" />
          <span>Project Active</span>
        </Button>
      </Link>
    ) : isAuthor ? (
      <Button
        type="button"
        size="xs"
        variant="primary"
        onClick={() => {
          navigate('/projects/create', {
            state: {
              fromIdea: {
                postId: post._id,
                title: post.title || '',
                description: post.content || '',
                category: 'Web Development',
                skills: post.tags || [],
              },
            },
          });
        }}
        className="text-[11px] gap-1 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
      >
        <Rocket className="w-3 h-3" />
        <span>Launch as Project</span>
      </Button>
    ) : (
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => setShowComments(true)}
        className="text-[11px] gap-1 font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
      >
        <MessageSquare className="w-3 h-3 text-amber-500" />
        <span>Give Feedback</span>
      </Button>
    )
  )}<button
    type="button"
    onClick={handleShare}
    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
    title="Share post"
  ><Share2 className="w-3.5 h-3.5" /><span>Share</span></button></div>{
    /* Expandable Threaded Comments */
  }{showComments && <CommentThread
    postId={post._id}
    currentUserId={currentUserId}
    isModerator={isModerator}
    onCommentCountChange={(delta) => setCommentCount((c) => Math.max(0, c + delta))}
  />}{
    /* Report Modal */
  }<ReportDialog
    targetType="post"
    targetId={post._id}
    targetTitle={post.title || post.content.slice(0, 40)}
    isOpen={isReportOpen}
    onClose={() => setIsReportOpen(false)}
  />{/* Universal Share Modal */}<ShareModal
    isOpen={showShareModal}
    onClose={() => setShowShareModal(false)}
    shareUrl={`${window.location.origin}/communities?post=${post._id}`}
    title={post.title || post.content?.slice(0, 50)}
    description={post.content}
    type={post.postType === "idea" ? "idea" : "post"}
  /></div>;
};
export default PostCard;
