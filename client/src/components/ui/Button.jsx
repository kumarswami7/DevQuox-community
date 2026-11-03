import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export const Button = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-custom transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25",
    secondary: "bg-secondary-800 hover:bg-secondary-900 text-white dark:bg-secondary-700 dark:hover:bg-secondary-600",
    accent: "bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25",
    outline: "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return <button
    className={cn(baseStyles, variants[variant], sizes[size], className)}
    disabled={disabled || isLoading}
    {...props}
  >{isLoading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}{children}</button>;
};
