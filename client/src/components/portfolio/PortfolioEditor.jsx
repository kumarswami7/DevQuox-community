import React, { useState } from "react";
import { Eye, Save, X, Globe, Lock, Shield, Check, User, Link as LinkIcon, DollarSign, Clock } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level (0-1 yrs)" },
  { value: "junior", label: "Junior (1-3 yrs)" },
  { value: "mid", label: "Mid-Level (3-5 yrs)" },
  { value: "senior", label: "Senior (5-8 yrs)" },
  { value: "lead", label: "Lead / Principal (8+ yrs)" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available for Hire" },
  { value: "open_to_offers", label: "Open to Offers" },
  { value: "busy", label: "Busy on Active Projects" },
  { value: "not_available", label: "Not Available" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "fixed_price", label: "Fixed-Price Milestones" },
  { value: "hourly", label: "Hourly Contract" },
  { value: "open_source", label: "Open Source Collaboration" },
  { value: "full_time", label: "Full-Time Opportunities" },
  { value: "mentorship", label: "Mentorship & Guidance" },
];

export const PortfolioEditor = ({
  profile,
  onSave,
  onCancel,
  onPreviewToggle,
  isPreview = false,
}) => {
  const [headline, setHeadline] = useState(profile?.headline || profile?.title || "");
  const [bio, setBio] = useState(profile?.bio || profile?.about || "");
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || "mid");
  const [availability, setAvailability] = useState(profile?.availability || "available");
  const [visibility, setVisibility] = useState(profile?.visibility || "public");
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate || 0);
  const [location, setLocation] = useState(profile?.location || "");
  const [timezone, setTimezone] = useState(profile?.timezone || "");
  const [preferredRoles, setPreferredRoles] = useState(profile?.preferredRoles?.join(", ") || "");
  const [languages, setLanguages] = useState(profile?.languages?.join(", ") || "English");
  const [selectedProjectTypes, setSelectedProjectTypes] = useState(
    profile?.preferredProjectTypes || ["fixed_price", "hourly"]
  );
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.websiteUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(profile?.twitterUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleToggleProjectType = (val) => {
    if (selectedProjectTypes.includes(val)) {
      setSelectedProjectTypes(selectedProjectTypes.filter((t) => t !== val));
    } else {
      setSelectedProjectTypes([...selectedProjectTypes, val]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        headline: headline.trim(),
        title: headline.trim(),
        bio: bio.trim(),
        about: bio.trim(),
        experienceLevel,
        availability,
        visibility,
        hourlyRate: parseFloat(hourlyRate) || 0,
        location: location.trim(),
        timezone: timezone.trim(),
        preferredRoles: preferredRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        preferredProjectTypes: selectedProjectTypes,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        twitterUrl: twitterUrl.trim(),
      };

      if (onSave) {
        await onSave(payload);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to save portfolio settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 glass-card border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Portfolio & Profile Settings
          </h2>
          <p className="text-xs text-slate-500">
            Control your professional showcase, discovery visibility, and collaboration terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewToggle && (
            <Button
              type="button"
              size="sm"
              variant={isPreview ? "primary" : "outline"}
              onClick={onPreviewToggle}
              className="gap-1.5 text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              {isPreview ? "Exit Preview" : "Preview Public Portfolio"}
            </Button>
          )}

          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Visibility Setting */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Portfolio Visibility & Discovery Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                visibility === "public"
                  ? "border-primary-500 bg-primary-500/5 text-slate-900 dark:text-white"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                className="mt-0.5 text-primary-500"
              />
              <div className="text-xs">
                <span className="font-bold block flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" /> Public (Recommended)
                </span>
                <span className="text-[11px] text-slate-400">
                  Visible in Developer Discovery directory and accessible to everyone.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                visibility === "authenticated"
                  ? "border-primary-500 bg-primary-500/5 text-slate-900 dark:text-white"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="authenticated"
                checked={visibility === "authenticated"}
                onChange={() => setVisibility("authenticated")}
                className="mt-0.5 text-primary-500"
              />
              <div className="text-xs">
                <span className="font-bold block flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary-500" /> Community Members Only
                </span>
                <span className="text-[11px] text-slate-400">
                  Only signed-in Devquox developers & clients can view your portfolio.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                visibility === "private"
                  ? "border-primary-500 bg-primary-500/5 text-slate-900 dark:text-white"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
                className="mt-0.5 text-primary-500"
              />
              <div className="text-xs">
                <span className="font-bold block flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Private
                </span>
                <span className="text-[11px] text-slate-400">
                  Excluded from Developer Discovery. Only you and team project owners can view.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Professional Headline */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Professional Headline *
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer | Distributed Systems & React"
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Biography */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Biography / Summary
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Introduce yourself, key strengths, technical passions, and what projects you love building..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
          />
        </div>

        {/* Experience Level & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Work Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hourly Rate, Location & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hourly Rate ($ USD)
            </label>
            <input
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 65"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Toronto, Canada"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Timezone (optional)
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. UTC-5 (EST)"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Preferred Roles & Languages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Roles (comma-separated)
            </label>
            <input
              type="text"
              value={preferredRoles}
              onChange={(e) => setPreferredRoles(e.target.value)}
              placeholder="e.g. Full-Stack Developer, DevOps Engineer"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Spoken Languages (comma-separated)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g. English, Spanish, German"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Preferred Project Types */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Preferred Collaboration & Project Types
          </label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPE_OPTIONS.map((opt) => {
              const active = selectedProjectTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggleProjectType(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-primary-500 text-white border-primary-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social & Professional Links */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Public Professional Links
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourhandle"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourhandle"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Personal Portfolio / Website</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Twitter / X URL</label>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/yourhandle"
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button type="submit" variant="primary" size="sm" disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Portfolio..." : "Save Portfolio Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PortfolioEditor;
