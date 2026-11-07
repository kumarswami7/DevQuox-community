import { useState } from "react";
import {
  MessageSquare,
  HelpCircle,
  BookOpen,
  Sparkles,
  Users,
  Briefcase,
  X,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Lightbulb,
  Target,
  DollarSign,
  Rocket,
} from "lucide-react";
import { Button } from "../ui/Button";
import { communityService } from "../../services/communityService";
import { IDEA_CATEGORIES } from "./IdeaPitchModal";
const POST_TYPES = [
  {
    type: "idea",
    label: "Project Idea & Pitch",
    icon: Lightbulb,
    description: "Pitch a new project idea, request community review & feedback, and convert to project when ready",
    badgeColor: "border-amber-400 text-amber-600 dark:text-amber-400"
  },
  {
    type: "general",
    label: "Discussion",
    icon: MessageSquare,
    description: "Casual thoughts, ideas, or questions for the community",
    badgeColor: "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
  },
  {
    type: "question",
    label: "Q&A Help",
    icon: HelpCircle,
    description: "Ask technical questions and get answers from experts",
    badgeColor: "border-indigo-400 text-indigo-600 dark:text-indigo-400"
  },
  {
    type: "knowledge",
    label: "Tutorial / Tip",
    icon: BookOpen,
    description: "Share deep-dives, best practices, guides, and tutorials",
    badgeColor: "border-purple-400 text-purple-600 dark:text-purple-400"
  },
  {
    type: "showcase",
    label: "Showcase",
    icon: Sparkles,
    description: "Show off projects, open source tools, or design work",
    badgeColor: "border-emerald-400 text-emerald-600 dark:text-emerald-400"
  },
  {
    type: "collaboration",
    label: "Team-up",
    icon: Users,
    description: "Find co-founders, collaborators, or study buddies",
    badgeColor: "border-amber-400 text-amber-600 dark:text-amber-400"
  },
  {
    type: "career",
    label: "Opportunity",
    icon: Briefcase,
    description: "Career advice, internship leads, and job opportunities",
    badgeColor: "border-cyan-400 text-cyan-600 dark:text-cyan-400"
  }
];
export const PostComposer = ({ onPostCreated, onCancel }) => {
  const [postType, setPostType] = useState("idea");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Dedicated Idea Pitch Fields
  const [ideaCategory, setIdeaCategory] = useState("Web Development");
  const [targetAudience, setTargetAudience] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState([]);
  const [roleInput, setRoleInput] = useState("");
  const [feedbackPrompt, setFeedbackPrompt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddRole = (e) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = roleInput.trim();
    if (clean && !rolesNeeded.includes(clean) && rolesNeeded.length < 5) {
      setRolesNeeded([...rolesNeeded, clean]);
      setRoleInput("");
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setRolesNeeded(rolesNeeded.filter((r) => r !== roleToRemove));
  };
  const handleAddTag = (e) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const mediaUrls = mediaUrl.trim() ? [mediaUrl.trim()] : [];
      const links = linkUrl.trim() ? [{ title: linkTitle.trim() || "Reference Link", url: linkUrl.trim() }] : [];
      const ideaDetails = postType === "idea" ? {
        category: ideaCategory,
        targetAudience: targetAudience.trim() || undefined,
        rolesNeeded,
        feedbackQuestions: feedbackPrompt.trim() ? [feedbackPrompt.trim()] : [],
        status: "seeking_feedback",
      } : undefined;

      const res = await communityService.createPost({
        postType,
        title: title.trim() || void 0,
        content: content.trim(),
        tags,
        category: postType === "idea" ? ideaCategory : undefined,
        mediaUrls,
        links,
        ideaDetails,
      });
      if (res.data?.data) {
        onPostCreated(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to publish post.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  const selectedConfig = POST_TYPES.find((t) => t.type === postType) || POST_TYPES[0];
  return <div className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">{
    /* Header */
  }<div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800"><div className="flex items-center gap-2"><selectedConfig.icon className="w-5 h-5 text-primary-500" /><h3 className="font-bold text-slate-900 dark:text-white text-base">
            Create a Community Post
          </h3></div>{onCancel && <button
    type="button"
    onClick={onCancel}
    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
  ><X className="w-5 h-5" /></button>}</div>{error && <div className="flex items-center gap-2 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}{
    /* Post Type Selector Pills */
  }<div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Topic Category
        </label><div className="flex flex-wrap gap-2">{POST_TYPES.map((t) => {
    const Icon = t.icon;
    const isSelected = postType === t.type;
    return <button
      key={t.type}
      type="button"
      onClick={() => setPostType(t.type)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected ? "bg-primary-500 text-white border-primary-500 shadow-sm" : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400"}`}
    ><Icon className="w-3.5 h-3.5" />{t.label}</button>;
  })}</div><p className="text-xs text-slate-400 italic">{selectedConfig.description}</p></div><form onSubmit={handleSubmit} className="space-y-3.5">
    {/* Title Input */}
    <div>
      <input
        type="text"
        placeholder={
          postType === "idea"
            ? "Project Idea Title (e.g. AI-Powered Freelance Invoicing & Tax Estimator)"
            : postType === "question"
            ? "What is your technical question? (e.g. How to prevent memory leaks in useEffect?)"
            : postType === "showcase"
            ? "Project Title (e.g. Built an AI-powered Code Reviewer)"
            : "Post Title (Optional)"
        }
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    {/* Content Textarea */}
    <div className="space-y-1">
      <textarea
        required
        rows={4}
        placeholder={
          postType === "idea"
            ? "Describe your project idea in detail: What pain point does this solve? How should it work? What are the key features? Invite the community to review, critique, suggest improvements, or team up!"
            : "Share your thoughts, ask a question, or explain your project... Tip: you can include #hashtags directly in text."
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1e4}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
      />
      <div className="flex justify-end text-xs text-slate-400">
        {content.length} / 10,000 characters
      </div>
    </div>

    {/* Dedicated Idea Pitch Builder & Review Prompts */}
    {postType === "idea" && (
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-800/60 space-y-3.5 animate-in fade-in">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Idea Pitch Breakdown & Community Review Prompts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              🏷️ Category / Domain
            </label>
            <select
              value={ideaCategory}
              onChange={(e) => setIdeaCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {IDEA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              🎯 Target Audience / Who is this for?
            </label>
            <input
              type="text"
              placeholder="e.g. Freelancers, students, remote teams"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Roles Needed */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            👥 Roles / Collaborators you are looking for:
          </label>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {rolesNeeded.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs"
              >
                {role}
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {rolesNeeded.length < 5 && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Add role (e.g. Frontend Developer, UI Designer, Backend Dev)..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={handleAddRole}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
              >
                Add Role
              </button>
            </div>
          )}
        </div>

        {/* Feedback Prompts */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            💡 What feedback or review do you want from the community?
          </label>
          <input
            type="text"
            placeholder="e.g. Would you use this? What tech stack would you choose? Any suggestions on pricing?"
            value={feedbackPrompt}
            onChange={(e) => setFeedbackPrompt(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
    )}{
    /* Tags Section */
  }<div className="space-y-2"><div className="flex flex-wrap items-center gap-1.5">{tags.map((tag) => <span
    key={tag}
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
  >
                #{tag}<button
    type="button"
    onClick={() => handleRemoveTag(tag)}
    className="hover:text-rose-500"
  ><X className="w-3 h-3" /></button></span>)}{tags.length < 5 && <div className="flex items-center gap-1"><input
    type="text"
    placeholder="Add tag (Press Enter)..."
    value={tagInput}
    onChange={(e) => setTagInput(e.target.value)}
    onKeyDown={handleAddTag}
    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
  /><button
    type="button"
    onClick={handleAddTag}
    className="p-1 text-slate-400 hover:text-primary-500"
  ><Plus className="w-3.5 h-3.5" /></button></div>}</div></div>{
    /* Media URL Accordion */
  }{showMediaInput && <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Image Attachment URL
              </span><button
    type="button"
    onClick={() => setShowMediaInput(false)}
    className="text-slate-400 hover:text-slate-600"
  ><X className="w-3.5 h-3.5" /></button></div><input
    type="url"
    placeholder="https://example.com/screenshot.png"
    value={mediaUrl}
    onChange={(e) => setMediaUrl(e.target.value)}
    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
  /></div>}{
    /* Link Attachment Accordion */
  }{showLinkInput && <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Resource Link
              </span><button
    type="button"
    onClick={() => setShowLinkInput(false)}
    className="text-slate-400 hover:text-slate-600"
  ><X className="w-3.5 h-3.5" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input
    type="text"
    placeholder="Link Title (e.g. GitHub Repo)"
    value={linkTitle}
    onChange={(e) => setLinkTitle(e.target.value)}
    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
  /><input
    type="url"
    placeholder="https://github.com/..."
    value={linkUrl}
    onChange={(e) => setLinkUrl(e.target.value)}
    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
  /></div></div>}{
    /* Action Controls Footer */
  }<div className="flex items-center justify-between pt-2"><div className="flex items-center gap-1.5"><button
    type="button"
    onClick={() => setShowMediaInput(!showMediaInput)}
    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  ><ImageIcon className="w-4 h-4 text-emerald-500" />
              Add Image
            </button><button
    type="button"
    onClick={() => setShowLinkInput(!showLinkInput)}
    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  ><LinkIcon className="w-4 h-4 text-cyan-500" />
              Add Link
            </button></div><div className="flex items-center gap-2">{onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>}<Button
    type="submit"
    variant="primary"
    size="sm"
    isLoading={submitting}
    disabled={submitting || !content.trim()}
  >
              Publish Post
            </Button></div></div></form></div>;
};
export default PostComposer;
