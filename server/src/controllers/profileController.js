import { Profile } from '../models/Profile.js';

export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email role avatar');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile', error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { title, availability, about, skills, techStack, githubUrl, linkedinUrl } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.title = title || profile.title;
    profile.availability = availability || profile.availability;
    profile.about = about || profile.about;
    profile.skills = skills || profile.skills;
    profile.techStack = techStack || profile.techStack;
    profile.githubUrl = githubUrl || profile.githubUrl;
    profile.linkedinUrl = linkedinUrl || profile.linkedinUrl;

    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};
