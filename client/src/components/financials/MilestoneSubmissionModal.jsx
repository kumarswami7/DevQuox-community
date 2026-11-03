import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Send, Plus, Trash2, Link as LinkIcon, FileText } from 'lucide-react';

export const MilestoneSubmissionModal = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState(['']);
  const [formError, setFormError] = useState('');

  if (!isOpen || !milestone) return null;

  const handleAddLink = () => {
    setLinks([...links, '']);
  };

  const handleLinkChange = (index, value) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  };

  const handleRemoveLink = (index) => {
    if (links.length === 1) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!notes.trim()) {
      setFormError('Submission notes or work description is required.');
      return;
    }

    const cleanedLinks = links.map((l) => l.trim()).filter(Boolean);

    onSubmit(milestone._id, {
      notes: notes.trim(),
      links: cleanedLinks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Submit Milestone Deliverables
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

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Milestone</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{milestone.title}</h4>
            <p className="text-xs text-slate-500">{milestone.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Submission Notes / Deliverable Summary *
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the work completed, branch name, testing performed, or instructions for the client..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-primary-500" />
                Deliverable Links (GitHub PR, Figma, Deployed Preview)
              </label>
              <button
                type="button"
                onClick={handleAddLink}
                className="text-[11px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>
            <div className="space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(idx, e.target.value)}
                    placeholder="https://github.com/org/repo/pull/42 or demo url"
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
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
            <Button type="submit" size="sm" isLoading={isLoading} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Submit for Client Review
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MilestoneSubmissionModal;
