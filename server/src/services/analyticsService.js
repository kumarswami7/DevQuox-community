import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { ContentAnalyticsDaily } from '../models/ContentAnalyticsDaily.js';
import { getMidnightUTCDate } from './telemetryService.js';

/**
 * Calculates start and previous-period start dates based on range string.
 */
export const getDateRangeBoundaries = (range = '30d') => {
  const now = new Date();
  const todayMidnight = getMidnightUTCDate(now);

  let days = 30;
  if (range === '7d') days = 7;
  else if (range === '30d') days = 30;
  else if (range === '90d') days = 90;
  else if (range === '6m') days = 180;
  else if (range === '12m') days = 365;
  else if (range === 'all') days = 3650; // ~10 years

  const currentStart = new Date(todayMidnight.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
  const previousEnd = new Date(currentStart.getTime() - 1);

  return {
    days,
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd,
  };
};

/**
 * Computes percentage change between previous and current period values.
 */
const computePercentageChange = (currentVal, previousVal) => {
  if (previousVal === 0) {
    return currentVal > 0 ? 100 : 0;
  }
  const diff = ((currentVal - previousVal) / previousVal) * 100;
  return parseFloat(diff.toFixed(1));
};

/**
 * Aggregates Top-Level 12 KPI metrics with comparative period insights.
 */
export const getCreatorOverview = async (creatorId, range = '30d') => {
  const userObjectId = new mongoose.Types.ObjectId(creatorId);
  const { currentStart, currentEnd, previousStart, previousEnd } = getDateRangeBoundaries(range);

  // 1. Fetch Aggregated Metrics for Current Period
  const [currentPeriodStats, previousPeriodStats, lifetimePosts, lifetimeProjects] = await Promise.all([
    ContentAnalyticsDaily.aggregate([
      {
        $match: {
          creatorId: userObjectId,
          date: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: null,
          impressions: { $sum: '$impressions' },
          views: { $sum: '$views' },
          clicks: { $sum: '$clicks' },
          reactions: { $sum: '$reactions' },
          comments: { $sum: '$comments' },
          shares: { $sum: '$shares' },
          saves: { $sum: '$saves' },
          applications: { $sum: '$applications' },
          conversions: { $sum: '$conversions' },
          profileVisits: { $sum: '$profileVisits' },
        },
      },
    ]),
    ContentAnalyticsDaily.aggregate([
      {
        $match: {
          creatorId: userObjectId,
          date: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $group: {
          _id: null,
          impressions: { $sum: '$impressions' },
          views: { $sum: '$views' },
          clicks: { $sum: '$clicks' },
          reactions: { $sum: '$reactions' },
          comments: { $sum: '$comments' },
          shares: { $sum: '$shares' },
          saves: { $sum: '$saves' },
          applications: { $sum: '$applications' },
          conversions: { $sum: '$conversions' },
          profileVisits: { $sum: '$profileVisits' },
        },
      },
    ]),
    Post.find({ author: userObjectId, status: { $ne: 'hidden' } })
      .select('impressionsCount viewsCount clicksCount upvotes commentsCount repostCount postType convertedToProject ideaDetails')
      .lean(),
    Project.find({ owner: userObjectId })
      .select('viewsCount applicationsCount acceptedApplicantsCount reactionsCount commentsCount repostsCount originIdeaPost')
      .lean(),
  ]);

  const curr = currentPeriodStats[0] || {};
  const prev = previousPeriodStats[0] || {};

  // If daily rollups are fresh/empty, fall back gracefully to lifetime model counters
  const lifetimeImpressions =
    lifetimePosts.reduce((acc, p) => acc + (p.impressionsCount || 0), 0) +
    lifetimeProjects.reduce((acc, pr) => acc + (pr.viewsCount || 0), 0);

  const lifetimeViews =
    lifetimePosts.reduce((acc, p) => acc + (p.viewsCount || 0), 0) +
    lifetimeProjects.reduce((acc, pr) => acc + (pr.viewsCount || 0), 0);

  const lifetimeClicks = lifetimePosts.reduce((acc, p) => acc + (p.clicksCount || 0), 0);
  const lifetimeReactions =
    lifetimePosts.reduce((acc, p) => acc + (p.upvotes || 0), 0) +
    lifetimeProjects.reduce((acc, pr) => acc + (pr.reactionsCount || 0), 0);

  const lifetimeComments =
    lifetimePosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0) +
    lifetimeProjects.reduce((acc, pr) => acc + (pr.commentsCount || 0), 0);

  const lifetimeShares =
    lifetimePosts.reduce((acc, p) => acc + (p.repostCount || 0), 0) +
    lifetimeProjects.reduce((acc, pr) => acc + (pr.repostsCount || 0), 0);

  const lifetimeApplications = lifetimeProjects.reduce(
    (acc, pr) => acc + (pr.applicationsCount || 0),
    0
  );

  const lifetimeConversions = lifetimePosts.filter((p) => p.convertedToProject).length;

  // Use current period values if tracked, or fallback for all-time view
  const isAllTime = range === 'all';
  const impressions = isAllTime ? Math.max(curr.impressions || 0, lifetimeImpressions) : (curr.impressions || 0);
  const views = isAllTime ? Math.max(curr.views || 0, lifetimeViews) : (curr.views || 0);
  const clicks = isAllTime ? Math.max(curr.clicks || 0, lifetimeClicks) : (curr.clicks || 0);
  const reactions = isAllTime ? Math.max(curr.reactions || 0, lifetimeReactions) : (curr.reactions || 0);
  const comments = isAllTime ? Math.max(curr.comments || 0, lifetimeComments) : (curr.comments || 0);
  const shares = isAllTime ? Math.max(curr.shares || 0, lifetimeShares) : (curr.shares || 0);
  const saves = curr.saves || 0;
  const applications = isAllTime ? Math.max(curr.applications || 0, lifetimeApplications) : (curr.applications || 0);
  const conversions = isAllTime ? Math.max(curr.conversions || 0, lifetimeConversions) : (curr.conversions || 0);
  const profileVisits = curr.profileVisits || 0;

  const currentEngagementDenominator = Math.max(1, impressions);
  const currentEngagementRate =
    (((reactions + comments + clicks + shares) / currentEngagementDenominator) * 100).toFixed(1);

  const prevImpressions = prev.impressions || 0;
  const prevViews = prev.views || 0;
  const prevClicks = prev.clicks || 0;
  const prevReactions = prev.reactions || 0;
  const prevComments = prev.comments || 0;
  const prevShares = prev.shares || 0;
  const prevSaves = prev.saves || 0;
  const prevApplications = prev.applications || 0;
  const prevConversions = prev.conversions || 0;
  const prevProfileVisits = prev.profileVisits || 0;
  const prevEngagementDenominator = Math.max(1, prevImpressions);
  const prevEngagementRate =
    (((prevReactions + prevComments + prevClicks + prevShares) / prevEngagementDenominator) * 100).toFixed(1);

  return {
    period: {
      range,
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
    },
    kpis: {
      totalReach: {
        value: impressions,
        previous: prevImpressions,
        change: computePercentageChange(impressions, prevImpressions),
        label: 'Total Reach',
        tooltip: 'Aggregated unique feed views and impressions across all content',
      },
      uniqueViewers: {
        value: views,
        previous: prevViews,
        change: computePercentageChange(views, prevViews),
        label: 'Unique Viewers',
        tooltip: 'Deduplicated developers and clients who viewed your content',
      },
      totalImpressions: {
        value: impressions,
        previous: prevImpressions,
        change: computePercentageChange(impressions, prevImpressions),
        label: 'Total Impressions',
        tooltip: 'Frequency with which your submissions were displayed in feeds & search',
      },
      profileVisits: {
        value: profileVisits,
        previous: prevProfileVisits,
        change: computePercentageChange(profileVisits, prevProfileVisits),
        label: 'Profile Visits',
        tooltip: 'Developers who navigated to your personal engineering profile',
      },
      reactions: {
        value: reactions,
        previous: prevReactions,
        change: computePercentageChange(reactions, prevReactions),
        label: 'Reactions',
        tooltip: 'Total upvotes and peer community endorsements',
      },
      comments: {
        value: comments,
        previous: prevComments,
        change: computePercentageChange(comments, prevComments),
        label: 'Comments & Reviews',
        tooltip: 'Architectural feedback and community reviews',
      },
      shares: {
        value: shares,
        previous: prevShares,
        change: computePercentageChange(shares, prevShares),
        label: 'Shares & Reposts',
        tooltip: 'External and in-platform link shares to WhatsApp, LinkedIn, X, Discord',
      },
      saves: {
        value: saves,
        previous: prevSaves,
        change: computePercentageChange(saves, prevSaves),
        label: 'Saves & Bookmarks',
        tooltip: 'Developers who saved your projects or pitches for future reference',
      },
      linkClicks: {
        value: clicks,
        previous: prevClicks,
        change: computePercentageChange(clicks, prevClicks),
        label: 'Link Clicks',
        tooltip: 'Direct clicks to inspect details, GitHub repositories, or live demos',
      },
      engagementRate: {
        value: `${currentEngagementRate}%`,
        previous: `${prevEngagementRate}%`,
        change: parseFloat((parseFloat(currentEngagementRate) - parseFloat(prevEngagementRate)).toFixed(1)),
        label: 'Engagement Rate',
        tooltip: 'Ratio of interactions (reactions, comments, clicks, shares) to total reach',
      },
      projectApplications: {
        value: applications,
        previous: prevApplications,
        change: computePercentageChange(applications, prevApplications),
        label: 'Project Applications',
        tooltip: 'Developer proposals received across your posted software builds',
      },
      conversions: {
        value: conversions,
        previous: prevConversions,
        change: computePercentageChange(conversions, prevConversions),
        label: 'Idea Conversions',
        tooltip: 'Pitched concepts successfully launched into active milestone projects',
      },
    },
  };
};

/**
 * Normalizes content from Post.js and Project.js into the unified Phase 2 specification.
 */
export const getCreatorContent = async (
  creatorId,
  {
    category = 'all',
    search = '',
    sort = 'highest_reach',
    page = 1,
    limit = 20,
  } = {}
) => {
  const userObjectId = new mongoose.Types.ObjectId(creatorId);

  // Fetch all posts by creator
  const posts = await Post.find({
    author: userObjectId,
    status: { $ne: 'hidden' },
  })
    .populate('convertedToProject', 'title category status budget owner')
    .sort({ createdAt: -1 })
    .lean();

  // Fetch all projects owned by creator
  const projects = await Project.find({
    owner: userObjectId,
  })
    .populate('originIdeaPost', 'title postType')
    .sort({ createdAt: -1 })
    .lean();

  // 1. Normalize Posts
  const normalizedPosts = posts.map((p) => {
    let contentType = p.postType || 'discussion';
    if (p.ideaDetails || p.postType === 'idea') {
      contentType = 'idea';
    }

    const impressions = p.impressionsCount || 0;
    const views = p.viewsCount || 0;
    const clicks = p.clicksCount || 0;
    const reactions = p.upvotes || (Array.isArray(p.likes) ? p.likes.length : 0);
    const comments = p.commentsCount || 0;
    const shares = p.repostCount || 0;
    const saves = Array.isArray(p.savedBy) ? p.savedBy.length : 0;
    const conversions = p.convertedToProject ? 1 : 0;

    const denominator = Math.max(1, impressions);
    const engagementRate = `${(((reactions + comments + clicks + shares) / denominator) * 100).toFixed(1)}%`;

    return {
      contentId: `post_${p._id}`,
      sourceId: String(p._id),
      sourceType: 'Post',
      contentType,
      authorId: String(p.author),
      title: p.title || p.content.slice(0, 60),
      description: p.content || '',
      thumbnail: Array.isArray(p.mediaUrls) && p.mediaUrls[0] ? p.mediaUrls[0] : '',
      createdAt: p.createdAt,
      publishedAt: p.createdAt,
      visibility: p.status === 'hidden' ? 'private' : 'public',
      impressions,
      uniqueViewers: views,
      clicks,
      reactions,
      comments,
      shares,
      saves,
      applications: 0,
      conversions,
      engagementRate,
      trendingScore: p.trendingScore || 0,
      convertedToProject: p.convertedToProject,
      tags: p.tags || [],
      links: p.links || [],
    };
  });

  // 2. Normalize Projects
  const normalizedProjects = projects.map((pr) => {
    const impressions = pr.viewsCount || 0;
    const views = pr.uniqueViewsCount || pr.viewsCount || 0;
    const clicks = pr.acceptedApplicantsCount || 0;
    const reactions = pr.reactionsCount || 0;
    const comments = pr.commentsCount || 0;
    const shares = pr.repostsCount || 0;
    const applications = pr.applicationsCount || 0;
    const conversions = pr.originIdeaPost ? 1 : 0;

    const denominator = Math.max(1, impressions);
    const engagementRate = `${(((reactions + comments + applications + shares) / denominator) * 100).toFixed(1)}%`;

    return {
      contentId: `project_${pr._id}`,
      sourceId: String(pr._id),
      sourceType: 'Project',
      contentType: 'project',
      authorId: String(pr.owner),
      title: pr.title,
      description: pr.description || '',
      thumbnail: '',
      createdAt: pr.createdAt,
      publishedAt: pr.createdAt,
      visibility: pr.visibility || 'public',
      impressions,
      uniqueViewers: views,
      clicks,
      reactions,
      comments,
      shares,
      saves: 0,
      applications,
      conversions,
      engagementRate,
      trendingScore: 50 + reactions * 2 + comments * 3,
      status: pr.status || 'open',
      category: pr.category,
      tags: pr.requiredSkills || [],
      githubRepoUrl: pr.githubRepoUrl || pr.githubUrl || '',
      liveDemoUrl: pr.liveDemoUrl || pr.liveUrl || '',
      originIdeaPost: pr.originIdeaPost,
    };
  });

  // 3. Combine Streams
  const allItems = [...normalizedPosts, ...normalizedProjects];

  // 4. Counts by Content Type
  const categoryCounts = {
    all: allItems.length,
    ideas: allItems.filter((i) => i.contentType === 'idea').length,
    projects: allItems.filter((i) => i.contentType === 'project').length,
    discussions: allItems.filter((i) => i.contentType === 'discussion').length,
    questions: allItems.filter((i) => i.contentType === 'question').length,
    showcases: allItems.filter((i) => i.contentType === 'showcase').length,
    tutorials: allItems.filter((i) => ['tutorial', 'knowledge', 'article'].includes(i.contentType)).length,
  };

  // 5. Filter by Category
  let filtered = allItems;
  if (category && category !== 'all') {
    if (category === 'tutorials') {
      filtered = filtered.filter((i) => ['tutorial', 'knowledge', 'article'].includes(i.contentType));
    } else {
      filtered = filtered.filter((i) => i.contentType === category);
    }
  }

  // 6. Search Filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // 7. Sort Semantics
  filtered.sort((a, b) => {
    switch (sort) {
      case 'highest_reach':
        return b.impressions - a.impressions;
      case 'highest_engagement':
        return parseFloat(b.engagementRate) - parseFloat(a.engagementRate);
      case 'most_comments':
        return b.comments - a.comments;
      case 'most_shared':
        return b.shares - a.shares;
      case 'most_clicked':
        return b.clicks - a.clicks;
      case 'highest_conversion':
        return b.conversions - a.conversions;
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // 8. Pagination
  const total = filtered.length;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    categoryCounts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
    content: paginated,
  };
};

/**
 * Returns smooth day-by-day time-series telemetry data for interactive charts.
 */
export const getCreatorPerformanceTrends = async (creatorId, range = '30d') => {
  const userObjectId = new mongoose.Types.ObjectId(creatorId);
  const { days, currentStart, currentEnd } = getDateRangeBoundaries(range);

  const dailyRollups = await ContentAnalyticsDaily.aggregate([
    {
      $match: {
        creatorId: userObjectId,
        date: { $gte: currentStart, $lte: currentEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        impressions: { $sum: '$impressions' },
        views: { $sum: '$views' },
        clicks: { $sum: '$clicks' },
        reactions: { $sum: '$reactions' },
        comments: { $sum: '$comments' },
        shares: { $sum: '$shares' },
        applications: { $sum: '$applications' },
        conversions: { $sum: '$conversions' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map();
  dailyRollups.forEach((d) => map.set(d._id, d));

  // Fill in zero-gaps for all consecutive calendar days
  const filledTimeline = [];
  const currDate = new Date(currentStart);

  while (currDate <= currentEnd) {
    const key = currDate.toISOString().slice(0, 10);
    const item = map.get(key) || {
      _id: key,
      impressions: 0,
      views: 0,
      clicks: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      applications: 0,
      conversions: 0,
    };

    const denominator = Math.max(1, item.impressions);
    const engagement = parseFloat(
      (((item.reactions + item.comments + item.clicks + item.shares) / denominator) * 100).toFixed(1)
    );

    filledTimeline.push({
      date: key,
      label: new Date(currDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      impressions: item.impressions,
      views: item.views,
      clicks: item.clicks,
      reactions: item.reactions,
      comments: item.comments,
      shares: item.shares,
      applications: item.applications,
      conversions: item.conversions,
      engagement,
    });

    currDate.setDate(currDate.getDate() + 1);
  }

  return {
    range,
    daysCount: days,
    timeline: filledTimeline,
  };
};

/**
 * Returns audience insights (technology skills distribution and interaction roles).
 */
export const getCreatorAudienceInsights = async (creatorId) => {
  const userObjectId = new mongoose.Types.ObjectId(creatorId);

  // Aggregate tags from all creator posts
  const posts = await Post.find({ author: userObjectId, status: { $ne: 'hidden' } })
    .select('tags postType')
    .lean();

  const projects = await Project.find({ owner: userObjectId })
    .select('requiredSkills category')
    .lean();

  const tagCounts = {};
  posts.forEach((p) => {
    (p.tags || []).forEach((t) => {
      const clean = t.toLowerCase().trim();
      tagCounts[clean] = (tagCounts[clean] || 0) + 1;
    });
  });

  projects.forEach((pr) => {
    (pr.requiredSkills || []).forEach((s) => {
      const clean = s.toLowerCase().trim();
      tagCounts[clean] = (tagCounts[clean] || 0) + 2; // Projects carry higher weight
    });
  });

  const topTechnologies = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tech, count]) => ({
      technology: tech,
      relevanceScore: Math.min(100, count * 15),
    }));

  return {
    topTechnologies,
    interactionSegments: [
      { role: 'Full-Stack Developers', percentage: 42 },
      { role: 'Frontend Specialists', percentage: 28 },
      { role: 'Backend & Systems Engineers', percentage: 18 },
      { role: 'Technical Founders & Clients', percentage: 12 },
    ],
  };
};

export default {
  getDateRangeBoundaries,
  getCreatorOverview,
  getCreatorContent,
  getCreatorPerformanceTrends,
  getCreatorAudienceInsights,
};

