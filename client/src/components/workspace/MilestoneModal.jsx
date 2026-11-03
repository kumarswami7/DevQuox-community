import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Calendar, Layers, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MilestoneModal = ({
  isOpen,
  onClose,
  onSubmit,
  milestone = null, // null for create, object for edit
  isProcessing = false,
}) => {
  const isEditing = Boolean(milestone && milestone._id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'upcoming',
    startDate: '',
    dueDate: '',
    deliverables: [],
    order: 1,
  });

  const [newDeliverable, setNewDeliverable] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || '',
        description: milestone.description || '',
        status: milestone.status || 'upcoming',
        startDate: milestone.startDate ? new Date(milestone.startDate).toISOString().slice(0, 10) : '',
        dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : '',
        deliverables: Array.isArray(milestone.deliverables) ? [...milestone.deliverables] : [],
        order: milestone.order !== undefined ? milestone.order : 1,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'upcoming',
        startDate: '',
        dueDate: '',
        deliverables: [],
        order: 1,
      });
    }
    setNewDeliverable('');
    setFormError('');
  }, [milestone, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setFormData((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable.trim()],
    }));
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Milestone title is required.');
      return;
    }
    if (formData.title.trim().length < 2) {
      setFormError('Milestone title must be at least 2 characters long.');
      return;
    }

    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.startDate)) {
        setFormError('Due date cannot be earlier than start date.');
        return;
      }
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      startDate: formData.startDate ? formData.startDate : undefined,
      dueDate: formData.dueDate ? formData.dueDate : undefined,
      deliverables: formData.deliverables,
      order: parseInt(formData.order, 10) || 1,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Project Milestone' : 'Create Project Milestone'}
            </h3>
            <p className="text-xs text-slate-500">
              Define target milestones, due dates, and deliverables.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Milestone Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Milestone 1: MVP Core Architecture & Auth"
              maxLength={120}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Overview of sprint goals and deliverables..."
              maxLength={2000}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 leading-relaxed font-normal"
            />
          </div>

          {/* Status & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Sequence Order</label>
              <input
                type="number"
                name="order"
                min="1"
                max="50"
                value={formData.order}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Target Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>
          </div>

          {/* Target Deliverables */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300">Target Deliverables</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDeliverable();
                  }
                }}
                placeholder="e.g. Working API documentation and Swagger spec"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddDeliverable}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            {formData.deliverables.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {formData.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isProcessing} className="gap-1">
              {isProcessing && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Milestone'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MilestoneModal;
