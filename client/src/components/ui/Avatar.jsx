import { cn } from "../../utils";
export const Avatar = ({
  src,
  alt = "Avatar",
  name = "User",
  size = "md",
  status,
  className
}) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-xl",
    "2xl": "w-32 h-32 text-2xl",
    full: "w-full h-full text-3xl"
  };
  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    away: "bg-amber-500"
  };
  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  const dimensionClass = size === "full" ? "w-full h-full" : sizes[size] || sizes.md;

  return (
    <div className={cn("relative inline-block shrink-0 aspect-square", size === "full" && "w-full h-full", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn("rounded-full aspect-square object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0", dimensionClass)}
        />
      ) : (
        <div
          className={cn(
            "rounded-full aspect-square bg-primary-600 text-white font-bold flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shrink-0",
            dimensionClass
          )}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};
