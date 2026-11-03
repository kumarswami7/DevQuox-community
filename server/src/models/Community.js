import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Community name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    categories: {
      type: [String],
      default: ['General'],
      index: true,
    },
    icon: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    membersCount: {
      type: Number,
      default: 1,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

communitySchema.pre('save', function (next) {
  if (this.category && (!this.categories || this.categories.length === 0)) {
    this.categories = [this.category];
  } else if (this.categories && this.categories.length > 0 && !this.category) {
    this.category = this.categories[0];
  }
  if (Array.isArray(this.members)) {
    this.membersCount = this.members.length;
  }
  next();
});

communitySchema.index({ membersCount: -1, createdAt: -1 });

export const Community = mongoose.models.Community || mongoose.model('Community', communitySchema);
export default Community;
