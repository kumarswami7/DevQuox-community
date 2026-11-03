import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { projectService } from '../services/projectService';
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Globe,
  Lock,
  Github,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Lightbulb,
} from 'lucide-react';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'AI & ML',
  'Cloud & DevOps',
  'FinTech',
  'Cybersecurity',
  'Open Source',
  'Blockchain',
  'Data Science',
  'Other',
];

const PROJECT_TYPES = [
  { id: 'collaboration', label: 'Team Collaboration', desc: 'Co-build software with peers' },
  { id: 'freelance', label: 'Freelance Bounty', desc: 'Paid milestones and deliverables' },
  { id: 'academic', label: 'Academic & Research', desc: 'Study, lab, or thesis project' },
  { id: 'open_source', label: 'Open Source', desc: 'Public repo with community contributors' },
];

const COMMITMENTS = [
  { id: 'flexible', label: 'Flexible', desc: 'Self-paced contributor schedule' },
  { id: 'part_time', label: 'Part-Time', desc: '~10 - 20 hrs / week' },
  { id: 'full_time', label: 'Full-Time', desc: '~35 - 40 hrs / week' },
];

const DURATIONS = [
  '1 Week',
  '2 Weeks',
  '1 Month',
  '1 - 2 Months',
  '3 Months',
  '6 Months+',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },
];

const SUGGESTED_SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'MongoDB',
  'TailwindCSS',
  'Docker',
  'AWS',
  'Next.js',
  'GraphQL',
];

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ideaData = location.state?.fromIdea;

  // Skills Tag State
  const [skills, setSkills] = useState(['React', 'Node.js', 'MongoDB']);
  const [newSkill, setNewSkill] = useState('');
  const [skillError, setSkillError] = useState('');

  // Budget Expansion Toggle State
  const [showBudget, setShowBudget] = useState(false);

  // Form State
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: formErrors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'Web Development',
      projectType: 'collaboration',
      teamSize: 1,
      budgetMin: '',
      budgetMax: '',
      currency: 'USD',
      duration: '1 - 2 Months',
      commitment: 'flexible',
      visibility: 'public',
      deadline: '',
      applicationDeadline: '',
      githubRepoUrl: '',
      liveDemoUrl: '',
    },
  });

  // Pre-fill fields if launched from a community Idea
  useEffect(() => {
    if (ideaData) {
      if (ideaData.title) setValue('title', ideaData.title);
      if (ideaData.description) {
        let compiledDesc = ideaData.description;
        if (Array.isArray(ideaData.rolesNeeded) && ideaData.rolesNeeded.length > 0) {
          compiledDesc += `\n\n### 👥 Looking to Collaborate with:\n- ` + ideaData.rolesNeeded.join('\n- ');
        }
        setValue('description', compiledDesc);
      }
      if (ideaData.category) setValue('category', ideaData.category);
      if (Array.isArray(ideaData.skills) && ideaData.skills.length > 0) {
        setSkills(ideaData.skills);
      }
      if (ideaData.budget) {
        const numMatches = String(ideaData.budget).match(/\d+/g);
        if (numMatches && numMatches.length > 0) {
          setShowBudget(true);
          setValue('budgetMin', numMatches[0]);
          if (numMatches[1]) setValue('budgetMax', numMatches[1]);
        }
      }
    }
  }, [ideaData, setValue]);

  const titleVal = watch('title') || '';
  const descVal = watch('description') || '';
  const currentCategory = watch('category');
  const currentProjectType = watch('projectType');
  const currentCommitment = watch('commitment');
  const currentVisibility = watch('visibility');
  const currentCurrency = watch('currency') || 'USD';

  // Handle adding new skill tag
  const handleAddSkill = (skillToAdd) => {
    const rawSkill = (skillToAdd || newSkill).trim().replace(/^#/, '');
    if (!rawSkill) return;

    if (skills.length >= 25) {
      setSkillError('Maximum of 25 skills allowed per project');
      return;
    }

    const lower = rawSkill.toLowerCase();
    const isDuplicate = skills.some((s) => s.toLowerCase() === lower);

    if (isDuplicate) {
      setSkillError(`"${rawSkill}" is already added`);
      return;
    }

    setSkills([...skills, rawSkill]);
    setNewSkill('');
    setSkillError('');
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    if (skills.length <= 25) {
      setSkillError('');
    }
  };

  // Comprehensive Client-Side Validation
  const validateForm = (data) => {
    const errs = {};

    // 1. Title validation (Mandatory)
    const trimmedTitle = (data.title || '').trim();
    if (!trimmedTitle) {
      errs.title = 'Project title is required';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'Title must be at least 3 characters';
    } else if (trimmedTitle.length > 120) {
      errs.title = 'Title cannot exceed 120 characters';
    }

    // 2. Description validation (Mandatory)
    const trimmedDesc = (data.description || '').trim();
    if (!trimmedDesc) {
      errs.description = 'Project description is required';
    } else if (trimmedDesc.length < 10) {
      errs.description = 'Description must be at least 10 characters';
    } else if (trimmedDesc.length > 5000) {
      errs.description = 'Description cannot exceed 5000 characters';
    }

    // 3. GitHub Repository URL (MANDATORY)
    const urlPattern = /^https?:\/\/.+/i;
    const trimmedGithub = (data.githubRepoUrl || '').trim();
    if (!trimmedGithub) {
      errs.githubRepoUrl = 'GitHub Repository URL is required';
    } else if (!urlPattern.test(trimmedGithub)) {
      errs.githubRepoUrl = 'GitHub URL must start with http:// or https://';
    }

    // 4. Live Demo URL (Optional)
    if (data.liveDemoUrl && data.liveDemoUrl.trim()) {
      if (!urlPattern.test(data.liveDemoUrl.trim())) {
        errs.liveDemoUrl = 'Live Demo URL must start with http:// or https://';
      }
    }

    // 5. Team Size (Mandatory)
    const teamNum = Number(data.teamSize);
    if (isNaN(teamNum) || teamNum < 1 || teamNum > 100) {
      errs.teamSize = 'Team size must be between 1 and 100 positions';
    }

    // 6. Budget Validation (Optional, active only if budget section opened or values provided)
    if (showBudget) {
      const hasMin = data.budgetMin !== '' && data.budgetMin !== undefined && data.budgetMin !== null;
      const hasMax = data.budgetMax !== '' && data.budgetMax !== undefined && data.budgetMax !== null;
      const bMin = hasMin ? Number(data.budgetMin) : null;
      const bMax = hasMax ? Number(data.budgetMax) : null;

      if (bMin !== null) {
        if (isNaN(bMin) || bMin < 0) {
          errs.budgetMin = 'Minimum budget cannot be negative';
        }
      }
      if (bMax !== null) {
        if (isNaN(bMax) || bMax < 0) {
          errs.budgetMax = 'Maximum budget cannot be negative';
        }
      }
      if (bMin !== null && bMax !== null && !isNaN(bMin) && !isNaN(bMax) && bMin > bMax) {
        errs.budgetRange = 'Minimum budget cannot exceed maximum budget';
      }
    }

    // 7. Deadlines (Optional)
    if (data.deadline && isNaN(new Date(data.deadline).getTime())) {
      errs.deadline = 'Invalid project deadline date format';
    }
    if (data.applicationDeadline && isNaN(new Date(data.applicationDeadline).getTime())) {
      errs.applicationDeadline = 'Invalid application deadline date format';
    }
    if (data.deadline && data.applicationDeadline) {
      const d1 = new Date(data.deadline);
      const d2 = new Date(data.applicationDeadline);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 > d1) {
        errs.applicationDeadline = 'Application deadline cannot be after project deadline';
      }
    }

    // 8. Skills
    if (skills.length > 25) {
      errs.skills = 'Cannot specify more than 25 required skills';
    }

    return errs;
  };

  // Submit Handler supporting both Draft and Publish flows
  const processSubmission = async (formData, targetStatus) => {
    setServerError('');
    setFieldErrors({});

    const clientErrs = validateForm(formData);
    if (Object.keys(clientErrs).length > 0) {
      setFieldErrors(clientErrs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (targetStatus === 'draft') {
      setIsSubmittingDraft(true);
    } else {
      setIsPublishing(true);
    }

    try {
      const cur = formData.currency || 'USD';
      const curSymbol = CURRENCIES.find((c) => c.code === cur)?.symbol || '$';

      let formattedBudget;
      let bMin = 0;
      let bMax = 0;

      if (showBudget) {
        const hasMin = formData.budgetMin !== '' && formData.budgetMin !== undefined && formData.budgetMin !== null;
        const hasMax = formData.budgetMax !== '' && formData.budgetMax !== undefined && formData.budgetMax !== null;
        bMin = hasMin ? Number(formData.budgetMin) : 0;
        bMax = hasMax ? Number(formData.budgetMax) : 0;

        if (hasMin && hasMax) {
          formattedBudget = `${curSymbol}${bMin.toLocaleString()} - ${curSymbol}${bMax.toLocaleString()}`;
        } else if (hasMin) {
          formattedBudget = `From ${curSymbol}${bMin.toLocaleString()}`;
        } else if (hasMax) {
          formattedBudget = `Up to ${curSymbol}${bMax.toLocaleString()}`;
        } else {
          formattedBudget = 'Negotiable / Flexible';
        }
      } else {
        formattedBudget = 'Negotiable / Flexible';
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || 'Web Development',
        projectType: formData.projectType || 'collaboration',
        experienceLevel: 'all', // Standardized to 'all' (Removed from UI)
        teamSize: Number(formData.teamSize) || 1,
        budget: formattedBudget,
        budgetMin: bMin,
        budgetMax: bMax,
        currency: cur,
        duration: formData.duration || '1 - 2 Months',
        commitment: formData.commitment || 'flexible',
        visibility: formData.visibility || 'public',
        requiredSkills: skills,
        status: targetStatus,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : undefined,
        githubRepoUrl: formData.githubRepoUrl.trim(),
        liveDemoUrl: formData.liveDemoUrl && formData.liveDemoUrl.trim() ? formData.liveDemoUrl.trim() : undefined,
        ideaPostId: ideaData?.postId || undefined,
      };

      await projectService.createProject(payload);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to create project:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save project. Please verify all fields and try again.';
      setServerError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmittingDraft(false);
      setIsPublishing(false);
    }
  };

  const handleDraftClick = handleSubmit((data) => processSubmission(data, 'draft'));
  const handlePublishClick = handleSubmit((data) => processSubmission(data, 'open'));

  const isAnySubmitting = isSubmittingDraft || isPublishing;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/20">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create New Project
              </h1>
              <Badge variant="primary" className="text-[10px] uppercase font-bold tracking-wider">
                Spec Creator
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Draft comprehensive requirements, assemble technical teams, and collaborate with top developers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDraftClick}
            disabled={isAnySubmitting}
            isLoading={isSubmittingDraft}
            className="text-xs font-semibold gap-1.5"
          >
            <FileEdit className="w-3.5 h-3.5" /> Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePublishClick}
            disabled={isAnySubmitting}
            isLoading={isPublishing}
            className="text-xs font-semibold gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Publish Project
          </Button>
        </div>
      </div>

      {/* Converting from Community Idea Banner */}
      {ideaData && (
        <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Converting Community Idea & Pitch
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                Auto-Pre-filled
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              Launching <span className="font-bold italic">"{ideaData.title || 'Community Idea'}"</span> as an official project. We've pre-filled the requirements, description, roles, and skills from your pitch. Adjust anything and hit Publish!
            </p>
          </div>
        </div>
      )}

      {/* Global Server Error Banner */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-rose-800 dark:text-rose-200">Unable to create project</h4>
            <p className="mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handlePublishClick} className="space-y-8" noValidate>
        {/* Section 1: Core Details */}
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Layers className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              1. Project Overview & Scope
            </h2>
          </div>

          {/* Project Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${titleVal.length > 120 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {titleVal.length}/120
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g., High-Throughput Distributed Microservice Orchestrator"
              {...register('title')}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                fieldErrors.title || formErrors.title
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
              }`}
            />
            {(fieldErrors.title || formErrors.title?.message) && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.title || formErrors.title?.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Project Description <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${descVal.length > 5000 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {descVal.length}/5000
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="Provide a comprehensive technical overview, project goals, deliverable expectations, architecture requirements, and contributor responsibilities..."
              {...register('description')}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                fieldErrors.description || formErrors.description
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
              }`}
            />
            {(fieldErrors.description || formErrors.description?.message) && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.description || formErrors.description?.message}
              </p>
            )}
          </div>

          {/* Category & Project Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Project Type
              </label>
              <select
                {...register('projectType')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              >
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.label} — {pt.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Team Architecture & Expected Commitment */}
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Users className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              2. Team Architecture & Contributor Profile
            </h2>
          </div>

          {/* Team Size */}
          <div className="space-y-1.5 max-w-sm">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Team Size (Target Positions)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="1"
              {...register('teamSize')}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                fieldErrors.teamSize ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
              }`}
            />
            {fieldErrors.teamSize && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.teamSize}
              </p>
            )}
            <p className="text-[11px] text-slate-400">Total number of engineers or designers you plan to onboard.</p>
          </div>

          {/* Contributor Commitment (Optional) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Expected Time Commitment <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              {currentCommitment && (
                <button
                  type="button"
                  onClick={() => setValue('commitment', '')}
                  className="text-[11px] text-slate-400 hover:text-primary-500 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COMMITMENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue('commitment', currentCommitment === c.id ? '' : c.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    currentCommitment === c.id
                      ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">{c.label}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 3: Budget, Compensation & Timeline */}
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              3. Budget, Compensation & Timeline
            </h2>
          </div>

          {/* Interactive Budget Toggle Section */}
          {!showBudget ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Project Budget & Compensation <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Currently set to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Negotiable / Flexible</span>. Click button to specify exact budget numbers.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBudget(true)}
                className="text-xs font-semibold gap-1.5 self-start sm:self-auto border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Plus className="w-3.5 h-3.5" /> Specify Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Defined Budget Tier</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudget(false);
                    setValue('budgetMin', '');
                    setValue('budgetMax', '');
                  }}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove Budget (Make Negotiable)
                </button>
              </div>

              {/* Budget Range & Currency (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Currency <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <select
                    {...register('currency')}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all font-mono"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} ({cur.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Min Budget ({CURRENCIES.find((c) => c.code === currentCurrency)?.symbol || '$'}) <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="500"
                    {...register('budgetMin')}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                      fieldErrors.budgetMin || fieldErrors.budgetRange
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                    }`}
                  />
                  {fieldErrors.budgetMin && (
                    <p className="text-[11px] font-medium text-rose-500 mt-1">{fieldErrors.budgetMin}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Max Budget ({CURRENCIES.find((c) => c.code === currentCurrency)?.symbol || '$'}) <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="2500"
                    {...register('budgetMax')}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                      fieldErrors.budgetMax || fieldErrors.budgetRange
                        ? 'border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                    }`}
                  />
                  {fieldErrors.budgetMax && (
                    <p className="text-[11px] font-medium text-rose-500 mt-1">{fieldErrors.budgetMax}</p>
                  )}
                </div>
              </div>

              {fieldErrors.budgetRange && (
                <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.budgetRange}
                </p>
              )}
            </div>
          )}

          {/* Duration & Deadlines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Estimated Duration
              </label>
              <select
                {...register('duration')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              >
                {DURATIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Application Deadline <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <input
                type="date"
                {...register('applicationDeadline')}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  fieldErrors.applicationDeadline
                    ? 'border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                }`}
              />
              {fieldErrors.applicationDeadline && (
                <p className="text-[11px] font-medium text-rose-500 mt-1">{fieldErrors.applicationDeadline}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Project Delivery Deadline <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <input
                type="date"
                {...register('deadline')}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  fieldErrors.deadline
                    ? 'border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                }`}
              />
              {fieldErrors.deadline && (
                <p className="text-[11px] font-medium text-rose-500 mt-1">{fieldErrors.deadline}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Section 4: Required Skills & Tech Stack */}
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                4. Tech Stack & Required Skills
              </h2>
            </div>
            <span className={`text-[11px] font-mono ${skills.length > 25 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
              {skills.length}/25 skills
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a skill and press Enter (e.g., GraphQL, Redis, Rust)..."
                value={newSkill}
                onChange={(e) => {
                  setNewSkill(e.target.value);
                  setSkillError('');
                }}
                onKeyDown={handleKeyDownSkill}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-all"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddSkill()}
                className="px-4 text-xs font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {skillError && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {skillError}
              </p>
            )}
            {fieldErrors.skills && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.skills}
              </p>
            )}

            {/* Current Skills Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="primary"
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs rounded-xl border border-primary-500/20 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 rounded-full hover:bg-primary-500/20 text-primary-500 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Quick Suggestions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <p className="text-[11px] text-slate-400 font-medium mb-1.5">Quick add suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter(
                  (s) => !skills.some((added) => added.toLowerCase() === s.toLowerCase())
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 5: External Repositories, Demos & Visibility */}
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Globe className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              5. Repositories, Demos & Visibility
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GitHub Repository URL (MANDATORY) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub Repository URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://github.com/organization/project-name"
                {...register('githubRepoUrl')}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  fieldErrors.githubRepoUrl
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                }`}
              />
              {fieldErrors.githubRepoUrl && (
                <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.githubRepoUrl}
                </p>
              )}
            </div>

            {/* Live Demo or Staging URL (OPTIONAL) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" /> Live Demo or Staging URL <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://preview.devconnect.io"
                {...register('liveDemoUrl')}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                  fieldErrors.liveDemoUrl
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'
                }`}
              />
              {fieldErrors.liveDemoUrl && (
                <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.liveDemoUrl}
                </p>
              )}
            </div>
          </div>

          {/* Visibility Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Project Discoverability
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('visibility', 'public')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  currentVisibility === 'public'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Public Project</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Visible to all developers in the feed, search, and directory.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('visibility', 'private')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  currentVisibility === 'private'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Lock className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Private / Unlisted</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Accessible only via direct invite link and authorized members.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* Bottom Submission Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/projects')}
            disabled={isAnySubmitting}
            className="text-xs font-semibold"
          >
            Cancel & Return to Feed
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDraftClick}
              disabled={isAnySubmitting}
              isLoading={isSubmittingDraft}
              className="flex-1 sm:flex-none text-xs font-semibold gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" /> Save Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePublishClick}
              disabled={isAnySubmitting}
              isLoading={isPublishing}
              className="flex-1 sm:flex-none text-xs font-bold gap-2 px-6 shadow-md shadow-primary-500/25"
            >
              Publish Project Spec <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
