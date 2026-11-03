import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['developer', 'project'],
      required: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    query: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

savedSearchSchema.pre('save', function (next) {
  if (this.filters && Object.keys(this.filters).length > 0 && (!this.query || Object.keys(this.query).length === 0)) {
    this.query = this.filters;
  } else if (this.query && Object.keys(this.query).length > 0 && (!this.filters || Object.keys(this.filters).length === 0)) {
    this.filters = this.query;
  }
  next();
});

savedSearchSchema.index({ user: 1, type: 1, createdAt: -1 });
savedSearchSchema.index({ user: 1, name: 1 });

export const SavedSearch = mongoose.models.SavedSearch || mongoose.model('SavedSearch', savedSearchSchema);
export default SavedSearch;
