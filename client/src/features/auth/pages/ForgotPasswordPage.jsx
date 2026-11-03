import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../schemas/authSchemas";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import { authService } from "../../../services/authService";
export const ForgotPasswordPage = () => {
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });
  const [serverError, setServerError] = useState("");
  const onSubmit = async (data) => {
    setServerError("");
    try {
      await authService.forgotPassword(data.email);
      setIsSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to process forgot password request.");
    }
  };
  return <Card glass className="p-8 shadow-2xl border-slate-200/80 dark:border-slate-800/80 text-center">{!isSent ? <><div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4"><Mail className="w-6 h-6" /></div><h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Forgot Password?
          </h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
            No worries! Enter your registered email address and we'll send you a password reset link.
          </p><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left"><div className="space-y-1.5"><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input
    type="email"
    placeholder="alex@example.com"
    {...register("email")}
    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
  /></div>{errors.email && <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>}</div><Button
    type="submit"
    variant="primary"
    size="lg"
    isLoading={isSubmitting}
    className="w-full mt-2"
  >
              Send Reset Link
            </Button></form></> : <div className="py-4 space-y-4"><div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto"><CheckCircle2 className="w-6 h-6" /></div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Check Your Email</h2><p className="text-xs text-slate-500 dark:text-slate-400">
            We have sent password reset instructions to your email.
          </p><Link to="/reset-password"><Button variant="outline" size="sm" className="w-full mt-2">
              Proceed to Reset Password
            </Button></Link></div>}<div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800"><Link
    to="/login"
    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
  ><ArrowLeft className="w-4 h-4" /> Back to Login
        </Link></div></Card>;
};
