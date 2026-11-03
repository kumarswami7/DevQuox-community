import mongoose from 'mongoose';

export const SKILL_CATEGORIES = [
  'Languages',
  'Frontend development',
  'Backend development',
  'Full-stack development',
  'Database',
  'DevOps and cloud',
  'Tools & Version Control',
  'UI/UX design',
  'Mobile development',
  'Data science and AI',
  'Cybersecurity',
  'Quality assurance and testing',
  'Civil and other engineering disciplines',
  'Product management and related professional skills',
  'General',
];

export const normalizeSkillName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName.trim().replace(/\s+/g, ' ');
};

export const createSkillSlug = (name) => {
  return normalizeSkillName(name)
    .toLowerCase()
    .replace(/[^a-z0-9#+.]+/gi, '-')
    .replace(/^-+|-+$/g, '');
};

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      default: function () {
        return createSkillSlug(this.name || '');
      },
    },
    category: {
      type: String,
      enum: SKILL_CATEGORIES,
      default: 'General',
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    iconProvider: {
      type: String,
      enum: ['devicon', 'simpleicons', 'iconify', 'custom', 'fallback'],
      default: 'devicon',
    },
    iconName: {
      type: String,
      default: '',
    },
    iconUrl: {
      type: String,
      default: '',
    },
    fallbackUrl: {
      type: String,
      default: '',
    },
    iconifyUrl: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#64748b',
    },
  },
  {
    timestamps: true,
  }
);

skillSchema.pre('validate', function () {
  if (this.name) {
    this.name = normalizeSkillName(this.name);
    if (!this.slug) {
      this.slug = createSkillSlug(this.name);
    }
  }
});

skillSchema.index({ name: 'text', aliases: 'text' });

export const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
export default Skill;
