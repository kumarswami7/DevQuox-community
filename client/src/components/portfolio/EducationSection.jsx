import React, { useState } from "react";
import { GraduationCap, Calendar, Plus, Trash2, X } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const EducationSection = ({
  education = [],
  isOwn = false,
  onAddEducation,
  onDeleteEducation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institution.trim()) return;

    if (onAddEducation) {
      await onAddEducation({
        institution: institution.trim(),
        degree: degree.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        startYear: startYear ? parseInt(startYear) : null,
        endYear: endYear ? parseInt(endYear) : null,
        description: description.trim(),
      });
    }

    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartYear("");
    setEndYear("");
    setDescription("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary-500" />
          Education & Academic Background
        </h3>

        {isOwn && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Education
          </Button>
        )}
      </div>

      {education.length === 0 ? (
        <Card className="p-6 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-cardDark/50 border-dashed">
          No education history listed.
        </Card>
      ) : (
        <div className="space-y-3">
          {education.map((edu, idx) => (
            <Card
              key={edu._id || idx}
              className="p-4 glass-card relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {isOwn && onDeleteEducation && (
                <button
                  onClick={() => onDeleteEducation(edu._id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove education"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {edu.institution}
                  </h4>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <>
                      <span className="text-xs text-slate-400 font-semibold">•</span>
                      <span className="text-xs font-semibold text-accent-600 dark:text-accent-400">
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </span>
                    </>
                  )}
                </div>

                {(edu.startYear || edu.endYear) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {edu.startYear || "Year"} — {edu.endYear || "Present"}
                    </span>
                  </div>
                )}

                {edu.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
                    {edu.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Education Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary-500" /> Add Education
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
                  Institution / University *
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. Bachelor of Science"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="2018"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    End Year (or Expected)
                  </label>
                  <input
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    placeholder="2022"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Description / Honors
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Relevant coursework, capstone project, GPA..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Education
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EducationSection;
