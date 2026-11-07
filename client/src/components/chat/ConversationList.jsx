import React, { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { UnreadBadge } from './UnreadBadge';
import { ReadReceipt } from './ReadReceipt';
import { useAuthStore } from '../../store';
import {
  Search,
  MessageSquare,
  Briefcase,
  Users,
  Loader2,
  CheckCheck,
  Check,
  Star,
  Plus,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'projects' | 'direct' | 'starred'
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  // Filter conversations by query and tab
  const filtered = conversations.filter((conv) => {
    const isProject = conv.type === 'project' || Boolean(conv.project);
    const unreadCount = Number(conv.unreadCount || 0);

    // Tab filter
    if (filterTab === 'unread' && unreadCount <= 0) return false;
    if (filterTab === 'projects' && !isProject) return false;
    if (filterTab === 'direct' && isProject) return false;
    if (filterTab === 'starred' && !conv.isStarred) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = conv.title || conv.user?.name || conv.project?.title || '';
    const lastSnippet = conv.lastMessage || '';
    return title.toLowerCase().includes(q) || lastSnippet.toLowerCase().includes(q);
  });

  const unreadTotal = conversations.reduce(
    (acc, c) => acc + (Number(c.unreadCount) > 0 ? 1 : 0),
    0
  );

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none overflow-hidden ${className}`}
    >
      {/* 1. Devquox Brand Header Bar */}
      <div className="h-16 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={currentUser?.avatar || currentUser?.avatarUrl}
            name={currentUser?.name || 'Me'}
            size="sm"
            status="online"
            className="ring-2 ring-primary-500/30"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Devquox Chat
              </h2>
              <span className="px-1.5 py-0.2 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {conversations.length} chats • {unreadTotal} unread
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setFilterTab(filterTab === 'starred' ? 'all' : 'starred')}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              filterTab === 'starred' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : ''
            }`}
            title="Starred Messages"
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const query = prompt('Enter developer username or name to start chat:');
              if (query) setSearchQuery(query);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 transition-colors"
            title="New Conversation"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Modern Search & Category Filter Pills */}
      <div className="p-3 space-y-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations, teams or keywords..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-primary-500/50 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills in Devquox Brand Colors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-semibold">
          {[
            { id: 'all', label: 'All' },
            { id: 'direct', label: 'Direct' },
            { id: 'projects', label: 'Projects' },
            { id: 'unread', label: unreadTotal > 0 ? `Unread (${unreadTotal})` : 'Unread' },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Conversation Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2 text-primary-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs text-slate-400">Loading chats...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((conv) => {
            const convId = conv._id || conv.id;
            const isActive = String(convId) === String(activeConversationId);
            const isProject = conv.type === 'project' || Boolean(conv.project);
            const title = conv.title || conv.user?.name || conv.project?.title || 'Chat';
            const subtitle = conv.lastMessage || 'No messages yet';
            const unreadCount = Number(conv.unreadCount || 0);

            // Format timestamp: "10:45 AM", "Yesterday", or "MM/DD/YY"
            let timeStr = '';
            if (conv.updatedAt || conv.lastMessageDate) {
              const d = new Date(conv.updatedAt || conv.lastMessageDate);
              const now = new Date();
              if (d.toDateString() === now.toDateString()) {
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) timeStr = 'Yesterday';
                else timeStr = d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
              }
            }

            return (
              <button
                key={convId}
                onClick={() => onSelectConversation(conv)}
                className={`w-full px-3.5 py-3 flex items-center gap-3 text-left transition-all relative ${
                  isActive
                    ? 'bg-primary-50/70 dark:bg-primary-950/20 border-l-4 border-primary-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                }`}
              >
                {/* Contact or Project Avatar (No duplicate green dot!) */}
                <div className="shrink-0">
                  {isProject ? (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/60 dark:to-slate-800 border border-primary-200/80 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-xs">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  ) : (
                    <Avatar
                      src={conv.user?.avatar || conv.user?.avatarUrl}
                      name={conv.user?.name || 'Contact'}
                      size="md"
                      status="online"
                      className="rounded-full ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  )}
                </div>

                {/* Info and Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {title}
                    </p>
                    <span
                      className={`text-[10.5px] font-medium shrink-0 ${
                        unreadCount > 0
                          ? 'text-primary-600 dark:text-primary-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {timeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-xs truncate flex items-center gap-1 ${
                        unreadCount > 0
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isProject && (
                        <span className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 shrink-0">
                          [Squad]
                        </span>
                      )}
                      <span className="truncate">{subtitle}</span>
                    </p>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold rounded-full bg-primary-600 text-white shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-1">
            <p className="text-xs font-semibold">
              {searchQuery ? 'No chats found matching query' : 'No chats yet'}
            </p>
            <p className="text-[11px]">
              {searchQuery
                ? 'Try searching with a different name or keyword.'
                : 'Start a conversation with a project team or developer.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
