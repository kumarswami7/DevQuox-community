import React, { useState, useEffect } from "react";
import { X, Building2, Globe, Mail, MapPin, DollarSign, Users, Briefcase, Check, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

const INDUSTRIES = [
  "Software & SaaS",
  "Artificial Intelligence / ML",
  "FinTech & Payments",
  "E-Commerce & Retail",
  "Healthcare & Biotech",
  "Web3 & Blockchain",
  "Developer Tools & Cloud",
  "Media & Entertainment",
  "EdTech & Learning",
  "Other"
];

const COMPANY_SIZES = [
  "1-10 Employees",
  "11-50 Employees",
  "51-200 Employees",
  "201-500 Employees",
  "500+ Employees"
];

const COMPANY_STAGES = [
  "Bootstrapped",
  "Pre-Seed / Angel",
  "Seed Stage",
  "Series A",
  "Series B & Beyond",
  "Enterprise / Public"
];

const BUDGET_RANGES = [
  "$500 – $2,500 (Small / MVP)",
  "$2,500 – $10,000 (Medium Project)",
  "$10,000 – $30,000 (Full-Scale Build)",
  "$30,000+ (Enterprise / Ongoing)"
];

export const EditCompanyModal = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    companyName: "",
    companyWebsite: "",
    industry: INDUSTRIES[0],
    companySize: COMPANY_SIZES[0],
    companyStage: COMPANY_STAGES[0],
    typicalBudgetRange: BUDGET_RANGES[1],
    location: "",
    contactEmail: "",
    linkedinUrl: "",
    twitterUrl: "",
    about: "",
    hiringNeeds: []
  });

  const [newHiringNeed, setNewHiringNeed] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.user?.name || profile.name || "",
        title: profile.title || "Founder & Project Owner",
        companyName: profile.companyName || profile.user?.companyName || "",
        companyWebsite: profile.companyWebsite || profile.websiteUrl || "",
        industry: profile.industry || INDUSTRIES[0],
        companySize: profile.companySize || COMPANY_SIZES[0],
        companyStage: profile.companyStage || COMPANY_STAGES[0],
        typicalBudgetRange: profile.typicalBudgetRange || BUDGET_RANGES[1],
        location: profile.location || profile.user?.location || "",
        contactEmail: profile.contactEmail || profile.user?.email || "",
        linkedinUrl: profile.linkedinUrl || "",
        twitterUrl: profile.twitterUrl || "",
        about: profile.about || profile.user?.bio || "",
        hiringNeeds: profile.hiringNeeds || []
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddHiringNeed = () => {
    if (!newHiringNeed.trim()) return;
    if (!formData.hiringNeeds.includes(newHiringNeed.trim())) {
      setFormData((prev) => ({
        ...prev,
        hiringNeeds: [...prev.hiringNeeds, newHiringNeed.trim()]
      }));
    }
    setNewHiringNeed("");
  };

  const handleRemoveHiringNeed = (role) => {
    setFormData((prev) => ({
      ...prev,
      hiringNeeds: prev.hiringNeeds.filter((r) => r !== role)
    }));
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
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Edit Company Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update your company details, hiring needs, and verification data.
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
          {/* Founder & Representative */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Founder & Representative
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Alex Henderson"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. Founder & CEO, Product Lead"
                />
              </div>
            </div>
          </div>

          {/* Company Core Information */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Company Core Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  placeholder="e.g. NovaCloud AI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Industry / Domain
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleChange("companySize", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Funding Stage
                </label>
                <select
                  value={formData.companyStage}
                  onChange={(e) => handleChange("companyStage", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {COMPANY_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Typical Project Budget
                </label>
                <select
                  value={formData.typicalBudgetRange}
                  onChange={(e) => handleChange("typicalBudgetRange", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headquarters / Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. San Francisco, CA / Remote"
              />
            </div>
          </div>

          {/* About Company & Mission */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              About Company & Mission
            </label>
            <textarea
              rows={4}
              value={formData.about}
              onChange={(e) => handleChange("about", e.target.value)}
              placeholder="Tell developers about your company mission, products you're building, and what makes working with your team rewarding..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>

          {/* Hiring Needs (Roles) */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Roles Actively Hiring For
              </label>
              <span className="text-[11px] text-slate-400">
                Developers will see these on your profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHiringNeed}
                onChange={(e) => setNewHiringNeed(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHiringNeed();
                  }
                }}
                placeholder="Add role (e.g. Next.js Developer, Mobile Engineer)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddHiringNeed}>
                + Add Role
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.hiringNeeds.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHiringNeed(role)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Web & Social Links */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Company Web & Social Links
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => handleChange("companyWebsite", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="hiring@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn Profile / Company Page
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Twitter / X Profile
                </label>
                <input
                  type="url"
                  value={formData.twitterUrl}
                  onChange={(e) => handleChange("twitterUrl", e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="https://x.com/..."
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
              <Check className="w-4 h-4" /> Save Company Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompanyModal;
