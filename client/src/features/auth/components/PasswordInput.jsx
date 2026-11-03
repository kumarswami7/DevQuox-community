import React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
export const PasswordInput = React.forwardRef(
  ({ label = "Password", error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    return <div className="space-y-1 w-full">{label && <label className="block text-[11px] font-bold text-slate-700">{label}</label>}<div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input
      ref={ref}
      type={showPassword ? "text" : "password"}
      autoComplete={props.autoComplete || "current-password"}
      className={`w-full pl-8 pr-9 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${error ? "border-rose-500 focus:ring-1 focus:ring-rose-500/20" : "border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"} ${className}`}
      {...props}
    /><button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
    >{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button></div>{error && <p className="text-[10px] text-rose-500">{error}</p>}</div>;
  }
);
PasswordInput.displayName = "PasswordInput";
