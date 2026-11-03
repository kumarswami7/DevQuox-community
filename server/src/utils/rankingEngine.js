/**
 * Centralized Intelligent Community Feed Ranking & Recommendation Engine
 *
 * Implements Phase 7 multi-signal ranking algorithm for DevConnect.
 * Evaluates content based on Quality, Engagement, Freshness, Shareability,
 * Conversion, and Discovery Opportunity while penalizing spam and preventing
 * popularity monopolies.
 */

export const DEFAULT_RANKING_WEIGHTS = {
  quality: 0.20,
  engagement: 0.20,
  relevance: 0.15,
  freshness: 0.15,
  shareability: 0.10,
  conversion: 0.10,
  discoveryOpportunity: 0.10,
};

export const DEFAULT_DECAY_HOURS = {
  idea: 72,       // Ideas have a 3-day half-life for feedback gathering
  project: 168,   // Projects have a 7-day half-life for developer discovery
  discussion: 48, // Discussions have a 2-day half-life for active responses
  default: 72,
};

/**
 * Calculates a Content Quality Score (0 to 100) based on structural completeness.
 */
export const calculateQualityScore = (item) => {
  let score = 0;

  const title = String(item.title || item.name || '').trim();
  const desc = String(item.content || item.description || '').trim();
  const tags = Array.isArray(item.tags) ? item.tags : Array.isArray(item.requiredSkills) ? item.requiredSkills : [];
  const links = Array.isArray(item.links) ? item.links : [];
  const hasRepoOrDemo = Boolean(item.githubRepoUrl || item.liveDemoUrl || item.githubUrl || links.length > 0);
  const attachments = Array.isArray(item.attachments) ? item.attachments : [];

  // Title completeness
  if (title.length >= 8) score += 10;
  if (title.length >= 20) score += 10;

  // Description depth and clarity
  if (desc.length >= 50) score += 10;
  if (desc.length >= 150) score += 15;
  if (desc.length >= 350) score += 15;

  // Technology / Skill categorization
  if (tags.length >= 1) score += 10;
  if (tags.length >= 3) score += 10;

  // Concrete reference (Repo, Live Demo, or Specification Attachment)
  if (hasRepoOrDemo || attachments.length > 0) score += 15;

  // Category / Type specification
  if (item.category || item.postType || item.projectType) score += 5;

  return Math.min(100, Math.max(0, score));
};

/**
 * Calculates Freshness Score (0 to 100) using exponential decay.
 */
export const calculateFreshnessScore = (createdAt, contentType = 'default', customDecayHours = null) => {
  const createdTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - createdTime) / (1000 * 60 * 60));
  const decayHours = customDecayHours || DEFAULT_DECAY_HOURS[contentType] || DEFAULT_DECAY_HOURS.default;

  // FreshnessScore = 100 * exp(-ageHours / decayHours)
  const score = 100 * Math.exp(-ageHours / decayHours);
  return Math.min(100, Math.max(0, parseFloat(score.toFixed(2))));
};

/**
 * Calculates Engagement Quality Score (0 to 100) with Laplace smoothing.
 * Prevents small-sample division anomalies (e.g., 1 click on 1 impression = 100%).
 */
export const calculateEngagementScore = (item) => {
  const impressions = Math.max(0, item.impressionsCount || item.impressions || item.viewsCount || 0);
  const upvotes = Math.max(0, item.upvotes || (Array.isArray(item.likes) ? item.likes.length : 0) || item.reactionsCount || 0);
  const comments = Math.max(0, item.commentsCount || 0);
  const clicks = Math.max(0, item.clicksCount || item.clicks || 0);
  const shares = Math.max(0, item.repostCount || item.repostsCount || item.shares || 0);

  // Smoothing constant: min denominator is 15
  const denominator = Math.max(15, impressions) + 5;
  const weightedEngagements = upvotes * 3.5 + comments * 5.0 + clicks * 1.5 + shares * 3.0;

  const rawRate = (weightedEngagements / denominator) * 100;
  return Math.min(100, Math.max(0, parseFloat(rawRate.toFixed(2))));
};

/**
 * Calculates Discovery Opportunity Score (0 to 100) to give emerging creators a fair launchpad.
 */
export const calculateDiscoveryOpportunityScore = (item, creatorTotalReach = 0) => {
  const impressions = Math.max(0, item.impressionsCount || item.impressions || 0);
  const quality = calculateQualityScore(item);

  // If content is high quality (> 50) and has low historical impressions, boost discovery
  if (impressions < 350 && quality >= 50) {
    const reachFactor = Math.max(0, 1 - impressions / 350);
    const creatorFactor = creatorTotalReach < 1000 ? 1.0 : 0.5;
    return Math.min(100, Math.round(quality * reachFactor * creatorFactor));
  }

  return 0;
};

/**
 * Calculates Shareability & Virality Score (0 to 100).
 */
export const calculateShareabilityScore = (item) => {
  const shares = Math.max(0, item.repostCount || item.repostsCount || item.shares || 0);
  const saves = Math.max(0, (Array.isArray(item.savedBy) ? item.savedBy.length : 0) || item.saves || 0);
  const impressions = Math.max(10, item.impressionsCount || item.impressions || 10);

  const rate = ((shares * 3.0 + saves * 2.0) / impressions) * 100;
  return Math.min(100, Math.max(0, parseFloat((rate * 4.0).toFixed(2))));
};

/**
 * Calculates Conversion Score (0 to 100).
 * High score for ideas that converted into real projects, or projects that successfully accept members.
 */
export const calculateConversionScore = (item) => {
  if (item.convertedToProject || item.originIdeaPost) {
    return 100;
  }

  if (item.postType === 'idea' || item.ideaDetails) {
    const comments = item.commentsCount || 0;
    const upvotes = item.upvotes || 0;
    if (comments >= 3 && upvotes >= 5) return 80;
    if (comments >= 1) return 50;
    return 20;
  }

  if (item.acceptedApplicantsCount && item.acceptedApplicantsCount > 0) {
    const ratio = (item.acceptedApplicantsCount / Math.max(1, item.teamSize || 1)) * 100;
    return Math.min(100, Math.max(30, Math.round(ratio)));
  }

  return 10;
};

/**
 * Calculates Negative Feedback Penalty based on reports or hide flags.
 */
export const calculateNegativePenalty = (item) => {
  let penalty = 0;
  if (item.isHidden || item.status === 'hidden') penalty += 80;
  if (typeof item.reportsCount === 'number' && item.reportsCount > 0) {
    penalty += Math.min(75, item.reportsCount * 25);
  }
  return penalty;
};

/**
 * Computes Master Community Ranking Score (0 to 100).
 *
 * RankingScore =
 *   (0.20 * Quality) +
 *   (0.20 * Engagement) +
 *   (0.15 * Relevance) +
 *   (0.15 * Freshness) +
 *   (0.10 * Shareability) +
 *   (0.10 * Conversion) +
 *   (0.10 * DiscoveryOpportunity) -
 *   NegativePenalty
 */
export const computeRankingScore = (
  item,
  {
    weights = DEFAULT_RANKING_WEIGHTS,
    relevanceScore = 75,
    creatorTotalReach = 0,
  } = {}
) => {
  const quality = calculateQualityScore(item);
  const freshness = calculateFreshnessScore(item.createdAt, item.postType || 'default');
  const engagement = calculateEngagementScore(item);
  const shareability = calculateShareabilityScore(item);
  const conversion = calculateConversionScore(item);
  const discovery = calculateDiscoveryOpportunityScore(item, creatorTotalReach);
  const penalty = calculateNegativePenalty(item);

  const w = { ...DEFAULT_RANKING_WEIGHTS, ...weights };

  const rawScore =
    w.quality * quality +
    w.engagement * engagement +
    w.relevance * relevanceScore +
    w.freshness * freshness +
    w.shareability * shareability +
    w.conversion * conversion +
    w.discoveryOpportunity * discovery -
    penalty;

  return Math.min(100, Math.max(0, parseFloat(rawScore.toFixed(2))));
};

export default {
  DEFAULT_RANKING_WEIGHTS,
  DEFAULT_DECAY_HOURS,
  calculateQualityScore,
  calculateFreshnessScore,
  calculateEngagementScore,
  calculateDiscoveryOpportunityScore,
  calculateShareabilityScore,
  calculateConversionScore,
  calculateNegativePenalty,
  computeRankingScore,
};

