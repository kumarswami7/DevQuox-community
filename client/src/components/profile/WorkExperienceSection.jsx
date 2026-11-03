import React, { useState, useRef, useEffect } from "react";
import {
  Briefcase,
  CalendarDays,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  MoreHorizontal,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Code2,
  Terminal,
  Sparkles,
  Laptop,
  CheckCircle2,
  Layers,
  ExternalLink,
} from "lucide-react";
import { profileService } from "../../services/profileService";
import { CompanySelector, CompanyLogoBadge } from "../company/CompanySelector";
import { resolveDomainFromName } from "../company/companyUtils";

/**
 * Standardized Role Icon Resolver
 * Delivers clean, professional monochrome Lucide icons for the interlinked career tracker:
 * - Developer / Frontend / Full Stack / Mobile: Code2 (Electric Blue)
 * - Backend / Cloud / DevOps / Systems / Database: Terminal (Indigo)
 * - Lead / Founder / CTO / Manager / Architect: Sparkles (Amber)
 * - Corporate / Consultant / Enterprise / General: Briefcase / Laptop (Teal / Cyan)
 */
const resolveRoleIcon = (item, index = 0) => {
  const text = `${item?.role || ""} ${item?.company || ""} ${item?.description || ""} ${item?.employmentType || ""}`.toLowerCase();

  // 1. Leadership / Executive / Management
  if (
    text.includes("lead") ||
    text.includes("manager") ||
    text.includes("director") ||
    text.includes("founder") ||
    text.includes("co-founder") ||
    text.includes("cto") ||
    text.includes("vp") ||
    text.includes("principal") ||
    text.includes("architect") ||
    text.includes("head")
  ) {
    return {
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      borderColor: "border-amber-400 dark:border-amber-600",
    };
  }

  // 2. Backend / Cloud / DevOps / Systems / Database
  if (
    text.includes("backend") ||
    text.includes("back-end") ||
    text.includes("cloud") ||
    text.includes("devops") ||
    text.includes("database") ||
    text.includes("sre") ||
    text.includes("infrastructure") ||
    text.includes("server") ||
    text.includes("aws") ||
    text.includes("node") ||
    text.includes("python") ||
    text.includes("system")
  ) {
    return {
      icon: Terminal,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
      borderColor: "border-indigo-400 dark:border-indigo-600",
    };
  }

  // 3. Software Engineer / Full Stack / Frontend / Web / App / React
  if (
    text.includes("developer") ||
    text.includes("engineer") ||
    text.includes("frontend") ||
    text.includes("front-end") ||
    text.includes("full stack") ||
    text.includes("fullstack") ||
    text.includes("web") ||
    text.includes("react") ||
    text.includes("javascript") ||
    text.includes("mobile") ||
    text.includes("code") ||
    text.includes("programmer")
  ) {
    return {
      icon: Code2,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      borderColor: "border-red-400 dark:border-red-600",
    };
  }

  // 4. Default / Alternating icons
  const fallbacks = [
    {
      icon: Briefcase,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      borderColor: "border-rose-400 dark:border-rose-600",
    },
    {
      icon: Laptop,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
      borderColor: "border-cyan-400 dark:border-cyan-600",
    },
    {
      icon: Layers,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-400 dark:border-emerald-600",
    },
  ];
  return fallbacks[Math.abs(index) % fallbacks.length];
};

/**
 * 3-Dot Action Menu Component with click-outside detection and ESC key support
 */
const ActionMenu = ({ onEdit, onDelete, itemName = "item" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Options for ${itemName}`}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white dark:bg-[#182229] border border-slate-200 dark:border-slate-700/80 shadow-lg py-1 animate-scale-in text-xs font-medium text-slate-700 dark:text-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-primary-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Clean Deletion Confirmation Modal
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
            <Trash2 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title || "Confirm Removal"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message || "Are you sure you want to remove this record? This action cannot be undone."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Add / Edit Experience Modal
 */
const ExperienceModal = ({ isOpen, onClose, onSave, initialData, isSaving }) => {
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    companyLogo: "",
    companyDomain: "",
    companyWebsite: "",
    companyId: null,
    employmentType: "Full-Time",
    period: "",
    location: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        role: initialData.role || "",
        company: initialData.company || "",
        companyLogo: initialData.companyLogo || "",
        companyDomain: initialData.companyDomain || "",
        companyWebsite: initialData.companyWebsite || "",
        companyId: initialData.companyId || null,
        employmentType: initialData.employmentType || "Full-Time",
        period: initialData.period || "",
        location: initialData.location || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        role: "",
        company: "",
        companyLogo: "",
        companyDomain: "",
        companyWebsite: "",
        companyId: null,
        employmentType: "Full-Time",
        period: "",
        location: "",
        description: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.role.trim()) errs.role = "Role / Job Title is required";
    if (!formData.company.trim()) errs.company = "Company name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-primary-500 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/40 shrink-0">
              <Briefcase className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Work Experience" : "Add Work Experience"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track engineering roles, internships, or leadership milestones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Role */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="e.g. Senior Full-Stack Engineer"
              className={`w-full p-2.5 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                errors.role ? "border-rose-400 dark:border-rose-600" : "border-slate-200 dark:border-slate-700"
              }`}
            />
            {errors.role && (
              <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.role}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <CompanySelector
              value={formData.company}
              logoUrl={formData.companyLogo}
              domain={formData.companyDomain}
              onChange={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  company: selected.company,
                  companyLogo: selected.companyLogo,
                  companyDomain: selected.companyDomain,
                  companyWebsite: selected.companyWebsite,
                  companyId: selected.companyId,
                  location: !prev.location && selected.location ? selected.location : prev.location,
                }));
                if (errors.company) {
                  setErrors((prev) => ({ ...prev, company: undefined }));
                }
              }}
              placeholder="e.g. Stripe, Google, or GATENova"
              error={errors.company}
            />
            {errors.company && (
              <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.company}
              </p>
            )}
          </div>

          {/* Employment Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Hyderabad, India / Remote"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Time Period */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Time Period
            </label>
            <input
              type="text"
              value={formData.period}
              onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
              placeholder="e.g. 2022 – Present, or Jun 2021 – Dec 2023"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description & Key Contributions
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Key architectural impact, system scaling, technologies used, and business achievements..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 active:scale-98 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Save Changes" : "Save Experience"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENT 1: WORK EXPERIENCE PREVIEW (FOR OVERVIEW TAB - INTERLINKED TRACKER)
// =============================================================================
export const WorkExperiencePreview = ({
  experience = [],
  isOwnProfile = false,
  onProfileUpdate,
  syncUpdateToBackend,
  onViewAll,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Save (Edit)
  const handleSaveExperience = async (data) => {
    setIsSaving(true);
    const derivedDomain = data.companyDomain || resolveDomainFromName(data.company);
    const derivedLogo =
      data.companyLogo ||
      (derivedDomain ? `https://www.google.com/s2/favicons?domain=${derivedDomain}&sz=128` : "");
    const cleanData = {
      ...data,
      companyDomain: derivedDomain,
      companyLogo: derivedLogo,
    };

    try {
      if (selectedExp && selectedExp._id) {
        try {
          const res = await profileService.editExperience(selectedExp._id, cleanData);
          const updated = res.data || experience.map((item, i) => (i === selectedExp._idx ? { ...item, ...cleanData } : item));
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        } catch {
          const updated = experience.map((item, i) => (i === selectedExp._idx ? { ...item, ...cleanData } : item));
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
          if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
        }
      }
      setModalOpen(false);
      setSelectedExp(null);
    } catch (err) {
      console.error("Error saving experience:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteExperience = async (item, index) => {
    setIsDeleting(true);
    try {
      if (item._id) {
        try {
          const res = await profileService.deleteExperience(item._id);
          const updated = res.data || experience.filter((_, i) => i !== index);
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        } catch {
          const updated = experience.filter((_, i) => i !== index);
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
          if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
        }
      } else {
        const updated = experience.filter((_, i) => i !== index);
        if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting experience:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-primary-500 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/40">
            <Briefcase className="w-4.5 h-4.5" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Work Experience</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {experience.length}
              </span>
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
        >
          <span>View All / Add</span>
          <span>→</span>
        </button>
      </div>

      {/* Interlinked Career Journey Tracker */}
      {experience && experience.length > 0 ? (
        <div className="relative space-y-4 before:absolute before:left-5 sm:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-primary-500 before:via-red-300 dark:before:via-red-950 before:to-slate-200 dark:before:to-slate-800">
          {experience.map((exp, idx) => {
            const isCurrent = exp.current || String(exp.period || "").toLowerCase().includes("present");

            return (
              <div key={exp._id || idx} className="relative flex items-start gap-3 sm:gap-4 group">
                {/* Company Logo Node on the Interlink Track */}
                <div
                  className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-[#182229] border-2 border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center p-1 sm:p-1.5 shrink-0 group-hover:scale-105 group-hover:border-primary-400 transition-all overflow-hidden"
                >
                  <CompanyLogoBadge
                    name={exp.company}
                    logoUrl={exp.companyLogo}
                    domain={exp.companyDomain}
                    className="w-full h-full rounded-lg sm:rounded-xl"
                    size="sm"
                  />
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-[#182229]"></span>
                    </span>
                  )}
                </div>

                {/* Interlinked Experience Card */}
                <div className="flex-1 min-w-0 p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-500 dark:group-hover:text-red-400 transition-colors">
                      {exp.role}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          Active Role
                        </span>
                      )}
                      {exp.employmentType && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-primary-500 dark:text-red-400 border border-red-200/60 dark:border-red-900/50">
                          {exp.employmentType}
                        </span>
                      )}
                      {isOwnProfile && (
                        <ActionMenu
                          itemName={exp.role}
                          onEdit={() => {
                            setSelectedExp({ ...exp, _idx: idx });
                            setModalOpen(true);
                          }}
                          onDelete={() => {
                            setDeleteTarget({
                              item: exp,
                              index: idx,
                              title: `${exp.role} at ${exp.company}`,
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{exp.company}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {exp.period && (
                      <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        <span>{exp.period}</span>
                      </span>
                    )}
                    {exp.location && (
                      <span className="flex items-center gap-1 font-medium text-slate-400">
                        • <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{exp.location}</span>
                      </span>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed line-clamp-2">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic py-3 text-center">
          No work experience records listed yet.
        </p>
      )}

      {/* Edit Modal */}
      <ExperienceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExp(null);
        }}
        onSave={handleSaveExperience}
        initialData={selectedExp}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Work Experience"
        message={`Are you sure you want to remove "${deleteTarget?.title || "this experience"}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={() => {
          if (!deleteTarget) return;
          handleDeleteExperience(deleteTarget.item, deleteTarget.index);
        }}
      />
    </div>
  );
};

// =============================================================================
// COMPONENT 2: FULL WORK EXPERIENCE SECTION (DEDICATED TAB - INTERLINKED TRACKER)
// =============================================================================
export const WorkExperienceSection = ({
  experience = [],
  isOwnProfile = false,
  onProfileUpdate,
  syncUpdateToBackend,
  triggerAction,
  onClearAction,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger from outside (e.g., header "+ Add Section")
  useEffect(() => {
    if (triggerAction === "addExperience") {
      setSelectedExp(null);
      setModalOpen(true);
      if (onClearAction) onClearAction();
    }
  }, [triggerAction, onClearAction]);

  // Handle Save (Add or Edit)
  const handleSaveExperience = async (data) => {
    setIsSaving(true);
    const derivedDomain = data.companyDomain || resolveDomainFromName(data.company);
    const derivedLogo =
      data.companyLogo ||
      (derivedDomain ? `https://www.google.com/s2/favicons?domain=${derivedDomain}&sz=128` : "");
    const cleanData = {
      ...data,
      companyDomain: derivedDomain,
      companyLogo: derivedLogo,
    };

    try {
      if (selectedExp && selectedExp._id) {
        // Edit existing
        try {
          const res = await profileService.editExperience(selectedExp._id, cleanData);
          const updated = res.data || experience.map((item, i) => (i === selectedExp._idx ? { ...item, ...cleanData } : item));
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        } catch {
          const updated = experience.map((item, i) => (i === selectedExp._idx ? { ...item, ...cleanData } : item));
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
          if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
        }
      } else {
        // Add new
        try {
          const res = await profileService.addExperience(cleanData);
          const updated = res.data || [...experience, cleanData];
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        } catch {
          const updated = [...experience, cleanData];
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
          if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
        }
      }
      setModalOpen(false);
      setSelectedExp(null);
    } catch (err) {
      console.error("Error saving experience:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteExperience = async (item, index) => {
    setIsDeleting(true);
    try {
      if (item._id) {
        try {
          const res = await profileService.deleteExperience(item._id);
          const updated = res.data || experience.filter((_, i) => i !== index);
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        } catch {
          const updated = experience.filter((_, i) => i !== index);
          if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
          if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
        }
      } else {
        const updated = experience.filter((_, i) => i !== index);
        if (onProfileUpdate) onProfileUpdate({ experience: updated, experiences: updated });
        if (syncUpdateToBackend) syncUpdateToBackend({ experience: updated, experiences: updated });
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting experience:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-primary-500 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/40 shrink-0">
                <Briefcase className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <span>Career Journey & Work Experience</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {experience.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological track of engineering roles, contributions, and professional milestones.
            </p>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                setSelectedExp(null);
                setModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 active:scale-98 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Experience</span>
            </button>
          )}
        </div>

        {/* Interlinked Career Journey Tracker */}
        {experience && experience.length > 0 ? (
          <div className="relative space-y-6 before:absolute before:left-5 sm:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-primary-500 before:via-red-300 dark:before:via-red-950 before:to-slate-200 dark:before:to-slate-800">
            {experience.map((exp, idx) => {
              const isCurrent = exp.current || String(exp.period || "").toLowerCase().includes("present");

              return (
                <div key={exp._id || idx} className="relative flex items-start gap-3 sm:gap-4 group">
                  {/* Company Logo Node on the Interlink Track */}
                  <div
                    className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-[#182229] border-2 border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center p-1 sm:p-1.5 shrink-0 group-hover:scale-105 group-hover:border-primary-400 transition-all overflow-hidden"
                  >
                    <CompanyLogoBadge
                      name={exp.company}
                      logoUrl={exp.companyLogo}
                      domain={exp.companyDomain}
                      className="w-full h-full rounded-lg sm:rounded-xl"
                      size="md"
                    />
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#182229]"></span>
                      </span>
                    )}
                  </div>

                  {/* Interlinked Experience Card */}
                  <div className="flex-1 min-w-0 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-500 dark:group-hover:text-red-400 transition-colors">
                          {exp.role}
                        </h3>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Active Role</span>
                          </span>
                        )}
                        {exp.employmentType && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-primary-500 dark:text-red-400 border border-red-200/60 dark:border-red-900/50 uppercase tracking-wider">
                            {exp.employmentType}
                          </span>
                        )}
                      </div>

                      {isOwnProfile && (
                        <ActionMenu
                          itemName={exp.role}
                          onEdit={() => {
                            setSelectedExp({ ...exp, _idx: idx });
                            setModalOpen(true);
                          }}
                          onDelete={() => {
                            setDeleteTarget({
                              item: exp,
                              index: idx,
                              title: `${exp.role} at ${exp.company}`,
                            });
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exp.company}</span>
                      {exp.companyWebsite && (
                        <a
                          href={exp.companyWebsite.startsWith("http") ? exp.companyWebsite : `https://${exp.companyWebsite}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-500 hover:text-primary-600 hover:underline text-[11px] font-normal inline-flex items-center gap-0.5 shrink-0"
                        >
                          <span>Website</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      {exp.period && (
                        <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.period}</span>
                        </span>
                      )}
                      {exp.location && (
                        <span className="flex items-center gap-1 font-medium text-slate-400 text-[11px]">
                          • <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{exp.location}</span>
                        </span>
                      )}
                    </div>

                    {exp.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <Briefcase className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No experience records listed yet
            </p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedExp(null);
                  setModalOpen(true);
                }}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                + Add your first work experience
              </button>
            )}
          </div>
        )}
      </section>

      {/* Modal */}
      <ExperienceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExp(null);
        }}
        onSave={handleSaveExperience}
        initialData={selectedExp}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Work Experience"
        message={`Are you sure you want to remove "${deleteTarget?.title || "this experience"}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={() => {
          if (!deleteTarget) return;
          handleDeleteExperience(deleteTarget.item, deleteTarget.index);
        }}
      />
    </div>
  );
};

export default WorkExperienceSection;