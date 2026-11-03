import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, X, ShieldAlert, FileText } from 'lucide-react';

export const DisputeModal = ({
  isOpen,
  onClose,
  onSubmitDispute,
  transaction = null,
  milestone = null,
  contract = null,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('deliverable_unmet');
  const [description, setDescription] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Please provide a detailed explanation of the issue or dispute.');
      return;
    }

    const payload = {
      contractId: contract?._id || transaction?.contractId?._id || transaction?.contractId,
      milestoneId: milestone?._id || transaction?.milestoneId?._id || transaction?.milestoneId,
      paymentId: transaction?._id,
      reason,
      description: description.trim(),
      evidence: evidenceLinks ? evidenceLinks.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    };

    onSubmitDispute(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Open Financial Dispute
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

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Dispute Subject:
            </p>
            <p>
              {transaction?.invoiceNumber ? `Invoice #${transaction.invoiceNumber}` : ''}
              {milestone?.title ? ` - Milestone: ${milestone.title}` : ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dispute Category *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="deliverable_unmet">Deliverables do not match agreement criteria</option>
              <option value="missed_deadline">Missed agreed deadline without communication</option>
              <option value="payment_withheld">Client withheld payment for completed & approved work</option>
              <option value="unresponsive_counterparty">Counterparty unresponsive</option>
              <option value="scope_creep">Unagreed work demanded without compensation</option>
              <option value="other">Other issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description & Context *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the facts clearly, referencing the agreed scope and where expectations were not met..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supporting Evidence Links (one URL per line)
            </label>
            <textarea
              rows={2}
              value={evidenceLinks}
              onChange={(e) => setEvidenceLinks(e.target.value)}
              placeholder="https://github.com/issue/12&#10;https://loom.com/share/..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
            Note: Submitting a dispute freezes the associated milestone payment until reviewed by project participants or platform moderation.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="danger" isLoading={isLoading}>
              Submit Dispute
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DisputeModal;
