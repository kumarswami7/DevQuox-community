import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Plus, Trash2, DollarSign, Calendar, FileText } from 'lucide-react';

export const ContractCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  teamMembers = [],
  initialContract = null,
  isLoading = false,
}) => {
  const [developerId, setDeveloperId] = useState('');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState(['']);
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('milestone_based');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [formError, setFormError] = useState('');

  // Pre-fill if editing or amending
  useEffect(() => {
    if (initialContract) {
      setDeveloperId(initialContract.developerId?._id || initialContract.developerId || '');
      setTitle(initialContract.title || '');
      setScope(initialContract.scope || '');
      setDeliverables(initialContract.deliverables?.length ? initialContract.deliverables : ['']);
      setTotalAmount(initialContract.totalAmountMinorUnits ? (initialContract.totalAmountMinorUnits / 100).toString() : '');
      setCurrency(initialContract.currency || 'USD');
      setPaymentTerms(initialContract.paymentTerms || 'milestone_based');
      setStartDate(initialContract.startDate ? initialContract.startDate.slice(0, 10) : '');
      setExpectedCompletionDate(initialContract.expectedCompletionDate ? initialContract.expectedCompletionDate.slice(0, 10) : '');
    } else {
      setTitle('');
      setScope('');
      setDeliverables(['']);
      setTotalAmount('');
      setCurrency('USD');
      setPaymentTerms('milestone_based');
      setStartDate('');
      setExpectedCompletionDate('');
    }
  }, [initialContract, isOpen]);

  if (!isOpen) return null;

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, '']);
  };

  const handleDeliverableChange = (index, value) => {
    const updated = [...deliverables];
    updated[index] = value;
    setDeliverables(updated);
  };

  const handleRemoveDeliverable = (index) => {
    if (deliverables.length === 1) return;
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Contract title is required.');
      return;
    }
    if (!developerId) {
      setFormError('Please select the assigned developer.');
      return;
    }
    if (!scope.trim()) {
      setFormError('Scope of work is required.');
      return;
    }
    const parsedAmount = parseFloat(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Valid positive total budget amount is required.');
      return;
    }

    const cleanedDeliverables = deliverables.map((d) => d.trim()).filter(Boolean);
    if (cleanedDeliverables.length === 0) {
      setFormError('At least one deliverable item is required.');
      return;
    }

    const payload = {
      projectId,
      developerId,
      title: title.trim(),
      scope: scope.trim(),
      deliverables: cleanedDeliverables,
      amount: parsedAmount,
      currency,
      paymentTerms,
      startDate: startDate || undefined,
      expectedCompletionDate: expectedCompletionDate || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <Card className="w-full max-w-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {initialContract ? 'Propose Contract Amendment' : 'Create Financial Agreement'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Agreement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack DevConnect Milestone Agreement"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Developer *
              </label>
              <select
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select accepted team developer...</option>
                {teamMembers.map((member) => {
                  const u = member.user || member;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email || u.username})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Budget *
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="2500.00"
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Scope of Work *
            </label>
            <textarea
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Outline the detailed requirements, architecture deliverables, coding standards, and project expectations..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deliverables & Acceptance Criteria *
              </label>
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                    placeholder={`Deliverable #${idx + 1}`}
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  {deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Completion Date
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Contract Lifecycle & Safety Notice:
            </p>
            <p>
              Saving this agreement will generate a draft version. The assigned developer will review the terms before acceptance. Material amendments create a new version requiring mutual re-acceptance.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              {initialContract ? 'Save & Propose Amendment' : 'Create Draft Agreement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ContractCreateModal;
