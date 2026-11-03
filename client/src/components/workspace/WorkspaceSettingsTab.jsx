import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  Globe,
  GitBranch,
  Layers,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Save,
} from 'lucide-react';

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

export const WorkspaceSettingsTab = ({
  project,
  isOwner = false,
  onSaveProject,
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

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        category: project.category || 'Web Development',
        status: project.status || 'in_progress',
        budgetMin: project.budget?.min ?? '',
        budgetMax: project.budget?.max ?? '',
        githubUrl: project.githubUrl || project.githubRepoUrl || project.repositoryUrl || '',
        liveUrl: project.liveUrl || project.liveDemoUrl || project.demoUrl || '',
        requiredSkills: Array.isArray(project.requiredSkills)
          ? project.requiredSkills.join(', ')
          : '',
      });
    }
  }, [project]);

  const handleChange = (e) => {
    if (!isOwner) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    setErrorMsg('');
    setSavedSuccess(false);

    if (!formData.title.trim()) {
      setErrorMsg('Project title cannot be empty.');
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

    try {
      await onSaveProject(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Governance Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
        isOwner
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
      }`}>
        <div className="flex items-center gap-3">
          {isOwner ? (
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <Lock className="w-5 h-5 text-slate-400 shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isOwner ? 'Project Owner Governance Active' : 'Read-Only Project Settings'}
            </h4>
            <p className="text-xs">
              {isOwner
                ? 'You have complete authority over project metadata, budget parameters, and lifecycle settings.'
                : `Project parameters are managed exclusively by Project Owner (@${project.owner?.name || 'Owner'}).`}
            </p>
          </div>
        </div>

        {isOwner && (
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-200/60 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
            Owner Only
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Project settings successfully updated and broadcast to team workspace.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="p-6 md:p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Project Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Project Title {isOwner && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={!isOwner || isProcessing}
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                isOwner
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500'
                  : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
              } font-medium`}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Technical Overview & Architecture Description {isOwner && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              disabled={!isOwner || isProcessing}
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                isOwner
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500'
                  : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
              } font-medium leading-relaxed resize-none`}
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-500" /> Category
              </label>
              {isOwner ? (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.category}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Sprint Lifecycle Status
              </label>
              {isOwner ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isProcessing}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.status.toUpperCase()}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium uppercase"
                />
              )}
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
                disabled={!isOwner || isProcessing}
                placeholder="Min ($)"
                className={`w-full px-3.5 py-2 rounded-xl border ${
                  isOwner
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                }`}
              />
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                disabled={!isOwner || isProcessing}
                placeholder="Max ($)"
                className={`w-full px-3.5 py-2 rounded-xl border ${
                  isOwner
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" /> Version Control (GitHub / Repo URL)
              </label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                disabled={!isOwner || isProcessing}
                placeholder="https://github.com/..."
                className={`w-full px-3.5 py-2 rounded-xl border ${
                  isOwner
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                }`}
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
                disabled={!isOwner || isProcessing}
                placeholder="https://app.example.com"
                className={`w-full px-3.5 py-2 rounded-xl border ${
                  isOwner
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary-500" /> Required Skills & Stack
            </label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              disabled={!isOwner || isProcessing}
              placeholder="React, Node.js, TypeScript, Docker"
              className={`w-full px-3.5 py-2 rounded-xl border ${
                isOwner
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Owner Submit Action */}
          {isOwner && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isProcessing}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{isProcessing ? 'Updating Project Settings...' : 'Save Changes'}</span>
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

