import React, { useState, useEffect } from "react";
import { Plus, X, Sparkles, Check } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { SkillBadge } from "./SkillBadge";
import { discoveryService } from "../../services/discoveryService";

const PROFICIENCY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export const SkillsEditor = ({
  skillsWithProficiency = [],
  categories = [],
  onAddSkill,
  onRemoveSkill,
}) => {
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("Frontend development");
  const [proficiency, setProficiency] = useState("intermediate");
  const [years, setYears] = useState(2);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (skillName.trim().length >= 2) {
      discoveryService
        .suggestSkills(skillName.trim())
        .then((data) => setSuggestions(data || []))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [skillName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    if (onAddSkill) {
      onAddSkill({
        name: skillName.trim(),
        category,
        proficiency,
        yearsOfExperience: parseInt(years) || 1,
      });
    }

    setSkillName("");
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      {/* Current Skills List */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          Your Skills & Expertise
        </label>
        <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {skillsWithProficiency.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No skills added yet.</span>
          ) : (
            skillsWithProficiency.map((skill, idx) => (
              <SkillBadge
                key={skill.name || idx}
                name={skill.name}
                category={skill.category}
                proficiency={skill.proficiency}
                yearsOfExperience={skill.yearsOfExperience}
                showDetails={true}
                onRemove={onRemoveSkill}
              />
            ))
          )}
        </div>
      </div>

      {/* Add New Skill Form */}
      <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-cardDark/70 glass-card space-y-3">
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Add New Skill
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Skill Name with Autocomplete */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              required
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. React, Docker, Python..."
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.slug || s._id}
                    type="button"
                    onClick={() => {
                      setSkillName(s.name);
                      if (s.category) setCategory(s.category);
                      setSuggestions([]);
                    }}
                    className="w-full text-left px-2.5 py-1 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency */}
          <div className="sm:col-span-2">
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white capitalize"
            >
              {PROFICIENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Years */}
          <div className="sm:col-span-2">
            <input
              type="number"
              min="0"
              max="50"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="Yrs"
              className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="primary" className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Skill
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SkillsEditor;
