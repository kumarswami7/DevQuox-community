import React, { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  CalendarDays,
  BookOpen,
  Award,
  BadgeCheck,
  ExternalLink,
  Pencil,
  Trash2,
  MoreHorizontal,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Globe,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { profileService } from "../../services/profileService";
import { UniversitySelector } from "../education/UniversitySelector";
import { CollegeSelector } from "../education/CollegeSelector";

/**
 * Intelligent Badge Image Resolver
 * Resolves institution / certification names to high-resolution badges
 */
/**
 * Standardized Multi-Badge Resolver
 * Delivers 4 distinct, cohesive vector badge icons matching Image 2 reference:
 *
 * Education Variations:
 * 1. School / Secondary / 10th / MPPS: Open Book of Knowledge (edu_school.svg)
 * 2. Bachelor's / B.Tech / University: Iconic Graduation Cap (edu_university.svg)
 * 3. Master's / MS / PhD / Research: Diploma Parchment Scroll & Seal (edu_masters.svg)
 * 4. Academy / College / Foundation: Classical Pillars of Learning (edu_academy.svg)
 *
 * Certification Variations:
 * 1. Web & Fullstack / Frontend: Code Brackets < / > (cert_developer.svg)
 * 2. Backend & Cloud / Systems: Database Server Stack (cert_cloud.svg)
 * 3. Verified License / Credential: Checkmark Shield (cert_verified.svg)
 * 4. Awards & Honors / Hackathons: Star Ribbon Medal (cert_award.svg)
 */
export const resolveBadgeImage = (item, type, index = 0) => {
  const text = `${item?.degree || ""} ${item?.institution || ""} ${item?.name || ""} ${item?.issuer || ""} ${item?.fieldOfStudy || ""}`.toLowerCase();

  if (type === "certification") {
    // 1. Developer / Code / Frontend / Fullstack
    if (
      text.includes("developer") ||
      text.includes("frontend") ||
      text.includes("front-end") ||
      text.includes("full stack") ||
      text.includes("fullstack") ||
      text.includes("web") ||
      text.includes("react") ||
      text.includes("javascript") ||
      text.includes("software") ||
      text.includes("code")
    ) {
      return "/badges/cert_developer.svg";
    }

    // 2. Backend / Cloud / Database / DevOps / Systems
    if (
      text.includes("backend") ||
      text.includes("back-end") ||
      text.includes("cloud") ||
      text.includes("server") ||
      text.includes("database") ||
      text.includes("aws") ||
      text.includes("azure") ||
      text.includes("devops") ||
      text.includes("node") ||
      text.includes("python") ||
      text.includes("system")
    ) {
      return "/badges/cert_cloud.svg";
    }

    // 3. Award / Hackathon / Honors / Competition
    if (
      text.includes("award") ||
      text.includes("honor") ||
      text.includes("winner") ||
      text.includes("hackathon") ||
      text.includes("rank") ||
      text.includes("first") ||
      text.includes("prize")
    ) {
      return "/badges/cert_award.svg";
    }

    // 4. Default / Alternate across 4 distinct certification badges
    const certVariations = [
      "/badges/cert_verified.svg",
      "/badges/cert_developer.svg",
      "/badges/cert_cloud.svg",
      "/badges/cert_award.svg",
    ];
    return certVariations[Math.abs(index) % certVariations.length];
  }

  // --- Education Level & Timeline Matching ---
  // 1. School / Secondary / 10th / MPPS / High School
  if (
    text.includes("school") ||
    text.includes("secondary") ||
    text.includes("mpps") ||
    text.includes("high school") ||
    text.includes("primary") ||
    text.includes("10th") ||
    text.includes("matric") ||
    text.includes("ssc") ||
    text.includes("k-12")
  ) {
    return "/badges/edu_school.svg";
  }

  // 2. Master's / MS / PhD / Doctorate / Research
  if (
    text.includes("master") ||
    text.includes("m.tech") ||
    text.includes("mtech") ||
    text.includes("ms ") ||
    text.includes("mba") ||
    text.includes("phd") ||
    text.includes("doctorate") ||
    text.includes("post grad") ||
    text.includes("postgraduate")
  ) {
    return "/badges/edu_masters.svg";
  }

  // 3. Bachelor's / B.Tech / Undergraduate / University
  if (
    text.includes("b tech") ||
    text.includes("btech") ||
    text.includes("b.e") ||
    text.includes("b.sc") ||
    text.includes("bachelor") ||
    text.includes("undergraduate") ||
    text.includes("degree") ||
    text.includes("university") ||
    text.includes("rgukt") ||
    text.includes("iiit")
  ) {
    return "/badges/edu_university.svg";
  }

  // 4. Academy / College / Intermediate / Polytechnic / General
  if (
    text.includes("academy") ||
    text.includes("intermediate") ||
    text.includes("12th") ||
    text.includes("polytechnic") ||
    text.includes("diploma") ||
    text.includes("college") ||
    text.includes("institute")
  ) {
    return "/badges/edu_academy.svg";
  }

  // Fallback by index so arbitrary items (e.g. "sdfdfdf") get their own distinct badge
  const eduVariations = [
    "/badges/edu_academy.svg",
    "/badges/edu_university.svg",
    "/badges/edu_school.svg",
    "/badges/edu_masters.svg",
  ];
  return eduVariations[Math.abs(index) % eduVariations.length];
};

/**
 * Reusable Badge Image Component
 * Fixed dimensions (w-14 h-14) prevent any image overflow or distortion.
 */
const BadgeImage = ({ item, type, index = 0, className = "w-14 h-14" }) => {
  const fallbackSrc = resolveBadgeImage(item, type, index);
  const preferredLogo = item?.collegeLogoUrl || item?.universityLogoUrl;
  const [currentSrc, setCurrentSrc] = useState(preferredLogo || fallbackSrc);

  useEffect(() => {
    const updated = item?.collegeLogoUrl || item?.universityLogoUrl || fallbackSrc;
    setCurrentSrc(updated);
  }, [item?.collegeLogoUrl, item?.universityLogoUrl, fallbackSrc]);

  return (
    <div
      className={`${className} min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-[#0091ff]/60 group-hover:shadow-xs transition-all`}
    >
      <img
        src={currentSrc}
        alt={type === "certification" ? "Certification Badge" : "Education Badge"}
        className="w-full h-full object-contain pointer-events-none select-none"
        loading="lazy"
        onError={() => setCurrentSrc(fallbackSrc)}
      />
    </div>
  );
};

// Helper function to safely format dates (e.g., "Jun 2023", "2023")
const formatDisplayDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return String(dateVal);
  }
};

/**
 * 3-Dot Action Menu Component with click-outside detection and keyboard escape
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
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/40 cursor-pointer"
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
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-[#0a66c2] dark:hover:text-sky-400 transition-colors cursor-pointer"
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
 * Clean Confirmation Dialog Modal for Deletions
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
 * Add / Edit Education Modal
 */
const EducationModal = ({ isOpen, onClose, onSave, initialData, isSaving }) => {
  const [formData, setFormData] = useState({
    institution: "",
    university: null,
    universityCountry: "",
    universityLogoUrl: "",
    universityDomain: "",
    isVerifiedUniversity: false,
    college: null,
    collegeName: "",
    collegeCountry: "",
    collegeCity: "",
    collegeState: "",
    collegeLogoUrl: "",
    collegeLogoSource: "favicon",
    collegeInitials: "",
    collegeWebsite: "",
    isVerifiedCollege: false,
    degree: "",
    fieldOfStudy: "",
    year: "",
    startYear: "",
    endYear: "",
    status: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        institution: initialData.institution || initialData.collegeName || "",
        university: initialData.university || null,
        universityCountry: initialData.universityCountry || initialData.collegeCountry || "",
        universityLogoUrl: initialData.universityLogoUrl || initialData.collegeLogoUrl || "",
        universityDomain: initialData.universityDomain || "",
        isVerifiedUniversity: Boolean(initialData.isVerifiedUniversity),
        college: initialData.college || initialData.university || null,
        collegeName: initialData.collegeName || initialData.institution || "",
        collegeCountry: initialData.collegeCountry || initialData.universityCountry || "",
        collegeCity: initialData.collegeCity || "",
        collegeState: initialData.collegeState || "",
        collegeLogoUrl: initialData.collegeLogoUrl || initialData.universityLogoUrl || "",
        collegeLogoSource: initialData.collegeLogoSource || "favicon",
        collegeInitials: initialData.collegeInitials || "",
        collegeWebsite: initialData.collegeWebsite || "",
        isVerifiedCollege: Boolean(initialData.isVerifiedCollege || initialData.isVerifiedUniversity),
        degree: initialData.degree || "",
        fieldOfStudy: initialData.fieldOfStudy || "",
        year: initialData.year || "",
        startYear: initialData.startYear ? String(initialData.startYear) : "",
        endYear: initialData.endYear ? String(initialData.endYear) : "",
        status: initialData.status || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        institution: "",
        university: null,
        universityCountry: "",
        universityLogoUrl: "",
        universityDomain: "",
        isVerifiedUniversity: false,
        college: null,
        collegeName: "",
        collegeCountry: "",
        collegeCity: "",
        collegeState: "",
        collegeLogoUrl: "",
        collegeLogoSource: "favicon",
        collegeInitials: "",
        collegeWebsite: "",
        isVerifiedCollege: false,
        degree: "",
        fieldOfStudy: "",
        year: "",
        startYear: "",
        endYear: "",
        status: "Completed",
        description: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.institution.trim()) {
      newErrors.institution = "School or institution name is required.";
    }
    if (!formData.degree.trim()) {
      newErrors.degree = "Degree or qualification is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      institution: formData.institution.trim(),
      university: formData.university || formData.college || null,
      universityCountry: formData.universityCountry || formData.collegeCountry || "",
      universityLogoUrl: formData.universityLogoUrl || formData.collegeLogoUrl || "",
      universityDomain: formData.universityDomain || "",
      isVerifiedUniversity: Boolean(formData.isVerifiedUniversity || formData.isVerifiedCollege),
      college: formData.college || formData.university || null,
      collegeName: formData.collegeName || formData.institution.trim(),
      collegeCountry: formData.collegeCountry || formData.universityCountry || "",
      collegeCity: formData.collegeCity || "",
      collegeState: formData.collegeState || "",
      collegeLogoUrl: formData.collegeLogoUrl || formData.universityLogoUrl || "",
      collegeLogoSource: formData.collegeLogoSource || "favicon",
      collegeInitials: formData.collegeInitials || "",
      collegeWebsite: formData.collegeWebsite || "",
      isVerifiedCollege: Boolean(formData.isVerifiedCollege || formData.isVerifiedUniversity),
      degree: formData.degree.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      year:
        formData.year.trim() ||
        (formData.startYear && formData.endYear
          ? `${formData.startYear} – ${formData.endYear}`
          : formData.startYear || formData.endYear || ""),
      startYear: formData.startYear ? Number(formData.startYear) : null,
      endYear: formData.endYear ? Number(formData.endYear) : null,
      status: formData.status.trim(),
      description: formData.description.trim(),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0a66c2] dark:text-sky-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Education Record" : "Add Education Record"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage your academic degrees and educational background.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              School or Institution <span className="text-rose-500">*</span>
            </label>
            <CollegeSelector
              value={{
                college: formData.college || formData.university,
                collegeName: formData.collegeName || formData.institution,
                collegeCountry: formData.collegeCountry || formData.universityCountry,
                collegeCity: formData.collegeCity,
                collegeState: formData.collegeState,
                collegeLogoUrl: formData.collegeLogoUrl || formData.universityLogoUrl,
                collegeLogoSource: formData.collegeLogoSource,
                collegeInitials: formData.collegeInitials,
                collegeWebsite: formData.collegeWebsite,
                domain: formData.universityDomain,
                isVerifiedCollege: formData.isVerifiedCollege || formData.isVerifiedUniversity,
              }}
              onChange={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  institution: selected.institution || selected.collegeName,
                  college: selected.college,
                  collegeName: selected.collegeName,
                  collegeCountry: selected.collegeCountry,
                  collegeCity: selected.collegeCity,
                  collegeState: selected.collegeState,
                  collegeLogoUrl: selected.collegeLogoUrl,
                  collegeLogoSource: selected.collegeLogoSource,
                  collegeInitials: selected.collegeInitials,
                  collegeWebsite: selected.collegeWebsite,
                  isVerifiedCollege: selected.isVerifiedCollege,
                  university: selected.college,
                  universityCountry: selected.collegeCountry,
                  universityLogoUrl: selected.collegeLogoUrl,
                  universityDomain: selected.collegeWebsite ? selected.collegeWebsite.replace(/^https?:\/\//, '').split('/')[0] : '',
                  isVerifiedUniversity: selected.isVerifiedCollege,
                }));
                if (errors.institution) setErrors((prev) => ({ ...prev, institution: null }));
              }}
              placeholder="Search worldwide colleges, engineering, medical & universities..."
            />
            {errors.institution && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.institution}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Degree / Qualification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech in ECE or Secondary School"
                value={formData.degree}
                onChange={(e) => {
                  setFormData({ ...formData, degree: e.target.value });
                  if (errors.degree) setErrors({ ...errors, degree: null });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
              {errors.degree && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.degree}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Electronics & Communication"
                value={formData.fieldOfStudy}
                onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Start Year
              </label>
              <input
                type="number"
                placeholder="e.g. 2020"
                value={formData.startYear}
                onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                End Year (or Expected)
              </label>
              <input
                type="number"
                placeholder="e.g. 2026"
                value={formData.endYear}
                onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Completion Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30 cursor-pointer"
              >
                <option value="">Select status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Description / Coursework / Honors
            </label>
            <textarea
              rows={3}
              placeholder="Outline key academic honors, coursework, or leadership roles..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
            />
          </div>

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
              className="px-4 py-2 rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Save Changes" : "Save Education"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Add / Edit Certification Modal
 */
const CertificationModal = ({ isOpen, onClose, onSave, initialData, isSaving }) => {
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    noExpiry: true,
    credentialId: "",
    credentialUrl: "",
    isVerified: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        issuer: initialData.issuer || "",
        issueDate: initialData.issueDate
          ? new Date(initialData.issueDate).toISOString().substring(0, 10)
          : "",
        expiryDate: initialData.expiryDate
          ? new Date(initialData.expiryDate).toISOString().substring(0, 10)
          : "",
        noExpiry: !initialData.expiryDate,
        credentialId: initialData.credentialId || "",
        credentialUrl: initialData.credentialUrl || "",
        isVerified: initialData.isVerified !== undefined ? Boolean(initialData.isVerified) : true,
      });
    } else {
      setFormData({
        name: "",
        issuer: "",
        issueDate: new Date().toISOString().substring(0, 10),
        expiryDate: "",
        noExpiry: true,
        credentialId: "",
        credentialUrl: "",
        isVerified: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Certification title is required.";
    }
    if (!formData.issuer.trim()) {
      newErrors.issuer = "Issuing organization is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      issuer: formData.issuer.trim(),
      issueDate: formData.issueDate ? new Date(formData.issueDate) : new Date(),
      expiryDate: formData.noExpiry || !formData.expiryDate ? null : new Date(formData.expiryDate),
      credentialId: formData.credentialId.trim(),
      credentialUrl: formData.credentialUrl.trim(),
      isVerified: Boolean(formData.isVerified),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1b2730] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0a66c2] dark:text-sky-400 flex items-center justify-center">
              <Award className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Certification" : "Add License & Certification"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add engineering certifications, industry credentials, and licenses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Certification Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer or Backend Developer"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              autoFocus
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Issuing Organization <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. GATENova, Meta, AWS, Google Cloud"
              value={formData.issuer}
              onChange={(e) => {
                setFormData({ ...formData, issuer: e.target.value });
                if (errors.issuer) setErrors({ ...errors, issuer: null });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
            />
            {errors.issuer && <p className="text-[11px] text-rose-500 mt-1">{errors.issuer}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                disabled={formData.noExpiry}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30 disabled:opacity-50"
              />
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.noExpiry}
                  onChange={(e) => setFormData({ ...formData, noExpiry: e.target.checked })}
                  className="rounded text-[#0a66c2] focus:ring-[#0a66c2]"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  This credential does not expire
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Credential ID (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. GATE-FS-84920"
                value={formData.credentialId}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Credential URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.credentialUrl}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-[#0a66c2] dark:text-sky-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Mark as Verified Credential
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isVerified}
              onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
              className="w-4 h-4 rounded text-[#0a66c2] focus:ring-[#0a66c2] cursor-pointer"
            />
          </div>

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
              className="px-4 py-2 rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Save Changes" : "Save Certification"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENT 1: PREVIEW ON OVERVIEW TAB — 2 DISTINCT CARDS WITH 2-COLUMN GRIDS
// =============================================================================
export const EducationCertificationsPreview = ({
  education = [],
  certifications = [],
  onViewAll,
}) => {
  return (
    <div className="space-y-5">
      {/* 1. SEPARATE EDUCATION SECTION (2-COLUMN GRID) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0a66c2] dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <GraduationCap className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Education & Academic Background</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {education.length}
                </span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-[#0a66c2] hover:text-[#004182] dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>View All / Add</span>
            <span>→</span>
          </button>
        </div>

        {education && education.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.map((edu, idx) => (
              <div
                key={edu._id || idx}
                className="p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex items-start gap-3.5 group"
              >
                <BadgeImage item={edu} type="education" index={idx} className="w-13 h-13" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0a66c2] dark:group-hover:text-sky-400 transition-colors">
                    {edu.degree || "Degree / Program"}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {edu.collegeName || edu.institution}
                    </p>
                    {(edu.isVerifiedCollege || edu.isVerifiedUniversity) && (
                      <span title="Verified Institution">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </span>
                    )}
                    {(edu.collegeCity || edu.collegeCountry || edu.universityCountry) && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        • <Globe className="w-2.5 h-2.5" />
                        <span>
                          {[edu.collegeCity, edu.collegeCountry || edu.universityCountry]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {edu.year && (
                      <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        <span>{edu.year}</span>
                      </span>
                    )}
                    {edu.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {edu.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-3 text-center">
            No formal education records listed yet.
          </p>
        )}
      </div>

      {/* 2. SEPARATE LICENSES & CERTIFICATIONS SECTION (2-COLUMN GRID) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Award className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Licenses & Certifications</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {certifications.length}
                </span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-[#0a66c2] hover:text-[#004182] dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>View All / Add</span>
            <span>→</span>
          </button>
        </div>

        {certifications && certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert, idx) => (
              <div
                key={cert._id || idx}
                className="p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex items-start gap-3.5 group"
              >
                <BadgeImage item={cert} type="certification" index={idx} className="w-13 h-13" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0a66c2] dark:group-hover:text-sky-400 transition-colors">
                    {cert.name}
                  </h4>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {cert.issuer}
                  </p>
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0a66c2] dark:text-sky-400">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-slate-500 hover:text-[#0a66c2] dark:text-slate-400 dark:hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Show credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-3 text-center">
            No certifications added yet.
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENT 2: FULL TAB VIEW — TWO SEPARATE 2-COLUMN GRID SECTIONS
// =============================================================================
export const EducationCertificationsSection = ({
  education = [],
  certifications = [],
  isOwnProfile = false,
  onProfileUpdate,
  syncUpdateToBackend,
  triggerAction = null,
  onClearAction = null,
}) => {
  // Modal States
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState(null);

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Respond to external action triggers (e.g. from AddSectionModal or Checklist)
  useEffect(() => {
    if (triggerAction === "addEducation") {
      setSelectedEdu(null);
      setEduModalOpen(true);
      if (onClearAction) onClearAction();
    } else if (triggerAction === "addCertification") {
      setSelectedCert(null);
      setCertModalOpen(true);
      if (onClearAction) onClearAction();
    }
  }, [triggerAction, onClearAction]);

  // --- EDUCATION HANDLERS ---
  const handleSaveEducation = async (formData) => {
    setIsSaving(true);
    setActionError(null);
    try {
      if (selectedEdu && selectedEdu._id) {
        let updatedList;
        try {
          const res = await profileService.editEducation(selectedEdu._id, formData);
          updatedList = res.data;
        } catch {
          updatedList = education.map((item) =>
            String(item._id) === String(selectedEdu._id) ? { ...item, ...formData } : item
          );
        }
        if (onProfileUpdate) onProfileUpdate({ education: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ education: updatedList });
      } else if (selectedEdu) {
        const updatedList = education.map((item, idx) =>
          idx === selectedEdu._idx ? { ...item, ...formData } : item
        );
        if (onProfileUpdate) onProfileUpdate({ education: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ education: updatedList });
      } else {
        let updatedList;
        try {
          const res = await profileService.addEducation(formData);
          updatedList = res.data || [...education, formData];
        } catch {
          updatedList = [...education, formData];
        }
        if (onProfileUpdate) onProfileUpdate({ education: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ education: updatedList });
      }
      setEduModalOpen(false);
      setSelectedEdu(null);
    } catch (err) {
      console.error("[Education] Save error:", err);
      setActionError("Failed to save education record. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEducation = async (item, index) => {
    setIsDeleting(true);
    setActionError(null);
    try {
      let updatedList;
      if (item._id) {
        try {
          const res = await profileService.deleteEducation(item._id);
          updatedList = res.data || education.filter((_, idx) => idx !== index);
        } catch {
          updatedList = education.filter((_, idx) => idx !== index);
        }
      } else {
        updatedList = education.filter((_, idx) => idx !== index);
      }
      if (onProfileUpdate) onProfileUpdate({ education: updatedList });
      if (syncUpdateToBackend) syncUpdateToBackend({ education: updatedList });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[Education] Delete error:", err);
      setActionError("Failed to delete education record. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- CERTIFICATION HANDLERS ---
  const handleSaveCertification = async (formData) => {
    setIsSaving(true);
    setActionError(null);
    try {
      if (selectedCert && selectedCert._id) {
        let updatedList;
        try {
          const res = await profileService.editCertification(selectedCert._id, formData);
          updatedList = res.data;
        } catch {
          updatedList = certifications.map((item) =>
            String(item._id) === String(selectedCert._id) ? { ...item, ...formData } : item
          );
        }
        if (onProfileUpdate) onProfileUpdate({ certifications: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ certifications: updatedList });
      } else if (selectedCert) {
        const updatedList = certifications.map((item, idx) =>
          idx === selectedCert._idx ? { ...item, ...formData } : item
        );
        if (onProfileUpdate) onProfileUpdate({ certifications: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ certifications: updatedList });
      } else {
        let updatedList;
        try {
          const res = await profileService.addCertification(formData);
          updatedList = res.data || [...certifications, formData];
        } catch {
          updatedList = [...certifications, formData];
        }
        if (onProfileUpdate) onProfileUpdate({ certifications: updatedList });
        if (syncUpdateToBackend) syncUpdateToBackend({ certifications: updatedList });
      }
      setCertModalOpen(false);
      setSelectedCert(null);
    } catch (err) {
      console.error("[Certification] Save error:", err);
      setActionError("Failed to save certification. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCertification = async (item, index) => {
    setIsDeleting(true);
    setActionError(null);
    try {
      let updatedList;
      if (item._id) {
        try {
          const res = await profileService.deleteCertification(item._id);
          updatedList = res.data || certifications.filter((_, idx) => idx !== index);
        } catch {
          updatedList = certifications.filter((_, idx) => idx !== index);
        }
      } else {
        updatedList = certifications.filter((_, idx) => idx !== index);
      }
      if (onProfileUpdate) onProfileUpdate({ certifications: updatedList });
      if (syncUpdateToBackend) syncUpdateToBackend({ certifications: updatedList });
      setDeleteTarget(null);
    } catch (err) {
      console.error("[Certification] Delete error:", err);
      setActionError("Failed to delete certification. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error notification banner */}
      {actionError && (
        <div className="p-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =======================================================================
          SECTION 1: EDUCATION & ACADEMIC BACKGROUND (2-COLUMN GRID)
         ======================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#0a66c2]" strokeWidth={1.8} />
              <span>Education & Academic Background</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {education.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your educational qualifications, degrees, and academic background.
            </p>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                setSelectedEdu(null);
                setEduModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0a66c2] hover:bg-[#004182] active:scale-98 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Education</span>
            </button>
          )}
        </div>

        {/* 2-Column Responsive Grid */}
        {education && education.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.map((edu, idx) => (
              <div
                key={edu._id || idx}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs transition-all flex items-start gap-3.5 group relative"
              >
                <BadgeImage item={edu} type="education" index={idx} className="w-13 h-13" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {edu.degree || "Degree Qualification"}
                    </h3>
                    {isOwnProfile && (
                      <ActionMenu
                        itemName={edu.degree}
                        onEdit={() => {
                          setSelectedEdu({ ...edu, _idx: idx });
                          setEduModalOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteTarget({
                            type: "education",
                            item: edu,
                            index: idx,
                            title: edu.degree || edu.institution,
                          });
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {edu.collegeName || edu.institution}
                    </p>
                    {(edu.isVerifiedCollege || edu.isVerifiedUniversity) && (
                      <span title="Verified Institution">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </span>
                    )}
                    {(edu.collegeCity || edu.collegeCountry || edu.universityCountry) && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        • <Globe className="w-2.5 h-2.5" />
                        <span>
                          {[edu.collegeCity, edu.collegeCountry || edu.universityCountry]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </span>
                    )}
                    {(edu.collegeWebsite || edu.universityDomain) && (
                      <a
                        href={edu.collegeWebsite || `https://${edu.universityDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#0a66c2] dark:text-sky-400 hover:underline font-mono"
                      >
                        <span>{edu.collegeWebsite ? edu.collegeWebsite.replace(/^https?:\/\//, '').split('/')[0] : edu.universityDomain}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    {edu.year && (
                      <span className="flex items-center gap-1 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>{edu.year}</span>
                      </span>
                    )}
                    {edu.fieldOfStudy && (
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{edu.fieldOfStudy}</span>
                      </span>
                    )}
                    {edu.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {edu.status}
                      </span>
                    )}
                  </div>

                  {edu.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-1.5 leading-relaxed line-clamp-2">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <GraduationCap className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No education records listed yet
            </p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEdu(null);
                  setEduModalOpen(true);
                }}
                className="text-xs font-bold text-[#0a66c2] hover:underline cursor-pointer"
              >
                + Add your first education record
              </button>
            )}
          </div>
        )}
      </section>

      {/* =======================================================================
          SECTION 2: LICENSES & CERTIFICATIONS (2-COLUMN GRID)
         ======================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.8} />
              <span>Licenses & Certifications</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {certifications.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Professional credentials, engineering licenses, and verified certifications.
            </p>
          </div>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                setSelectedCert(null);
                setCertModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg border border-[#0a66c2] dark:border-sky-500 text-[#0a66c2] dark:text-sky-400 hover:bg-[#0a66c2]/10 active:scale-98 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Certification</span>
            </button>
          )}
        </div>

        {/* 2-Column Responsive Grid */}
        {certifications && certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert, idx) => (
              <div
                key={cert._id || idx}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#151f26] hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs transition-all flex items-start gap-3.5 group relative"
              >
                <BadgeImage item={cert} type="certification" index={idx} className="w-13 h-13" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cert.name}
                    </h3>
                    {isOwnProfile && (
                      <ActionMenu
                        itemName={cert.name}
                        onEdit={() => {
                          setSelectedCert({ ...cert, _idx: idx });
                          setCertModalOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteTarget({
                            type: "certification",
                            item: cert,
                            index: idx,
                            title: cert.name,
                          });
                        }}
                      />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {cert.issuer}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#0a66c2] dark:text-sky-300 border border-blue-200/60 dark:border-blue-900/50">
                      <BadgeCheck className="w-3 h-3 text-[#0a66c2] dark:text-sky-400" />
                      <span>Verified Credential</span>
                    </span>
                    {cert.issueDate && (
                      <span className="text-[11px] text-slate-400">
                        • Issued {formatDisplayDate(cert.issueDate)}
                      </span>
                    )}
                  </div>

                  {cert.credentialId && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 truncate font-mono">
                      ID: {cert.credentialId}
                    </p>
                  )}

                  {cert.credentialUrl && (
                    <div className="pt-2">
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a66c2] hover:text-[#004182] dark:text-sky-400 dark:hover:text-sky-300 hover:underline transition-colors cursor-pointer"
                      >
                        <span>Show credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <Award className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No certifications added yet
            </p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCert(null);
                  setCertModalOpen(true);
                }}
                className="text-xs font-bold text-[#0a66c2] hover:underline cursor-pointer"
              >
                + Add your first certification
              </button>
            )}
          </div>
        )}
      </section>

      {/* Modals */}
      <EducationModal
        isOpen={eduModalOpen}
        onClose={() => {
          setEduModalOpen(false);
          setSelectedEdu(null);
        }}
        onSave={handleSaveEducation}
        initialData={selectedEdu}
        isSaving={isSaving}
      />

      <CertificationModal
        isOpen={certModalOpen}
        onClose={() => {
          setCertModalOpen(false);
          setSelectedCert(null);
        }}
        onSave={handleSaveCertification}
        initialData={selectedCert}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.type === "education"
            ? "Delete Education Record"
            : "Delete Certification"
        }
        message={`Are you sure you want to remove "${deleteTarget?.title || "this item"}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "education") {
            handleDeleteEducation(deleteTarget.item, deleteTarget.index);
          } else {
            handleDeleteCertification(deleteTarget.item, deleteTarget.index);
          }
        }}
      />
    </div>
  );
};

export default EducationCertificationsSection;
