import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Send,
  Eye,
  Plus,
} from 'lucide-react';

export const MilestoneFinancialTable = ({
  milestones = [],
  contract,
  currentUser,
  isOwner,
  onOpenCreateModal,
  onSubmitWork,
  onReviewWork,
  onPayMilestone,
}) => {
  const isClient = String(contract?.clientId?._id || contract?.clientId) === String(currentUser?._id);
  const isDeveloper = String(contract?.developerId?._id || contract?.developerId) === String(currentUser?._id);
  const isContractActive = contract?.status === 'active';

  const getWorkStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'submitted':
        return <Badge variant="warning">Submitted for Review</Badge>;
      case 'revision_requested':
        return <Badge variant="danger">Revision Requested</Badge>;
      case 'in_progress':
        return <Badge variant="primary">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending Work</Badge>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid & Verified</Badge>;
      case 'pending':
        return <Badge variant="warning">Payment Processing</Badge>;
      case 'refunded':
        return <Badge variant="accent">Refunded</Badge>;
      case 'disputed':
        return <Badge variant="danger">Disputed</Badge>;
      case 'failed':
        return <Badge variant="danger">Payment Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Funded</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            Financial Milestones ({milestones.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracks work deliverables, client approvals, and verified milestone funding.
          </p>
        </div>

        {isClient && (contract?.status === 'draft' || contract?.status === 'pending_acceptance') && (
          <Button size="sm" onClick={onOpenCreateModal} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No financial milestones defined yet.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Break the project agreement into funded milestones with clear acceptance criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const formattedMilestoneAmount = ((m.amountMinorUnits || 0) / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: m.currency || 'USD',
            });

            return (
              <Card
                key={m._id}
                className="p-5 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.title}
                      </h4>
                      {getWorkStatusBadge(m.workStatus)}
                      {getPaymentStatusBadge(m.paymentStatus)}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.description}
                    </p>

                    {m.deliverables && m.deliverables.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Deliverables:
                        </span>
                        {m.deliverables.map((d, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Developer Submission Details Preview */}
                    {m.submissionDetails?.notes && (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                        <span className="font-bold">Latest Developer Submission:</span>
                        <p>{m.submissionDetails.notes}</p>
                        {m.submissionDetails.links && m.submissionDetails.links.length > 0 && (
                          <div className="flex items-center gap-2 pt-0.5">
                            {m.submissionDetails.links.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-600 dark:text-primary-400 underline font-semibold flex items-center gap-0.5"
                              >
                                View Link #{lIdx + 1}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Client Review Feedback Preview */}
                    {m.reviewDetails?.feedback && (
                      <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 text-[11px] text-rose-900 dark:text-rose-300">
                        <span className="font-bold">Client Review Feedback:</span>
                        <p>{m.reviewDetails.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Milestone Value</span>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formattedMilestoneAmount}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Upon Delivery'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Developer Submission Trigger */}
                      {isDeveloper && isContractActive && m.workStatus !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSubmitWork(m)}
                          className="gap-1.5 text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {m.workStatus === 'revision_requested' ? 'Submit Revisions' : 'Submit Work'}
                        </Button>
                      )}

                      {/* Client Review Trigger */}
                      {isClient && isContractActive && m.workStatus === 'submitted' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onReviewWork(m)}
                          className="gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Deliverables
                        </Button>
                      )}

                      {/* Client Fund / Pay Milestone Trigger */}
                      {isClient && isContractActive && m.paymentStatus !== 'paid' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => onPayMilestone(m)}
                          className="gap-1.5 text-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Fund Milestone ({formattedMilestoneAmount})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MilestoneFinancialTable;
