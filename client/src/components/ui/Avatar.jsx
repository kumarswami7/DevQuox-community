import { useState, useEffect } from "react";
import { cn } from "../../utils";

export const Avatar = ({
  src,
  alt = "Avatar",
  name = "User",
  size = "md",
  status,
  className
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError if src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

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
  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";
    
  const dimensionClass = size === "full" ? "w-full h-full" : sizes[size] || sizes.md;

  const showImage = Boolean(src && !imgError);

  return (
    <div className={cn("relative inline-block shrink-0 aspect-square select-none", size === "full" && "w-full h-full", className)}>
      {showImage ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={cn("rounded-full aspect-square object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0", dimensionClass)}
        />
      ) : (
        <div
          className={cn(
            "rounded-full aspect-square bg-gradient-to-br from-primary-600 to-rose-600 text-white font-bold flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shrink-0",
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
