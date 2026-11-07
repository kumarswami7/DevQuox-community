import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Rocket,
  Lightbulb,
  MousePointer,
  Share2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ChevronDown,
  Download,
  Bookmark,
  Percent,
  HelpCircle,
  FileText,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { ShareModal } from '../components/ui/ShareModal';
import { PerformanceTrendChart } from '../components/analytics/PerformanceTrendChart';
import { ContentInspectorDrawer } from '../components/analytics/ContentInspectorDrawer';
import { CommentInspectorModal } from '../components/analytics/CommentInspectorModal';
import { analyticsService } from '../services/analyticsService';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store';

export const CreatorAnalyticsPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  // Primary State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | '6m' | '12m' | 'all'

  // Data State
  const [overviewKPIs, setOverviewKPIs] = useState(null);
  const [contentData, setContentData] = useState({ content: [], categoryCounts: {}, pagination: {} });
  const [trendTimeline, setTrendTimeline] = useState([]);
  const [audienceInsights, setAudienceInsights] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('highest_reach');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers
  const [inspectingItem, setInspectingItem] = useState(null);
  const [inspectingCommentsItem, setInspectingCommentsItem] = useState(null);
  const [postCommentsList, setPostCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Share Modal
  const [shareConfig, setShareConfig] = useState({
    isOpen: false,
    url: '',
    title: '',
    description: '',
    type: 'project',
  });

  // Fetch all analytics data from backend
  const loadAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, contentRes, trendsRes, audienceRes] = await Promise.allSettled([
        analyticsService.getOverview(dateRange),
        analyticsService.getContent({
          category: activeTab,
          search: searchQuery,
          sort: sortBy,
          page: currentPage,
          limit: 20,
        }),
        analyticsService.getTrends(dateRange),
        analyticsService.getAudience(),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.data) {
        setOverviewKPIs(overviewRes.value.data.data.kpis);
      }

      if (contentRes.status === 'fulfilled' && contentRes.value.data?.data) {
        setContentData(contentRes.value.data.data);
      }

      if (trendsRes.status === 'fulfilled' && trendsRes.value.data?.data) {
        setTrendTimeline(trendsRes.value.data.data.timeline || []);
      }

      if (audienceRes.status === 'fulfilled' && audienceRes.value.data?.data) {
        setAudienceInsights(audienceRes.value.data.data);
      }
    } catch (err) {
      console.warn('[CreatorAnalytics] Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, activeTab, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadAnalytics();
  }, [currentUser, loadAnalytics]);

  // WebSocket Live Updates Listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleLiveEngagement = () => {
      // Re-fetch lightly when new telemetry arrives
      loadAnalytics(false);
    };

    socket.on('analytics:engagementUpdated', handleLiveEngagement);
    socket.on('analytics:impressionUpdated', handleLiveEngagement);
    socket.on('analytics:conversionUpdated', handleLiveEngagement);

    return () => {
      socket.off('analytics:engagementUpdated', handleLiveEngagement);
      socket.off('analytics:impressionUpdated', handleLiveEngagement);
      socket.off('analytics:conversionUpdated', handleLiveEngagement);
    };
  }, [loadAnalytics]);

  // Open Comments Drawer
  const handleOpenComments = async (item) => {
    setInspectingCommentsItem(item);
    setLoadingComments(true);
    setPostCommentsList([]);
    try {
      const res = await analyticsService.getComments(item.sourceId);
      const list = res.data?.data || [];
      setPostCommentsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Open Universal Share Modal
  const handleOpenShare = (item) => {
    const isProj = item.contentType === 'project';
    const url = isProj
      ? `${window.location.origin}/projects/${item.sourceId}`
      : `${window.location.origin}/communities?post=${item.sourceId}`;

    setShareConfig({
      isOpen: true,
      url,
      title: item.title,
      description: item.description,
      type: isProj ? 'project' : item.contentType === 'idea' ? 'idea' : 'post',
    });
  };

  // Export Analytics to CSV
  const handleExportCSV = () => {
    const items = contentData.content || [];
    if (items.length === 0) return;

    const headers = [
      'Title',
      'Type',
      'Published Date',
      'Impressions',
      'Unique Viewers',
      'Clicks',
      'Reactions',
      'Comments',
      'Shares',
      'Engagement Rate',
    ];

    const rows = items.map((i) => [
      `"${String(i.title || '').replace(/"/g, '""')}"`,
      i.contentType,
      new Date(i.createdAt).toISOString().slice(0, 10),
      i.impressions,
      i.uniqueViewers,
      i.clicks,
      i.reactions,
      i.comments,
      i.shares,
      i.engagementRate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `devconnect_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryCounts = contentData.categoryCounts || {};

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-7 pb-20 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. CREATOR HERO BANNER & DATE RANGE CONTROLS                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-gradient-to-br from-white via-slate-50 to-primary-50/20 dark:from-cardDark dark:via-slate-900/90 dark:to-primary-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          {/* Creator Profile Info */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <Avatar
              src={currentUser?.avatar || currentUser?.avatarUrl}
              name={currentUser?.name || 'Creator'}
              size="lg"
              className="ring-3 ring-primary-500/20 shrink-0"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {currentUser?.name || 'Developer Creator'}
                </h1>
                <span className="text-xs font-semibold text-slate-400">
                  @{currentUser?.username || 'user'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xl">
                {currentUser?.headline || 'Open Source Builder, Community Creator & Full-Stack Developer'}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                <span>{categoryCounts.all || 0} Assets Tracked</span>
                <span>•</span>
                <span>Real-time audience reach & conversions</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Range Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Date Range Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: '6m', label: '6M' },
                { id: '12m', label: '1Y' },
                { id: 'all', label: 'All' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDateRange(r.id)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    dateRange === r.id
                      ? 'bg-primary-600 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadAnalytics(true)}
                disabled={refreshing}
                className="gap-1.5 font-bold border-slate-200 dark:border-slate-800 text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl"
                title="Refresh telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="gap-1.5 font-bold border-slate-200 dark:border-slate-800 text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl"
                title="Export Analytics as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>

              <Link to="/projects/create">
                <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-sm text-xs h-8 sm:h-9 px-3 rounded-xl">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Post Project</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. TOP-LEVEL EXECUTIVE TELEMETRY & REACH KPIS                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Executive Telemetry & Growth Signals
              </h2>
              <p className="text-xs text-slate-400">
                Comparing against previous {dateRange} period
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800 self-start sm:self-auto">
            Live Stream Connected
          </span>
        </div>

        {overviewKPIs ? (
          <div className="space-y-3 sm:space-y-3.5">
            {/* Tier 1: 4 Core Growth Drivers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  key: 'totalReach',
                  label: 'Total Reach',
                  tooltip: overviewKPIs.totalReach?.tooltip,
                  value: overviewKPIs.totalReach?.value,
                  change: overviewKPIs.totalReach?.change,
                  icon: BarChart2,
                  accentColor: 'text-emerald-600 dark:text-emerald-400',
                  accentBg: 'bg-emerald-500/10',
                },
                {
                  key: 'uniqueViewers',
                  label: 'Unique Viewers',
                  tooltip: overviewKPIs.uniqueViewers?.tooltip,
                  value: overviewKPIs.uniqueViewers?.value,
                  change: overviewKPIs.uniqueViewers?.change,
                  icon: Eye,
                  accentColor: 'text-blue-600 dark:text-blue-400',
                  accentBg: 'bg-blue-500/10',
                },
                {
                  key: 'engagementRate',
                  label: 'Engagement Rate',
                  tooltip: overviewKPIs.engagementRate?.tooltip,
                  value: overviewKPIs.engagementRate?.value,
                  change: overviewKPIs.engagementRate?.change,
                  icon: Percent,
                  accentColor: 'text-purple-600 dark:text-purple-400',
                  accentBg: 'bg-purple-500/10',
                },
                {
                  key: 'projectApplications',
                  label: 'Proposals / Inbound',
                  tooltip: overviewKPIs.projectApplications?.tooltip,
                  value: overviewKPIs.projectApplications?.value,
                  change: overviewKPIs.projectApplications?.change,
                  icon: Users,
                  accentColor: 'text-primary-600 dark:text-primary-400',
                  accentBg: 'bg-primary-500/10',
                },
              ].map((driver) => {
                const Icon = driver.icon;
                const isPositive = driver.change >= 0;
                return (
                  <Card
                    key={driver.key}
                    className="p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-2 sm:space-y-2.5 shadow-sm hover:shadow-md transition-all group"
                    title={driver.tooltip}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 sm:p-2 rounded-xl ${driver.accentBg} ${driver.accentColor} shrink-0`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-bold">
                        {isPositive ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            +{driver.change}%
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center">
                            <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {driver.change}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {typeof driver.value === 'number' ? driver.value.toLocaleString() : driver.value || 0}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {driver.label}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Tier 2: Secondary Activity Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
              {[
                { key: 'reactions', label: 'Reactions', icon: Heart, color: 'text-rose-500' },
                { key: 'comments', label: 'Reviews', icon: MessageSquare, color: 'text-amber-500' },
                { key: 'shares', label: 'Shares', icon: Share2, color: 'text-emerald-500' },
                { key: 'saves', label: 'Saves', icon: Bookmark, color: 'text-amber-500' },
                { key: 'linkClicks', label: 'Clicks', icon: MousePointer, color: 'text-blue-500' },
                { key: 'profileVisits', label: 'Profile Views', icon: Users, color: 'text-indigo-500' },
                { key: 'conversions', label: 'Idea Launches', icon: Rocket, color: 'text-purple-500' },
                { key: 'totalImpressions', label: 'Impressions', icon: Sparkles, color: 'text-teal-500' },
              ].map((metric) => {
                const kpi = overviewKPIs[metric.key] || { value: 0, change: 0 };
                const Icon = metric.icon;
                const isPositive = kpi.change >= 0;
                return (
                  <div
                    key={metric.key}
                    className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-cardDark space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    title={kpi.tooltip}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="font-bold uppercase tracking-wider truncate">
                        {metric.label}
                      </span>
                      <Icon className={`w-3 h-3 ${metric.color} shrink-0`} />
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                      {isPositive ? (
                        <span className="text-emerald-600 dark:text-emerald-400">+{kpi.change}%</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">{kpi.change}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE PERFORMANCE CHARTS                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <PerformanceTrendChart timeline={trendTimeline} range={dateRange} />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. AUDIENCE ENGINEERING INSIGHTS & TOP TECH RELEVANCE               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {audienceInsights && audienceInsights.topTechnologies?.length > 0 && (
        <Card className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Audience Engineering Distribution & Core Stacks</span>
              </h3>
              <p className="text-xs text-slate-500">
                Skills distribution and technology communities interacting with your published initiatives
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              Verified Developer Reach
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Top Technology Tags */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Primary Technology Exposure
              </span>
              <div className="space-y-2">
                {audienceInsights.topTechnologies.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                        #{t.technology}
                      </span>
                      <span className="font-semibold text-slate-400">
                        {t.relevanceScore}% Relevance
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${t.relevanceScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interaction Segments */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Developer Audience Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {(audienceInsights.interactionSegments || []).map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {seg.role}
                    </span>
                    <div className="text-lg font-black text-primary-600 dark:text-primary-400">
                      {seg.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. FILTER TABS, SEARCH & CONTENT PERFORMANCE TABLE                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-cardDark border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-1 md:pb-0">
            {[
              { id: 'all', label: `All (${categoryCounts.all || 0})`, icon: Sparkles },
              { id: 'ideas', label: `Ideas (${categoryCounts.ideas || 0})`, icon: Lightbulb },
              { id: 'projects', label: `Projects (${categoryCounts.projects || 0})`, icon: Rocket },
              { id: 'discussions', label: `Discussions (${categoryCounts.discussions || 0})`, icon: MessageSquare },
              { id: 'questions', label: `Q&A (${categoryCounts.questions || 0})`, icon: HelpCircle },
              { id: 'showcases', label: `Showcase (${categoryCounts.showcases || 0})`, icon: StarIcon },
              { id: 'tutorials', label: `Tutorials (${categoryCounts.tutorials || 0})`, icon: FileText },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs font-black shadow-primary-600/20'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search submissions or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 sm:px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="highest_reach">Highest Reach</option>
              <option value="highest_engagement">Highest Engagement</option>
              <option value="most_comments">Most Reviews</option>
              <option value="most_shared">Most Shared</option>
              <option value="most_clicked">Most Clicked</option>
              <option value="highest_conversion">Highest Conversion</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Content Performance Table / Stream */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              Aggregating creator content & real-time telemetry...
            </p>
          </div>
        ) : (contentData.content || []).length === 0 ? (
          <Card className="p-12 sm:p-16 text-center rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Content Submissions Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No submissions match "${searchQuery}". Try a different keyword.`
                : "You haven't published content in this category yet. Pitch a project idea to start collecting developer feedback!"}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5 font-bold rounded-xl text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pitch an Idea</span>
                </Button>
              </Link>
              <Link to="/projects/create">
                <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-sm rounded-xl text-xs">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Post a Project</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {(contentData.content || []).map((item) => {
              const isIdea = item.contentType === 'idea';
              const isProj = item.contentType === 'project';
              const openLink = isProj
                ? `/projects/${item.sourceId}`
                : `/communities?post=${item.sourceId}`;

              return (
                <Card
                  key={item.contentId}
                  className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3 sm:space-y-4 hover:border-primary-500/40 hover:shadow-md transition-all"
                >
                  {/* Top Bar: Badge, Published Date, Conversion Indicator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                          isIdea
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70'
                            : isProj
                            ? 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-300/60 dark:border-primary-800/70'
                            : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800/70'
                        }`}
                      >
                        {isIdea ? (
                          <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500/30" />
                        ) : isProj ? (
                          <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-500" />
                        ) : (
                          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500" />
                        )}
                        <span className="capitalize">{item.contentType}</span>
                      </span>

                      {isProj && (
                        <Badge
                          variant={item.status === 'completed' ? 'success' : 'primary'}
                          className="text-[9px] sm:text-[10px] font-bold uppercase"
                        >
                          {item.status || 'open'}
                        </Badge>
                      )}

                      {isIdea && item.convertedToProject && (
                        <Link to={`/projects/${item.convertedToProject._id || item.convertedToProject}`}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active Project Launched ↗</span>
                          </span>
                        </Link>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="space-y-1">
                    <Link
                      to={openLink}
                      className="hover:text-primary-600 transition-colors inline-block"
                    >
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
                        <span>{item.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 opacity-60" />
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Granular Metric Blocks: 3 columns on mobile, 6 on desktop */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-emerald-500 shrink-0" /> Reach
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.impressions.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-500 shrink-0" /> Viewers
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.uniqueViewers.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 shrink-0" /> Upvotes
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.reactions}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-amber-500 shrink-0" /> Reviews
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.comments}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MousePointer className="w-3 h-3 text-indigo-500 shrink-0" /> Clicks
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.clicks}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-purple-500 shrink-0" /> Engaged
                      </span>
                      <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {item.engagementRate}
                      </div>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setInspectingItem(item)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-primary-500" />
                        <span>Analytics</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenComments(item)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 hover:bg-amber-100/70 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reviews ({item.comments})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenShare(item)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {isIdea && !item.convertedToProject && (
                        <Link to={`/projects/create?fromIdea=${item.sourceId}`}>
                          <Button
                            size="xs"
                            variant="primary"
                            className="gap-1 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs h-7.5 px-2.5 sm:px-3 rounded-lg text-[11px]"
                          >
                            <Rocket className="w-3 h-3" />
                            <span>Launch as Project</span>
                          </Button>
                        </Link>
                      )}

                      <Link
                        to={openLink}
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 py-1 px-1.5"
                      >
                        <span>Open Asset</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination Controls */}
            {contentData.pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 px-2">
                <span className="text-xs text-slate-400">
                  Showing page {contentData.pagination.page} of {contentData.pagination.totalPages} ({contentData.pagination.total} total submissions)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= contentData.pagination.totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. CONTENT PERFORMANCE INSPECTOR DRAWER                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {inspectingItem && (
        <ContentInspectorDrawer
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
          onOpenShare={handleOpenShare}
          onOpenComments={handleOpenComments}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. COMMENT & FEEDBACK INSPECTOR MODAL                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {inspectingCommentsItem && (
        <CommentInspectorModal
          item={inspectingCommentsItem}
          comments={postCommentsList}
          loading={loadingComments}
          onClose={() => setInspectingCommentsItem(null)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. UNIVERSAL SHARE MODAL                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ShareModal
        isOpen={shareConfig.isOpen}
        onClose={() => setShareConfig((prev) => ({ ...prev, isOpen: false }))}
        shareUrl={shareConfig.url}
        title={shareConfig.title}
        description={shareConfig.description}
        type={shareConfig.type}
      />
    </div>
  );
};

// Helper Star Icon for showcases
const StarIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default CreatorAnalyticsPage;
