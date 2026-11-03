import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Eye,
  Layers,
  Users,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  Kanban,
  List,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';

export const WorkspaceOverviewTab = ({
  project,
  progress,
  tasks = [],
  milestones = [],
  activities = [],
  team = [],
  onNavigateTab,
  onCreateTask,
  onCreateMilestone,
  onSelectTask,
  canCreateTask,
  canCreateMilestone,
}) => {
  const totalTasks = progress?.totalTasks ?? tasks.length;
  const completedTasks = progress?.completedTasks ?? tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = progress?.inProgressTasks ?? tasks.filter((t) => t.status === 'in_progress').length;
  const inReviewTasks = progress?.inReviewTasks ?? tasks.filter((t) => t.status === 'in_review').length;
  const todoTasks = progress?.todoTasks ?? tasks.filter((t) => t.status === 'todo').length;
  const blockedTasks = progress?.blockedTasks ?? tasks.filter((t) => t.status === 'blocked').length;
  const overdueTasks = progress?.overdueTasks ?? tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length;

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Recent 5 tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  // Active upcoming milestones
  const upcomingMilestones = milestones
    .filter((m) => m.status !== 'completed')
    .slice(0, 3);

  // Team contribution calculation
  const memberContributions = team.map((member) => {
    const memberId = String(member.user?._id || member.user);
    const assigned = tasks.filter((t) =>
      Array.isArray(t.assignees) && t.assignees.some((a) => String(a._id || a) === memberId)
    );
    const completed = assigned.filter((t) => t.status === 'completed');
    const created = tasks.filter((t) => String(t.creator?._id || t.creator) === memberId);

    return {
      user: member.user,
      role: member.role,
      assignedCount: assigned.length,
      completedCount: completed.length,
      createdCount: created.length,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP SPRINT HEALTH & KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Overall Completion */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50/50 dark:from-primary-950/30 dark:to-slate-900 border border-primary-200/70 dark:border-primary-900/40 space-y-1">
          <div className="flex items-center justify-between text-primary-600 dark:text-primary-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Progress</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
            {overallProgress}%
          </div>
          <span className="text-[10px] text-slate-500">{completedTasks} of {totalTasks} done</span>
        </div>

        {/* Total Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Backlog</span>
            <Kanban className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalTasks}
          </div>
          <span className="text-[10px] text-slate-500">Total planned tasks</span>
        </div>

        {/* To Do */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">To Do</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
            {todoTasks}
          </div>
          <span className="text-[10px] text-slate-500">Queued for work</span>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {inProgressTasks}
          </div>
          <span className="text-[10px] text-slate-500">Active dev tasks</span>
        </div>

        {/* In Review */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Review</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {inReviewTasks}
          </div>
          <span className="text-[10px] text-slate-500">Peer & owner review</span>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedTasks}
          </div>
          <span className="text-[10px] text-slate-500">Approved & shipped</span>
        </div>

        {/* Blocked or Overdue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Blocked</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {blockedTasks}
          </div>
          <span className="text-[10px] text-slate-500">
            {overdueTasks > 0 ? `${overdueTasks} overdue` : '0 overdue'}
          </span>
        </div>
      </div>

      {/* 2. PROGRESS BAR BANNER */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Sprint Velocity & Overall Progress
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {overallProgress}% Achieved
            </span>
            <span className="text-slate-400">({completedTasks}/{totalTasks} Tasks)</span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Completed: ${completedTasks}`}
          />
          <div
            style={{ width: `${totalTasks > 0 ? (inReviewTasks / totalTasks) * 100 : 0}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`In Review: ${inReviewTasks}`}
          />
          <div
            style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
            className="bg-indigo-500 transition-all duration-500"
            title={`In Progress: ${inProgressTasks}`}
          />
          <div
            style={{ width: `${totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Blocked: ${blockedTasks}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed ({completedTasks})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Review ({inReviewTasks})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> In Progress ({inProgressTasks})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Blocked ({blockedTasks})</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" onClick={() => onNavigateTab('board')} className="gap-1 text-xs">
              <Kanban className="w-3 h-3" /> View Board
            </Button>
            <Button size="xs" variant="outline" onClick={() => onNavigateTab('tasks')} className="gap-1 text-xs">
              <List className="w-3 h-3" /> View List
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. TWO-COLUMN SPLIT: RECENT TASKS & UPCOMING MILESTONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column A: Recent Task Updates */}
        <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Task Updates
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              <span>See All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentTasks.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => onSelectTask(t)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>by {t.creator?.name || 'Creator'}</span>
                      {t.dueDate && (
                        <span>• Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      t.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : t.status === 'in_progress'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : t.status === 'in_review'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : t.status === 'blocked'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-xs">No tasks recorded yet in this workspace.</p>
              <Button size="xs" variant="primary" onClick={onCreateTask} className="gap-1">
                <Plus className="w-3 h-3" /> Create First Task
              </Button>
            </div>
          )}
        </Card>

        {/* Column B: Active Milestones */}
        <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Upcoming Milestones
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('milestones')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              <span>Manage ({milestones.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingMilestones.length > 0 ? (
            <div className="space-y-3">
              {upcomingMilestones.map((m) => (
                <div
                  key={m._id}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.title}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>

                  {m.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>by {m.creator?.name || 'Owner'}</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {m.progress || 0}% Complete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-xs">No active upcoming milestones.</p>
              {canCreateMilestone && (
                <Button size="xs" variant="outline" onClick={onCreateMilestone} className="gap-1">
                  <Plus className="w-3 h-3" /> Add Milestone
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* 4. TEAM CONTRIBUTION ROSTER SUMMARY */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Team Contribution Breakdown
            </h4>
          </div>
          <button
            onClick={() => onNavigateTab('team')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
          >
            <span>Team Roster ({team.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {memberContributions.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  src={m.user?.avatar || m.user?.avatarUrl}
                  name={m.user?.name || 'Member'}
                  size="sm"
                  className="ring-1 ring-slate-300 dark:ring-slate-700"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {m.user?.name || 'Member'}
                  </p>
                  <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 capitalize">
                    {m.role}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] shrink-0">
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {m.completedCount}/{m.assignedCount}
                </span>
                <span className="block text-[10px] text-slate-400">Tasks Done</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

