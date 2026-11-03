import React, { useState } from "react";
import { Repeat2, Quote, Trash2, X, Check, Loader2, Sparkles } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { projectService } from "../../services/projectService";
import { useAuthStore } from "../../store";

export const ProjectRepostModal = ({
  project,
  hasReposted,
  onClose,
  onRepostSuccess,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const [mode, setMode] = useState("choose"); // 'choose' | 'quote'
  const [commentary, setCommentary] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const projectId = project._id || project.id;
  const ownerName = project.owner?.name || "Client";
  const ownerAvatar = project.owner?.avatar || project.owner?.avatarUrl;

  const handleInstantRepost = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await projectService.repostProject(projectId, { commentary: "" });
      const newCount = res.data?.repostsCount;
      setDoneMsg("Reposted to your network!");
      if (onRepostSuccess) {
        onRepostSuccess(true, newCount);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Repost error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to repost. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteRepost = async (e) => {
    e.preventDefault();
    if (!commentary.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await projectService.repostProject(projectId, { commentary: commentary.trim() });
      const newCount = res.data?.repostsCount;
      setDoneMsg("Quote repost published!");
      if (onRepostSuccess) {
        onRepostSuccess(true, newCount);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Quote repost error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to quote repost.");
    } finally {
      setLoading(false);
    }
  };

  const handleUndoRepost = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await projectService.undoRepost(projectId);
      const newCount = res.data?.repostsCount;
      setDoneMsg("Repost removed from your profile.");
      if (onRepostSuccess) {
        onRepostSuccess(false, newCount);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Undo repost error:", err);
      setErrorMsg("Failed to undo repost.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-5 rounded-3custom bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {doneMsg ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">{doneMsg}</h4>
          </div>
        ) : mode === "choose" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                <Repeat2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Share Project with Network
                </h3>
                <p className="text-xs text-slate-500">Broadcast this opportunity to fellow developers</p>
              </div>
            </div>

            {errorMsg && (
              <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                {errorMsg}
              </p>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleInstantRepost}
                disabled={loading}
                className="w-full p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all flex items-center gap-3 text-left group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {hasReposted ? "Already Reposted Instantly" : "Repost Instantly"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Instantly share this project to your activity feed without adding commentary
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("quote")}
                disabled={loading}
                className="w-full p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all flex items-center gap-3 text-left group"
              >
                <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Repost with Your Thoughts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add your insights, recommendations, or why your network should collaborate
                  </p>
                </div>
              </button>

              {hasReposted && (
                <button
                  type="button"
                  onClick={handleUndoRepost}
                  disabled={loading}
                  className="w-full p-3 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Undo Repost</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quote Repost Composer Mode */
          <form onSubmit={handleQuoteRepost} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentUser?.avatar || currentUser?.avatarUrl}
                name={currentUser?.name || "Me"}
                size="sm"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.name || "Me"}
                </p>
                <p className="text-[10px] text-slate-400">Sharing with your network</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                required
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="What do you think about this project scope or stack? Recommend someone in your network..."
                maxLength={2000}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 resize-none"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                {commentary.length}/2000
              </span>
            </div>

            {/* Embedded Mini Card of Original Project */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-1.5">
              <div className="flex items-center gap-2">
                <Avatar src={ownerAvatar} name={ownerName} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {project.title}
                  </p>
                  <p className="text-[10px] text-slate-400">By {ownerName} • {project.budget}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                {project.description}
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-500 dark:text-rose-400">{errorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode("choose")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!commentary.trim() || loading}
                isLoading={loading}
              >
                Post Repost
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProjectRepostModal;

