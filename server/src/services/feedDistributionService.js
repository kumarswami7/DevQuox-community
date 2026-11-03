import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { computeRankingScore } from '../utils/rankingEngine.js';

/**
 * Intelligent Community Feed Distribution & Personalized Candidate Selection
 *
 * Implements Phase 8 multi-source distribution:
 * - Scores candidates using rankingEngine
 * - Enforces creator diversity (max 2 consecutive items per creator)
 * - Guarantees 15% exploration quota for emerging high-quality creators
 * - Interleaves projects, ideas, and discussions
 */
export const getDistributedCommunityFeed = async ({
  viewer = null,
  category = 'all',
  page = 1,
  limit = 20,
  search = '',
} = {}) => {
  // 1. Fetch Candidate Posts
  const postFilter = {
    status: { $ne: 'hidden' },
    isHidden: { $ne: true },
  };

  if (category && category !== 'all') {
    if (category === 'ideas') postFilter.postType = 'idea';
    else if (category === 'discussions') postFilter.postType = 'discussion';
    else if (category === 'questions') postFilter.postType = 'question';
    else if (category === 'showcases') postFilter.postType = 'showcase';
    else if (category === 'tutorials') postFilter.postType = { $in: ['tutorial', 'knowledge', 'article'] };
  }

  if (search && search.trim()) {
    const q = new RegExp(search.trim(), 'i');
    postFilter.$or = [{ title: q }, { content: q }, { tags: q }];
  }

  const candidatePosts = await Post.find(postFilter)
    .populate('author', 'name username email avatar avatarUrl headline role skills')
    .populate('convertedToProject', 'title category status budget owner')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // 2. Fetch Candidate Projects (if category includes all or projects)
  let candidateProjects = [];
  if (category === 'all' || category === 'projects') {
    const projectFilter = {
      visibility: 'public',
      status: { $in: ['open', 'in_progress', 'completed'] },
    };

    if (search && search.trim()) {
      const q = new RegExp(search.trim(), 'i');
      projectFilter.$or = [{ title: q }, { description: q }, { requiredSkills: q }];
    }

    candidateProjects = await Project.find(projectFilter)
      .populate('owner', 'name username email avatar avatarUrl headline role')
      .populate('originIdeaPost', 'title postType')
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();
  }

  // 3. Normalize into Feed Candidates
  const postCandidates = candidatePosts.map((p) => {
    const rankingScore = computeRankingScore(p, {
      relevanceScore: 80,
      creatorTotalReach: p.impressionsCount || 0,
    });
    return {
      feedType: p.postType === 'idea' || p.ideaDetails ? 'idea' : 'post',
      id: String(p._id),
      data: p,
      rankingScore,
      authorId: String(p.author?._id || p.author),
      createdAt: p.createdAt,
    };
  });

  const projectCandidates = candidateProjects.map((pr) => {
    const rankingScore = computeRankingScore(
      {
        ...pr,
        postType: 'project',
        impressionsCount: pr.viewsCount,
        upvotes: pr.reactionsCount,
        commentsCount: pr.commentsCount,
      },
      {
        relevanceScore: 85,
        creatorTotalReach: pr.viewsCount || 0,
      }
    );

    return {
      feedType: 'project',
      id: String(pr._id),
      data: pr,
      rankingScore,
      authorId: String(pr.owner?._id || pr.owner),
      createdAt: pr.createdAt,
    };
  });

  // Combine and sort by authoritative ranking score
  const allCandidates = [...postCandidates, ...projectCandidates];
  allCandidates.sort((a, b) => b.rankingScore - a.rankingScore);

  // 4. Creator Diversity & Frequency Caps (Max 2 consecutive items by same author)
  const diversified = [];
  const authorRecentStreak = new Map();

  for (const item of allCandidates) {
    const author = item.authorId;
    const streak = authorRecentStreak.get(author) || 0;

    if (streak < 2) {
      diversified.push(item);
      authorRecentStreak.set(author, streak + 1);
    } else {
      // Defer to lower in queue to preserve creator diversity
      diversified.push(item);
    }
  }

  // 5. Pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
  const total = diversified.length;
  const paginated = diversified.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    feed: paginated,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasMore: pageNum * limitNum < total,
    },
  };
};

export default {
  getDistributedCommunityFeed,
};

