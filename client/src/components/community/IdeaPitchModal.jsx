import React, { useState } from "react";
import {
  Lightbulb,
  Rocket,
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Plus,
  Layers,
  Sparkles,
  Target,
  HelpCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "../ui/Button";
import { TechnologyIcon } from "../skills/TechnologyIcon";
import { communityService } from "../../services/communityService";

export const IDEA_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "AI & ML",
  "Cloud & DevOps",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Gaming",
  "Open Source",
  "Other",
];

const POPULAR_TECH_SUGGESTIONS = [
  "React",
  "Node.js",
  "TypeScript",
  "MongoDB",
  "Python",
  "Next.js",
  "TailwindCSS",
  "PostgreSQL",
  "Docker",
  "GraphQL",
];

export const IdeaPitchModal = ({
  isOpen,
  onClose,
  onIdeaCreated,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [feedbackPrompt, setFeedbackPrompt] = useState("");

  // Tech stack & skills
  const [skills, setSkills] = useState(["React", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddSkill = (skillToAdd) => {
    const raw = typeof skillToAdd === "string" ? skillToAdd : skillInput;
    const clean = raw.trim().replace(/^#/, "");
    if (clean && !skills.includes(clean) && skills.length < 8) {
      setSkills([...skills, clean]);
      setSkillInput("");
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.slice(0, 5 - attachments.length).map((file) => {
      const isImg = file.type.startsWith("image/");
      return {
        name: file.name,
        size: file.size,
        fileType: isImg ? "image" : "document",
        previewUrl: isImg ? URL.createObjectURL(file) : null,
        url: isImg ? URL.createObjectURL(file) : URL.createObjectURL(file),
        file,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a descriptive idea title.");
      return;
    }
    if (!content.trim()) {
      setError("Please explain your project idea in detail.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        postType: "idea",
        title: title.trim(),
        content: content.trim(),
        tags: skills.map((s) => s.toLowerCase()),
        category,
        ideaDetails: {
          category,
          targetAudience: targetAudience.trim() || undefined,
          rolesNeeded: skills,
          feedbackQuestions: feedbackPrompt.trim() ? [feedbackPrompt.trim()] : [],
          attachments: attachments.map((a) => ({
            name: a.name,
            url: a.url || a.previewUrl || "",
            fileType: a.fileType,
            size: a.size,
          })),
          status: "seeking_feedback",
        },
        attachments: attachments.map((a) => ({
          name: a.name,
          url: a.url || a.previewUrl || "",
          fileType: a.fileType,
          size: a.size,
        })),
      };

      const res = await communityService.createPost(payload);
      const createdIdea = res.data?.data || res.data;

      if (onIdeaCreated) {
        onIdeaCreated(createdIdea);
      }

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to publish idea. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-6 sm:p-7 rounded-3xl bg-white dark:bg-cardDark border border-slate-200/90 dark:border-slate-800 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Pitch Project Idea
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                Community Review
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Share your raw concept with the DevConnect community to get feedback, review feasibility, and find co-builders.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Idea Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Idea Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. B2B Multi-Tenant SaaS Billing & Subscription Engine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Category / Domain <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Select matching ecosystem</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              {IDEA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Pitch Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Explain Your Idea & Problem Solved <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">{content.length}/5,000</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={5000}
              placeholder="What is the concept? What pain point does it solve? What key workflows or architectures do you envision? Invite developers to review and share thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y leading-relaxed"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary-500" />
              <span>Target Audience / Who is it for? (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Freelancers, indie hackers, developer teams, students"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Required Skills & Tech Stack */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-500" />
                <span>Tech Stack & Required Skills</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Press Enter or comma to add (Max 8)</span>
            </label>

            {/* Selected Skills Chips with TechnologyIcon */}
            <div className="flex flex-wrap items-center gap-2 mb-2 min-h-[32px]">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
                >
                  <TechnologyIcon name={skill} size="xs" />
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 hover:text-rose-500 text-slate-400 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Skill Input & Quick Add */}
            {skills.length < 8 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type skill (e.g. React, Docker, Python)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSkill()}
                    className="text-xs h-8 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add</span>
                  </Button>
                </div>

                {/* Popular suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick suggestions:</span>
                  {POPULAR_TECH_SUGGESTIONS.filter((s) => !skills.includes(s))
                    .slice(0, 5)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                      >
                        <TechnologyIcon name={s} size="xs" />
                        <span>+{s}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Question */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>What review or feedback do you want from developers? (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Would you use this? What tech stack would you recommend? Is scope realistic?"
              value={feedbackPrompt}
              onChange={(e) => setFeedbackPrompt(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Document / Mockup / Image Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-primary-500" />
                <span>Attach Documents or Mockups (Optional)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">PDF, DOC, PNG, JPG (Max 5 files)</span>
            </label>

            {/* Dropzone */}
            <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 bg-slate-50/70 dark:bg-slate-800/50 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-400 font-medium">
              <UploadCloud className="w-4 h-4 text-primary-500 shrink-0" />
              <span>Upload specification documents, PDF proposals, or design mockups</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFileAttach}
                className="hidden"
              />
            </label>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.fileType === "image" ? (
                        file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt="preview"
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        )
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px] max-w-[140px]">
                          {file.name}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {file.fileType} • {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 hover:text-rose-500 text-slate-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !title.trim() || !content.trim()}
              isLoading={submitting}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-glow-primary rounded-xl h-9 px-4 text-xs"
            >
              <Rocket className="w-4 h-4" />
              <span>Share Idea to Community</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IdeaPitchModal;

