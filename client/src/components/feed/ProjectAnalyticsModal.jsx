import React, { useEffect, useState } from "react";
import {
  X,
  Eye,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Users,
  BarChart3,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { projectService } from "../../services/projectService";
import { REACTION_CONFIG } from "./ProjectReactionPicker";

export const ProjectAnalyticsModal = ({ projectId, projectTitle, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await projectService.getProjectAnalytics(projectId);
        if (isMounted) {
          setAnalytics(res.data?.analytics || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load project analytics.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [projectId, onClose]);

  const reactionBreakdown = analytics?.reactionBreakdown || {};
  const totalReactions = analytics?.reactionsCount || 0;
  const applications = analytics?.applications || { pending: 0, accepted: 0, rejected: 0, total: 0 };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              <BarChart3 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Project Owner Analytics
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                  Private
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {analytics?.projectTitle || projectTitle || "Software Project"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Aggregating live project metrics...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 space-y-3">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Views */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
                  <Eye className="w-4 h-4 text-primary-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {analytics.totalViews}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {analytics.uniqueViewsCount} unique viewers
                </span>
              </div>

              {/* Total Reactions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Reactions</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {analytics.reactionsCount}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Across 5 reaction types
                </span>
              </div>

              {/* Comments & Reposts */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Discussions</span>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {analytics.commentsCount}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {analytics.repostsCount} shares & reposts
                </span>
              </div>

              {/* Engagement Rate */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Engagement</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {analytics.engagementRate}
                </div>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium block">
                  {analytics.totalEngagements} total actions
                </span>
              </div>
            </div>

            {/* Reaction Breakdown Progress Bars */}
            <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Reaction Distribution</span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {totalReactions} total reactions
                </span>
              </h4>

              <div className="space-y-2">
                {Object.entries(REACTION_CONFIG).map(([type, config]) => {
                  const count = reactionBreakdown[type] || 0;
                  const pct = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <span>{config.emoji}</span>
                          <span>{config.label}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${config.bg}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applications Funnel & Team Capacity */}
            <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>Applications & Hiring Pipeline</span>
                </h4>
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
                  {applications.total} Proposals Received
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                    Pending
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {applications.pending}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                    Accepted
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {applications.accepted}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Rejected
                  </span>
                  <span className="text-base font-black text-slate-600 dark:text-slate-300">
                    {applications.rejected}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics Methodology Documentation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
                <span>Audited Calculation Formula</span>
              </div>
              <p className="leading-relaxed">
                {analytics.formula}
              </p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalyticsModal;

