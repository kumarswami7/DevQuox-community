import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Play,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Edit2,
  Filter,
  Search,
  Calendar,
  Sparkles,
} from 'lucide-react';

const ACTION_CONFIG = {
  task_created: { label: 'Created Task', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CheckCircle2 },
  task_updated: { label: 'Updated Task', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', icon: Edit2 },
  task_assigned: { label: 'Assigned Task', color: 'bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300', icon: Users },
  task_reassigned: { label: 'Reassigned Task', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', icon: Users },
  task_status_changed: { label: 'Changed Status', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300', icon: Play },
  task_completed: { label: 'Approved & Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CheckCircle2 },
  task_reopened: { label: 'Reopened Task', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300', icon: RotateCcw },
  task_deleted: { label: 'Deleted Task', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: Trash2 },
  milestone_created: { label: 'Created Milestone', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', icon: Layers },
  milestone_updated: { label: 'Updated Milestone', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', icon: Edit2 },
  milestone_completed: { label: 'Completed Milestone', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CheckCircle2 },
  milestone_deleted: { label: 'Deleted Milestone', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: Trash2 },
  member_joined: { label: 'Joined Team', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: Users },
  member_left: { label: 'Departed Team', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: Users },
  member_removed: { label: 'Removed Member', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: Users },
  role_updated: { label: 'Updated Role', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', icon: ShieldCheck },
  project_settings_updated: { label: 'Project Settings Updated', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', icon: ShieldCheck },
};

export const WorkspaceActivityTab = ({ activities = [] }) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'tasks' | 'milestones' | 'team' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type Filter
      if (filterType === 'tasks' && !act.action.startsWith('task_')) return false;
      if (filterType === 'milestones' && !act.action.startsWith('milestone_')) return false;
      if (filterType === 'team' && !act.action.includes('member_') && act.action !== 'role_updated') return false;
      if (filterType === 'settings' && act.action !== 'project_settings_updated') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const userName = act.user?.name?.toLowerCase() || '';
        const action = act.action.toLowerCase();
        const title = act.details?.title?.toLowerCase() || '';
        const prev = act.details?.previousStatus?.toLowerCase() || '';
        const next = act.details?.newStatus?.toLowerCase() || '';
        if (
          !userName.includes(q) &&
          !action.includes(q) &&
          !title.includes(q) &&
          !prev.includes(q) &&
          !next.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activities, filterType, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter and Search Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, members, titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'milestones', label: 'Milestones' },
            { id: 'team', label: 'Team Governance' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-primary-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Chronological Activity Feed */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Project Audit Trail ({filteredActivities.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Immutable Historical Log • UTC Timestamps Preserved
          </span>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredActivities.map((act) => {
              const cfg = ACTION_CONFIG[act.action] || {
                label: act.action?.replace(/_/g, ' '),
                color: 'bg-slate-100 text-slate-700',
                icon: Activity,
              };
              const Icon = cfg.icon;

              return (
                <div key={act._id} className="relative flex items-start gap-4 text-xs group">
                  {/* Timeline Bullet */}
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-cardDark border-2 border-primary-500 flex items-center justify-center shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  </span>

                  {/* Actor Avatar */}
                  <Avatar
                    src={act.user?.avatar || act.user?.avatarUrl}
                    name={act.user?.name || 'Member'}
                    size="sm"
                    className="ring-1 ring-slate-200 dark:ring-slate-700 mt-0.5 shrink-0"
                  />

                  {/* Activity Details Card */}
                  <div className="flex-1 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {act.user?.name || 'Team Member'}
                        </strong>
                        <span className="text-slate-400">@{act.user?.username || 'user'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(act.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Specific Action Descriptions */}
                    <div className="text-slate-700 dark:text-slate-300">
                      {act.action === 'task_created' && (
                        <p>Created task <strong className="text-slate-900 dark:text-white">"{act.details?.title}"</strong> with priority <span className="font-semibold">{act.details?.priority || 'medium'}</span>.</p>
                      )}

                      {act.action === 'task_status_changed' && (
                        <p>
                          Moved task status from{' '}
                          <span className="font-bold uppercase text-slate-500">{act.details?.previousStatus || 'start'}</span>{' '}
                          ➔{' '}
                          <span className="font-bold uppercase text-primary-600 dark:text-primary-400">{act.details?.newStatus || 'next'}</span>.
                        </p>
                      )}

                      {act.action === 'task_reassigned' && (
                        <p>Reassigned task <strong className="text-slate-900 dark:text-white">"{act.details?.taskTitle}"</strong> to active project assignees.</p>
                      )}

                      {act.action === 'task_reopened' && (
                        <p>Reopened task <strong className="text-slate-900 dark:text-white">"{act.details?.title || 'task'}"</strong> back to active development.</p>
                      )}

                      {act.action === 'task_deleted' && (
                        <p className="text-rose-600 dark:text-rose-400">Deleted task "{act.details?.title}".</p>
                      )}

                      {act.action === 'milestone_created' && (
                        <p>Planned new milestone <strong className="text-slate-900 dark:text-white">"{act.details?.title}"</strong>.</p>
                      )}

                      {act.action === 'milestone_completed' && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">Successfully achieved and closed milestone "{act.details?.title}".</p>
                      )}

                      {act.action === 'project_settings_updated' && (
                        <p>Project Owner updated core metadata and settings for <strong className="text-slate-900 dark:text-white">"{act.details?.title}"</strong>.</p>
                      )}

                      {act.action === 'member_joined' && (
                        <p>Joined the project workspace as <strong className="capitalize">{act.details?.role || 'developer'}</strong>.</p>
                      )}

                      {act.action === 'member_removed' && (
                        <p className="text-rose-600">
                          Removed from team. {act.details?.reason && <span className="italic text-slate-400">(Reason: "{act.details.reason}")</span>}
                        </p>
                      )}

                      {act.action === 'role_updated' && (
                        <p>Updated team member role to <strong className="text-primary-600 capitalize">{act.details?.newRole || 'member'}</strong>.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">No activity matching filter criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

