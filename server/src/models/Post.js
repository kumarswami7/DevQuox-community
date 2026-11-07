import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    postType: {
      type: String,
      enum: [
        'discussion',
        'showcase',
        'question',
        'article',
        'general',
        'knowledge',
        'collaboration',
        'career',
        'tutorial',
        'idea',
      ],
      default: 'discussion',
      index: true,
    },
    ideaDetails: {
      category: { type: String, default: 'Web Development', trim: true },
      technologies: { type: [String], default: [] },
      requiredSkills: { type: [String], default: [] },
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'intermediate' },
      expectedOutcome: { type: String, default: '', trim: true },
      coverImage: { type: String, default: '' },
      targetAudience: { type: String, default: '', trim: true },
      estimatedBudget: { type: String, default: '', trim: true },
      rolesNeeded: { type: [String], default: [] },
      feedbackQuestions: { type: [String], default: [] },
      attachments: [
        {
          name: { type: String, default: '' },
          url: { type: String, default: '' },
          fileType: { type: String, default: 'document' },
          size: { type: Number, default: 0 },
        },
      ],
      status: {
        type: String,
        enum: ['brainstorming', 'seeking_feedback', 'ready_to_build', 'converted', 'project_published'],
        default: 'seeking_feedback',
      },
    },
    attachments: [
      {
        name: { type: String, default: '' },
        url: { type: String, default: '' },
        fileType: { type: String, default: 'document' },
        size: { type: Number, default: 0 },
      },
    ],
    convertedToProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    links: [
      {
        title: { type: String, default: '' },
        url: { type: String, required: true },
      },
    ],
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvotes: {
      type: Number,
      default: 0,
      index: true,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    impressionsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    uniqueViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    trendingScore: {
      type: Number,
      default: 0,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'archived'],
      default: 'active',
      index: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
    repostedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.pre('save', function (next) {
  if (this.isHidden) {
    this.status = 'hidden';
  } else if (this.status === 'hidden') {
    this.isHidden = true;
  } else {
    this.isHidden = false;
    this.status = this.status || 'active';
  }

  // Ensure upvotes stays in sync with unique likes array length
  if (Array.isArray(this.likes)) {
    this.upvotes = this.likes.length;
  }
  next();
});

postSchema.index({ status: 1, isHidden: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ savedBy: 1 });

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;
