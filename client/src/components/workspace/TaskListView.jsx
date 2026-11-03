import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import {
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Lock,
} from 'lucide-react';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
  in_review: { label: 'In Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
  blocked: { label: 'Blocked', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' },
};

const PRIORITY_BADGES = {
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export const TaskListView = ({
  tasks = [],
  onSelectTask,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  isElevated,
  currentUserId,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-cardDark text-slate-400 space-y-2">
        <p className="text-sm font-semibold">No tasks matching current filter criteria.</p>
        <p className="text-xs text-slate-500">Create a new task or adjust your search and filters above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Task Details</th>
            <th className="py-3 px-4">Created By</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Milestone</th>
            <th className="py-3 px-4">Assignees</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Last Updated</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tasks.map((task) => {
            const isCreator = String(task.creator?._id || task.creator) === String(currentUserId);
            const canManage = isElevated || isCreator;
            const isAssigned = (task.assignees || []).some(
              (a) => String(a._id || a) === String(currentUserId)
            );
            const canChangeStatus = isElevated || isCreator || isAssigned;
            const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
            const isOverdue =
              task.dueDate &&
              new Date() > new Date(task.dueDate) &&
              task.status !== 'completed';

            return (
              <tr
                key={task._id}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                onClick={() => onSelectTask(task)}
              >
                {/* Title & Description */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                </td>

                {/* Created By Attribution */}
                <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {isCreator ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      You
                    </span>
                  ) : task.creator ? (
                    <div className="flex items-center gap-1.5" title={`Added by ${task.creator.name}`}>
                      <Avatar
                        src={task.creator.avatar || task.creator.avatarUrl}
                        name={task.creator.name || 'User'}
                        size="xs"
                        className="w-5 h-5 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                        {task.creator.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Unknown</span>
                  )}
                </td>

                {/* Status Dropdown / Protected Badge */}
                <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                  {canChangeStatus ? (
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none ${statusConfig.color}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-85 ${statusConfig.color}`}
                      title="Protected: Only the task creator, assigned member, or project owner can change status."
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{statusConfig.label}</span>
                    </span>
                  )}
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>

                {/* Milestone */}
                <td className="py-3.5 px-4">
                  {task.milestone ? (
                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <Layers className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{task.milestone.title}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">None</span>
                  )}
                </td>

                {/* Assignees */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center -space-x-1.5">
                    {task.assignees?.length > 0 ? (
                      task.assignees.map((a, idx) => (
                        <Avatar
                          key={a._id || idx}
                          src={a.avatar || a.avatarUrl}
                          name={a.name || 'User'}
                          size="xs"
                          className="border border-white dark:border-cardDark"
                        />
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {task.dueDate ? (
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        isOverdue ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No date</span>
                  )}
                </td>

                {/* Last Updated */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                  {new Date(task.updatedAt || task.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {canManage && (
                      <>
                        <button
                          onClick={() => onEditTask(task)}
                          title="Edit task"
                          className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task)}
                          title="Delete task"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListView;
