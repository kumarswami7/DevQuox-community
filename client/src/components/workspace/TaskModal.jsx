import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { X, Calendar, Clock, Layers, Users, AlertCircle, Check } from 'lucide-react';

export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  task = null, // null for create, object for edit
  members = [],
  milestones = [],
  isProcessing = false,
}) => {
  const isEditing = Boolean(task && task._id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignees: [],
    milestone: '',
    startDate: '',
    dueDate: '',
    estimatedEffort: '',
    labels: '',
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignees: (task.assignees || []).map((a) => a._id || a),
        milestone: task.milestone?._id || task.milestone || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        estimatedEffort: task.estimatedEffort !== undefined ? task.estimatedEffort : '',
        labels: Array.isArray(task.labels) ? task.labels.join(', ') : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignees: [],
        milestone: '',
        startDate: '',
        dueDate: '',
        estimatedEffort: '',
        labels: '',
      });
    }
    setFormError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAssignee = (userId) => {
    setFormData((prev) => {
      const exists = prev.assignees.includes(userId);
      if (exists) {
        return { ...prev, assignees: prev.assignees.filter((id) => id !== userId) };
      }
      return { ...prev, assignees: [...prev.assignees, userId] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (formData.title.trim().length < 2) {
      setFormError('Task title must be at least 2 characters long.');
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
      priority: formData.priority,
      assignees: formData.assignees,
      milestone: formData.milestone ? formData.milestone : null,
      startDate: formData.startDate ? formData.startDate : undefined,
      dueDate: formData.dueDate ? formData.dueDate : undefined,
      estimatedEffort: formData.estimatedEffort ? parseFloat(formData.estimatedEffort) : undefined,
      labels: formData.labels
        ? formData.labels
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean)
        : [],
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Project Task' : 'Create New Task'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update task assignment, workflow stage, and details.'
                : 'Plan work and assign active team members.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Attribution Info Banner */}
        {isEditing && task?.creator ? (
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Avatar src={task.creator.avatar || task.creator.avatarUrl} name={task.creator.name || 'Author'} size="xs" />
              <span className="text-slate-700 dark:text-slate-300">
                Created by: <strong>{task.creator.name || 'Team Member'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Recorded in audit log'}
            </span>
          </div>
        ) : !isEditing ? (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="font-bold text-primary-600 dark:text-primary-400">ℹ️ Attribution:</span>
            <span>You will be recorded as the Creator. Both you and assigned members can update its status.</span>
          </div>
        ) : null}

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
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Implement OAuth login and JWT cookie verification"
              maxLength={150}
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
              placeholder="Provide context, acceptance criteria, or technical constraints..."
              maxLength={3000}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 leading-relaxed font-normal"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="todo">To Do (Backlog)</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Milestone & Estimated Effort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Linked Milestone
              </label>
              <select
                name="milestone"
                value={formData.milestone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="">No milestone linked</option>
                {milestones.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Estimated Effort (Hours)
              </label>
              <input
                type="number"
                name="estimatedEffort"
                min="0"
                max="1000"
                step="0.5"
                value={formData.estimatedEffort}
                onChange={handleChange}
                placeholder="e.g. 8"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary-500" /> Assign To Active Team Members
            </label>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 max-h-36 overflow-y-auto space-y-1.5">
              {members.length === 0 ? (
                <p className="text-slate-400 italic">No active team members available</p>
              ) : (
                members.map((member) => {
                  const u = member.user || member;
                  const isChecked = formData.assignees.includes(u._id);

                  return (
                    <label
                      key={u._id}
                      onClick={() => toggleAssignee(u._id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatar || u.avatarUrl} name={u.name || 'User'} size="xs" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-none">{u.name}</p>
                          <span className="text-[10px] text-slate-400">@{u.username}</span>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Start Date & Due Date */}
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
                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Due Date
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

          {/* Labels */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Labels / Tags (comma-separated)
            </label>
            <input
              type="text"
              name="labels"
              value={formData.labels}
              onChange={handleChange}
              placeholder="frontend, auth, bug, high-impact"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isProcessing} className="gap-1">
              {isProcessing && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TaskModal;
