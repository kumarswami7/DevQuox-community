import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Send,
  Check,
  X,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const ContractDetails = ({
  contract,
  currentUser,
  isOwner,
  onSendContract,
  onAcceptContract,
  onRejectContract,
  onCancelContract,
  onEditContract,
  isLoading,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!contract) {
    return (
      <Card className="p-8 text-center text-slate-500">
        <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Contract Agreement Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Create a project financial agreement to formalize scope, milestones, and payment terms between client and developer.
        </p>
      </Card>
    );
  }

  const isClient = String(contract.clientId?._id || contract.clientId) === String(currentUser?._id);
  const isDeveloper = String(contract.developerId?._id || contract.developerId) === String(currentUser?._id);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active Agreement</Badge>;
      case 'pending_acceptance':
        return <Badge variant="warning">Pending Acceptance</Badge>;
      case 'completed':
        return <Badge variant="primary">Completed</Badge>;
      case 'disputed':
        return <Badge variant="danger">Disputed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formattedAmount = (contract.totalAmountMinorUnits / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: contract.currency || 'USD',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Header */}
      <Card className="p-6 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                {contract.title}
              </h2>
              {getStatusBadge(contract.status)}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                Version {contract.version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Agreement ID: <span className="font-mono">{contract._id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {contract.status === 'draft' && isClient && (
              <>
                <Button size="sm" variant="outline" onClick={onEditContract} disabled={isLoading}>
                  Edit Draft
                </Button>
                <Button size="sm" onClick={() => onSendContract(contract._id)} isLoading={isLoading} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Send for Acceptance
                </Button>
              </>
            )}

            {contract.status === 'pending_acceptance' && isDeveloper && (
              <>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  disabled={isLoading}
                >
                  Reject Terms
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onAcceptContract(contract._id)}
                  isLoading={isLoading}
                  className="gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Review & Accept Agreement
                </Button>
              </>
            )}

            {contract.status === 'active' && isClient && (
              <Button size="sm" variant="outline" onClick={onEditContract} disabled={isLoading}>
                Propose Amendment (v{contract.version + 1})
              </Button>
            )}

            {contract.versionHistory && contract.versionHistory.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                <History className="w-3.5 h-3.5" />
                History ({contract.versionHistory.length})
              </Button>
            )}
          </div>
        </div>

        {/* Rejection Input Drawer */}
        {showRejectInput && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
            <label className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Reason for rejecting terms:
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Milestone 2 due date is too short or deliverable scope needs adjustment..."
              className="w-full text-xs p-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onRejectContract(contract._id, rejectReason)}
                isLoading={isLoading}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Budget</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              {formattedAmount}
            </div>
            <span className="text-[10px] text-slate-500">{contract.currency || 'USD'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Payment Terms</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 capitalize">
              {contract.paymentTerms?.replace('_', ' ') || 'Milestone Based'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Start Date</span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
              {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Upon Acceptance'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Expected Delivery</span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
              {contract.expectedCompletionDate ? new Date(contract.expectedCompletionDate).toLocaleDateString() : 'TBD'}
            </div>
          </div>
        </div>

        {/* Parties Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {contract.clientId?.name ? contract.clientId.name[0] : 'C'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-500">Project Client</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {contract.clientId?.name || 'Client'}
              </p>
              <p className="text-[10px] text-slate-400">{contract.clientId?.email || ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              {contract.developerId?.name ? contract.developerId.name[0] : 'D'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500">Accepted Developer</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {contract.developerId?.name || 'Developer'}
              </p>
              <p className="text-[10px] text-slate-400">{contract.developerId?.email || ''}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Scope and Deliverables Section */}
      <Card className="p-6 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Scope of Work</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {contract.scope || 'No scope details specified.'}
          </p>
        </div>

        {contract.deliverables && contract.deliverables.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Agreed Deliverables</h3>
            <ul className="space-y-1.5">
              {contract.deliverables.map((d, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Acceptance Records Audit */}
        {contract.acceptanceRecords && contract.acceptanceRecords.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Verified Acceptance Trail
            </h4>
            <div className="space-y-1.5">
              {contract.acceptanceRecords.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {record.role === 'client' ? 'Client' : 'Developer'}: {record.user?.name || record.user}
                  </span>
                  <span>{new Date(record.acceptedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Version History Drawer */}
      {showHistory && contract.versionHistory && contract.versionHistory.length > 0 && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            Amendment Version History
          </h3>
          <div className="space-y-3">
            {contract.versionHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-700 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Version {item.version}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Archived on {new Date(item.archivedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Budget: {((item.totalAmountMinorUnits || 0) / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: item.currency || 'USD',
                  })}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  Scope: {item.scope}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContractDetails;
