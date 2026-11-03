import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import {
  X,
  Calendar,
  Clock,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  Check,
  User,
  Lock,
  Sparkles,
} from 'lucide-react';

const STATUS_MAP = {
  todo: { label: 'To Do', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'In Progress', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
  in_review: { label: 'In Review', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' },
  completed: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
  blocked: { label: 'Blocked', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' },
};

const PRIORITY_MAP = {
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
};

export const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isElevated,
  currentUserId,
}) => {
  if (!isOpen || !task) return null;

  const isCreator = String(task.creator?._id || task.creator) === String(currentUserId);
  const isAssigned = (task.assignees || []).some(
    (a) => String(a._id || a) === String(currentUserId)
  );
  const canManage = isElevated || isCreator;
  const canChangeStatus = isElevated || isCreator || isAssigned;
  const statusInfo = STATUS_MAP[task.status] || STATUS_MAP.todo;
  const isOverdue =
    task.dueDate &&
    new Date() > new Date(task.dueDate) &&
    task.status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-2xl space-y-6">
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${statusInfo.badge}`}>
                {statusInfo.label}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                  PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium
                }`}
              >
                {task.priority} Priority
              </span>
              {task.milestone && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Layers className="w-3 h-3" /> {task.milestone.title}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.description || <span className="text-slate-400 italic">No description provided for this task.</span>}
          </div>
        </div>

        {/* Labels / Tags */}
        {task.labels?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Labels</h4>
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  #{lbl}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 text-xs">
          {/* Created By Attribution Card */}
          <div className="col-span-1 sm:col-span-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Task Creator & Attribution
            </span>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={task.creator?.avatar || task.creator?.avatarUrl}
                  name={task.creator?.name || 'Author'}
                  size="sm"
                  className="ring-2 ring-amber-300/60 dark:ring-amber-700/60"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{task.creator?.name || 'Community Member'}</span>
                    {isCreator && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                        You (Creator)
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    @{task.creator?.username || 'member'} • Created on {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="text-[10px]">
                {isCreator ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    ✓ You created this task
                  </span>
                ) : isAssigned ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    ✓ You are assigned to this task
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Protected Task</span>
                )}
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-500" /> Assigned Team Members
            </span>
            <div className="space-y-1.5">
              {task.assignees?.length > 0 ? (
                task.assignees.map((a) => (
                  <div key={a._id} className="flex items-center gap-2">
                    <Avatar src={a.avatar || a.avatarUrl} name={a.name || 'User'} size="xs" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{a.name}</p>
                      <span className="text-[10px] text-slate-400">@{a.username}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-slate-400 italic">No active assignees</span>
              )}
            </div>
          </div>

          {/* Dates & Effort */}
          <div className="space-y-2">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" /> Schedule & Effort
            </span>
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              <p className="flex justify-between">
                <span className="text-slate-400">Start Date:</span>
                <span className="font-semibold">
                  {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className={`font-semibold ${isOverdue ? 'text-orange-600 font-bold' : ''}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  {isOverdue && ' (Overdue)'}
                </span>
              </p>
              {task.estimatedEffort && (
                <p className="flex justify-between">
                  <span className="text-slate-400">Estimated Effort:</span>
                  <span className="font-semibold">{task.estimatedEffort} hours</span>
                </p>
              )}
              {task.completedAt && (
                <p className="flex justify-between text-emerald-600 font-semibold">
                  <span>Completed At:</span>
                  <span>{new Date(task.completedAt).toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Lifecycle Transition Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Task Workflow Stage Controls
            </h4>
            <span className="text-[11px] text-slate-400">
              Current: <strong className="text-slate-900 dark:text-white">{statusInfo.label}</strong>
            </span>
          </div>

          {!canChangeStatus ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Task workflow is protected. Only the creator (<strong>{task.creator?.name || 'author'}</strong>), assigned team members, or the project owner can update its status.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {task.status !== 'in_progress' && task.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(task, 'in_progress')}
                  className="gap-1.5 text-xs text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Move to In Progress
                </Button>
              )}

              {task.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(task, 'in_review')}
                  className="gap-1.5 text-xs text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                >
                  <Eye className="w-3.5 h-3.5" /> Submit for Peer Review
                </Button>
              )}

              {task.status !== 'completed' && canManage && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(task, 'completed')}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Mark Done
                </Button>
              )}

              {task.status !== 'blocked' && task.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(task, 'blocked')}
                  className="gap-1.5 text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Mark Blocked
                </Button>
              )}

              {task.status === 'completed' && canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(task, 'in_progress')}
                  className="gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Task
                </Button>
              )}
            </div>
          )}

          {!canManage && canChangeStatus && task.status === 'in_review' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
              This task is currently under formal review. Approval requires project owner, manager, or creator confirmation.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailModal;
