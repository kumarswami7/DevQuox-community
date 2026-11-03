import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  PlayCircle,
  XCircle,
} from 'lucide-react';

const MILESTONE_STATUS = {
  upcoming: { label: 'Upcoming', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'In Progress', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' },
  completed: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
  cancelled: { label: 'Cancelled', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' },
};

export const MilestoneSection = ({
  milestones = [],
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onStatusChange,
  isElevated,
}) => {
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Milestones & Deliverables
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Track major project phases, sprint targets, and completion deliverables.
          </p>
        </div>

        {isElevated && (
          <Button size="sm" onClick={onCreateMilestone} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>New Milestone</span>
          </Button>
        )}
      </div>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No milestones created yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Break down the project lifecycle into structured phases with deadlines and key deliverables.
            </p>
          </div>
          {isElevated && (
            <Button size="sm" onClick={onCreateMilestone} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Milestone</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {milestones.map((milestone) => {
            const statusConfig = MILESTONE_STATUS[milestone.status] || MILESTONE_STATUS.upcoming;
            const progress = milestone.progress || 0;
            const isOverdue =
              milestone.dueDate &&
              new Date() > new Date(milestone.dueDate) &&
              milestone.status !== 'completed' &&
              milestone.status !== 'cancelled';

            return (
              <Card
                key={milestone._id}
                className="p-5 md:p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-sm space-y-4"
              >
                {/* Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Phase {milestone.order || 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  {/* Top Actions */}
                  {isElevated && (
                    <div className="flex items-center gap-2 self-start">
                      <select
                        value={milestone.status}
                        onChange={(e) => onStatusChange(milestone, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => onEditMilestone(milestone)}
                        title="Edit milestone"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMilestone(milestone)}
                        title="Delete milestone"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Linked Task Stats */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      Progress: <strong className="text-indigo-600 dark:text-indigo-400">{progress}%</strong>
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {milestone.completedTasks || 0} of {milestone.totalTasks || 0} tasks completed
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> In Progress:{' '}
                      <strong className="text-slate-600 dark:text-slate-300 font-semibold">
                        {milestone.inProgressTasks || 0}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done:{' '}
                      <strong className="text-slate-600 dark:text-slate-300 font-semibold">
                        {milestone.completedTasks || 0}
                      </strong>
                    </span>
                    {milestone.dueDate && (
                      <span className="flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3 text-slate-400" /> Target Date:{' '}
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Deliverables Checklist */}
                {milestone.deliverables?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Target Deliverables
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {milestone.deliverables.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-extrabold">{i + 1}</span>
                          </div>
                          <span className="truncate">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MilestoneSection;
