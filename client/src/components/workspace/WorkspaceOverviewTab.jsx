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
  Edit2,
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
  onStatusChange,
  onMilestoneStatusChange,
  onEditMilestone,
  canCreateTask,
  canCreateMilestone,
  isElevated = false,
  currentUserId = null,
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
      <Card className="p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark rounded-2xl shadow-xs space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/60 dark:to-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-200/60 dark:border-primary-800/60 shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Sprint Velocity & Overall Progress
                </h4>
                {totalTasks > 0 && overallProgress === 100 && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Sprint Complete
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Workspace milestone delivery and completion metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {overallProgress}% Achieved
              </span>
              <span className="text-slate-400 text-[11px]">
                ({completedTasks}/{totalTasks} Tasks)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            {totalTasks > 0 ? (
              <>
                <div
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Completed: ${completedTasks}`}
                />
                <div
                  style={{ width: `${(inReviewTasks / totalTasks) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`In Review: ${inReviewTasks}`}
                />
                <div
                  style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                  className="bg-indigo-500 transition-all duration-500"
                  title={`In Progress: ${inProgressTasks}`}
                />
                <div
                  style={{ width: `${(blockedTasks / totalTasks) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Blocked: ${blockedTasks}`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-slate-200/60 dark:bg-slate-800/60" />
            )}
          </div>
        </div>

        {/* Metrics & Action Buttons Bottom Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed</span>
              <strong className="font-extrabold ml-0.5">({completedTasks})</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>In Review</span>
              <strong className="font-extrabold ml-0.5">({inReviewTasks})</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>In Progress</span>
              <strong className="font-extrabold ml-0.5">({inProgressTasks})</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Blocked</span>
              <strong className="font-extrabold ml-0.5">({blockedTasks})</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('board')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5 text-indigo-500" />
              <span>View Board</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <List className="w-3.5 h-3.5 text-primary-500" />
              <span>View List</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 3. TWO-COLUMN SPLIT: RECENT TASKS & UPCOMING MILESTONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Column A: Recent Task Updates */}
        <Card className="p-5 md:p-6 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-sm transition-all min-h-[300px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Recent Task Updates
                  </h4>
                  <p className="text-[11px] text-slate-400">Latest active sprint items</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task List or Empty State */}
            {recentTasks.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
                {recentTasks.map((t) => {
                  const isAssigned = (t.assignees || []).some(
                    (a) => String(a._id || a) === String(currentUserId)
                  );
                  const isCreator = String(t.creator?._id || t.creator) === String(currentUserId);
                  const canUpdate = isElevated || isAssigned || (!t.assignees?.length && isCreator);
                  const primaryAssignee = t.assignees?.[0];

                  return (
                    <div
                      key={t._id}
                      onClick={() => onSelectTask(t)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 px-2 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {t.title}
                          </p>
                          {isAssigned && (
                            <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Your Task
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                          {primaryAssignee ? (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                              <Avatar src={primaryAssignee.avatar || primaryAssignee.avatarUrl} name={primaryAssignee.name || 'User'} size="xs" />
                              <span>{primaryAssignee.name}</span>
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Unassigned</span>
                          )}
                          {t.dueDate && (
                            <span>• Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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

                        {!canUpdate && (
                          <span
                            title={`Assigned to ${primaryAssignee?.name || 'teammate'}. Only assignee or admin can update.`}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No tasks recorded yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Track development progress with assigned team members, priorities, and due dates.
                  </p>
                </div>
                {canCreateTask && (
                  <button
                    type="button"
                    onClick={onCreateTask}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:shadow transition-all mt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create First Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Column B: Active Milestones */}
        <Card className="p-5 md:p-6 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-sm transition-all min-h-[300px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Upcoming Milestones
                  </h4>
                  <p className="text-[11px] text-slate-400">Key targets and release phases</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {canCreateMilestone && (
                  <button
                    onClick={onCreateMilestone}
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Add New Milestone"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigateTab('milestones')}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>Manage ({milestones.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Milestone List or Empty State */}
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-3 pt-3">
                {upcomingMilestones.map((m) => (
                  <div
                    key={m._id}
                    className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.title}
                      </span>

                      {/* Admin Status Dropdown vs Read-only Badge */}
                      {isElevated && onMilestoneStatusChange ? (
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={m.status}
                            onChange={(e) => onMilestoneStatusChange(m, e.target.value)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {onEditMilestone && (
                            <button
                              onClick={() => onEditMilestone(m)}
                              className="p-1 rounded text-slate-400 hover:text-primary-600 transition-colors"
                              title="Edit Milestone"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                            {m.status?.replace('_', ' ') || 'Upcoming'}
                          </span>
                          <span title="Milestones are managed by Project Admin">
                            <Lock className="w-3 h-3 text-slate-400" />
                          </span>
                        </div>
                      )}
                    </div>

                    {m.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No target date'}
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {m.progress || 0}% Complete
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <Layers className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {milestones.length > 0 ? 'All milestones completed! 🎉' : 'No upcoming milestones'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {milestones.length > 0
                      ? 'All scheduled milestones have been completed. Add a new milestone to track your next major sprint phase.'
                      : 'Break down your project into sprint milestones with deliverables and target dates.'}
                  </p>
                </div>
                {canCreateMilestone && (
                  <button
                    type="button"
                    onClick={onCreateMilestone}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs hover:shadow transition-all mt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Milestone</span>
                  </button>
                )}
              </div>
            )}
          </div>
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

