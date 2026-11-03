import React, { useState } from "react";
import { Briefcase, Calendar, MapPin, Plus, Trash2, X } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CompanySelector, CompanyLogoBadge } from "../company/CompanySelector";

export const ExperienceSection = ({
  experiences = [],
  isOwn = false,
  onAddExperience,
  onDeleteExperience,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [current, setCurrent] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    if (onAddExperience) {
      await onAddExperience({
        company: company.trim(),
        companyLogo: companyLogo.trim(),
        companyDomain: companyDomain.trim(),
        role: role.trim(),
        location: location.trim(),
        startDate: startDate || null,
        endDate: current ? null : endDate || null,
        current,
        description: description.trim(),
      });
    }

    // Reset
    setCompany("");
    setCompanyLogo("");
    setCompanyDomain("");
    setRole("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setCurrent(false);
    setDescription("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary-500" />
          Work Experience
        </h3>

        {isOwn && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <Card className="p-6 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-cardDark/50 border-dashed">
          No experience records added yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp, idx) => (
            <Card
              key={exp._id || idx}
              className="p-4 glass-card relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {isOwn && onDeleteExperience && (
                <button
                  onClick={() => onDeleteExperience(exp._id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove experience"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CompanyLogoBadge
                    name={exp.company}
                    logoUrl={exp.companyLogo}
                    domain={exp.companyDomain}
                    className="w-5 h-5 rounded-md"
                    size="sm"
                  />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {exp.role}
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">•</span>
                  <span className="text-xs font-bold text-primary-500">{exp.company}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Started"}{" "}
                    —{" "}
                    {exp.current
                      ? "Present"
                      : exp.endDate
                      ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                      : "Finished"}
                  </span>

                  {exp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {exp.location}
                    </span>
                  )}
                </div>

                {exp.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Experience Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary-500" /> Add Work Experience
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Company / Organization *
                </label>
                <CompanySelector
                  value={company}
                  logoUrl={companyLogo}
                  domain={companyDomain}
                  onChange={(selected) => {
                    setCompany(selected.company);
                    setCompanyLogo(selected.companyLogo);
                    setCompanyDomain(selected.companyDomain);
                    if (!location && selected.location) setLocation(selected.location);
                  }}
                  placeholder="e.g. Google, Microsoft, Stripe, or your startup..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA (or Remote)"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    disabled={current}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentRole"
                  checked={current}
                  onChange={(e) => setCurrent(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <label htmlFor="currentRole" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  I currently work here
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Description / Achievements
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key responsibilities, stack, leadership, impact..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Experience
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;
