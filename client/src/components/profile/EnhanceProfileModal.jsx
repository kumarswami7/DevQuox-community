import React, { useState } from "react";
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import { Button } from "../ui/Button";

export const EnhanceProfileModal = ({
  isOpen,
  onClose,
  profile,
  onApplyEnhancements,
  isClient = false
}) => {
  const [applied, setApplied] = useState(false);

  if (!isOpen || !profile) return null;

  // Real, genuine completeness calculation
  let score = 0;
  if (isClient) {
    if (profile.user?.name || profile.name) score += 20;
    if (profile.companyName || profile.user?.companyName) score += 20;
    if (profile.about || profile.user?.bio) score += 20;
    if (profile.industry && profile.companySize) score += 15;
    if (profile.hiringNeeds && profile.hiringNeeds.length > 0) score += 15;
    if (profile.location || profile.companyWebsite) score += 10;
  } else {
    if (profile.title || profile.user?.headline) score += 20;
    if (profile.about || profile.user?.bio) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.portfolio && profile.portfolio.length > 0) score += 15;
    if (profile.experience && profile.experience.length > 0) score += 15;
    if (profile.education && profile.education.length > 0) score += 10;
  }

  const scoreLabel =
    score >= 85 ? "All Star" : score >= 60 ? "Intermediate" : score >= 35 ? "Developing" : "Getting Started";

  // Dynamic tailoring based on actual data
  const skillsList = profile.skills && profile.skills.length > 0 ? profile.skills.slice(0, 4).join(", ") : "Modern Web Architecture";
  const userRoleTitle = profile.title || profile.user?.headline || (isClient ? "Founder & Project Owner" : "Software Engineer");
  const company = profile.companyName || profile.user?.companyName || "";

  const suggestedHeadline = isClient
    ? `${company ? `${company} · ` : ""}${userRoleTitle} | Assembling agile engineering teams for milestone-backed deliverables`
    : `${userRoleTitle} | Specializing in ${skillsList} | Open to High-Impact Opportunities`;

  const suggestedBio = isClient
    ? `Product and technology leader${company ? ` at ${company}` : ""} assembling collaborative engineering teams. Committed to clear technical specifications, transparent escrow milestones, and high-quality software execution.`
    : `Software engineer specializing in ${skillsList}. Experienced in building reliable, well-tested applications with clean architecture, modern frameworks, and responsive user experiences.`;

  const handleApply = () => {
    onApplyEnhancements({
      title: suggestedHeadline,
      headline: suggestedHeadline,
      about: suggestedBio,
      bio: suggestedBio
    });
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Enhance Profile <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 border border-primary-200 dark:border-primary-800">Optimization</span>
              </h3>
              <p className="text-xs text-slate-500">
                Actionable suggestions tailored to your actual skills and role.
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Profile Strength Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary-600" /> Real Profile Strength Score
              </span>
              <span className="text-primary-600 font-black">{score}% — {scoreLabel}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Calculated from your verified profile attributes. Profiles with complete headlines, bio summaries, and skills attract significantly more engagement.
            </p>
          </div>

          {/* Suggested Headline */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Tailored Professional Headline
            </h4>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {suggestedHeadline}
            </div>
          </div>

          {/* Suggested Bio */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary-500" /> High-Impact Summary
            </h4>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {suggestedBio}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Dismiss
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="gap-2 font-bold cursor-pointer"
          >
            {applied ? (
              <>
                <Check className="w-4 h-4" /> Applied Successfully!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Apply Suggestions <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhanceProfileModal;
