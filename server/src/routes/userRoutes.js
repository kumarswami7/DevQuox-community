import express from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Application } from '../models/Application.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { portfolioRouter, followRouter } from './discoveryRoutes.js';

export const userRouter = express.Router();

// Permitted fields that an authenticated user may self-update on their profile
const PERMITTED_PROFILE_FIELDS = [
  'name',
  'username',
  'avatar',
  'avatarUrl',
  'headline',
  'bio',
  'skills',
  'hourlyRate',
  'location',
  'githubUrl',
  'linkedinUrl',
  'websiteUrl',
  'twitterUrl',
  'availability',
  'openTo',
  'experienceLevel',
  'preferredRoles',
  'preferredProjectTypes',
  'languages',
  'timezone',
  'notificationPreferences',
];

// @route   GET /api/users/me
// @desc    Retrieve currently authenticated user profile
// @access  Private
userRouter.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await Profile.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      user,
      profile,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/prelaunch-pass
// @desc    Retrieve real pre-launch founding pass and community stats
// @access  Private
userRouter.get('/prelaunch-pass', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine user's real founding member sequence number from database
    let memberNumber = user.foundingMemberNumber;
    if (!memberNumber) {
      const priorCount = await User.countDocuments({
        createdAt: { $lte: user.createdAt || new Date() },
      });
      memberNumber = Math.max(1, priorCount);
      user.foundingMemberNumber = memberNumber;
      await user.save();
    }

    const totalMembers = await User.countDocuments();
    const totalIdeas = await Post.countDocuments({ postType: 'idea' }).catch(() => 0);
    const totalProjects = await Project.countDocuments().catch(() => 0);

    // Fetch user's actual submitted idea from the database if they posted one
    const submittedIdea = await Post.findOne({
      author: user._id,
      postType: 'idea',
    }).sort({ createdAt: -1 });

    const cardData = {
      memberNumber,
      memberNumberFormatted: String(memberNumber).padStart(4, '0'),
      cardNumber: `4829 •••• •••• ${String(memberNumber).padStart(4, '0')}`,
      cardHolder: (user.name || 'Founding Member').toUpperCase(),
      role: user.role || 'developer',
      tier: 'FOUNDING PASS',
      status: 'COMING SOON',
      passCode: `DQ-${String(memberNumber).padStart(4, '0')}`,
      cvv: String(((memberNumber * 73 + 127) % 900) + 100),
      totalRegisteredMembers: totalMembers,
      totalIdeas,
      totalProjects,
      submittedIdea: submittedIdea || null,
      hasSubmittedIdea: Boolean(submittedIdea),
    };

    return res.status(200).json({
      success: true,
      data: cardData,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/prelaunch-stats
// @desc    Public real platform stats for pre-launch
// @access  Public
userRouter.get('/prelaunch-stats', async (req, res, next) => {
  try {
    const totalMembers = await User.countDocuments();
    const totalIdeas = await Post.countDocuments({ postType: 'idea' }).catch(() => 0);
    const totalProjects = await Project.countDocuments().catch(() => 0);

    return res.status(200).json({
      success: true,
      data: {
        totalRegisteredMembers: totalMembers,
        totalIdeas,
        totalProjects,
        status: 'COMING SOON',
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/me/applications
// @desc    Retrieve currently authenticated user's submitted applications
// @access  Private
userRouter.get('/me/applications', protect, async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'project',
        select: 'title description category budget duration status experienceLevel teamSize acceptedApplicantsCount owner',
        populate: { path: 'owner', select: 'name username email avatar avatarUrl role' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/users/me
// @desc    Update currently authenticated user's permitted profile fields
// @access  Private
userRouter.patch('/me', protect, async (req, res, next) => {
  try {
    const updates = {};

    // Filter out any disallowed/mass-assigned fields (role, password, status, etc.)
    for (const field of PERMITTED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Username uniqueness validation and normalization
    if (updates.username) {
      const normalizedUsername = updates.username.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        });
      }

      const existing = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }

      updates.username = normalizedUsername;
    }

    // Name length validation
    if (updates.name && (updates.name.trim().length < 2 || updates.name.trim().length > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    // Mirror relevant fields to Profile document if it exists
    await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(updates.headline && { title: updates.headline }),
        ...(updates.bio && { about: updates.bio }),
        ...(updates.skills && { skills: updates.skills }),
        ...(updates.location && { location: updates.location }),
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/me/deactivate
// @desc    Deactivate currently authenticated user account
// @access  Private
userRouter.post('/me/deactivate', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status: 'deactivated', availability: 'not_available' },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Account has been deactivated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/me
// @desc    Permanently delete or deactivate currently authenticated user account
// @access  Private
userRouter.delete('/me', protect, async (req, res, next) => {
  try {
    const { password } = req.body || {};
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password confirmation',
        });
      }
    }

    await User.findByIdAndUpdate(req.user._id, {
      status: 'deactivated',
      bio: '[Account Deleted]',
      availability: 'not_available',
    });

    return res.status(200).json({
      success: true,
      message: 'Your account has been deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/developers
// @desc    List public developer profiles
// @access  Public
userRouter.get('/developers', async (req, res, next) => {
  try {
    const developers = await User.find({ role: 'developer', status: 'active' });
    const safeDevelopers = developers.map((d) => d.toPublicProfile());

    return res.status(200).json({
      success: true,
      data: safeDevelopers,
    });
  } catch (error) {
    next(error);
  }
});

// ── Portfolio & Follow Route Proxies ────────────────────────────────────────

// @route   GET /api/users/me/portfolio
userRouter.get('/me/portfolio', protect, (req, res, next) => {
  req.url = '/me';
  return portfolioRouter(req, res, next);
});

// @route   PATCH /api/users/me/portfolio
userRouter.patch('/me/portfolio', protect, (req, res, next) => {
  req.url = '/me';
  return portfolioRouter(req, res, next);
});

// @route   POST /api/users/me/portfolio/projects
userRouter.post('/me/portfolio/projects', protect, (req, res, next) => {
  req.url = '/me/projects';
  return portfolioRouter(req, res, next);
});

// @route   PATCH /api/users/me/portfolio/projects/:projectId
userRouter.patch('/me/portfolio/projects/:projectId', protect, (req, res, next) => {
  req.url = `/me/projects/${req.params.projectId}`;
  return portfolioRouter(req, res, next);
});

// @route   DELETE /api/users/me/portfolio/projects/:projectId
userRouter.delete('/me/portfolio/projects/:projectId', protect, (req, res, next) => {
  req.url = `/me/projects/${req.params.projectId}`;
  return portfolioRouter(req, res, next);
});

// @route   POST /api/users/me/skills
userRouter.post('/me/skills', protect, (req, res, next) => {
  req.url = '/me/skills';
  return portfolioRouter(req, res, next);
});

// @route   DELETE /api/users/me/skills/:skillName
userRouter.delete('/me/skills/:skillName', protect, (req, res, next) => {
  req.url = `/me/skills/${encodeURIComponent(req.params.skillName)}`;
  return portfolioRouter(req, res, next);
});

// @route   GET /api/users/:userId/portfolio
userRouter.get('/:userId/portfolio', optionalAuth, (req, res, next) => {
  req.url = `/${req.params.userId}`;
  return portfolioRouter(req, res, next);
});

// @route   POST /api/users/:userId/follow
userRouter.post('/:userId/follow', protect, (req, res, next) => {
  req.url = `/${req.params.userId}/follow`;
  return followRouter(req, res, next);
});

// @route   DELETE /api/users/:userId/follow
userRouter.delete('/:userId/follow', protect, (req, res, next) => {
  req.url = `/${req.params.userId}/follow`;
  return followRouter(req, res, next);
});

// @route   GET /api/users/:userId/followers
userRouter.get('/:userId/followers', (req, res, next) => {
  req.url = `/${req.params.userId}/followers`;
  return followRouter(req, res, next);
});

// @route   GET /api/users/:userId/following
userRouter.get('/:userId/following', (req, res, next) => {
  req.url = `/${req.params.userId}/following`;
  return followRouter(req, res, next);
});

// @route   GET /api/users/:username
// @desc    Get public user profile by username (or fallback ID) without exposing email
// @access  Public
userRouter.get('/:username', async (req, res, next) => {
  try {
    const param = req.params.username;
    let user;

    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(param);
    }

    if (!user) {
      user = await User.findOne({ username: param.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const profile = await Profile.findOne({ user: user._id });

    const safeUser = user.toPublicProfile();

    // Expose only safe public profile data — never expose email or internal status
    return res.status(200).json({
      success: true,
      user: safeUser,
      profile: profile || null,
      data: {
        user: safeUser,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users
// @desc    List users with public fields
// @access  Public
userRouter.get('/', async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = { status: 'active' };
    if (role) filter.role = role;

    const users = await User.find(filter);
    const safeUsers = users.map((u) => u.toPublicProfile());

    return res.status(200).json({
      success: true,
      data: safeUsers,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Backwards-compatible user update by ID
// @access  Private
userRouter.put('/:id', protect, async (req, res, next) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile',
      });
    }

    const updates = {};
    for (const field of PERMITTED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default userRouter;
