import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, ShieldCheck, AlertCircle, DollarSign, Globe, GitBranch, Layers, Tag } from 'lucide-react';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Cloud & DevOps',
  'Blockchain & Web3',
  'UI/UX Design',
  'Cybersecurity',
  'Open Source Tooling',
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open (Hiring & Backlog)' },
  { value: 'in_progress', label: 'In Progress (Active Sprint)' },
  { value: 'completed', label: 'Completed (Shipped)' },
  { value: 'cancelled', label: 'Cancelled / Paused' },
];

export const ProjectDetailsEditModal = ({
  isOpen,
  onClose,
  project,
  onSave,
  isProcessing = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    status: 'in_progress',
    budgetMin: '',
    budgetMax: '',
    githubUrl: '',
    liveUrl: '',
    requiredSkills: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        category: project.category || 'Web Development',
        status: project.status || 'in_progress',
        budgetMin: project.budget?.min ?? '',
        budgetMax: project.budget?.max ?? '',
        githubUrl: project.githubUrl || project.repositoryUrl || '',
        liveUrl: project.liveUrl || project.demoUrl || '',
        requiredSkills: Array.isArray(project.requiredSkills)
          ? project.requiredSkills.join(', ')
          : '',
      });
      setFormError('');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Project title cannot be empty.');
      return;
    }
    if (formData.title.trim().length < 3) {
      setFormError('Project title must be at least 3 characters.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Project description cannot be empty.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      status: formData.status,
      githubUrl: formData.githubUrl.trim(),
      liveUrl: formData.liveUrl.trim(),
      requiredSkills: formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (formData.budgetMin !== '' || formData.budgetMax !== '') {
      payload.budget = {
        type: project.budget?.type || 'fixed',
        currency: project.budget?.currency || 'USD',
        min: formData.budgetMin !== '' ? Number(formData.budgetMin) : undefined,
        max: formData.budgetMax !== '' ? Number(formData.budgetMax) : undefined,
      };
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Project Details
              </h3>
              <p className="text-xs text-slate-500">
                Project Owner Authority • Core metadata & sprint settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Owner Governance Notice */}
        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Only you as the <strong>Project Owner</strong> can edit project details. Non-owners and team members are restricted to adding tasks and updating their own assigned work.
          </span>
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
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Distributed Task Orchestrator"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Project Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed architecture description and deliverables..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium leading-relaxed resize-none"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-500" /> Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Project Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Budget Range (USD)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                placeholder="Min ($)"
                min="0"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                placeholder="Max ($)"
                min="0"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Repository & Live Demo URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" /> GitHub / Repository URL
              </label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> Live Demo URL
              </label>
              <input
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="https://app.example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary-500" /> Required Skills (comma separated)
            </label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="React, Node.js, TypeScript, Docker"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isProcessing}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
            >
              {isProcessing ? 'Saving Changes...' : 'Save Project Details'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

