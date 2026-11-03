import { useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../auth/components/ProgressBar";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { PRE_LAUNCH_CONFIG } from "../../../utils/preLaunchConfig";
import { UniversitySelector } from "../../../components/education/UniversitySelector";
import { CollegeSelector } from "../../../components/education/CollegeSelector";
import { CompanySelector } from "../../../components/company/CompanySelector";
import { SkillSelector } from "../../../components/skills/SkillSelector";
import { TechnologyIcon } from "../../../components/skills/TechnologyIcon";
import { normalizeSkillKey } from "../../../constants/skillRegistry";
export const DeveloperProfileWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const stepTitles = [
    "Basic Information",
    "Professional Details",
    "Skills & Tech Stack",
    "Portfolio Projects",
    "Work Experience",
    "Education",
    "Certifications",
    "Social Links"
  ];
  const [formData, setFormData] = useState({
    title: "Full Stack Engineer",
    about: "",
    city: "San Francisco",
    country: "United States",
    experienceYears: "4",
    employmentStatus: "Full Time",
    availability: "Available",
    preferredWorkType: "Remote",
    skills: ["React", "Node.js", "TypeScript"],
    experience: {
      company: "Google",
      companyLogo: "https://www.google.com/s2/favicons?domain=google.com&sz=128",
      companyDomain: "google.com",
      role: "Senior Full-Stack Engineer",
      employmentType: "Full-Time",
      location: "San Francisco, CA / Remote",
      period: "2022 – Present",
    },
    education: {
      institution: "Rajiv Gandhi University of Knowledge Technologies, Ongole",
      degree: "B.Tech in Computer Science",
      fieldOfStudy: "Software Engineering",
      startYear: 2021,
      endYear: 2025,
      university: null,
      universityCountry: "India",
      universityLogoUrl: "",
      universityDomain: "rgukt.in",
      isVerifiedUniversity: true,
    },
    github: "",
    linkedin: "",
    twitter: ""
  });
  const [newSkill, setNewSkill] = useState("");
  const handleAddSkill = (skillToAdd) => {
    const raw = typeof skillToAdd === "string" ? skillToAdd : newSkill;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const isDuplicate = (formData.skills || []).some(
      (s) => normalizeSkillKey(s) === normalizeSkillKey(trimmed)
    );
    if (!isDuplicate) {
      setFormData((prev) => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
    }
    setNewSkill("");
  };
  const handleRemoveSkill = (skillToRemove) => {
    const targetKey = normalizeSkillKey(skillToRemove);
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => normalizeSkillKey(s) !== targetKey),
    }));
  };
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard");
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  return <div className="max-w-3xl mx-auto space-y-6 py-6">{
    /* Wizard Header */
  }<div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Developer Profile Setup
          </h1><p className="text-xs text-slate-500">
            Complete your profile wizard so clients can hire or collaborate with you
          </p></div><button
    onClick={() => navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard")}
    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
  >
          Skip for Now
        </button></div><ProgressBar currentStep={step} totalSteps={totalSteps} stepTitles={stepTitles} /><Card className="p-6 sm:p-8 space-y-6">{
    /* Step 1: Basic Information */
  }{step === 1 && <div className="space-y-4"><h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 1: Basic Identity
            </h3><div className="space-y-3"><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Title *
                </label><input
    type="text"
    value={formData.title}
    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
    placeholder="e.g. Senior MERN Stack Architect"
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  /></div><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  About Me / Bio *
                </label><textarea
    rows={4}
    value={formData.about}
    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
    placeholder="Briefly describe your software background, architectural interests, and preferred tech stack..."
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label><input
    type="text"
    value={formData.city}
    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  /></div><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label><input
    type="text"
    value={formData.country}
    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  /></div></div></div></div>}{
    /* Step 2: Professional Details */
  }{step === 2 && <div className="space-y-4"><h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 2: Experience & Work Type
            </h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Years of Experience</label><input
    type="number"
    value={formData.experienceYears}
    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  /></div><div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Availability Status</label><select
    value={formData.availability}
    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
  ><option value="Available">Available for Hire</option><option value="Busy">Currently Busy</option></select></div></div></div>}{
    /* Step 3: Skills */
  }{step === 3 && (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Step 3: Primary Technical Skills
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Select or search your core programming languages, frameworks, databases, and developer tools.
        </p>
      </div>

      <SkillSelector
        selectedSkills={formData.skills || []}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        placeholder="Search technologies (e.g. React, Node.js, Python, Docker)..."
        showQuickPicks={true}
      />

      {formData.skills && formData.skills.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Selected Skills ({formData.skills.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 text-xs font-semibold"
              >
                <TechnologyIcon name={skill} size="xs" />
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-500 p-0.5 rounded cursor-pointer transition-colors"
                  title={`Remove ${skill}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )}{
    /* Step 5: Work Experience & Company Selection */
  }{step === 5 && (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Step 5: Professional Work Experience & Company
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Select or enter your company with instant logo resolution, role, and location.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Company / Organization *
          </label>
          <CompanySelector
            value={formData.experience.company}
            logoUrl={formData.experience.companyLogo}
            domain={formData.experience.companyDomain}
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                experience: {
                  ...prev.experience,
                  company: selected.company,
                  companyLogo: selected.companyLogo,
                  companyDomain: selected.companyDomain,
                  location: !prev.experience.location && selected.location ? selected.location : prev.experience.location,
                },
              }))
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Title / Role *
            </label>
            <input
              type="text"
              value={formData.experience.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  experience: { ...prev.experience, role: e.target.value },
                }))
              }
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.experience.location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  experience: { ...prev.experience, location: e.target.value },
                }))
              }
              placeholder="e.g. Hyderabad, India / Remote"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  )}{
    /* Step 6: Worldwide University & College Selection */
  }{step === 6 && (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Step 6: Worldwide College & Academic Background
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Search and select your university from our worldwide catalog, or enter your college manually.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            University / College *
          </label>
          <CollegeSelector
            value={formData.education}
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                education: {
                  ...prev.education,
                  ...selected,
                },
              }))
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Degree / Qualification
            </label>
            <input
              type="text"
              value={formData.education.degree}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  education: { ...prev.education, degree: e.target.value },
                }))
              }
              placeholder="e.g. B.Tech in CSE, BS, MS"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Field of Study
            </label>
            <input
              type="text"
              value={formData.education.fieldOfStudy}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  education: { ...prev.education, fieldOfStudy: e.target.value },
                }))
              }
              placeholder="e.g. Computer Science, AI, ECE"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  )}{
    /* Generic Steps (other than 1,2,3,5,6) Simple Setup Placeholders */
  }{step >= 4 && step !== 5 && step !== 6 && <div className="space-y-3 py-4 text-center"><div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500 w-fit mx-auto"><CheckCircle2 className="w-6 h-6" /></div><h3 className="text-base font-bold text-slate-900 dark:text-white">{stepTitles[step - 1]} Configured
            </h3><p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your details for this step are saved automatically in your profile state.
            </p></div>}{
    /* Wizard Footer Controls */
  }<div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800"><Button
    type="button"
    variant="outline"
    onClick={handleBack}
    disabled={step === 1}
    className="gap-1.5"
  ><ArrowLeft className="w-4 h-4" /> Back
          </Button><Button type="button" variant="primary" onClick={handleNext} className="gap-1.5">{step === totalSteps ? "Finish Profile" : "Next"} <ArrowRight className="w-4 h-4" /></Button></div></Card></div>;
};
