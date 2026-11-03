import express from 'express';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

export const profileRouter = express.Router();

const USER_POPULATE_FIELDS =
  'name email avatar avatarUrl role username location headline bio companyName websiteUrl githubUrl linkedinUrl college';

const ALLOWED_PROFILE_FIELDS = [
  'title', 'headline', 'about', 'bio', 'bannerImage', 'avatar', 'avatarUrl',
  'experienceLevel', 'preferredRoles', 'availability', 'visibility', 'openTo',
  'preferredProjectTypes', 'languages', 'hourlyRate', 'location', 'timezone',
  'contactEmail', 'skills', 'skillsWithProficiency', 'techStack', 'interests',
  'githubUrl', 'linkedinUrl', 'websiteUrl', 'twitterUrl',
  'companyName', 'companyWebsite', 'industry', 'companySize', 'companyStage',
  'hiringNeeds', 'typicalBudgetRange', 'workplaces',
  'experience', 'experiences', 'education', 'portfolio', 'openSource', 'certifications', 'college'
];

// ============================================================================
// 1. GET Current Logged-In User Profile
// ============================================================================
profileRouter.get('/me', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate('user', USER_POPULATE_FIELDS);

    // If user has no profile document yet in MongoDB, create an initialized profile from real user data
    if (!profile) {
      const isClient = req.user.role === 'client';
      profile = await Profile.create({
        user: req.user._id,
        title: req.user.headline || (isClient ? 'Founder & Project Owner' : 'Software Developer'),
        about: req.user.bio || '',
        headline: req.user.headline || '',
        location: req.user.location || '',
        companyName: req.user.companyName || '',
        hourlyRate: req.user.hourlyRate || 0,
        availability: req.user.availability || 'available',
        openTo: req.user.openTo || ['full_time', 'freelance'],
        skills: req.user.skills || [],
        techStack: [],
        experience: [],
        experiences: [],
        education: [],
        portfolio: [],
        openSource: [],
        reviews: [],
        certifications: [],
        achievements: [],
        bannerImage: '/banners/minimalist_desk.jpg',
        avatar: req.user.avatar || req.user.avatarUrl || '',
      });
      profile = await Profile.findById(profile._id).populate('user', USER_POPULATE_FIELDS);
    }

    return res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. GET Profile by Profile ID, User ID, or Username
// ============================================================================
profileRouter.get('/:id', async (req, res, next) => {
  try {
    const param = req.params.id;
    let profile = null;

    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await Profile.findById(param).populate('user', USER_POPULATE_FIELDS);
      if (!profile) {
        profile = await Profile.findOne({ user: param }).populate('user', USER_POPULATE_FIELDS);
      }
    }

    if (!profile) {
      // Try resolving by username
      const user = await User.findOne({ username: param.toLowerCase() });
      if (user) {
        profile = await Profile.findOne({ user: user._id }).populate('user', USER_POPULATE_FIELDS);
        if (!profile) {
          profile = await Profile.create({
            user: user._id,
            title: user.headline || (user.role === 'client' ? 'Founder & Project Owner' : 'Software Developer'),
            about: user.bio || '',
            headline: user.headline || '',
            skills: user.skills || [],
            availability: 'available',
          });
          profile = await Profile.findById(profile._id).populate('user', USER_POPULATE_FIELDS);
        }
      }
    }

    // If still no profile and param is a valid ObjectId, check User directly
    if (!profile && param.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(param);
      if (user) {
        profile = await Profile.create({
          user: user._id,
          title: user.headline || (user.role === 'client' ? 'Founder & Project Owner' : 'Software Developer'),
          about: user.bio || '',
          headline: user.headline || '',
          skills: user.skills || [],
          availability: 'available',
        });
        profile = await Profile.findById(profile._id).populate('user', USER_POPULATE_FIELDS);
      }
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. UPDATE Logged-In User Profile (Whitelisted Full / Partial)
// ============================================================================
profileRouter.put('/', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Filter updates to allowed fields only
    const updates = {};
    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Sync experience alias if provided
    if (updates.experience) {
      updates.experiences = updates.experience;
    } else if (updates.experiences) {
      updates.experience = updates.experiences;
    }

    // Assign sanitized updates to profile
    Object.assign(profile, updates);
    await profile.save();

    // Sync matching profile attributes to User document for consistency across app
    const userUpdates = {};
    if (req.body.name) userUpdates.name = req.body.name;
    if (updates.headline) userUpdates.headline = updates.headline;
    if (updates.title && !updates.headline) userUpdates.headline = updates.title;
    if (updates.about) userUpdates.bio = updates.about;
    if (updates.bio) userUpdates.bio = updates.bio;
    if (updates.avatar) {
      userUpdates.avatar = updates.avatar;
      userUpdates.avatarUrl = updates.avatar;
    }
    if (updates.avatarUrl) {
      userUpdates.avatar = updates.avatarUrl;
      userUpdates.avatarUrl = updates.avatarUrl;
    }
    if (updates.skills) userUpdates.skills = updates.skills;
    if (updates.location) userUpdates.location = updates.location;
    if (updates.companyName) userUpdates.companyName = updates.companyName;
    if (updates.hourlyRate !== undefined) userUpdates.hourlyRate = updates.hourlyRate;
    if (updates.availability) userUpdates.availability = updates.availability;
    if (updates.openTo) userUpdates.openTo = updates.openTo;
    if (updates.githubUrl) userUpdates.githubUrl = updates.githubUrl;
    if (updates.linkedinUrl) userUpdates.linkedinUrl = updates.linkedinUrl;
    if (updates.websiteUrl) userUpdates.websiteUrl = updates.websiteUrl;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    const updatedProfile = await Profile.findById(profile._id).populate('user', USER_POPULATE_FIELDS);
    return res.status(200).json(updatedProfile);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. Dedicated Sub-resource Endpoints: Experience
// ============================================================================
profileRouter.post('/experience', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = new Profile({ user: req.user._id });

    const newExp = {
      company: req.body.company,
      role: req.body.role,
      employmentType: req.body.employmentType || 'Full-Time',
      period: req.body.period || 'Present',
      location: req.body.location || '',
      description: req.body.description || '',
      companyLogo: req.body.companyLogo || '',
      companyLogoSource: req.body.companyLogoSource || '',
      companyDomain: req.body.companyDomain || '',
      companyWebsite: req.body.companyWebsite || '',
      companyId: req.body.companyId || null,
    };

    profile.experience.push(newExp);
    profile.experiences.push(newExp);
    await profile.save();

    return res.status(201).json(profile.experience);
  } catch (err) {
    next(err);
  }
});

profileRouter.delete('/experience/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.experience = profile.experience.filter((exp) => String(exp._id) !== req.params.id);
    profile.experiences = profile.experiences.filter((exp) => String(exp._id) !== req.params.id);
    await profile.save();

    return res.status(200).json(profile.experience);
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/experience/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const idx = profile.experience.findIndex((exp) => String(exp._id) === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: 'Experience record not found' });
    }

    const currentExp = profile.experience[idx].toObject ? profile.experience[idx].toObject() : profile.experience[idx];
    profile.experience[idx] = {
      ...currentExp,
      company: req.body.company ?? currentExp.company,
      role: req.body.role ?? currentExp.role,
      employmentType: req.body.employmentType ?? currentExp.employmentType,
      period: req.body.period ?? currentExp.period,
      location: req.body.location ?? currentExp.location,
      startDate: req.body.startDate ?? currentExp.startDate,
      endDate: req.body.endDate ?? currentExp.endDate,
      current: req.body.current ?? currentExp.current,
      description: req.body.description ?? currentExp.description,
      companyLogo: req.body.companyLogo ?? currentExp.companyLogo,
      companyLogoSource: req.body.companyLogoSource ?? currentExp.companyLogoSource,
      companyDomain: req.body.companyDomain ?? currentExp.companyDomain,
      companyWebsite: req.body.companyWebsite ?? currentExp.companyWebsite,
      companyId: req.body.companyId ?? currentExp.companyId,
    };
    profile.experiences = profile.experience;
    await profile.save();

    return res.status(200).json(profile.experience);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 5. Dedicated Sub-resource Endpoints: Education
// ============================================================================
profileRouter.post('/education', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = new Profile({ user: req.user._id });

    const newEdu = {
      institution: req.body.institution,
      degree: req.body.degree || '',
      fieldOfStudy: req.body.fieldOfStudy || '',
      year: req.body.year || '',
      startYear: req.body.startYear || null,
      endYear: req.body.endYear || null,
      status: req.body.status || '',
      description: req.body.description || '',
      university: req.body.university || null,
      universityCountry: req.body.universityCountry || '',
      universityLogoUrl: req.body.universityLogoUrl || '',
      universityDomain: req.body.universityDomain || '',
      isVerifiedUniversity: Boolean(req.body.isVerifiedUniversity),
      college: req.body.college || null,
      collegeName: req.body.collegeName || req.body.institution || '',
      collegeCity: req.body.collegeCity || '',
      collegeState: req.body.collegeState || '',
      collegeCountry: req.body.collegeCountry || req.body.universityCountry || '',
      collegeLogoUrl: req.body.collegeLogoUrl || req.body.universityLogoUrl || '',
      collegeLogoSource: req.body.collegeLogoSource || 'favicon',
      collegeInitials: req.body.collegeInitials || '',
      collegeWebsite: req.body.collegeWebsite || '',
      isVerifiedCollege: Boolean(req.body.isVerifiedCollege || req.body.isVerifiedUniversity),
    };

    profile.education.push(newEdu);
    if (newEdu.college) {
      profile.college = newEdu.college;
      await User.findByIdAndUpdate(req.user._id, { college: newEdu.college });
    }
    await profile.save();

    return res.status(201).json(profile.education);
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/education/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const edu = profile.education.id(req.params.id) || profile.education.find((e) => String(e._id) === req.params.id);
    if (!edu) return res.status(404).json({ message: 'Education record not found' });

    if (req.body.institution !== undefined) edu.institution = req.body.institution;
    if (req.body.degree !== undefined) edu.degree = req.body.degree;
    if (req.body.fieldOfStudy !== undefined) edu.fieldOfStudy = req.body.fieldOfStudy;
    if (req.body.year !== undefined) edu.year = req.body.year;
    if (req.body.startYear !== undefined) edu.startYear = req.body.startYear;
    if (req.body.endYear !== undefined) edu.endYear = req.body.endYear;
    if (req.body.status !== undefined) edu.status = req.body.status;
    if (req.body.description !== undefined) edu.description = req.body.description;
    if (req.body.university !== undefined) edu.university = req.body.university;
    if (req.body.universityCountry !== undefined) edu.universityCountry = req.body.universityCountry;
    if (req.body.universityLogoUrl !== undefined) edu.universityLogoUrl = req.body.universityLogoUrl;
    if (req.body.universityDomain !== undefined) edu.universityDomain = req.body.universityDomain;
    if (req.body.isVerifiedUniversity !== undefined) edu.isVerifiedUniversity = Boolean(req.body.isVerifiedUniversity);
    if (req.body.college !== undefined) edu.college = req.body.college;
    if (req.body.collegeName !== undefined) edu.collegeName = req.body.collegeName;
    if (req.body.collegeCity !== undefined) edu.collegeCity = req.body.collegeCity;
    if (req.body.collegeState !== undefined) edu.collegeState = req.body.collegeState;
    if (req.body.collegeCountry !== undefined) edu.collegeCountry = req.body.collegeCountry;
    if (req.body.collegeLogoUrl !== undefined) edu.collegeLogoUrl = req.body.collegeLogoUrl;
    if (req.body.collegeLogoSource !== undefined) edu.collegeLogoSource = req.body.collegeLogoSource;
    if (req.body.collegeInitials !== undefined) edu.collegeInitials = req.body.collegeInitials;
    if (req.body.collegeWebsite !== undefined) edu.collegeWebsite = req.body.collegeWebsite;
    if (req.body.isVerifiedCollege !== undefined) edu.isVerifiedCollege = Boolean(req.body.isVerifiedCollege);

    if (edu.college) {
      profile.college = edu.college;
      await User.findByIdAndUpdate(req.user._id, { college: edu.college });
    }

    await profile.save();
    return res.status(200).json(profile.education);
  } catch (err) {
    next(err);
  }
});

profileRouter.delete('/education/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.education = profile.education.filter((edu) => String(edu._id) !== req.params.id);
    await profile.save();

    return res.status(200).json(profile.education);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 6. Dedicated Sub-resource Endpoints: Portfolio Showcase
// ============================================================================
profileRouter.post('/portfolio', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = new Profile({ user: req.user._id });

    const newProject = {
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category || 'Web Development',
      skills: req.body.skills || [],
      technologies: req.body.skills || [],
      liveUrl: req.body.liveUrl || '',
      repoUrl: req.body.repoUrl || '',
      role: req.body.role || '',
    };

    profile.portfolio.push(newProject);
    await profile.save();

    return res.status(201).json(profile.portfolio);
  } catch (err) {
    next(err);
  }
});

profileRouter.delete('/portfolio/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.portfolio = profile.portfolio.filter((proj) => String(proj._id) !== req.params.id);
    await profile.save();

    return res.status(200).json(profile.portfolio);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 7. Dedicated Sub-resource Endpoints: Open Source
// ============================================================================
profileRouter.post('/opensource', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = new Profile({ user: req.user._id });

    const newRepo = {
      repoName: req.body.repoName,
      description: req.body.description || '',
      url: req.body.url || '',
      stars: req.body.stars || 0,
      forks: req.body.forks || 0,
      language: req.body.language || 'JavaScript',
    };

    profile.openSource.push(newRepo);
    await profile.save();

    return res.status(201).json(profile.openSource);
  } catch (err) {
    next(err);
  }
});

profileRouter.delete('/opensource/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.openSource = profile.openSource.filter((item) => String(item._id) !== req.params.id);
    await profile.save();

    return res.status(200).json(profile.openSource);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 8. Reviews / Endorsements
// ============================================================================
profileRouter.post('/:id/reviews', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Prevent self-reviews
    if (String(profile.user) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot write a review for your own profile' });
    }

    if (!req.body.comment || !req.body.comment.trim()) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    // Check for duplicate reviews from same user
    const alreadyReviewed = profile.reviews.some(
      (r) => r.authorName?.toLowerCase() === req.user.name?.toLowerCase()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already submitted a review for this profile' });
    }

    const ratingVal = Math.min(5, Math.max(1, Number(req.body.rating) || 5));

    const newReview = {
      authorName: req.user.name,
      authorAvatar: req.user.avatar || req.user.avatarUrl || '',
      role: req.user.role === 'client' ? 'Client / Project Owner' : 'Peer Engineer',
      comment: req.body.comment.trim(),
      rating: ratingVal,
      createdAt: new Date(),
    };

    profile.reviews.push(newReview);
    // Recalculate average rating
    const total = profile.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    profile.rating = Number((total / profile.reviews.length).toFixed(1));
    await profile.save();

    return res.status(201).json(profile.reviews);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 9. Dedicated Sub-resource Endpoints: Certifications
// ============================================================================
profileRouter.post('/certifications', protect, async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = new Profile({ user: req.user._id });

    const newCert = {
      name: req.body.name,
      issuer: req.body.issuer,
      credentialUrl: req.body.credentialUrl || '',
      credentialId: req.body.credentialId || '',
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      isVerified: Boolean(req.body.isVerified),
    };

    profile.certifications.push(newCert);
    await profile.save();

    return res.status(201).json(profile.certifications);
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/certifications/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const cert = profile.certifications.id(req.params.id) || profile.certifications.find((c) => String(c._id) === req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certification record not found' });

    if (req.body.name !== undefined) cert.name = req.body.name;
    if (req.body.issuer !== undefined) cert.issuer = req.body.issuer;
    if (req.body.credentialUrl !== undefined) cert.credentialUrl = req.body.credentialUrl;
    if (req.body.credentialId !== undefined) cert.credentialId = req.body.credentialId;
    if (req.body.issueDate !== undefined) cert.issueDate = req.body.issueDate ? new Date(req.body.issueDate) : null;
    if (req.body.expiryDate !== undefined) cert.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
    if (req.body.isVerified !== undefined) cert.isVerified = Boolean(req.body.isVerified);

    await profile.save();
    return res.status(200).json(profile.certifications);
  } catch (err) {
    next(err);
  }
});

profileRouter.delete('/certifications/:id', protect, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.certifications = profile.certifications.filter((cert) => String(cert._id) !== req.params.id);
    await profile.save();

    return res.status(200).json(profile.certifications);
  } catch (err) {
    next(err);
  }
});

export default profileRouter;
