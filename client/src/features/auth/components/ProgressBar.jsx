import { motion } from "framer-motion";
export const ProgressBar = ({
  currentStep,
  totalSteps,
  stepTitles
}) => {
  const percentage = Math.round(currentStep / totalSteps * 100);
  return <div className="space-y-2 w-full"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>
          Step {currentStep} of {totalSteps}{stepTitles && stepTitles[currentStep - 1] && <span className="text-slate-900 dark:text-white ml-2">
              — {stepTitles[currentStep - 1]}</span>}</span><span className="text-primary-500">{percentage}%</span></div><div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative"><motion.div
    initial={{ width: 0 }}
    animate={{ width: `${percentage}%` }}
    transition={{ duration: 0.4, ease: "easeInOut" }}
    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
  /></div></div>;
};
