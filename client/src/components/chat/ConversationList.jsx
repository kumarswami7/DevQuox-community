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
  MoreVertical,
  Plus,
  Filter,
} from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  isLoading = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'projects' | 'direct'
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
      className={`flex flex-col h-full bg-white dark:bg-[#111b21] border-r border-slate-200/90 dark:border-slate-800 select-none overflow-hidden ${className}`}
    >
      {/* 1. WhatsApp Web Top Header Bar */}
      <div className="h-16 px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Avatar
            src={currentUser?.avatar || currentUser?.avatarUrl}
            name={currentUser?.name || 'Me'}
            size="sm"
            status="online"
            className="ring-2 ring-emerald-500/30"
          />
          <div>
            <h2 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef] tracking-tight">
              Chats
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-[#8696a0]">
              {conversations.length} total • {unreadTotal} unread
            </p>
          </div>
        </div>

        {/* WhatsApp Top Right Action Icons */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-[#aebac1]">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Communities & Channels"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="New Conversation"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. WhatsApp Search & Filter Pills */}
      <div className="p-2.5 space-y-2 bg-white dark:bg-[#111b21] border-b border-slate-100 dark:border-slate-800/80">
        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-[#8696a0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] border-none focus:outline-none focus:ring-1 focus:ring-[#00a884] transition-all"
          />
        </div>

        {/* WhatsApp Filter Pills: All, Unread, Groups/Projects, Direct */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: unreadTotal > 0 ? `Unread (${unreadTotal})` : 'Unread' },
            { id: 'projects', label: 'Projects' },
            { id: 'direct', label: 'Direct' },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#00a884] text-white shadow-xs'
                    : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Conversation Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 space-y-2 text-[#00a884]">
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

            // Format timestamp in WhatsApp style: e.g. "10:45 AM", "Yesterday", or "MM/DD/YYYY"
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
                className={`w-full px-3.5 py-3 flex items-center gap-3 text-left transition-colors relative ${
                  isActive
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/70'
                }`}
              >
                {/* Contact or Project Avatar */}
                <div className="relative shrink-0">
                  {isProject ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-[#00a884] dark:text-[#25d366] shadow-xs">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  ) : (
                    <Avatar
                      src={conv.user?.avatar || conv.user?.avatarUrl}
                      name={conv.user?.name || 'Contact'}
                      size="md"
                      status="online"
                    />
                  )}
                </div>

                {/* Info and Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[13.5px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                      {title}
                    </p>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        unreadCount > 0
                          ? 'text-[#25d366] font-bold'
                          : 'text-[#667781] dark:text-[#8696a0]'
                      }`}
                    >
                      {timeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-xs truncate flex items-center gap-1 ${
                        unreadCount > 0
                          ? 'font-bold text-[#111b21] dark:text-white'
                          : 'text-[#667781] dark:text-[#8696a0]'
                      }`}
                    >
                      {isProject && (
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          [Project]
                        </span>
                      )}
                      <span className="truncate">{subtitle}</span>
                    </p>
                    <UnreadBadge count={unreadCount} />
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
