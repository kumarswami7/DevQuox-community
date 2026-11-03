import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ExternalLink,
  BarChart2,
  Eye,
  MousePointer,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Users,
  Rocket,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

/**
 * ContentInspectorDrawer
 *
 * Detailed deep-dive performance inspector for any selected content asset.
 * Displays engagement breakdown funnel, interaction metrics, and audience signals.
 */
export const ContentInspectorDrawer = ({
  item,
  onClose,
  onOpenShare,
  onOpenComments,
}) => {
  if (!item) return null;

  const isIdea = item.contentType === 'idea';
  const isProj = item.contentType === 'project';
  const openLink = isProj
    ? `/projects/${item.sourceId}`
    : `/communities?post=${item.sourceId}`;

  // Funnel calculations
  const impressions = Math.max(1, item.impressions || 0);
  const views = Math.max(0, item.uniqueViewers || 0);
  const clicks = Math.max(0, item.clicks || 0);
  const engagements = (item.reactions || 0) + (item.comments || 0) + (item.shares || 0);
  const conversions = item.conversions || item.applications || 0;

  const funnel = [
    { label: 'Feed Reach (Impressions)', count: impressions, pct: 100, color: 'bg-emerald-500' },
    { label: 'Viewed Content Details', count: views, pct: Math.min(100, Math.round((views / impressions) * 100)), color: 'bg-blue-500' },
    { label: 'Interacted (Clicks & Opens)', count: clicks, pct: Math.min(100, Math.round((clicks / impressions) * 100)), color: 'bg-indigo-500' },
    { label: 'Community Feedback (Likes & Reviews)', count: engagements, pct: Math.min(100, Math.round((engagements / impressions) * 100)), color: 'bg-amber-500' },
    { label: 'High Intent (Conversions / Applications)', count: conversions, pct: Math.min(100, Math.round((conversions / impressions) * 100)), color: 'bg-purple-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                {item.contentType}
              </span>
              <span className="text-xs text-slate-400">
                Published {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Excerpt */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {item.description}
          </div>

          {/* Quick Metrics Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Performance Snapshot
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" /> Total Reach
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.impressions.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Unique Viewers
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.uniqueViewers.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Reactions
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.reactions}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Comments
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.comments}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <MousePointer className="w-3 h-3" /> Link Clicks
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.clicks}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> Shares
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.shares}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> Saves
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {item.saves}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Engagement
                </span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {item.engagementRate}
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Funnel */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audience Conversion Funnel
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              {funnel.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {step.label}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {step.count.toLocaleString()} ({step.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all duration-500`}
                      style={{ width: `${step.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Technology & Skills Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenComments(item)}
              className="gap-1.5 font-bold"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Reviews ({item.comments})</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenShare(item)}
              className="gap-1.5 font-bold"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Share</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isIdea && !item.convertedToProject && (
              <Link to={`/projects/create?fromIdea=${item.sourceId}`}>
                <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-xs">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Launch as Project</span>
                </Button>
              </Link>
            )}

            <Link to={openLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 font-bold">
                <span>Open Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentInspectorDrawer;

