import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Users,
  ShieldCheck,
  UserX,
  LogOut,
  Calendar,
  Lock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const WorkspaceTeamTab = ({
  team = [],
  onlineUsers = [],
  isOwner = false,
  currentUserId,
  onRoleChange,
  onRemoveMemberClick,
  onLeaveTeamClick,
  isProcessing = false,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Governance Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Team Roster & Roles ({team.length})
            </h3>
            <p className="text-xs text-slate-500">
              Active collaborators with secure workspace and sprint access
            </p>
          </div>
        </div>

        {isOwner ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Owner Authority Active</span>
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Roles Managed by Project Owner</span>
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={onLeaveTeamClick}
              className="text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-3 h-3 mr-1" /> Leave Team
            </Button>
          </div>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => {
          const isMemberOwner = member.role === 'owner';
          const memberUserId = String(member.user?._id || member.user);
          const isSelf = memberUserId === String(currentUserId);
          const isOnline = onlineUsers.some(
            (u) => String(u._id || u.id || u.userId) === memberUserId
          );

          return (
            <Card
              key={member._id}
              className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={member.user?.avatar || member.user?.avatarUrl}
                        name={member.user?.name || 'Member'}
                        size="md"
                        className="ring-2 ring-primary-500/20"
                      />
                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"
                          title="Online in workspace"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {member.user?.name || 'Collaborator'}
                        </p>
                        {isOnline && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        @{member.user?.username || 'user'}
                        {isSelf && (
                          <span className="ml-1 text-primary-600 dark:text-primary-400 font-semibold">
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                      isMemberOwner
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        : member.role === 'manager'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                {member.user?.headline && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {member.user.headline}
                  </p>
                )}

                {member.user?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {member.user.skills.slice(0, 4).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Info & Owner Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}
                </span>

                {/* Owner Actions */}
                {isOwner && !isMemberOwner && !isSelf && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => onRoleChange(member.user._id, e.target.value)}
                      disabled={isProcessing}
                      className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold cursor-pointer"
                    >
                      <option value="developer">Developer</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                    </select>

                    <button
                      onClick={() => onRemoveMemberClick(member)}
                      title="Remove Member from Team"
                      disabled={isProcessing}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

