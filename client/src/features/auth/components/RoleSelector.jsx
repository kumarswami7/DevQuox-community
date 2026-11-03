import React from "react";
import { motion } from "framer-motion";
import { Code2, Briefcase, Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export const RoleSelector = ({
  selectedRole,
  onSelectRole,
  onNext
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-primary-600" />
          <span>Step 1 of 2 • Account Type</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          How do you plan to use Devquox?
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Choose your account role. Your profile, dashboard, and workspace are permanently customized to this account type.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Developer Role Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectRole("developer")}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all relative flex flex-col justify-between ${
            selectedRole === "developer"
              ? "border-primary-600 bg-gradient-to-b from-primary-50/40 to-white shadow-md shadow-primary-500/10 ring-2 ring-primary-500/20"
              : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedRole === "developer"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-primary-50 text-primary-600 border border-primary-100"
                }`}
              >
                <Code2 className="w-5 h-5" />
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedRole === "developer"
                    ? "bg-primary-600 text-white shadow-xs"
                    : "border-2 border-slate-300"
                }`}
              >
                {selectedRole === "developer" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Developer / Engineer</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700">
                  Talent
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Join verified software teams, showcase your GitHub portfolio, and earn with protected milestone payouts.
              </p>
            </div>

            {/* Bullet Highlights */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Access to verified client project specs & MVPs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span>Escrow-backed milestone payments guaranteed</span>
              </div>
            </div>
          </div>

          {/* Selection Pill */}
          <div className="mt-4 pt-1">
            <div
              className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all ${
                selectedRole === "developer"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {selectedRole === "developer" ? "✓ Selected: Developer" : "Select Developer"}
            </div>
          </div>
        </motion.div>

        {/* Client Role Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectRole("client")}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all relative flex flex-col justify-between ${
            selectedRole === "client"
              ? "border-slate-900 bg-gradient-to-b from-slate-50/60 to-white shadow-md shadow-slate-900/10 ring-2 ring-slate-900/20"
              : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedRole === "client"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  selectedRole === "client"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "border-2 border-slate-300"
                }`}
              >
                {selectedRole === "client" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Client / Founder</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                  Hiring
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post project requirements, assemble vetted full-stack engineers, and manage agile deliverables in real-time.
              </p>
            </div>

            {/* Bullet Highlights */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Post projects & receive instant talent applications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span>Transparent milestone releases with escrow safety</span>
              </div>
            </div>
          </div>

          {/* Selection Pill */}
          <div className="mt-4 pt-1">
            <div
              className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all ${
                selectedRole === "client"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {selectedRole === "client" ? "✓ Selected: Client" : "Select Client"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>Role:</span>
          <span className="font-bold text-slate-900 capitalize px-2 py-0.5 rounded bg-slate-100 text-[11px]">
            {selectedRole === "developer" ? "Developer / Engineer" : "Client / Founder"}
          </span>
        </div>

        <Button
          onClick={onNext}
          variant="primary"
          size="md"
          className="w-full sm:w-auto px-6 py-2 text-xs font-bold shadow-md shadow-primary-500/20 gap-2"
        >
          <span>Continue to Google Verification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default RoleSelector;
