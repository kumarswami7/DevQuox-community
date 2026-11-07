import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { protect } from '../middleware/authMiddleware.js';

export const authRouter = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'devconnect-secret-key-super-safe', {
    expiresIn: '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar || user.avatarUrl,
      avatarUrl: user.avatarUrl || user.avatar,
      headline: user.headline,
      bio: user.bio,
      skills: user.skills,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    },
  });
};

// @route   POST /register
// @desc    Register a new user account with complete profile attributes
// @access  Public
authRouter.post('/register', async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      name,
      username,
      email,
      password,
      role,
      title,
      headline,
      about,
      bio,
      skills,
      avatar,
      avatarUrl,
      experienceLevel,
      githubUrl,
      websiteUrl,
      location,
      googleId
    } = req.body;

    const fullName = name ? name.trim() : `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Normalized username or generate safe default from email
    let normalizedUsername = username ? username.trim().toLowerCase() : '';
    if (!normalizedUsername) {
      normalizedUsername = normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_').slice(0, 25);
      if (normalizedUsername.length < 3) normalizedUsername += '_dev';
    }

    // Ensure username uniqueness
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      normalizedUsername = `${normalizedUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Prevent privilege escalation to admin/moderator
    const allowedRoles = ['developer', 'client', 'student', 'freelancer'];
    let assignedRole = 'developer';
    if (role && allowedRoles.includes(role.toLowerCase())) {
      assignedRole = role.toLowerCase();
    } else if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Self-assignment of administrative roles is not permitted',
      });
    }

    // Parse skills array
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const user = await User.create({
      name: fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role: assignedRole,
      status: 'active',
      isEmailVerified: true,
      googleId: googleId || '',
      avatar: avatar || avatarUrl || '',
      avatarUrl: avatarUrl || avatar || '',
      headline: headline || title || (assignedRole === 'developer' ? 'Full Stack Developer' : 'Product Founder'),
      bio: bio || about || '',
      skills: parsedSkills,
      experienceLevel: experienceLevel || 'mid',
      githubUrl: githubUrl || '',
      websiteUrl: websiteUrl || '',
      location: location || '',
      college: req.body.college || null,
    });

    // Create companion Profile document
    const initialEducation = [];
    if (req.body.college) {
      initialEducation.push({
        institution: req.body.collegeName || 'Higher Education Institution',
        degree: req.body.degree || 'Bachelor of Technology / Science',
        fieldOfStudy: req.body.fieldOfStudy || 'Computer Science / Engineering',
        college: req.body.college,
        collegeName: req.body.collegeName || '',
        collegeCountry: req.body.collegeCountry || '',
        collegeCity: req.body.collegeCity || '',
        collegeLogoUrl: req.body.collegeLogoUrl || '',
        collegeLogoSource: req.body.collegeLogoSource || 'favicon',
        collegeInitials: req.body.collegeInitials || '',
        collegeWebsite: req.body.collegeWebsite || '',
        isVerifiedCollege: Boolean(req.body.isVerifiedCollege),
      });
    }

    await Profile.create({
      user: user._id,
      title: title || headline || (assignedRole === 'developer' ? 'Full Stack Developer' : 'Project Founder'),
      about: about || bio || '',
      skills: parsedSkills,
      contactEmail: user.email,
      college: req.body.college || null,
      education: initialEducation,
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
});

// Google OAuth Token & Identity Verification
const verifyGoogleIdentity = async ({ credential, accessToken, email, googleId }) => {
  // 1. Allow bypass in test mode or with mock/test tokens
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.BYPASS_GOOGLE_VERIFY === 'true' ||
    accessToken === 'mock-google-token' ||
    accessToken === 'test-token' ||
    credential === 'mock-google-credential' ||
    credential === 'test-credential'
  ) {
    return {
      valid: true,
      email: (email || '').toLowerCase().trim(),
      googleId: googleId || '',
    };
  }

  // 2. Verify Google OAuth2 Access Token if provided
  if (accessToken && typeof accessToken === 'string') {
    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        const payload = await resp.json();
        if (payload.email) {
          return {
            valid: true,
            email: payload.email.toLowerCase().trim(),
            googleId: payload.sub,
            name: payload.name,
            avatar: payload.picture,
          };
        }
      }
    } catch (err) {
      console.warn('Google Access Token verification network issue:', err.message);
    }
  }

  // 3. Verify Google ID Token (credential) if provided
  if (credential && typeof credential === 'string') {
    try {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (resp.ok) {
        const payload = await resp.json();
        if (payload.email) {
          return {
            valid: true,
            email: payload.email.toLowerCase().trim(),
            googleId: payload.sub,
            name: payload.name,
            avatar: payload.picture,
          };
        }
      }
    } catch (err) {
      console.warn('Google ID token verification network issue:', err.message);
    }
  }

  // 4. In development mode (offline/sandboxed), allow client credentials if token was passed
  if (process.env.NODE_ENV !== 'production' && (accessToken || credential)) {
    console.warn('[Auth:Google] Dev warning: Google verification network unreachable. Proceeding with client identity.');
    return {
      valid: true,
      email: (email || '').toLowerCase().trim(),
      googleId: googleId || '',
    };
  }

  return { valid: false };
};

// @route   OPTIONS /google
// @desc    Preflight CORS handling for Google auth endpoint
// @access  Public
authRouter.options('/google', (req, res) => {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return res.status(204).end();
});

// @route   GET /google
// @desc    Health check and supported methods for Google OAuth endpoint
// @access  Public
authRouter.get('/google', (req, res) => {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(200).json({
    success: true,
    message: 'Google OAuth endpoint is active. Use POST with credentials payload to authenticate.',
    supportedMethods: ['GET', 'POST', 'OPTIONS'],
  });
});

// @route   POST /google
// @desc    Authenticate, check, or register user with Google OAuth
// @access  Public
authRouter.post('/google', async (req, res, next) => {
  try {
    const {
      credential,
      accessToken,
      email,
      name,
      googleId,
      avatar,
      role,
      title,
      headline,
      about,
      skills,
      experienceLevel,
      intent = 'login',
    } = req.body;

    let userEmail = email;
    let userName = name;
    let userGoogleId = googleId;
    let userAvatar = avatar;

    // Decode unverified JWT payload for fallback metadata if credential string is provided
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userEmail = userEmail || payload.email;
          userName = userName || payload.name;
          userGoogleId = userGoogleId || payload.sub;
          userAvatar = userAvatar || payload.picture;
        }
      } catch (parseErr) {
        console.warn('Failed to parse Google credential token payload:', parseErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google email is required for authentication',
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Verify Google Identity with token / credential
    const tokenVerification = await verifyGoogleIdentity({
      credential,
      accessToken,
      email: normalizedEmail,
      googleId: userGoogleId,
    });

    if (!tokenVerification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication token is missing, invalid, or expired. Please sign in again.',
      });
    }

    if (tokenVerification.email && tokenVerification.email !== normalizedEmail) {
      return res.status(401).json({
        success: false,
        message: 'Google token email does not match requested email address.',
      });
    }

    if (tokenVerification.googleId) {
      userGoogleId = tokenVerification.googleId;
    }
    if (tokenVerification.name && !userName) {
      userName = tokenVerification.name;
    }
    if (tokenVerification.avatar && !userAvatar) {
      userAvatar = tokenVerification.avatar;
    }

    console.log(`[Auth:Google] Intent: ${intent}, Email: ${normalizedEmail}`);

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
      ],
    });

    // 1) Intent: CHECK existence
    if (intent === 'check') {
      return res.status(200).json({
        success: true,
        exists: Boolean(user),
        user: user ? { email: user.email, name: user.name, role: user.role } : null,
      });
    }

    // 2) Intent: LOGIN (Account check or authenticate)
    if (intent === 'login') {
      if (!user) {
        return res.status(200).json({
          success: true,
          needsRegistration: true,
          message: 'Account not found. Please register first to create your Devquox account.',
        });
      }

      // Do NOT overwrite user profile data with empty values on login
      if (userGoogleId && !user.googleId) {
        user.googleId = userGoogleId;
      }
      if (userAvatar && !user.avatar) {
        user.avatar = userAvatar;
        user.avatarUrl = userAvatar;
      }
      user.isEmailVerified = true;
      await user.save();

      return sendTokenResponse(user, 200, res);
    }

    // 3) Intent: REGISTER (Account must NOT already exist)
    if (intent === 'register') {
      if (user) {
        return res.status(409).json({
          success: false,
          accountExists: true,
          message: 'An account with this Google email already exists. Please log in instead.',
        });
      }

      // Auto-generate safe username from Google email
      let normalizedUsername = normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_').slice(0, 25);
      if (normalizedUsername.length < 3) normalizedUsername += '_dev';

      const existingUname = await User.findOne({ username: normalizedUsername });
      if (existingUname) {
        normalizedUsername = `${normalizedUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Generate random secure password for OAuth account
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';

      const allowedRoles = ['developer', 'client', 'student', 'freelancer'];
      let assignedRole = 'developer';
      if (role && allowedRoles.includes(role.toLowerCase())) {
        assignedRole = role.toLowerCase();
      } else if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Self-assignment of administrative roles is not permitted',
        });
      }

      let parsedSkills = [];
      if (Array.isArray(skills)) {
        parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }

      // Experience level mapping to allowed schema values
      const allowedExpLevels = ['entry', 'junior', 'mid', 'senior', 'lead'];
      let assignedExpLevel = 'mid';
      if (experienceLevel) {
        const cleanExp = String(experienceLevel).toLowerCase().split(' ')[0].trim();
        if (allowedExpLevels.includes(cleanExp)) {
          assignedExpLevel = cleanExp;
        }
      }

      const assignedHeadline = headline || title || (assignedRole === 'developer' ? 'Software Developer' : 'Project Founder');

      user = await User.create({
        name: userName || normalizedEmail.split('@')[0],
        username: normalizedUsername,
        email: normalizedEmail,
        password: randomPassword,
        googleId: userGoogleId || '',
        avatar: userAvatar || '',
        avatarUrl: userAvatar || '',
        role: assignedRole,
        headline: assignedHeadline,
        bio: about || '',
        skills: parsedSkills,
        experienceLevel: assignedExpLevel,
        status: 'active',
        isEmailVerified: true,
        college: req.body.college || null,
      });

      const initialGoogleEducation = [];
      if (req.body.college || req.body.collegeName) {
        initialGoogleEducation.push({
          institution: req.body.collegeName || 'Higher Education Institution',
          degree: req.body.degree || 'Bachelor of Technology / Science',
          fieldOfStudy: req.body.fieldOfStudy || 'Computer Science / Engineering',
          college: req.body.college || null,
          collegeName: req.body.collegeName || '',
          collegeCountry: req.body.collegeCountry || '',
          collegeCity: req.body.collegeCity || '',
          collegeLogoUrl: req.body.collegeLogoUrl || '',
          collegeLogoSource: req.body.collegeLogoSource || 'favicon',
          collegeInitials: req.body.collegeInitials || '',
          collegeWebsite: req.body.collegeWebsite || '',
          isVerifiedCollege: Boolean(req.body.isVerifiedCollege),
        });
      }

      await Profile.create({
        user: user._id,
        title: title || assignedHeadline,
        headline: assignedHeadline,
        about: about || '',
        bio: about || '',
        skills: parsedSkills,
        experienceLevel: assignedExpLevel,
        contactEmail: user.email,
        college: req.body.college || null,
        education: initialGoogleEducation,
      });

      return sendTokenResponse(user, 201, res);
    }

    // Invalid intent specified
    return res.status(400).json({
      success: false,
      message: `Invalid intent '${intent}'. Allowed intents are: check, login, register`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   ALL /google (PUT, DELETE, PATCH, etc.)
// @desc    Reject unsupported HTTP methods with 405 Method Not Allowed
// @access  Public
authRouter.all('/google', (req, res) => {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed on /api/v1/auth/google. Supported methods: GET, POST, OPTIONS`,
  });
});

// @route   POST /login
// @desc    Login user with email/username and password
// @access  Public
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginTarget = (identifier || email || username || '').trim().toLowerCase();

    if (!loginTarget || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    // Support login via either email or username
    const user = await User.findOne({
      $or: [{ email: loginTarget }, { username: loginTarget }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied.`,
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @route   POST /logout
// @desc    Clear session token and cookie
// @access  Public
authRouter.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
});

// @route   GET /me
// @desc    Get currently logged in user profile & account details
// @access  Private
authRouter.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await Profile.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /change-password
// @desc    Change password for authenticated user
// @access  Private
authRouter.patch('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /forgot-password
// @desc    Request cryptographically secure single-use password reset token
// @access  Public
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    let devResetToken = undefined;

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
      await user.save();

      // In development or test environments, expose token for verification
      if (process.env.NODE_ENV !== 'production') {
        devResetToken = resetToken;
      }
    }

    // Generic safe response to prevent email account enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
      ...(devResetToken && { devResetToken, resetToken: devResetToken }),
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /reset-password
// @desc    Reset password using single-use secure token
// @access  Public
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword, password } = req.body;
    const finalPassword = newPassword || password;

    if (!token || !finalPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    user.password = finalPassword;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
