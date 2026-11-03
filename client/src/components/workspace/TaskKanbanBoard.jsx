import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Eye,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  User,
  Plus,
  Lock,
} from 'lucide-react';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    description: 'Backlog & planned items',
    color: 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40',
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    accent: 'bg-slate-400',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Active development',
    color: 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    accent: 'bg-indigo-500',
  },
  {
    id: 'in_review',
    title: 'In Review',
    description: 'Peer & owner review',
    color: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    accent: 'bg-amber-500',
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Verified & approved',
    color: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  {
    id: 'blocked',
    title: 'Blocked',
    description: 'Impediments & dependencies',
    color: 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    accent: 'bg-rose-500',
  },
];

const PRIORITY_STYLES = {
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const TaskKanbanBoard = ({
  tasks = [],
  onSelectTask,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onCreateTask,
  isElevated,
  currentUserId,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border ${col.color} p-3.5 space-y-3 min-h-[450px] flex flex-col`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {col.title}
                </h4>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${col.badge}`}>
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards Queue */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-1">
              {colTasks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200/70 dark:border-slate-800/60 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400">
                  <p className="text-xs font-medium">No tasks here</p>
                  {col.id === 'todo' && (
                    <button
                      onClick={onCreateTask}
                      className="mt-1 text-[11px] text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add a task
                    </button>
                  )}
                </div>
              ) : (
                colTasks.map((task) => {
                  const isCreator = String(task.creator?._id || task.creator) === String(currentUserId);
                  const canManage = isElevated || isCreator;
                  const isAssigned = (task.assignees || []).some(
                    (a) => String(a._id || a) === String(currentUserId)
                  );
                  const canChangeStatus = isElevated || isCreator || isAssigned;
                  const isOverdue =
                    task.dueDate &&
                    new Date() > new Date(task.dueDate) &&
                    task.status !== 'completed';

                  return (
                    <Card
                      key={task._id}
                      className="p-3.5 border-slate-200 dark:border-slate-800/90 bg-white dark:bg-cardDark hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 cursor-pointer space-y-3 group"
                      onClick={() => onSelectTask(task)}
                    >
                      {/* Priority, Creator Attribution & Actions Top Row */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                              PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Creator Attribution */}
                          {isCreator ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                              By You
                            </span>
                          ) : task.creator ? (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[100px]"
                              title={`Created by ${task.creator.name}`}
                            >
                              by {task.creator.name?.split(' ')[0]}
                            </span>
                          ) : null}
                        </div>

                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canManage && (
                            <>
                              <button
                                onClick={() => onEditTask(task)}
                                title="Edit task"
                                className="p-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteTask(task)}
                                title="Delete task"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {task.title}
                        </h5>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Milestone Pill */}
                      {task.milestone && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40 max-w-full truncate">
                          <Layers className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{task.milestone.title}</span>
                        </div>
                      )}

                      {/* Due Date & Effort */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {task.dueDate ? (
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              isOverdue
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">No due date</span>
                        )}

                        {task.estimatedEffort && (
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Clock className="w-3 h-3" /> {task.estimatedEffort}h
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Assignees Avatars & Quick Status Buttons */}
                      <div
                        className="flex items-center justify-between gap-2 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Assignee Avatars */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {task.assignees?.length > 0 ? (
                            task.assignees.slice(0, 3).map((a, idx) => (
                              <Avatar
                                key={a._id || idx}
                                src={a.avatar || a.avatarUrl}
                                name={a.name || 'User'}
                                size="xs"
                                className="border-2 border-white dark:border-cardDark shadow-xs"
                              />
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                          )}
                          {task.assignees?.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-500 pl-1">
                              +{task.assignees.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Quick Transition Action Button (Protected: Creator, Assignee, Owner) */}
                        <div className="flex items-center gap-1">
                          {!canChangeStatus ? (
                            <span
                              className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                              title="Protected: Only the task creator, assigned member, or project owner can change status."
                            >
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <>
                              {task.status === 'todo' && (
                                <button
                                  onClick={() => onStatusChange(task, 'in_progress')}
                                  title="Start working"
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-300" /> Start
                                </button>
                              )}

                              {task.status === 'in_progress' && (
                                <button
                                  onClick={() => onStatusChange(task, 'in_review')}
                                  title="Submit for review"
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-600 dark:text-amber-300 flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Review
                                </button>
                              )}

                              {task.status === 'in_review' && canManage && (
                                <button
                                  onClick={() => onStatusChange(task, 'completed')}
                                  title="Approve and mark done"
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-300 flex items-center gap-1 transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Approve
                                </button>
                              )}

                              {task.status === 'completed' && canManage && (
                                <button
                                  onClick={() => onStatusChange(task, 'in_progress')}
                                  title="Reopen task"
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" /> Reopen
                                </button>
                              )}

                              {task.status === 'blocked' && (
                                <button
                                  onClick={() => onStatusChange(task, 'in_progress')}
                                  title="Unblock task"
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-300 flex items-center gap-1 transition-colors"
                                >
                                  Unblock
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskKanbanBoard;
