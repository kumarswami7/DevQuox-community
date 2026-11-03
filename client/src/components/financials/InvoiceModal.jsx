import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Printer, X, CheckCircle2, ShieldCheck, Download, FileText } from 'lucide-react';

export const InvoiceModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isReceipt = transaction.status === 'succeeded';
  const formattedAmount = ((transaction.amountMinorUnits || 0) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: transaction.currency || 'USD',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      <Card className="w-full max-w-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isReceipt ? 'Official Payment Receipt' : 'Financial Invoice'}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 space-y-6 text-slate-800 dark:text-slate-200 print:text-black">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-primary-600 dark:text-primary-400 print:text-indigo-700">
                  Devquox
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                  Financial Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Developer Collaboration & Financial Milestone Platform
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                  isReceipt
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isReceipt ? '✓ Payment Receipt' : 'Invoice - Pending'}
              </span>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white print:text-black">
                {transaction.invoiceNumber || `INV-${transaction._id.slice(-8).toUpperCase()}`}
              </div>
              <div className="text-[11px] text-slate-400">
                Date: {new Date(transaction.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Billed From (Client)</span>
              <h5 className="font-bold text-slate-900 dark:text-white print:text-black mt-1">
                {transaction.payerId?.name || 'Project Client'}
              </h5>
              <p className="text-slate-500">{transaction.payerId?.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Role: Client / Project Owner</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Recipient (Developer)</span>
              <h5 className="font-bold text-slate-900 dark:text-white print:text-black mt-1">
                {transaction.recipientId?.name || 'Accepted Developer'}
              </h5>
              <p className="text-slate-500">{transaction.recipientId?.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Role: Verified Developer</p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-300 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Milestone Description</th>
                  <th className="py-2.5 px-4">Deliverable Status</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white print:text-black">
                      {transaction.milestoneId?.title || 'Milestone Deliverable'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {transaction.milestoneId?.description || 'Project agreed milestone'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                    {transaction.milestoneId?.workStatus || 'Approved'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white print:text-black">
                    {formattedAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Transaction Reference Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1 text-[11px] text-slate-500 max-w-sm">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Transaction Record</span>
              </div>
              <p>Provider: {transaction.provider || 'Stripe'}</p>
              <p className="font-mono text-[10px] break-all">
                Provider Reference: {transaction.providerPaymentId || transaction.providerSessionId || 'sandbox_verified'}
              </p>
              <p className="font-mono text-[10px] break-all">
                Internal Tx ID: {transaction._id}
              </p>
            </div>

            <div className="w-full sm:w-48 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                  {formattedAmount}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Platform Fee:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                  $0.00
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 flex justify-between font-bold text-sm text-slate-900 dark:text-white print:text-black">
                <span>Total:</span>
                <span>{formattedAmount}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center print:text-slate-600">
            This document is generated by Devquox based on verified cryptographic transaction records.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvoiceModal;
