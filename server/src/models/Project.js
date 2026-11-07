import mongoose from 'mongoose';

const VALID_STATUS_TRANSITIONS = {
  draft: ['open', 'published', 'cancelled', 'archived'],
  open: ['paused', 'in_progress', 'completed', 'cancelled', 'archived'],
  published: ['paused', 'in_progress', 'completed', 'cancelled', 'archived'],
  paused: ['open', 'published', 'cancelled', 'archived'],
  in_progress: ['completed', 'cancelled', 'paused', 'archived'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: ['draft'],
};

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'Summary cannot exceed 300 characters'],
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        size: { type: Number, default: 0 },
        type: { type: String, default: '' },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: 'Web Development',
      trim: true,
    },
    projectType: {
      type: String,
      enum: {
        values: ['collaboration', 'freelance', 'academic', 'open_source'],
        message: '{VALUE} is not a valid project type',
      },
      default: 'collaboration',
    },
    experienceLevel: {
      type: String,
      default: 'intermediate',
      set: (val) => {
        if (typeof val === 'string') {
          const lower = val.toLowerCase().trim();
          if (lower === 'entry') return 'beginner';
          return lower;
        }
        return val;
      },
      enum: ['beginner', 'intermediate', 'expert', 'all', 'entry'],
    },
    teamSize: {
      type: Number,
      default: 1,
      min: [1, 'Team size must be at least 1'],
      max: [100, 'Team size cannot exceed 100 positions'],
    },
    acceptedApplicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    budget: {
      type: String,
      default: 'Community Project',
    },
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable', 'milestone'],
      default: 'fixed',
    },
    budgetMin: {
      type: Number,
      default: 0,
      min: [0, 'Minimum budget cannot be negative'],
    },
    budgetMax: {
      type: Number,
      default: 0,
      min: [0, 'Maximum budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    paymentStructure: {
      type: String,
      enum: ['milestone_based', 'upon_completion', 'hourly', 'custom'],
      default: 'milestone_based',
    },
    startDate: {
      type: Date,
    },
    duration: {
      type: String,
      default: '1 - 2 Months',
    },
    commitment: {
      type: String,
      enum: {
        values: ['full_time', 'part_time', 'flexible'],
        message: '{VALUE} is not a valid commitment type',
      },
      default: 'flexible',
    },
    workMode: {
      type: String,
      enum: ['remote', 'on_site', 'hybrid'],
      default: 'remote',
    },
    collaborationPreferences: {
      communicationTools: { type: [String], default: [] },
      workingHours: { type: String, default: '' },
      weeklyHours: { type: Number, default: 0 },
    },
    visibility: {
      type: String,
      enum: {
        values: ['public', 'private'],
        message: '{VALUE} is not a valid visibility',
      },
      default: 'public',
      index: true,
    },
    status: {
      type: String,
      default: 'open',
      set: (val) => {
        if (!val) return 'open';
        const normalized = val.toLowerCase().replace(/\s+/g, '_');
        if (normalized === 'published') return 'open';
        return normalized;
      },
      enum: ['draft', 'open', 'published', 'paused', 'in_progress', 'completed', 'cancelled', 'archived'],
      index: true,
    },
    applicationStatus: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 25,
        message: 'Cannot specify more than 25 required skills',
      },
    },
    technologies: {
      type: [String],
      default: [],
    },
    requiredRoles: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
    },
    applicationDeadline: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'contributor' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    applicationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reactionBreakdown: {
      like: { type: Number, default: 0, min: 0 },
      celebrate: { type: Number, default: 0, min: 0 },
      support: { type: Number, default: 0, min: 0 },
      insightful: { type: Number, default: 0, min: 0 },
      curious: { type: Number, default: 0, min: 0 },
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    repostsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    githubRepoUrl: {
      type: String,
      default: '',
    },
    liveDemoUrl: {
      type: String,
      default: '',
    },
    originIdeaPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for alias applicationCount
projectSchema.virtual('applicationCount').get(function () {
  return this.applicationsCount || 0;
});

// Auto-generate slug and publishedAt timestamp
projectSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    const base = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = this._id ? String(this._id).slice(-6) : Math.random().toString(36).substring(2, 8);
    this.slug = `${base}-${suffix}`;
  }
  if (['open', 'published'].includes(this.status) && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Compound indexes for optimal discovery feeds & filtering
projectSchema.index({ status: 1, visibility: 1, createdAt: -1 });
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ requiredSkills: 1, status: 1 });

// Text index for search
projectSchema.index(
  { title: 'text', description: 'text', requiredSkills: 'text' },
  { weights: { title: 10, requiredSkills: 5, description: 1 } }
);

// Method to validate status transitions
projectSchema.methods.canTransitionTo = function (nextStatus) {
  const current = this.status.toLowerCase().replace(/\s+/g, '_');
  const target = nextStatus.toLowerCase().replace(/\s+/g, '_');
  if (current === target) return true;
  const allowed = VALID_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(target);
};

export { VALID_STATUS_TRANSITIONS };
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;
