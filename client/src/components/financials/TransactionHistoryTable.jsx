import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  RotateCcw,
} from 'lucide-react';

export const TransactionHistoryTable = ({
  transactions = [],
  currentUser,
  onViewInvoice,
  onRaiseDispute,
  onRequestRefund,
  isOwner,
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="success">Verified Succeeded</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'refunded':
        return <Badge variant="accent">Refunded</Badge>;
      case 'disputed':
        return <Badge variant="danger">Disputed</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          Financial Ledger & Transactions ({transactions.length})
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable transaction records with unique invoice references and verified timestamps.
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
          <CreditCard className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No transactions recorded yet.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Completed milestone payments will appear here with cryptographic transaction IDs and receipts.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Invoice / Tx Ref</th>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Payer / Recipient</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {transactions.map((tx) => {
                const formattedAmount = ((tx.amountMinorUnits || 0) / 100).toLocaleString('en-US', {
                  style: 'currency',
                  currency: tx.currency || 'USD',
                });

                const isPayer = String(tx.payerId?._id || tx.payerId) === String(currentUser?._id);

                return (
                  <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {tx.invoiceNumber || tx._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {tx.milestoneId?.title || 'Milestone Payment'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-400">Payer: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.payerId?.name || 'Client'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Recipient: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.recipientId?.name || 'Developer'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formattedAmount}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewInvoice(tx)}
                          className="h-7 px-2 text-[11px] gap-1 text-primary-600 dark:text-primary-400"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Receipt
                        </Button>

                        {tx.status === 'succeeded' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRaiseDispute(tx)}
                            className="h-7 px-2 text-[11px] gap-1 text-slate-500 hover:text-rose-500"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Dispute
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryTable;
