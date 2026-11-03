import { useState, useEffect } from "react";
import {
  Heart,
  Reply,
  Edit2,
  Trash2,
  Send,
  Loader2,
  MessageCircle
} from "lucide-react";
import { Button } from "../ui/Button";
import { communityService } from "../../services/communityService";
export const CommentThread = ({
  postId,
  currentUserId,
  isModerator = false,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await communityService.getComments(postId);
      if (res.data?.data) {
        setComments(res.data.data);
      }
    } catch (err) {
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchComments();
  }, [postId]);
  const handleAddTopLevelComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await communityService.addComment(postId, { content: newComment.trim() });
      if (res.data?.data) {
        setComments([...comments, { ...res.data.data, replies: [] }]);
        setNewComment("");
        if (onCommentCountChange) onCommentCountChange(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleAddReply = async (parentId) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await communityService.addComment(postId, {
        content: replyContent.trim(),
        parentId
      });
      if (res.data?.data) {
        setComments(
          (prev) => prev.map(
            (c) => c._id === parentId ? {
              ...c,
              replyCount: (c.replyCount || 0) + 1,
              replies: [...c.replies || [], res.data.data]
            } : c
          )
        );
        setReplyContent("");
        setReplyingToId(null);
        if (onCommentCountChange) onCommentCountChange(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit reply.");
    } finally {
      setSubmittingReply(false);
    }
  };
  const handleToggleLike = async (commentId, parentId) => {
    const updateCommentLike = (c) => {
      if (c._id !== commentId) return c;
      const isLiked = !c.hasLiked;
      const count = isLiked ? (c.reactionCounts?.like || 0) + 1 : Math.max(0, (c.reactionCounts?.like || 0) - 1);
      return {
        ...c,
        hasLiked: isLiked,
        reactionCounts: { like: count }
      };
    };
    setComments(
      (prev) => prev.map((c) => {
        if (!parentId) {
          return updateCommentLike(c);
        } else if (c._id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).map(updateCommentLike)
          };
        }
        return c;
      })
    );
    try {
      await communityService.toggleCommentReaction(commentId, "like");
    } catch (err) {
      fetchComments();
    }
  };
  const handleSaveEdit = async (commentId, parentId) => {
    if (!editContent.trim()) return;
    setSubmittingEdit(true);
    try {
      const res = await communityService.updateComment(commentId, { content: editContent.trim() });
      if (res.data?.data) {
        const updated = res.data.data;
        setComments(
          (prev) => prev.map((c) => {
            if (!parentId && c._id === commentId) {
              return { ...c, content: updated.content, isEdited: true };
            } else if (parentId && c._id === parentId) {
              return {
                ...c,
                replies: (c.replies || []).map(
                  (r) => r._id === commentId ? { ...r, content: updated.content, isEdited: true } : r
                )
              };
            }
            return c;
          })
        );
        setEditingId(null);
        setEditContent("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update comment");
    } finally {
      setSubmittingEdit(false);
    }
  };
  const handleDelete = async (commentId, parentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await communityService.deleteComment(commentId);
      const deletedCount = res.data?.deletedCount || 1;
      if (!parentId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? {
                  ...c,
                  replyCount: Math.max(0, (c.replyCount || (c.replies?.length || 1)) - 1),
                  replies: (c.replies || []).filter((r) => r._id !== commentId),
                }
              : c
          )
        );
      }
      if (onCommentCountChange) onCommentCountChange(-deletedCount);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };
  const renderCommentItem = (comment, parentId) => {
    const isOwner = currentUserId && comment.author?._id === currentUserId;
    const canModerate = isOwner || isModerator;
    const isEditing = editingId === comment._id;
    const isReplying = replyingToId === comment._id;
    return <div
      key={comment._id}
      className={`group flex items-start gap-3 text-sm ${parentId ? "pl-8 pt-2.5 border-l-2 border-slate-100 dark:border-slate-800" : "pt-3"}`}
    >{
      /* Avatar */
    }<div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 mt-0.5">{comment.author?.avatarUrl || comment.author?.avatar ? <img
      src={comment.author?.avatarUrl || comment.author?.avatar}
      alt={comment.author?.name}
      className="w-full h-full object-cover"
    /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">{comment.author?.name?.charAt(0) || "U"}</div>}</div>{
      /* Content Box */
    }<div className="flex-1 space-y-1.5 min-w-0"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5 flex-wrap"><span className="font-semibold text-slate-900 dark:text-white text-xs">{comment.author?.name}</span><span className="text-[11px] text-slate-400">@{comment.author?.username}</span>{comment.author?.role && <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">{comment.author.role}</span>}<span className="text-[11px] text-slate-400">·</span><span className="text-[11px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString(void 0, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}</span>{comment.isEdited && <span className="text-[10px] text-slate-400 italic">(edited)</span>}</div>{canModerate && !comment.isDeleted && !isEditing && <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">{isOwner && <button
      onClick={() => {
        setEditingId(comment._id);
        setEditContent(comment.content);
      }}
      className="p-1 text-slate-400 hover:text-primary-500 rounded"
      title="Edit comment"
    ><Edit2 className="w-3.5 h-3.5" /></button>}<button
      onClick={() => handleDelete(comment._id, parentId)}
      className="p-1 text-slate-400 hover:text-rose-500 rounded"
      title="Delete comment"
    ><Trash2 className="w-3.5 h-3.5" /></button></div>}</div>{
      /* Comment Body / Editing Input */
    }{isEditing ? <div className="space-y-2 pt-1"><textarea
      rows={2}
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
    /><div className="flex items-center gap-2"><Button
      size="sm"
      variant="primary"
      onClick={() => handleSaveEdit(comment._id, parentId)}
      isLoading={submittingEdit}
    >
                  Save
                </Button><Button
      size="sm"
      variant="ghost"
      onClick={() => {
        setEditingId(null);
        setEditContent("");
      }}
    >
                  Cancel
                </Button></div></div> : <p
      className={`text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed ${comment.isDeleted ? "italic text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}
    >{comment.content}</p>}{
      /* Action Row */
    }{!comment.isDeleted && <div className="flex items-center gap-3 pt-0.5"><button
      onClick={() => handleToggleLike(comment._id, parentId)}
      className={`flex items-center gap-1 text-xs transition-colors ${comment.hasLiked ? "text-rose-500 font-semibold" : "text-slate-500 hover:text-rose-500"}`}
    ><Heart
      className={`w-3.5 h-3.5 ${comment.hasLiked ? "fill-rose-500 text-rose-500" : ""}`}
    /><span>{comment.reactionCounts?.like || 0}</span></button>{
      /* Reply Button (Only allowed for top-level comments to enforce 1-level thread) */
    }{!parentId && <button
      onClick={() => {
        setReplyingToId(isReplying ? null : comment._id);
        setReplyContent("");
      }}
      className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-500 transition-colors"
    ><Reply className="w-3.5 h-3.5" /><span>Reply</span></button>}</div>}{
      /* Inline Reply Input */
    }{isReplying && <div className="pt-2 pl-2 space-y-2"><div className="flex items-center gap-2"><input
      type="text"
      placeholder={`Reply to ${comment.author?.name}...`}
      value={replyContent}
      onChange={(e) => setReplyContent(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleAddReply(comment._id);
      }}
      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
    /><Button
      size="sm"
      variant="primary"
      onClick={() => handleAddReply(comment._id)}
      isLoading={submittingReply}
      disabled={!replyContent.trim() || submittingReply}
    >
                  Reply
                </Button><Button
      size="sm"
      variant="ghost"
      onClick={() => {
        setReplyingToId(null);
        setReplyContent("");
      }}
    >
                  Cancel
                </Button></div></div>}{
      /* Render Nested 1-Level Replies */
    }{comment.replies && comment.replies.length > 0 && <div className="space-y-3 pt-2">{comment.replies.map((reply) => renderCommentItem(reply, comment._id))}</div>}</div></div>;
  };
  return <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800"><div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"><MessageCircle className="w-4 h-4 text-primary-500" /><span>Discussion ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})</span></div>{error && <div className="p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-xl">{error}</div>}{
    /* Top-level comments list */
  }{loading ? <div className="flex justify-center py-6 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div> : comments.length === 0 ? <div className="text-center py-6 text-xs text-slate-400">
          No comments yet. Start the conversation!
        </div> : <div className="divide-y divide-slate-100 dark:divide-slate-800/60">{comments.map((c) => renderCommentItem(c, null))}</div>}{
    /* Top-Level Comment Composer Form */
  }<form onSubmit={handleAddTopLevelComment} className="flex items-center gap-2 pt-2"><input
    type="text"
    placeholder="Write a comment..."
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    maxLength={2e3}
    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
  /><Button
    type="submit"
    variant="primary"
    size="sm"
    isLoading={submitting}
    disabled={submitting || !newComment.trim()}
    className="shrink-0"
  ><Send className="w-3.5 h-3.5 mr-1" />
          Comment
        </Button></form></div>;
};
export default CommentThread;
