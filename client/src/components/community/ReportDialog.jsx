import { useState } from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { communityService } from "../../services/communityService";
const REASONS = [
  { value: "spam", label: "Spam, advertising, or unsolicited promotion" },
  { value: "harassment", label: "Harassment, bullying, or personal attacks" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate", label: "Sexually explicit or inappropriate content" },
  { value: "misleading", label: "Scam, deceptive, or misleading information" },
  { value: "other", label: "Other violation of community guidelines" }
];
export const ReportDialog = ({
  targetType,
  targetId,
  targetTitle,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState("spam");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await communityService.submitReport({
        targetType,
        targetId,
        reason,
        explanation: explanation.trim() || void 0
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit report. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"><div className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4"><button
    onClick={onClose}
    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
  ><X className="w-5 h-5" /></button>{submitted ? <div className="py-8 text-center space-y-3"><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Report Submitted
            </h3><p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for keeping Devquox safe. Our moderation team will review this report
              promptly.
            </p></div> : <><div className="flex items-center gap-2.5 text-rose-500"><AlertTriangle className="w-6 h-6 shrink-0" /><div><h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Report {targetType === "post" ? "Post" : targetType === "comment" ? "Comment" : targetType === "project" ? "Project" : "User"}</h3>{targetTitle && <p className="text-xs text-slate-400 truncate max-w-xs">{targetTitle}</p>}</div></div>{error && <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Select a Reason
                </label><div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">{REASONS.map((r) => <label
    key={r.value}
    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${reason === r.value ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-white" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
  ><input
    type="radio"
    name="reportReason"
    value={r.value}
    checked={reason === r.value}
    onChange={() => setReason(r.value)}
    className="mt-0.5 text-rose-500 focus:ring-rose-500"
  /><span>{r.label}</span></label>)}</div></div><div className="space-y-1"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Additional Details (Optional)
                </label><textarea
    rows={3}
    value={explanation}
    onChange={(e) => setExplanation(e.target.value)}
    maxLength={500}
    placeholder="Provide context or explanation for our moderators..."
    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
  /></div><div className="flex items-center justify-end gap-2 pt-2"><Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button><Button
    type="submit"
    variant="danger"
    size="sm"
    isLoading={submitting}
    disabled={submitting}
  >
                  Submit Report
                </Button></div></form></>}</div></div>;
};
export default ReportDialog;
