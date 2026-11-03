import { useState, useEffect } from "react";
import {
  ShieldAlert,
  X,
  Loader2,
  CheckCircle,
  EyeOff,
  Trash2
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { communityService } from "../../services/communityService";
export const ModerationQueueModal = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [processingId, setProcessingId] = useState(null);
  const [notesInput, setNotesInput] = useState({});
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await communityService.getReports({
        status: filterStatus || void 0,
        limit: 20
      });
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load moderation reports:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, filterStatus]);
  if (!isOpen) return null;
  const handleAction = async (reportId, actionTaken, status) => {
    setProcessingId(reportId);
    try {
      const notes = notesInput[reportId] || "";
      await communityService.reviewReport(reportId, {
        status,
        actionTaken,
        moderatorNotes: notes || void 0
      });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to action report.");
    } finally {
      setProcessingId(null);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"><div className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative">{
    /* Header */
  }<div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div className="flex items-center gap-2 text-rose-500"><ShieldAlert className="w-6 h-6" /><div><h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Community Moderation Queue
              </h2><p className="text-xs text-slate-500">
                Review reported posts, comments, and safety violations.
              </p></div></div><button
    onClick={onClose}
    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
  ><X className="w-5 h-5" /></button></div>{
    /* Filter bar */
  }<div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-2"><span className="text-xs font-semibold text-slate-500">Status Filter:</span>{["pending", "actioned", "dismissed"].map((st) => <button
    key={st}
    onClick={() => setFilterStatus(st)}
    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === st ? "bg-rose-500 text-white shadow-sm" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
  >{st}</button>)}</div>{
    /* Content list */
  }<div className="flex-1 overflow-y-auto p-5 space-y-4">{loading ? <div className="flex justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : reports.length === 0 ? <div className="text-center py-12 space-y-2"><CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" /><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                All clear! No {filterStatus} reports.
              </p><p className="text-xs text-slate-400">The community is currently safe and calm.</p></div> : reports.map((report) => {
    const isProcessing = processingId === report._id;
    return <div
      key={report._id}
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
    ><div className="flex items-start justify-between gap-2"><div className="space-y-1"><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">{report.reason}</span><span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Target: {report.targetType}</span></div><p className="text-xs text-slate-500">
                        Reported by <span className="font-semibold text-slate-700 dark:text-slate-300">@{report.reporterId?.username}</span> on{" "}{new Date(report.createdAt).toLocaleDateString()}</p></div><Badge variant={report.status === "pending" ? "warning" : "secondary"}>{report.status}</Badge></div>{report.explanation && <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800"><span className="font-semibold text-slate-500">Reporter's explanation:</span>{" "}
                      "{report.explanation}"
                    </div>}{
      /* Target Preview */
    }{report.targetPreview && <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Reported Content Preview
                      </span>{report.targetPreview.title && <h4 className="font-bold text-xs text-slate-900 dark:text-white">{report.targetPreview.title}</h4>}<p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">{report.targetPreview.content || "[No content text]"}</p><div className="text-[11px] text-slate-400 pt-1">
                        Author: @{report.targetPreview.author?.username || "Unknown"} · Status:{" "}{report.targetPreview.status || (report.targetPreview.isDeleted ? "deleted" : "active")}</div></div>}{
      /* Moderator notes input & actions */
    }{report.status === "pending" && <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800"><input
      type="text"
      placeholder="Add moderator action note (optional)..."
      value={notesInput[report._id] || ""}
      onChange={(e) => setNotesInput({ ...notesInput, [report._id]: e.target.value })}
      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
    /><div className="flex items-center justify-end gap-2"><Button
      size="sm"
      variant="ghost"
      onClick={() => handleAction(report._id, "none", "dismissed")}
      disabled={isProcessing}
    >
                          Dismiss Report
                        </Button><Button
      size="sm"
      variant="outline"
      onClick={() => handleAction(report._id, "hidden", "actioned")}
      disabled={isProcessing}
      className="text-amber-600 border-amber-300"
    ><EyeOff className="w-3.5 h-3.5 mr-1" />
                          Hide Content
                        </Button><Button
      size="sm"
      variant="danger"
      onClick={() => handleAction(report._id, "deleted", "actioned")}
      disabled={isProcessing}
    ><Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete Content
                        </Button></div></div>}</div>;
  })}</div></div></div>;
};
export default ModerationQueueModal;
