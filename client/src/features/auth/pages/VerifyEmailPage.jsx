import { useState, useEffect } from "react";
import { OTPInput } from "../components/OTPInput";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { MailCheck, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PRE_LAUNCH_CONFIG } from "../../../utils/preLaunchConfig";
export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1e3);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);
  const handleVerify = () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive() ? "/pre-launch" : "/dashboard");
    }, 1e3);
  };
  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
  };
  return <Card glass className="p-8 shadow-2xl border-slate-200/80 dark:border-slate-800/80 text-center"><div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4"><MailCheck className="w-6 h-6" /></div><h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
        Email Verification
      </h2><p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
        We sent a 6-digit code to <span className="font-semibold text-slate-800 dark:text-slate-200">alex@example.com</span>. Enter it below to verify.
      </p>{
    /* 6-Digit Box Input */
  }<OTPInput value={otp} onChange={setOtp} length={6} /><Button
    onClick={handleVerify}
    variant="primary"
    size="lg"
    disabled={otp.length < 6}
    isLoading={isLoading}
    className="w-full mt-4"
  >
        Verify Email
      </Button>{
    /* Resend & Countdown Timer */
  }<div className="flex items-center justify-between mt-6 text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800"><button
    type="button"
    onClick={handleResend}
    disabled={!canResend}
    className={`flex items-center gap-1.5 font-semibold transition-colors ${canResend ? "text-primary-500 hover:text-primary-600 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}
  ><RefreshCw className="w-3.5 h-3.5" /><span>Resend Code</span></button><span>{canResend ? "Ready to resend" : `Resend in ${timer}s`}</span></div><div className="mt-4"><Link to="/register" className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Change Email Address
        </Link></div></Card>;
};
