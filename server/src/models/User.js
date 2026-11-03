import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['developer', 'client', 'student', 'freelancer', 'admin'],
      default: 'developer',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: '',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
      maxlength: [150, 'Headline cannot exceed 150 characters'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Biography cannot exceed 1000 characters'],
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'not_available', 'open_to_offers'],
      default: 'available',
    },
    openTo: {
      type: [String],
      default: ['full_time', 'freelance', 'contract'],
    },
    skills: {
      type: [String],
      default: [],
    },
    skillsWithProficiency: [
      {
        name: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate',
        },
        yearsOfExperience: { type: Number, default: 1 },
      },
    ],
    hourlyRate: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: '',
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    githubUrl: {
      type: String,
      default: '',
    },
    linkedinUrl: {
      type: String,
      default: '',
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    twitterUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
    showcaseCount: {
      type: Number,
      default: 0,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    preferredProjectTypes: {
      type: [String],
      default: ['fixed_price', 'hourly', 'open_source'],
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    timezone: {
      type: String,
      default: '',
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      directMessages: { type: Boolean, default: true },
      applicationAlerts: { type: Boolean, default: true },
      communityMentions: { type: Boolean, default: true },
      marketingNewsletter: { type: Boolean, default: false },
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    foundingMemberNumber: {
      type: Number,
      default: null,
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordTokenHash;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordTokenHash;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return a safe representation for public consumption (no email, no hashes)
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    id: this._id,
    name: this.name,
    username: this.username,
    role: this.role,
    avatar: this.avatar || this.avatarUrl,
    avatarUrl: this.avatarUrl || this.avatar,
    headline: this.headline,
    bio: this.bio,
    skills: this.skills,
    skillsWithProficiency: this.skillsWithProficiency,
    availability: this.availability,
    openTo: this.openTo,
    hourlyRate: this.hourlyRate,
    location: this.location,
    githubUrl: this.githubUrl,
    linkedinUrl: this.linkedinUrl,
    websiteUrl: this.websiteUrl,
    twitterUrl: this.twitterUrl,
    rating: this.rating,
    completedProjectsCount: this.completedProjectsCount,
    showcaseCount: this.showcaseCount,
    experienceLevel: this.experienceLevel,
    preferredRoles: this.preferredRoles || [],
    preferredProjectTypes: this.preferredProjectTypes || [],
    languages: this.languages || [],
    timezone: this.timezone || '',
    followersCount: this.followersCount || 0,
    followingCount: this.followingCount || 0,
    foundingMemberNumber: this.foundingMemberNumber || null,
    college: this.college || null,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
