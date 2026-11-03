import mongoose from 'mongoose';

/**
 * Normalizes university names for deduplication and case-insensitive searching
 * E.g., "  University of Oxford! " -> "university of oxford"
 */
export const normalizeUniversityName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    .replace(/\s+/g, ' '); // collapse consecutive spaces
};

/**
 * Resolves standard 128px Google Favicon URL for a given domain
 */
export const resolveFaviconUrl = (domain) => {
  if (!domain || typeof domain !== 'string') return '';
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].trim();
  if (!cleanDomain) return '';
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
};

const universitySchema = new mongoose.Schema(
  {
    universityName: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
      maxlength: [200, 'University name cannot exceed 200 characters'],
    },
    normalizedName: {
      type: String,
      default: function () {
        return normalizeUniversityName(this.universityName);
      },
      trim: true,
      lowercase: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: [10, 'Country code cannot exceed 10 characters'],
      index: true,
    },
    stateProvince: {
      type: String,
      trim: true,
      default: null,
      maxlength: [100, 'State/Province cannot exceed 100 characters'],
    },
    domains: {
      type: [String],
      default: [],
      index: true,
    },
    websites: {
      type: [String],
      default: [],
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    logoSource: {
      type: String,
      enum: ['official', 'favicon', 'manual', 'placeholder'],
      default: 'favicon',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['hipo', 'manual', 'admin'],
      default: 'hipo',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to support rapid search by normalized name and country
universitySchema.index({ normalizedName: 1, country: 1 });
universitySchema.index({ countryCode: 1, normalizedName: 1 });

// Pre-save hook to ensure normalizedName and logoUrl are populated
universitySchema.pre('save', function (next) {
  if (this.isModified('universityName') || !this.normalizedName) {
    this.normalizedName = normalizeUniversityName(this.universityName);
  }

  // If logoUrl is empty and domain exists, populate fallback favicon
  if (!this.logoUrl && Array.isArray(this.domains) && this.domains.length > 0) {
    this.logoUrl = resolveFaviconUrl(this.domains[0]);
    this.logoSource = 'favicon';
  } else if (!this.logoUrl && Array.isArray(this.websites) && this.websites.length > 0) {
    this.logoUrl = resolveFaviconUrl(this.websites[0]);
    this.logoSource = 'favicon';
  }

  next();
});

export const University =
  mongoose.models.University || mongoose.model('University', universitySchema);

export default University;
