import { cn } from "../../utils";
export const Card = ({ children, className, glass = false, ...props }) => {
  return <div
    className={cn(
      "rounded-custom border p-5 transition-all duration-300",
      glass ? "glass" : "bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md",
      className
    )}
    {...props}
  >{children}</div>;
};
