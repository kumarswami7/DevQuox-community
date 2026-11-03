import React, { useState, useEffect } from "react";
import { X, Check, Briefcase, MapPin, Eye, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

const WORKPLACE_TYPES = ["On-site", "Hybrid", "Remote"];
const JOB_TYPES = ["Full-Time", "Contract", "Freelance", "Internship"];

export const OpenToWorkModal = ({
  isOpen,
  onClose,
  profile,
  onSave,
  isClient = false
}) => {
  const [jobTitles, setJobTitles] = useState("");
  const [locations, setLocations] = useState("");
  const [selectedWorkplaces, setSelectedWorkplaces] = useState(["Remote"]);
  const [selectedJobTypes, setSelectedJobTypes] = useState(["Full-Time", "Freelance"]);
  const [recruiterOnly, setRecruiterOnly] = useState(true);

  useEffect(() => {
    if (profile) {
      setJobTitles(
        profile.preferredRoles?.length > 0
          ? profile.preferredRoles.join(", ")
          : (profile.title || profile.headline || "")
      );
      setLocations(profile.location || "");
      if (profile.workplaces && profile.workplaces.length > 0) {
        setSelectedWorkplaces(profile.workplaces);
      }
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleWorkplace = (type) => {
    setSelectedWorkplaces((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleJobType = (type) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    const rolesArray = jobTitles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      preferredRoles: rolesArray,
      location: locations,
      workplaces: selectedWorkplaces,
      openTo: selectedJobTypes.map((t) => t.toLowerCase().replace("-", "_")),
      recruiterOnlyVisibility: recruiterOnly
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isClient ? "Hiring & Project Preferences" : "Edit Open to Work Preferences"}
              </h3>
              <p className="text-xs text-slate-500">
                {isClient
                  ? "Specify roles you're seeking to hire and terms."
                  : "Let recruiters know what roles and terms you are seeking."}
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Job Titles */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isClient ? "Roles You Are Hiring For" : "Job Titles / Target Roles *"}
            </label>
            <input
              type="text"
              required
              value={jobTitles}
              onChange={(e) => setJobTitles(e.target.value)}
              placeholder="e.g. Full-Stack Developer, React Engineer, Node.js Specialist"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="text-[11px] text-slate-400">Comma-separated target role titles</p>
          </div>

          {/* Locations */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Locations
            </label>
            <input
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g. Hyderabad, Bengaluru, Remote"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Workplace Types */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Workplace Types
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKPLACE_TYPES.map((type) => {
                const active = selectedWorkplaces.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleWorkplace(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-primary-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Types */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Employment Types
            </label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((type) => {
                const active = selectedJobTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleJobType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-primary-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                onClick={() => setRecruiterOnly(true)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  recruiterOnly
                    ? "border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 text-primary-900 dark:text-primary-200"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Eye className="w-3.5 h-3.5 text-primary-500" />
                  <span>Recruiters only</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Only verified recruiters & hiring managers see your badge.
                </p>
              </div>

              <div
                onClick={() => setRecruiterOnly(false)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  !recruiterOnly
                    ? "border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 text-primary-900 dark:text-primary-200"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>All Devquox Members</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Visible to everyone including founders and engineering peers.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="gap-1.5 font-bold shadow-xs cursor-pointer">
              <Check className="w-4 h-4" /> Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenToWorkModal;
