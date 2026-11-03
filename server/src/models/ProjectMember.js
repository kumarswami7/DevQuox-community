import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed'],
      default: 'active',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    removedAt: {
      type: Date,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    removalReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Removal reason cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sync legacy index fields on document validation
projectMemberSchema.pre('validate', function (next) {
  if (this.project && !this.projectId) this.projectId = this.project;
  if (this.user && !this.userId) this.userId = this.user;
  next();
});

// Sync legacy index fields on findOneAndUpdate
projectMemberSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const filter = this.getFilter() || {};
    const proj = update.$set?.project || update.$setOnInsert?.project || update.project || filter.project;
    const usr = update.$set?.user || update.$setOnInsert?.user || update.user || filter.user;

    if (proj) {
      if (update.$set) {
        update.$set.projectId = proj;
      } else if (update.$setOnInsert) {
        update.$setOnInsert.projectId = proj;
      } else {
        update.projectId = proj;
      }
    }
    if (usr) {
      if (update.$set) {
        update.$set.userId = usr;
      } else if (update.$setOnInsert) {
        update.$setOnInsert.userId = usr;
      } else {
        update.userId = usr;
      }
    }
  }
  next();
});

// Compound unique index enforcing exactly one membership record per user per project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
projectMemberSchema.index({ project: 1, status: 1 });
projectMemberSchema.index({ user: 1, status: 1 });

export const ProjectMember =
  mongoose.models.ProjectMember || mongoose.model('ProjectMember', projectMemberSchema);

// Safe attempt to drop legacy Atlas index if present
if (ProjectMember.collection) {
  ProjectMember.collection.dropIndex('projectId_1_userId_1').catch(() => {});
}

export default ProjectMember;
