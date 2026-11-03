import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MessageSquare,
  Search,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

/**
 * CommentInspectorModal
 *
 * Dedicated modal to inspect developer reviews and architectural feedback left on a creator asset.
 * Includes search, sorting, and direct navigation to original threads.
 */
export const CommentInspectorModal = ({
  item,
  comments = [],
  loading = false,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  if (!item) return null;

  const filteredComments = useMemo(() => {
    let list = Array.isArray(comments) ? [...comments] : [];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => {
        const text = String(c.content || c.text || '').toLowerCase();
        const authorName = String(c.author?.name || '').toLowerCase();
        return text.includes(q) || authorName.includes(q);
      });
    }

    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [comments, search, sortBy]);

  const openThreadLink =
    item.contentType === 'project'
      ? `/projects/${item.sourceId}`
      : `/communities?post=${item.sourceId}`;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Developer Reviews & Community Feedback
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
              "{item.title}"
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5 bg-white dark:bg-cardDark">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comments by keyword or developer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Comments List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500" />
              <p>Loading developer feedback reviews...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {search ? 'No comments match your search filter' : 'No Review Comments Left Yet'}
              </p>
              <p className="max-w-xs mx-auto">
                Share your pitch on WhatsApp, LinkedIn or Twitter to invite peer reviews and architectural feedback!
              </p>
            </div>
          ) : (
            filteredComments.map((c, idx) => {
              const author = c.author || {};
              return (
                <div
                  key={c._id || idx}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={author.avatar || author.avatarUrl}
                        name={author.name || 'Developer'}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {author.name || 'Developer Reviewer'}
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">
                          @{author.username || 'user'} • {author.role || 'developer'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.createdAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-9">
                    {c.content || c.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <span className="text-xs text-slate-500">
            {filteredComments.length} review comment{filteredComments.length === 1 ? '' : 's'}
          </span>
          <Link
            to={openThreadLink}
            onClick={onClose}
            className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
          >
            <span>Reply in Community Discussion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommentInspectorModal;

