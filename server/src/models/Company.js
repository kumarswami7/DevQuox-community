import mongoose from 'mongoose';

/**
 * Normalizes company name for deduplication and indexing
 * E.g., "  Tata Consultancy Services Limited! " -> "tata consultancy services limited"
 */
export const normalizeCompanyName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Extracts 2-4 letter uppercase initials/acronym from company name
 * E.g., "Tata Consultancy Services" -> "TCS"
 * "Infosys" -> "INF"
 * "Microsoft Corporation" -> "MC"
 */
export const extractCompanyInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return '';
  const clean = name.trim().replace(/[^\w\s]/g, '');
  const stopWords = new Set(['ltd', 'limited', 'inc', 'corp', 'corporation', 'llc', 'pvt', 'private', 'plc', 'co', 'the', 'and', 'of']);
  const words = clean.split(/\s+/).filter((w) => w && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) return clean.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  const initials = words.map((w) => w[0].toUpperCase()).join('');
  return initials.slice(0, 4);
};

/**
 * Clean and extract domain from website URL
 */
export const resolveCompanyDomain = (url) => {
  if (!url || typeof url !== 'string') return '';
  try {
    const raw = url.trim().toLowerCase();
    const withProto = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').trim();
  }
};

/**
 * Resolves standard 128px Google Favicon URL for a domain
 */
export const resolveCompanyFavicon = (domain) => {
  if (!domain || typeof domain !== 'string') return '';
  const clean = resolveCompanyDomain(domain);
  if (!clean) return '';
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=128`;
};

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      index: true,
    },
    normalizedName: {
      type: String,
      default: function () {
        return normalizeCompanyName(this.name);
      },
      trim: true,
      lowercase: true,
      index: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, 'Legal name cannot exceed 250 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    logoSource: {
      type: String,
      enum: ['jobiwork', 'official', 'favicon', 'initials', 'placeholder'],
      default: 'favicon',
    },
    initials: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        return extractCompanyInitials(this.name);
      },
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
      index: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: [10, 'Country code cannot exceed 10 characters'],
    },
    state: {
      type: String,
      trim: true,
      default: '',
      index: true,
      maxlength: [100, 'State/Province cannot exceed 100 characters'],
    },
    city: {
      type: String,
      trim: true,
      default: '',
      index: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    industry: {
      type: String,
      trim: true,
      default: 'Technology & Software',
      index: true,
      maxlength: [100, 'Industry name cannot exceed 100 characters'],
    },
    industryGroup: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Industry group cannot exceed 100 characters'],
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    registryName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      trim: true,
      default: 'Active',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    companySize: {
      type: String,
      trim: true,
      default: '',
    },
    employeesEstimate: {
      type: Number,
      default: 0,
    },
    parentCompany: {
      type: String,
      trim: true,
      default: '',
    },
    subsidiaries: {
      type: [String],
      default: [],
    },
    hiring: {
      isHiring: { type: Boolean, default: false },
      openJobs: { type: Number, default: 0 },
      employerVerified: { type: Boolean, default: false },
    },
    listing: {
      isListed: { type: Boolean, default: false },
      tickers: { type: [String], default: [] },
    },
    jobiworkId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    jobiworkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['jobiwork', 'manual', 'seed', 'system'],
      default: 'jobiwork',
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'pending', 'rejected'],
      default: 'verified',
      index: true,
    },
    lastSyncAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rawJobiworkData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound and text indexes
companySchema.index({ normalizedName: 1, country: 1 });
companySchema.index({ domain: 1 });
companySchema.index({ registrationNumber: 1 });
companySchema.index({ industry: 1, country: 1 });
companySchema.index({ name: 'text', legalName: 'text', domain: 'text', industry: 'text' });

// Lifecycle Pre-save Hook
companySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.normalizedName) {
    this.normalizedName = normalizeCompanyName(this.name);
  }

  if (!this.initials || this.isModified('name')) {
    this.initials = extractCompanyInitials(this.name);
  }

  if (this.website && (!this.domain || this.isModified('website'))) {
    this.domain = resolveCompanyDomain(this.website);
  }

  if (!this.logoUrl && this.domain) {
    this.logoUrl = resolveCompanyFavicon(this.domain);
    this.logoSource = 'favicon';
  }

  next();
});

export const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
export default Company;
