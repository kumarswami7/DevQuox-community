import { cn } from "../../utils";
export const Badge = ({ children, variant = "primary", className }) => {
  const variants = {
    primary: "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    accent: "bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide", variants[variant], className)}>{children}</span>;
};
