import mongoose from 'mongoose';

const VALID_STATUS_TRANSITIONS = {
  draft: ['open', 'cancelled'],
  open: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
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
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
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
      default: '$1,000 - $3,000',
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
        return normalized;
      },
      enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
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
    deadline: {
      type: Date,
    },
    applicationDeadline: {
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
