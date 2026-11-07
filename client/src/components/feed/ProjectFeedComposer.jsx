import React, { useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Rocket,
  Plus,
  X,
  Sparkles,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { useAuthStore } from "../../store";

const CATEGORIES = [
  "Web Development",
  "AI & ML",
  "FinTech",
  "Mobile Development",
  "Cloud & DevOps",
];

const PROJECT_TYPES = [
  { value: "collaboration", label: "Collaboration" },
  { value: "freelance", label: "Paid Freelance" },
  { value: "open_source", label: "Open Source" },
  { value: "academic", label: "Academic / Research" },
];

export const ProjectFeedComposer = ({ onProjectCreated }) => {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [projectType, setProjectType] = useState("collaboration");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [teamSize, setTeamSize] = useState(2);
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [duration, setDuration] = useState("1 - 2 Months");
  const [skills, setSkills] = useState(["React", "Node.js", "MongoDB"]);
  const [newSkill, setNewSkill] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      projectType,
      experienceLevel,
      teamSize: Number(teamSize) || 1,
      budget: `$${Number(budgetMin).toLocaleString()} - $${Number(budgetMax).toLocaleString()}`,
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || 0,
      currency: "USD",
      duration,
      requiredSkills: skills,
      status: "open",
      visibility: "public",
    };

    try {
      const res = await projectService.createProject(payload);
      const created = res.data?.project || res.data?.data || res.data;
      setSuccessMsg("Project posted successfully to the live feed!");

      if (onProjectCreated) {
        onProjectCreated(created);
      }

      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg("");
        setTitle("");
        setDescription("");
        setSkills(["React", "Node.js", "MongoDB"]);
      }, 1000);
    } catch (err) {
      console.error("Failed to post project:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to publish project to MongoDB database. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
      {/* Collapsed Start-a-Post Trigger Bar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Avatar
          src={currentUser?.avatar || currentUser?.avatarUrl}
          name={currentUser?.name || "Me"}
          size="sm"
          className="shrink-0"
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 text-left px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors truncate"
        >
          Post a requirement or hire developers...
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="hidden sm:flex gap-1.5 shadow-sm text-xs shrink-0 font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post</span>
        </Button>
      </div>

      {/* Quick Action Pills (visible on tablet/desktop to save vertical mobile space) */}
      <div className="hidden sm:flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setProjectType("freelance");
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors whitespace-nowrap"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>Paid Gig</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setProjectType("collaboration");
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 hover:text-primary-500 transition-colors whitespace-nowrap"
        >
          <Users className="w-3.5 h-3.5 text-primary-500" />
          <span>Team Collaboration</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setProjectType("open_source");
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 hover:text-purple-500 transition-colors whitespace-nowrap"
        >
          <Rocket className="w-3.5 h-3.5 text-purple-500" />
          <span>Open Source</span>
        </button>
      </div>

      {/* Full Project Post Composer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3custom bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Publish Software Project Post
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcast project deliverables to recruit vetted developers from MongoDB Atlas
                </p>
              </div>
            </div>

            {successMsg ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">{successMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                    {errorMsg}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Enterprise Real-Time FinTech Analytics Platform"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Scope of Work & Deliverables *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe architectural expectations, key requirements, API integrations, and milestones..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {/* Category & Project Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Engagement Type
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget Range & Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Min Budget ($)
                    </label>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Max Budget ($)
                    </label>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Est. Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 - 2 Months">1 - 2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months+">6 Months+</option>
                    </select>
                  </div>
                </div>

                {/* Team Size & Experience Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Team Capacity (Slots)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Required Experience
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="beginner">Junior / Beginner</option>
                      <option value="intermediate">Intermediate / Mid-Level</option>
                      <option value="expert">Senior / Principal / Expert</option>
                      <option value="all">Open to All Levels</option>
                    </select>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Required Technical Skills
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Type a skill and press Enter (e.g. Next.js, Redis, Fastify)..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSkill}
                      className="px-3"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="primary"
                        className="flex items-center gap-1.5 pl-2.5 pr-1 py-1"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                    className="gap-2 shadow-glow-primary"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    <span>Publish Project</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFeedComposer;

