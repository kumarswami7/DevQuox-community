import React, { useState, useEffect } from "react";
import { X, Code2, Globe, Mail, MapPin, DollarSign, Briefcase, Check, Sparkles, Github, Linkedin, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { UniversitySelector } from "../education/UniversitySelector";

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "🟢 Available for Work" },
  { value: "open_to_offers", label: "🟡 Open to Offers" },
  { value: "busy", label: "🟠 Currently Busy / In Project" },
  { value: "not_available", label: "🔴 Not Available" }
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry-Level (0-1 yrs)" },
  { value: "junior", label: "Junior Engineer (1-3 yrs)" },
  { value: "mid", label: "Mid-Level Engineer (3-5 yrs)" },
  { value: "senior", label: "Senior Engineer (5-8 yrs)" },
  { value: "lead", label: "Lead / Principal (8+ yrs)" }
];

const OPPORTUNITY_TYPES = ["freelance", "full_time", "contract", "internship", "collaboration"];

export const EditDeveloperModal = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    about: "",
    location: "",
    timezone: "",
    hourlyRate: 50,
    availability: "available",
    experienceLevel: "mid",
    openTo: ["freelance", "full_time"],
    contactEmail: "",
    githubUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    twitterUrl: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.user?.name || profile.name || "",
        title: profile.title || profile.user?.headline || "",
        about: profile.about || profile.user?.bio || "",
        location: profile.location || profile.user?.location || "",
        timezone: profile.timezone || "",
        hourlyRate: profile.hourlyRate ?? profile.user?.hourlyRate ?? 0,
        availability: profile.availability || profile.user?.availability || "available",
        experienceLevel: profile.experienceLevel || profile.user?.experienceLevel || "mid",
        openTo: profile.openTo || profile.user?.openTo || ["freelance", "full_time"],
        contactEmail: profile.contactEmail || profile.user?.email || "",
        githubUrl: profile.githubUrl || profile.user?.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || profile.user?.linkedinUrl || "",
        websiteUrl: profile.websiteUrl || profile.user?.websiteUrl || "",
        twitterUrl: profile.twitterUrl || profile.user?.twitterUrl || "",
        institution: profile.education?.[0]?.institution || ""
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleOpenTo = (type) => {
    setFormData((prev) => {
      const exists = prev.openTo.includes(type);
      return {
        ...prev,
        openTo: exists ? prev.openTo.filter((t) => t !== type) : [...prev.openTo, type]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Edit Developer Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update your professional credentials, hourly rate, and availability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Headline & Title */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Identity & Title
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Maya Chen"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Headline / Professional Role *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Senior Full-Stack Engineer"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College / University / Affiliation (Badge on Profile)
                </label>
                <UniversitySelector
                  value={{
                    institution: formData.institution,
                    university: formData.university,
                    universityCountry: formData.universityCountry,
                    universityLogoUrl: formData.universityLogoUrl,
                    universityDomain: formData.universityDomain,
                    isVerifiedUniversity: formData.isVerifiedUniversity,
                  }}
                  onChange={(selected) => {
                    setFormData((prev) => ({
                      ...prev,
                      institution: selected.institution,
                      university: selected.university,
                      universityCountry: selected.universityCountry,
                      universityLogoUrl: selected.universityLogoUrl,
                      universityDomain: selected.universityDomain,
                      isVerifiedUniversity: selected.isVerifiedUniversity,
                    }));
                  }}
                  placeholder="Search worldwide universities by name or country..."
                />
              </div>
            </div>
          </div>

          {/* About & Bio */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              About Developer / Bio
            </label>
            <textarea
              rows={4}
              value={formData.about}
              onChange={(e) => handleChange("about", e.target.value)}
              placeholder="Describe your engineering background, favorite tech stack, system architecture accomplishments, and what kind of projects you love building..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          {/* Availability, Rate & Experience */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Availability & Compensation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Availability Status
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => handleChange("availability", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleChange("experienceLevel", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hourly Rate (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => handleChange("hourlyRate", Number(e.target.value))}
                    className="w-full pl-7 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                    placeholder="75"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">/hr</span>
                </div>
              </div>
            </div>

            {/* Open to Opportunities */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Open To Opportunities
              </label>
              <div className="flex flex-wrap gap-2">
                {OPPORTUNITY_TYPES.map((type) => {
                  const isSelected = formData.openTo.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleToggleOpenTo(type)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {type.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. Bengaluru, India / Remote"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. UTC+05:30 (IST)"
                />
              </div>
            </div>
          </div>

          {/* Social & Portfolio Profiles */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Code & Social Profiles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => handleChange("githubUrl", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Portfolio / Personal Website
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://yourportfolio.dev"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="you@developer.com"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="gap-1.5 font-bold shadow-md shadow-primary-500/20 cursor-pointer">
              <Check className="w-4 h-4" /> Save Developer Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDeveloperModal;
