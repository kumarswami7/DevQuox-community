import mongoose from 'mongoose';

const showcaseProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  skills: {
    type: [String],
    default: [],
  },
  technologies: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    default: 'Web Development',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  screenshots: {
    type: [String],
    default: [],
  },
  repoUrl: {
    type: String,
    default: '',
    trim: true,
  },
  liveUrl: {
    type: String,
    default: '',
    trim: true,
  },
  role: {
    type: String,
    default: '',
    maxlength: [100, 'Role cannot exceed 100 characters'],
  },
  contributionDescription: {
    type: String,
    default: '',
    maxlength: [1000, 'Contribution cannot exceed 1000 characters'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  projectRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  source: {
    type: String,
    enum: ['devconnect', 'independent'],
    default: 'independent',
  },
  inProgress: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role/Title is required'],
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters'],
  },
  employmentType: {
    type: String,
    default: 'Full-Time',
  },
  period: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  current: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  companyLogo: {
    type: String,
    default: '',
  },
  companyLogoSource: {
    type: String,
    enum: ['official', 'jobiwork', 'favicon', 'initials', 'default', ''],
    default: '',
  },
  companyDomain: {
    type: String,
    default: '',
  },
  companyWebsite: {
    type: String,
    default: '',
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [150, 'Institution cannot exceed 150 characters'],
  },
  degree: {
    type: String,
    default: '',
    maxlength: [100, 'Degree cannot exceed 100 characters'],
  },
  fieldOfStudy: {
    type: String,
    default: '',
    maxlength: [100, 'Field of study cannot exceed 100 characters'],
  },
  year: {
    type: String,
    default: '',
  },
  startYear: {
    type: Number,
    default: null,
  },
  endYear: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    default: null,
  },
  universityCountry: {
    type: String,
    default: '',
  },
  universityLogoUrl: {
    type: String,
    default: '',
  },
  universityDomain: {
    type: String,
    default: '',
  },
  isVerifiedUniversity: {
    type: Boolean,
    default: false,
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null,
  },
  collegeName: {
    type: String,
    default: '',
  },
  collegeCity: {
    type: String,
    default: '',
  },
  collegeState: {
    type: String,
    default: '',
  },
  collegeCountry: {
    type: String,
    default: '',
  },
  collegeLogoUrl: {
    type: String,
    default: '',
  },
  collegeLogoSource: {
    type: String,
    default: 'favicon',
  },
  collegeInitials: {
    type: String,
    default: '',
  },
  collegeWebsite: {
    type: String,
    default: '',
  },
  isVerifiedCollege: {
    type: Boolean,
    default: false,
  },
});

const openSourceSchema = new mongoose.Schema({
  repoName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    default: '',
    trim: true,
  },
  stars: {
    type: Number,
    default: 0,
  },
  forks: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
    default: 'JavaScript',
  },
});

const reviewSchema = new mongoose.Schema({
  authorName: {
    type: String,
    required: true,
    trim: true,
  },
  authorAvatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    default: 'Client',
  },
  comment: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true,
  },
  issuer: {
    type: String,
    required: [true, 'Issuer is required'],
    trim: true,
  },
  issueDate: {
    type: Date,
    default: null,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  credentialUrl: {
    type: String,
    default: '',
    trim: true,
  },
  credentialId: {
    type: String,
    default: '',
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true,
  },
  issuerOrOrg: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: null,
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  url: {
    type: String,
    default: '',
  },
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Software Developer',
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    about: {
      type: String,
      default: '',
      maxlength: [2000, 'About cannot exceed 2000 characters'],
    },
    headline: {
      type: String,
      default: '',
      maxlength: [150, 'Headline cannot exceed 150 characters'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [2000, 'Biography cannot exceed 2000 characters'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead'],
      default: 'mid',
      index: true,
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'not_available', 'open_to_offers'],
      default: 'available',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'authenticated', 'private'],
      default: 'public',
      index: true,
    },
    openTo: {
      type: [String],
      default: ['full_time', 'freelance', 'contract'],
    },
    preferredProjectTypes: {
      type: [String],
      default: ['fixed_price', 'hourly', 'open_source'],
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: [0, 'Hourly rate cannot be negative'],
    },
    location: {
      type: String,
      default: '',
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    timezone: {
      type: String,
      default: '',
      maxlength: [50, 'Timezone cannot exceed 50 characters'],
    },
    contactEmail: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    skillsWithProficiency: [
      {
        name: { type: String, required: true, trim: true },
        category: { type: String, default: 'General' },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'intermediate',
        },
        yearsOfExperience: { type: Number, default: 1, min: 0 },
      },
    ],
    techStack: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    portfolio: [showcaseProjectSchema],
    experiences: [experienceSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
    },
    openSource: [openSourceSchema],
    reviews: [reviewSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],
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
    companyName: {
      type: String,
      default: '',
    },
    companyWebsite: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: 'Technology & Software',
    },
    companySize: {
      type: String,
      default: '1-10 Employees',
    },
    companyStage: {
      type: String,
      default: 'Early Stage / Startup',
    },
    hiringNeeds: {
      type: [String],
      default: [],
    },
    typicalBudgetRange: {
      type: String,
      default: '$1,000 - $10,000',
    },
    paymentVerified: {
      type: Boolean,
      default: true,
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
      min: 0,
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
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes for discovery and filtering
profileSchema.index({ visibility: 1, experienceLevel: 1, availability: 1 });

export const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
export default Profile;
