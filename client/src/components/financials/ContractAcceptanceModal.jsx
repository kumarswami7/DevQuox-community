import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldCheck, X, Check, AlertCircle, FileText } from 'lucide-react';

export const ContractAcceptanceModal = ({
  isOpen,
  onClose,
  onAccept,
  contract,
  isLoading = false,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDeliverables, setAgreedToDeliverables] = useState(false);

  if (!isOpen || !contract) return null;

  const formattedAmount = (contract.totalAmountMinorUnits / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: contract.currency || 'USD',
  });

  const canAccept = agreedToTerms && agreedToDeliverables;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Review & Accept Agreement
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {contract.title} (v{contract.version})
            </h4>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Agreed Total Budget:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {formattedAmount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Deliverables Count:</span>
              <span className="font-bold">{contract.deliverables?.length || 0} items</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Acceptance Confirmation
            </h5>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToDeliverables}
                onChange={(e) => setAgreedToDeliverables(e.target.checked)}
                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                I have reviewed all deliverables, acceptance criteria, and expected deadlines outlined in this contract.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                I agree to the milestone payment conditions and understand payments are released following client review and verified completion.
              </span>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2 border border-amber-200 dark:border-amber-900/50">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Formal acceptance will record your account ID, role, and a cryptographic timestamp on the immutable audit trail.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              disabled={!canAccept || isLoading}
              isLoading={isLoading}
              onClick={() => onAccept(contract._id)}
              className="gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirm & Activate Agreement
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContractAcceptanceModal;
