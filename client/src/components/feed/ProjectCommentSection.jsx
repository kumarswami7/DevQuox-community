import React, { useState, useEffect, useCallback } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Send, Reply, Edit2, Trash2, X, Check, Loader2, MessageSquare } from "lucide-react";
import { projectService } from "../../services/projectService";
import { useAuthStore } from "../../store";

export const ProjectCommentSection = ({ projectId, projectOwnerId, initialCommentsCount = 0, onCommentCountChange }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentUserId = currentUser?._id || currentUser?.id;

  const fetchComments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await projectService.getProjectComments(projectId, { limit: 30 });
      const list = res.data?.comments || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setComments(list);
    } catch (err) {
      console.error("Failed to load project comments:", err);
      setErrorMsg("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Submit top-level comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;
    if (!isAuthenticated) {
      setErrorMsg("Please log in to comment.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    const content = newCommentText.trim();

    try {
      const res = await projectService.addProjectComment(projectId, { content });
      const created = res.data?.comment || res.data?.data || res.data;
      setComments((prev) => [...prev, { ...created, replies: [] }]);
      setNewCommentText("");
      if (onCommentCountChange) {
        onCommentCountChange(1);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setErrorMsg(err.response?.data?.message || "Failed to submit comment. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit nested reply
  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim() || submittingReply) return;
    if (!isAuthenticated) return;

    setSubmittingReply(true);
    setErrorMsg("");
    const content = replyText.trim();

    try {
      const res = await projectService.addProjectComment(projectId, {
        content,
        parentComment: parentCommentId,
      });
      const createdReply = res.data?.comment || res.data?.data || res.data;

      setComments((prev) =>
        prev.map((c) => {
          if (String(c._id) === String(parentCommentId)) {
            return {
              ...c,
              replies: [...(c.replies || []), createdReply],
            };
          }
          return c;
        })
      );
      setReplyText("");
      setReplyingToId(null);
      if (onCommentCountChange) {
        onCommentCountChange(1);
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
      setErrorMsg("Failed to send reply. Please retry.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Edit comment
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim() || submittingEdit) return;
    setSubmittingEdit(true);
    setErrorMsg("");

    try {
      const res = await projectService.editComment(projectId, commentId, { content: editText.trim() });
      const updated = res.data?.comment || res.data;

      setComments((prev) =>
        prev.map((c) => {
          if (String(c._id) === String(commentId)) {
            return { ...c, content: updated.content || editText.trim() };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                String(r._id) === String(commentId)
                  ? { ...r, content: updated.content || editText.trim() }
                  : r
              ),
            };
          }
          return c;
        })
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      console.error("Error editing comment:", err);
      setErrorMsg("Failed to save edit.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await projectService.deleteComment(projectId, commentId);
      const deletedCount = res.data?.deletedCount || 1;

      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (String(c._id) === String(parentId)) {
              return {
                ...c,
                replies: (c.replies || []).filter((r) => String(r._id) !== String(commentId)),
              };
            }
            return c;
          })
        );
      } else {
        setComments((prev) => prev.filter((c) => String(c._id) !== String(commentId)));
      }

      if (onCommentCountChange) {
        onCommentCountChange(-deletedCount);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setErrorMsg("Failed to delete comment.");
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
      {/* Top Comment Composer */}
      {isAuthenticated ? (
        <form onSubmit={handleAddComment} className="flex gap-2.5 items-start">
          <Avatar
            src={currentUser?.avatar || currentUser?.avatarUrl}
            name={currentUser?.name || "Me"}
            size="sm"
            className="mt-0.5"
          />
          <div className="flex-1 space-y-1.5">
            <div className="relative">
              <textarea
                rows={2}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a thoughtful comment or question about this project requirement..."
                maxLength={3000}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 select-none">
                {newCommentText.length}/3000
              </span>
            </div>
            {errorMsg && (
              <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">{errorMsg}</p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!newCommentText.trim() || submitting}
                className="gap-1.5 text-xs py-1.5 h-auto"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Comment</span>
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log in to participate in the project discussion.
          </p>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="py-6 flex items-center justify-center space-x-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          <span className="text-xs">Loading project comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-slate-400 space-y-1">
          <MessageSquare className="w-6 h-6 mx-auto opacity-40" />
          <p className="text-xs font-medium">No comments yet.</p>
          <p className="text-[11px]">Be the first to share your thoughts or ask about this scope!</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {comments.map((comment) => {
            const isAuthor =
              currentUserId &&
              String(comment.author?._id || comment.author?.id || comment.author) === String(currentUserId);
            const isOwner =
              currentUserId &&
              projectOwnerId &&
              String(projectOwnerId) === String(currentUserId);
            const canDelete = isAuthor || isOwner;
            const isEditing = editingCommentId === comment._id;
            const authorName = comment.author?.name || "Developer";
            const authorHeadline = comment.author?.headline || "Software Engineer";
            const authorAvatar = comment.author?.avatar || comment.author?.avatarUrl;
            const commentDate = comment.createdAt
              ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Just now";

            return (
              <div key={comment._id} className="space-y-2">
                <div className="flex gap-2.5 items-start group">
                  <Avatar src={authorAvatar} name={authorName} size="sm" className="mt-0.5" />
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {authorName}
                          </span>
                          {String(comment.author?._id || comment.author) === String(projectOwnerId) && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                              Author
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{authorHeadline}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {commentDate}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditText("");
                            }}
                            className="text-[11px] h-7 px-2"
                          >
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSaveEdit(comment._id)}
                            disabled={!editText.trim() || submittingEdit}
                            className="text-[11px] h-7 px-2.5"
                          >
                            <Check className="w-3 h-3 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions row: Reply, Edit, Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-3 pt-2 text-[11px] font-semibold text-slate-500">
                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => {
                              if (replyingToId === comment._id) {
                                setReplyingToId(null);
                                setReplyText("");
                              } else {
                                setReplyingToId(comment._id);
                                setReplyText("");
                              }
                            }}
                            className="hover:text-primary-500 flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Reply</span>
                          </button>
                        )}
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditText(comment.content);
                            }}
                            className="hover:text-amber-500 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id, false)}
                            className="hover:text-rose-500 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Reply Composer */}
                {replyingToId === comment._id && (
                  <div className="ml-10 pl-2 border-l-2 border-primary-500/30 flex gap-2 items-start animate-in fade-in duration-150">
                    <Avatar
                      src={currentUser?.avatar || currentUser?.avatarUrl}
                      name={currentUser?.name || "Me"}
                      size="sm"
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1.5">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${authorName}...`}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText("");
                          }}
                          className="text-[11px] h-7 px-2"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!replyText.trim() || submittingReply}
                          onClick={() => handleAddReply(comment._id)}
                          className="text-[11px] h-7 px-2.5"
                        >
                          {submittingReply ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-10 pl-2 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor =
                        currentUserId &&
                        String(reply.author?._id || reply.author?.id || reply.author) === String(currentUserId);
                      const canDeleteReply = isReplyAuthor || isOwner;
                      const replyAuthorName = reply.author?.name || "Developer";
                      const replyHeadline = reply.author?.headline || "Software Engineer";
                      const replyAvatar = reply.author?.avatar || reply.author?.avatarUrl;
                      const replyDate = reply.createdAt
                        ? new Date(reply.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent";

                      return (
                        <div key={reply._id} className="flex gap-2 items-start">
                          <Avatar src={replyAvatar} name={replyAuthorName} size="sm" className="mt-0.5" />
                          <div className="flex-1 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div>
                                <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                                  {replyAuthorName}
                                </span>
                                <p className="text-[9px] text-slate-400 line-clamp-1">{replyHeadline}</p>
                              </div>
                              <span className="text-[9px] text-slate-400">{replyDate}</span>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                            {canDeleteReply && (
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply._id, true, comment._id)}
                                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectCommentSection;

