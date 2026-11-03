import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Eye,
  Flag,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react';

export const ProjectProgressWidget = ({ progress, loading }) => {
  if (loading) {
    return (
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (!progress) return null;

  const {
    overallProgress = 0,
    totalTasks = 0,
    completedTasks = 0,
    inProgressTasks = 0,
    inReviewTasks = 0,
    todoTasks = 0,
    blockedTasks = 0,
    overdueTasks = 0,
    totalMilestones = 0,
    completedMilestones = 0,
    priorityBreakdown = {},
  } = progress;

  return (
    <Card className="p-5 md:p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-sm space-y-5">
      {/* Top Header: Overall Completion Bar & Milestone Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Velocity & Completion
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Real-time metric synthesis from active tasks and project milestones.
          </p>
        </div>

        {/* Milestone Badge Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              Milestones:{' '}
              <strong className="text-slate-900 dark:text-white">
                {completedMilestones}/{totalMilestones}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-700 dark:text-primary-300 font-bold">
            <span>{overallProgress}% Complete</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
          <span>0% Kickoff</span>
          <span>
            {completedTasks} of {totalTasks} active tasks completed
          </span>
          <span>100% Launch</span>
        </div>
      </div>

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold">Total</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalTasks}</span>
          <span className="text-[10px] text-slate-400">All planned work</span>
        </div>

        {/* In Progress */}
        <div className="p-3 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs">
            <span className="font-semibold">In Progress</span>
            <PlayCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{inProgressTasks}</span>
          <span className="text-[10px] text-indigo-500/80">Actively worked</span>
        </div>

        {/* In Review */}
        <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs">
            <span className="font-semibold">In Review</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{inReviewTasks}</span>
          <span className="text-[10px] text-amber-600/80">Awaiting approval</span>
        </div>

        {/* Completed */}
        <div className="p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs">
            <span className="font-semibold">Done</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{completedTasks}</span>
          <span className="text-[10px] text-emerald-600/80">Approved</span>
        </div>

        {/* Blocked */}
        <div className="p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs">
            <span className="font-semibold">Blocked</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{blockedTasks}</span>
          <span className="text-[10px] text-rose-600/80">Requires unblocking</span>
        </div>

        {/* Overdue */}
        <div className="p-3 rounded-xl border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/30 dark:bg-orange-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 text-xs">
            <span className="font-semibold">Overdue</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-orange-700 dark:text-orange-300 mt-1">{overdueTasks}</span>
          <span className="text-[10px] text-orange-600/80">Past due date</span>
        </div>
      </div>
    </Card>
  );
};

export default ProjectProgressWidget;
