import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FileText,
  CreditCard,
  Layers,
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { contractService } from '../../services/contractService';
import { paymentService } from '../../services/paymentService';
import { ContractDetails } from './ContractDetails';
import { ContractCreateModal } from './ContractCreateModal';
import { ContractAcceptanceModal } from './ContractAcceptanceModal';
import { MilestoneFinancialTable } from './MilestoneFinancialTable';
import { MilestoneCreateModal } from './MilestoneCreateModal';
import { MilestoneSubmissionModal } from './MilestoneSubmissionModal';
import { MilestoneReviewModal } from './MilestoneReviewModal';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { InvoiceModal } from './InvoiceModal';
import { DisputeModal } from './DisputeModal';

export const FinancialsTab = ({
  projectId,
  currentUser,
  isOwner,
  teamMembers = [],
}) => {
  const [subTab, setSubTab] = useState('agreement'); // 'agreement' | 'transactions' | 'disputes'
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);

  // Modals state
  const [showContractModal, setShowContractModal] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedMilestoneForSubmit, setSelectedMilestoneForSubmit] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMilestoneForReview, setSelectedMilestoneForReview] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedMilestoneForPay, setSelectedMilestoneForPay] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedTransactionForInvoice, setSelectedTransactionForInvoice] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedTxForDispute, setSelectedTxForDispute] = useState(null);

  // Status feedback
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load contracts and transactions
  const loadFinancialData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // 1. Fetch contracts
      const contractRes = await contractService.getProjectContracts(projectId);
      if (contractRes.success) {
        const contractList = contractRes.contracts || [];
        setContracts(contractList);
        if (contractList.length > 0) {
          const activeOrLatest = contractList.find((c) => c.status === 'active') || contractList[0];
          setSelectedContract(activeOrLatest);
          // 2. Fetch milestones for active contract
          if (activeOrLatest?._id) {
            const mRes = await paymentService.getContractMilestones(activeOrLatest._id);
            if (mRes.success) setMilestones(mRes.milestones || []);
          }
        }
      }

      // 3. Fetch transactions for project
      const txRes = await paymentService.getProjectPayments(projectId);
      if (txRes.success) setTransactions(txRes.payments || []);

      // 4. Fetch disputes
      const dRes = await paymentService.getDisputes({ projectId });
      if (dRes.success) setDisputes(dRes.disputes || []);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [projectId]);

  // Handle Contract Creation / Amendment
  const handleSaveContract = async (payload) => {
    setIsProcessing(true);
    setActionError('');
    try {
      let res;
      if (selectedContract && selectedContract.status === 'active') {
        // Amendment
        res = await contractService.updateContract(selectedContract._id, payload);
      } else if (selectedContract && selectedContract.status === 'draft') {
        // Edit draft
        res = await contractService.updateContract(selectedContract._id, payload);
      } else {
        // New contract
        res = await contractService.createContract(payload);
      }

      if (res.success) {
        setActionSuccess(res.message || 'Agreement saved successfully.');
        setShowContractModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save contract.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Send Contract for Acceptance
  const handleSendContract = async (contractId) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await contractService.sendContract(contractId);
      if (res.success) {
        setActionSuccess('Contract sent to developer for review and acceptance.');
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to send contract.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Developer Accepts Contract
  const handleAcceptContract = async (contractId) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await contractService.acceptContract(contractId);
      if (res.success) {
        setActionSuccess('Agreement formally accepted! Milestone tracking is now active.');
        setShowAcceptanceModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept agreement.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Contract
  const handleRejectContract = async (contractId, reason) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await contractService.rejectContract(contractId, reason);
      if (res.success) {
        setActionSuccess('Contract terms returned with feedback for revision.');
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject agreement.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Individual Milestone
  const handleCreateMilestone = async (payload) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await paymentService.createMilestone(payload);
      if (res.success) {
        setActionSuccess('Milestone added successfully.');
        setShowMilestoneModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add milestone.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Developer Submits Milestone Work
  const handleSubmitWork = async (milestoneId, submissionData) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await paymentService.submitMilestoneWork(milestoneId, submissionData);
      if (res.success) {
        setActionSuccess('Deliverables submitted successfully for client review.');
        setShowSubmissionModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit milestone work.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Client Reviews Milestone Work
  const handleReviewWork = async (milestoneId, reviewData) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await paymentService.reviewMilestoneWork(milestoneId, reviewData);
      if (res.success) {
        setActionSuccess(
          reviewData.decision === 'approved'
            ? 'Deliverables approved! You can now fund this milestone.'
            : 'Revision feedback sent to developer.'
        );
        setShowReviewModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Raise Dispute
  const handleRaiseDispute = async (disputeData) => {
    setIsProcessing(true);
    setActionError('');
    try {
      const res = await paymentService.raiseDispute(disputeData);
      if (res.success) {
        setActionSuccess('Dispute raised and logged on the audit trail.');
        setShowDisputeModal(false);
        await loadFinancialData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Feedbacks */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {actionError}
          </span>
          <button onClick={() => setActionError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setSubTab('agreement')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'agreement'
                ? 'bg-white dark:bg-cardDark text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Agreement & Milestones
          </button>

          <button
            onClick={() => setSubTab('transactions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'transactions'
                ? 'bg-white dark:bg-cardDark text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Ledger & Receipts ({transactions.length})
          </button>

          <button
            onClick={() => setSubTab('disputes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'disputes'
                ? 'bg-white dark:bg-cardDark text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Disputes ({disputes.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (!selectedContract || selectedContract.status === 'completed' || selectedContract.status === 'cancelled') && (
            <Button
              size="sm"
              onClick={() => setShowContractModal(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Agreement
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={loadFinancialData}
            isLoading={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* SUB-TAB 1: AGREEMENT & MILESTONES */}
      {subTab === 'agreement' && (
        <div className="space-y-6">
          <ContractDetails
            contract={selectedContract}
            currentUser={currentUser}
            isOwner={isOwner}
            onSendContract={handleSendContract}
            onAcceptContract={() => setShowAcceptanceModal(true)}
            onRejectContract={handleRejectContract}
            onEditContract={() => setShowContractModal(true)}
            isLoading={isProcessing}
          />

          {selectedContract && (
            <MilestoneFinancialTable
              milestones={milestones}
              contract={selectedContract}
              currentUser={currentUser}
              isOwner={isOwner}
              onOpenCreateModal={() => setShowMilestoneModal(true)}
              onSubmitWork={(m) => {
                setSelectedMilestoneForSubmit(m);
                setShowSubmissionModal(true);
              }}
              onReviewWork={(m) => {
                setSelectedMilestoneForReview(m);
                setShowReviewModal(true);
              }}
              onPayMilestone={(m) => {
                setSelectedMilestoneForPay(m);
                setShowCheckoutModal(true);
              }}
            />
          )}
        </div>
      )}

      {/* SUB-TAB 2: TRANSACTIONS & RECEIPTS */}
      {subTab === 'transactions' && (
        <TransactionHistoryTable
          transactions={transactions}
          currentUser={currentUser}
          isOwner={isOwner}
          onViewInvoice={(tx) => {
            setSelectedTransactionForInvoice(tx);
            setShowInvoiceModal(true);
          }}
          onRaiseDispute={(tx) => {
            setSelectedTxForDispute(tx);
            setShowDisputeModal(true);
          }}
        />
      )}

      {/* SUB-TAB 3: DISPUTES & RESOLUTION */}
      {subTab === 'disputes' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Transparent Dispute Logs ({disputes.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Disputes freeze affected payouts pending review by project participants or moderation.
            </p>
          </div>

          {disputes.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No active or historical disputes.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Both parties are in full alignment on deliverables and payments.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <Card
                  key={d._id}
                  className="p-5 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Reason: {d.reason?.replace(/_/g, ' ')}
                    </span>
                    <Badge variant={d.status === 'resolved' ? 'success' : 'warning'}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{d.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Logged by {d.raisedBy?.name || 'User'} on {new Date(d.createdAt).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALL MODALS */}
      <ContractCreateModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onSubmit={handleSaveContract}
        projectId={projectId}
        teamMembers={teamMembers}
        initialContract={selectedContract}
        isLoading={isProcessing}
      />

      <ContractAcceptanceModal
        isOpen={showAcceptanceModal}
        onClose={() => setShowAcceptanceModal(false)}
        onAccept={handleAcceptContract}
        contract={selectedContract}
        isLoading={isProcessing}
      />

      <MilestoneCreateModal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        onSubmit={handleCreateMilestone}
        contract={selectedContract}
        isLoading={isProcessing}
      />

      <MilestoneSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onSubmit={handleSubmitWork}
        milestone={selectedMilestoneForSubmit}
        isLoading={isProcessing}
      />

      <MilestoneReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReview={handleReviewWork}
        milestone={selectedMilestoneForReview}
        isLoading={isProcessing}
      />

      <PaymentCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onPaymentSuccess={() => {
          loadFinancialData();
          setActionSuccess('Payment successfully completed!');
        }}
        milestone={selectedMilestoneForPay}
        contract={selectedContract}
      />

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        transaction={selectedTransactionForInvoice}
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmitDispute={handleRaiseDispute}
        transaction={selectedTxForDispute}
        contract={selectedContract}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default FinancialsTab;
