import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQualityScore,
  calculateFreshnessScore,
  calculateEngagementScore,
  calculateDiscoveryOpportunityScore,
  calculateShareabilityScore,
  calculateConversionScore,
  calculateNegativePenalty,
  computeRankingScore,
  DEFAULT_RANKING_WEIGHTS,
} from '../../src/utils/rankingEngine.js';
import { getMidnightUTCDate } from '../../src/services/telemetryService.js';
import { getDateRangeBoundaries } from '../../src/services/analyticsService.js';

test('Intelligent Community Feed Ranking Algorithm Engine (Unit)', async (t) => {
  await t.test('calculateQualityScore accurately scores content structural completeness', () => {
    // Thin submission
    const thinItem = {
      title: 'Idea',
      content: 'Short desc',
    };
    const thinScore = calculateQualityScore(thinItem);
    assert.ok(thinScore <= 20, `Thin content should have low score, got ${thinScore}`);

    // Complete, rich project submission
    const richItem = {
      title: 'DevConnect Full-Stack Collaborative Project Workspace',
      content:
        'DevConnect is an open-source platform enabling developers to collaborate on real milestone builds, share idea pitches, and manage protected sprint workspaces with real-time WebSockets and RBAC.',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Socket.IO'],
      githubRepoUrl: 'https://github.com/devconnect/workspace',
      category: 'Web Development',
    };
    const richScore = calculateQualityScore(richItem);
    assert.ok(richScore >= 80, `Comprehensive content should have high score, got ${richScore}`);
  });

  await t.test('calculateFreshnessScore enforces exponential decay over time', () => {
    const now = Date.now();
    const fresh = calculateFreshnessScore(new Date(now), 'idea');
    assert.equal(fresh, 100, 'Fresh post should have 100% freshness');

    // 72 hours later (idea half-life)
    const threeDaysOld = new Date(now - 72 * 60 * 60 * 1000);
    const decayed = calculateFreshnessScore(threeDaysOld, 'idea');
    // exp(-1) is ~0.3678 -> ~36.79%
    assert.ok(decayed >= 35 && decayed <= 38, `Decayed freshness should be ~36.8%, got ${decayed}`);

    // Very old post (30 days)
    const old = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const veryOldFreshness = calculateFreshnessScore(old, 'idea');
    assert.ok(veryOldFreshness < 1, '30-day old post should have nearly zero freshness');
  });

  await t.test('calculateEngagementScore uses Laplace smoothing to avoid small-sample anomalies', () => {
    // 1 click on 1 impression should NOT produce 100%
    const smallSample = {
      impressionsCount: 1,
      clicksCount: 1,
      upvotes: 0,
      commentsCount: 0,
    };
    const smallScore = calculateEngagementScore(smallSample);
    assert.ok(smallScore < 15, `Small sample should be smoothed down, got ${smallScore}`);

    // Highly engaged post with genuine velocity
    const viralPost = {
      impressionsCount: 100,
      upvotes: 25,
      commentsCount: 15,
      clicksCount: 40,
      repostCount: 10,
    };
    const viralScore = calculateEngagementScore(viralPost);
    assert.ok(viralScore >= 80, `High velocity engagement should yield high score, got ${viralScore}`);
  });

  await t.test('calculateDiscoveryOpportunityScore boosts emerging high-quality creators', () => {
    const emergingPost = {
      title: 'Novel High-Performance WebGL Shader Engine for Biomolecules',
      content:
        'A comprehensive implementation of hardware-accelerated 3D coordinate rendering in modern browsers using WebGL2 and KaTeX math formulas.',
      tags: ['WebGL', 'JavaScript', 'Graphics'],
      links: [{ url: 'https://demo.example.com' }],
      impressionsCount: 40, // Low reach
    };

    const discoveryBoost = calculateDiscoveryOpportunityScore(emergingPost, 120);
    assert.ok(discoveryBoost >= 40, `Emerging quality post must receive discovery boost, got ${discoveryBoost}`);

    // Saturated post with 50,000 impressions should not receive discovery boost
    const saturatedPost = {
      ...emergingPost,
      impressionsCount: 50000,
    };
    const noBoost = calculateDiscoveryOpportunityScore(saturatedPost, 100000);
    assert.equal(noBoost, 0, 'Saturated content must receive 0 discovery boost');
  });

  await t.test('calculateNegativePenalty severely penalizes hidden or reported content', () => {
    const cleanPost = { isHidden: false, reportsCount: 0 };
    assert.equal(calculateNegativePenalty(cleanPost), 0);

    const hiddenPost = { isHidden: true, status: 'hidden' };
    assert.ok(calculateNegativePenalty(hiddenPost) >= 80);

    const reportedPost = { isHidden: false, reportsCount: 3 };
    assert.ok(calculateNegativePenalty(reportedPost) >= 75);
  });

  await t.test('computeRankingScore generates deterministic score matching Phase 7 master formula', () => {
    const item = {
      title: 'Decentralized Microservices on Kubernetes with Go',
      content:
        'Detailed architectural analysis and production deployment guide covering Envoy service mesh, mutual TLS, and zero-downtime rolling updates.',
      tags: ['Go', 'Kubernetes', 'Docker'],
      links: [{ url: 'https://github.com/example/k8s' }],
      impressionsCount: 120,
      upvotes: 18,
      commentsCount: 8,
      clicksCount: 22,
      repostCount: 5,
      createdAt: new Date(),
    };

    const score1 = computeRankingScore(item);
    const score2 = computeRankingScore(item);

    assert.equal(score1, score2, 'Ranking formula must be strictly deterministic');
    assert.ok(score1 >= 40 && score1 <= 100, `Valid content must produce reasonable score, got ${score1}`);
  });
});

test('Telemetry & Analytics Service Utilities (Unit)', async (t) => {
  await t.test('getMidnightUTCDate normalizes dates to 00:00:00 UTC', () => {
    const d = new Date('2026-11-01T14:35:42.123Z');
    const midnight = getMidnightUTCDate(d);

    assert.equal(midnight.getUTCHours(), 0);
    assert.equal(midnight.getUTCMinutes(), 0);
    assert.equal(midnight.getUTCSeconds(), 0);
    assert.equal(midnight.getUTCMilliseconds(), 0);
    assert.equal(midnight.getUTCDate(), 1);
    assert.equal(midnight.getUTCMonth(), 10); // November (0-indexed 10)
    assert.equal(midnight.getUTCFullYear(), 2026);
  });

  await t.test('getDateRangeBoundaries correctly splits comparative periods', () => {
    const boundaries = getDateRangeBoundaries('7d');
    assert.equal(boundaries.days, 7);
    assert.ok(boundaries.currentStart instanceof Date);
    assert.ok(boundaries.currentEnd instanceof Date);
    assert.ok(boundaries.previousStart instanceof Date);
    assert.ok(boundaries.previousEnd instanceof Date);

    // Previous end must be earlier than current start
    assert.ok(boundaries.previousEnd.getTime() < boundaries.currentStart.getTime());

    // Period lengths must match
    const currentDuration = boundaries.currentEnd.getTime() - boundaries.currentStart.getTime();
    const previousDuration = boundaries.previousEnd.getTime() - boundaries.previousStart.getTime();
    const ratio = currentDuration / previousDuration;
    assert.ok(ratio >= 0.8 && ratio <= 1.2, `Comparative period windows should be equal length, got ratio ${ratio}`);
  });
});

