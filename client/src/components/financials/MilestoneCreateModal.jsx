import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Layers, DollarSign, Calendar, Plus, Trash2 } from 'lucide-react';

export const MilestoneCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  contract,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState(['']);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen || !contract) return null;

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
      setFormError('Milestone title is required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Valid milestone amount is required.');
      return;
    }

    const cleanedDeliverables = deliverables.map((d) => d.trim()).filter(Boolean);

    onSubmit({
      contractId: contract._id,
      title: title.trim(),
      description: description.trim(),
      deliverables: cleanedDeliverables,
      amount: parsedAmount,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Add Financial Milestone
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Milestone Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 1: Authentication & Database Architecture"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Milestone Amount ({contract.currency || 'USD'}) *
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State what requirements must be satisfied for milestone completion..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deliverable Items
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

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Add Milestone
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MilestoneCreateModal;
