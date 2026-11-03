import mongoose from 'mongoose';

/**
 * Normalizes college / institution name for duplicate matching and indexing
 * E.g., "  Indian Institute of Technology, Bombay! " -> "indian institute of technology bombay"
 */
export const normalizeCollegeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    .replace(/\s+/g, ' '); // collapse consecutive whitespaces
};

/**
 * Extracts standard acronym or initials from institution name
 * E.g., "Massachusetts Institute of Technology" -> "MIT"
 * "Indian Institute of Technology Bombay" -> "IITB"
 * "University of Oxford" -> "UO"
 */
export const extractInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return '';
  const clean = name.trim().replace(/[^\w\s]/g, '');
  const stopWords = new Set(['of', 'and', 'the', 'for', 'in', 'at', 'de', 'la', 'von', 'und']);
  const words = clean.split(/\s+/).filter((w) => w && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) return clean.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  // If known acronyms or short names exist
  const initials = words.map((w) => w[0].toUpperCase()).join('');
  return initials.slice(0, 5);
};

/**
 * Clean and extract domain from website URL
 */
export const resolveDomain = (url) => {
  if (!url || typeof url !== 'string') return '';
  try {
    const raw = url.trim().toLowerCase();
    const withProto = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    const cleaned = url.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').trim();
    return cleaned;
  }
};

/**
 * Validates a web URL safely
 */
export const isValidWebUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const raw = url.trim();
    const withProto = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
};

/**
 * Resolves standard 128px Google Favicon URL for a given domain
 */
export const resolveFaviconUrl = (domain) => {
  if (!domain || typeof domain !== 'string') return '';
  const cleanDomain = resolveDomain(domain);
  if (!cleanDomain) return '';
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
};

/**
 * Logo Fallback Hierarchy Resolver
 * 1. Official logo URL, if supplied by a trusted source
 * 2. Official website favicon
 * 3. Generated initials
 * 4. Placeholder
 */
export const resolveLogoHierarchy = ({ logoUrl, domain, name, initials }) => {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0 && !logoUrl.includes('placeholder')) {
    return {
      logoUrl: logoUrl.trim(),
      logoSource: 'official',
    };
  }

  const cleanDomain = resolveDomain(domain);
  if (cleanDomain) {
    return {
      logoUrl: resolveFaviconUrl(cleanDomain),
      logoSource: 'favicon',
    };
  }

  const generatedInitials = initials || extractInitials(name);
  if (generatedInitials) {
    return {
      logoUrl: '',
      logoSource: 'initials',
    };
  }

  return {
    logoUrl: '',
    logoSource: 'placeholder',
  };
};

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College or university name is required'],
      trim: true,
      maxlength: [250, 'Institution name cannot exceed 250 characters'],
    },
    normalizedName: {
      type: String,
      default: function () {
        return normalizeCollegeName(this.name);
      },
      trim: true,
      lowercase: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: [10, 'Country code cannot exceed 10 characters'],
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'State/Province cannot exceed 100 characters'],
      index: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Address cannot exceed 300 characters'],
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
      index: true,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    logoSource: {
      type: String,
      enum: ['official', 'favicon', 'initials', 'placeholder'],
      default: 'favicon',
    },
    initials: {
      type: String,
      trim: true,
      uppercase: true,
      default: function () {
        return extractInitials(this.name) || 'CLG';
      },
    },
    institutionType: {
      type: String,
      enum: [
        'university',
        'college',
        'engineering',
        'medical',
        'arts_science',
        'research_institute',
        'other',
      ],
      default: 'college',
      index: true,
    },
    rorId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: undefined,
    },
    source: {
      type: String,
      enum: ['ror', 'api_ninjas', 'manual', 'seed', 'admin'],
      default: 'seed',
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'rejected'],
      default: 'verified',
      index: true,
    },
    isManuallyAdded: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for fast searching and deduplication
collegeSchema.index({ normalizedName: 1, country: 1, city: 1 });
collegeSchema.index({ country: 1, state: 1, city: 1 });
collegeSchema.index({ institutionType: 1, country: 1 });
collegeSchema.index({ name: 'text', aliases: 'text', city: 'text' });

// Pre-save lifecycle hook to normalize values, compute initials, domain, and resolve logo hierarchy
collegeSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.normalizedName) {
    this.normalizedName = normalizeCollegeName(this.name);
  }

  if (!this.initials || this.isModified('name')) {
    this.initials = extractInitials(this.name);
  }

  if (this.website && (!this.domain || this.isModified('website'))) {
    this.domain = resolveDomain(this.website);
  }

  // Automatic Logo Resolution Hierarchy if logoUrl is not already official
  if (!this.logoUrl || this.logoSource !== 'official') {
    const resolved = resolveLogoHierarchy({
      logoUrl: this.logoUrl,
      domain: this.domain,
      name: this.name,
      initials: this.initials,
    });
    this.logoUrl = resolved.logoUrl;
    this.logoSource = resolved.logoSource;
  }

  next();
});

export const College = mongoose.models.College || mongoose.model('College', collegeSchema);
export default College;
