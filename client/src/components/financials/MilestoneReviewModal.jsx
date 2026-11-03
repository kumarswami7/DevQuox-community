import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, CheckCircle2, RotateCcw, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';

export const MilestoneReviewModal = ({
  isOpen,
  onClose,
  onReview,
  milestone,
  isLoading = false,
}) => {
  const [decision, setDecision] = useState('approved'); // 'approved' | 'revision_requested'
  const [feedback, setFeedback] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen || !milestone) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (decision === 'revision_requested' && !feedback.trim()) {
      setFormError('Please provide detailed revision instructions for the developer.');
      return;
    }

    onReview(milestone._id, {
      decision,
      feedback: feedback.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Review Deliverables
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              {formError}
            </div>
          )}

          {/* Milestone and Submission Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Milestone</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{milestone.title}</h4>
            </div>

            {milestone.submissionDetails?.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Developer Notes:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {milestone.submissionDetails.notes}
                </p>
              </div>
            )}

            {milestone.submissionDetails?.links && milestone.submissionDetails.links.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Links & Artifacts:
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  {milestone.submissionDetails.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Review Decision *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'approved'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Approve Work
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Deliverables meet the agreed criteria.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision('revision_requested')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'revision_requested'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 ring-2 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  Request Revisions
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Modifications or fixes required.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Feedback / Instructions {decision === 'revision_requested' ? '*' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                decision === 'approved'
                  ? 'Great job! Deliverables match the requirements.'
                  : 'Please resolve the following issues or missing tests before resubmission...'
              }
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required={decision === 'revision_requested'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={decision === 'approved' ? 'success' : 'danger'}
              isLoading={isLoading}
            >
              Submit Review Decision
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MilestoneReviewModal;
