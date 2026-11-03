import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../schemas/authSchemas";
import { PasswordInput } from "../components/PasswordInput";
import { PasswordStrength } from "../components/PasswordStrength";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../../services/authService";
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [emailInput, setEmailInput] = useState(searchParams.get("email") || "");
  const [tokenInput, setTokenInput] = useState(searchParams.get("token") || "");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });
  const passwordValue = useWatch({ control, name: "password" }) || "";
  const onSubmit = async (data) => {
    setServerError("");
    setSuccessMsg("");
    if (!emailInput) {
      setServerError("Please enter your account email address.");
      return;
    }
    try {
      await authService.resetPassword({
        email: emailInput,
        token: tokenInput || undefined,
        password: data.password
      });
      setSuccessMsg("Password successfully reset! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to reset password.");
    }
  };
  return <Card glass className="p-8 shadow-2xl border-slate-200/80 dark:border-slate-800/80 text-center"><div className="w-12 h-12 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center mx-auto mb-4"><KeyRound className="w-6 h-6" /></div><h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
        Reset Password
      </h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
        Set your new password to regain access to your developer workspace.
      </p><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">{serverError && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">{serverError}</div>}{successMsg && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50">{successMsg}</div>}<div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Account Email Address
          </label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input
    type="email"
    value={emailInput}
    onChange={(e) => setEmailInput(e.target.value)}
    placeholder="Enter your registered account email..."
    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
  /></div></div><PasswordInput
    label="New Password"
    placeholder="••••••••"
    {...register("password")}
    error={errors.password?.message}
  /><PasswordStrength password={passwordValue} /><PasswordInput
    label="Confirm New Password"
    placeholder="••••••••"
    {...register("confirmPassword")}
    error={errors.confirmPassword?.message}
  /><Button
    type="submit"
    variant="primary"
    size="lg"
    isLoading={isSubmitting}
    className="w-full mt-2"
  >
          Reset Password
        </Button></form><div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800"><Link
    to="/login"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
  ><ArrowLeft className="w-4 h-4" /> Back to Login
        </Link></div></Card>;
};
