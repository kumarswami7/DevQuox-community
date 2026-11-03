import React from "react";
import {
  X,
  Plus,
  FolderGit2,
  Briefcase,
  Award,
  Github,
  Code2,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export const AddSectionModal = ({
  isOpen,
  onClose,
  onSelectSection,
  isClient = false
}) => {
  if (!isOpen) return null;

  const sections = isClient
    ? [
        {
          id: "projects",
          title: "Post New Milestone Project",
          desc: "Create and publish a scoped software project specification for developer proposals.",
          icon: Briefcase,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40"
        },
        {
          id: "hiring",
          title: "Hiring Needs & Terms",
          desc: "Set target engineering roles, typical budget ranges, and payment milestones.",
          icon: ShieldCheck,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
        },
        {
          id: "about",
          title: "Company Story & Mission",
          desc: "Write detailed company backstory, founding vision, and technology stack.",
          icon: FolderGit2,
          color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40"
        }
      ]
    : [
        {
          id: "portfolio",
          actionId: "addPortfolio",
          title: "Showcase Project",
          desc: "Add a live web app or mobile project with GitHub code and demo links.",
          icon: FolderGit2,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40"
        },
        {
          id: "experience",
          actionId: "addExperience",
          title: "Work Experience",
          desc: "Add past engineering jobs, internships, freelance contracts, or leadership roles.",
          icon: Briefcase,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
        },
        {
          id: "education",
          actionId: "addEducation",
          title: "Education & Degree",
          desc: "Add your university (e.g. RGUKT ONGOLE), degree, field of study, and honors.",
          icon: Award,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
        },
        {
          id: "education",
          actionId: "addCertification",
          title: "Licenses & Certifications",
          desc: "Add industry certifications (AWS, Meta, MongoDB, Kotlin, Azure, etc.).",
          icon: ShieldCheck,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
        },
        {
          id: "opensource",
          actionId: "addOpenSource",
          title: "GitHub / Open Source Repository",
          desc: "Feature your open source repositories, packages, and public developer tools.",
          icon: Github,
          color: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
        },
        {
          id: "skills",
          actionId: "editSkills",
          title: "Skills & Tech Stack",
          desc: "Add core languages, frameworks, databases, and DevOps tools.",
          icon: Code2,
          color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40"
        },
        {
          id: "reviews",
          actionId: "addReview",
          title: "Client Endorsement / Review",
          desc: "Add client testimonials or peer engineer recommendations.",
          icon: MessageSquare,
          color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40"
        }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Add to Profile
              </h3>
              <p className="text-xs text-slate-500">
                Choose a section to add evidence of your skills and experience.
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

        {/* Section List */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectSection(sec.id, sec.actionId);
                  onClose();
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/50 bg-white dark:bg-slate-900/50 hover:bg-primary-50/20 dark:hover:bg-primary-950/20 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sec.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {sec.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {sec.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AddSectionModal;
