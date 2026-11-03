import { useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../auth/components/ProgressBar";
import { useNavigate } from "react-router-dom";
import { Building, ArrowRight, ArrowLeft } from "lucide-react";
import { PRE_LAUNCH_CONFIG } from "../../../utils/preLaunchConfig";
export const ClientProfileWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const stepTitles = [
    "Personal Info",
    "Company Information",
    "Hiring Preferences",
    "Budget & Duration",
    "Social Links"
  ];
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard");
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  return <div className="max-w-3xl mx-auto space-y-6 py-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Client / Employer Profile Setup
          </h1><p className="text-xs text-slate-500">
            Set up your organization profile to post software projects and hire talent
          </p></div><button
    onClick={() => navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard")}
    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
  >
          Skip for Now
        </button></div><ProgressBar currentStep={step} totalSteps={totalSteps} stepTitles={stepTitles} /><Card className="p-6 sm:p-8 space-y-6"><div className="text-center py-6 space-y-3"><div className="p-3 rounded-2xl bg-accent-500/10 text-accent-500 w-fit mx-auto"><Building className="w-6 h-6" /></div><h3 className="text-base font-bold text-slate-900 dark:text-white">{stepTitles[step - 1]}</h3><p className="text-xs text-slate-500 max-w-sm mx-auto">
            Configure your client workspace parameters to streamline hiring.
          </p></div><div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800"><Button
    type="button"
    variant="outline"
    onClick={handleBack}
    disabled={step === 1}
    className="gap-1.5"
  ><ArrowLeft className="w-4 h-4" /> Back
          </Button><Button type="button" variant="accent" onClick={handleNext} className="gap-1.5">{step === totalSteps ? "Finish Client Setup" : "Next"} <ArrowRight className="w-4 h-4" /></Button></div></Card></div>;
};
