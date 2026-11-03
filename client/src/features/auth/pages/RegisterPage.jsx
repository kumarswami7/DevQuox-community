import React, { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Building2,
  AlertCircle,
  Check,
  Sparkles,
  Zap,
  Briefcase
} from "lucide-react";
import { authService } from "../../../services/authService";
import { profileService } from "../../../services/profileService";
import { useAuthStore } from "../../../store";
import { PasswordStrength } from "../components/PasswordStrength";
import { PRE_LAUNCH_CONFIG } from "../../../utils/preLaunchConfig";
import { CollegeSelector } from "../../../components/education/CollegeSelector";

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const DEV_SKILL_OPTIONS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "Next.js",
  "MongoDB",
  "AI / LLMs",
  "TailwindCSS"
];

const EXPERIENCE_LEVELS = ["Junior (1-2y)", "Mid (3-5y)", "Senior (5-8y)", "Lead (8y+)"];
const BUDGET_OPTIONS = ["< $5,000", "$5k - $15k", "$15k - $40k", "$40k+"];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginUserStore = useAuthStore((state) => state.login);

  // If user navigated from Login page with an already pre-verified Google account
  const initialGoogleUser = location.state?.prefilledGoogleUser || null;

  const [step, setStep] = useState(initialGoogleUser ? 2 : 1);
  const [apiError, setApiError] = useState(null);
  const [existingAccountError, setExistingAccountError] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  // Real Google-verified user state or email credentials
  const [googleVerifiedUser, setGoogleVerifiedUser] = useState(initialGoogleUser);
  const [emailCredentials, setEmailCredentials] = useState(null);

  // Profile preferences
  const [selectedSkills, setSelectedSkills] = useState(["React", "Node.js", "TypeScript"]);
  const [expLevel, setExpLevel] = useState("Senior (5-8y)");
  const [budgetRange, setBudgetRange] = useState("$5k - $15k");
  const [selectedCollege, setSelectedCollege] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      role: "developer",
      fullName: initialGoogleUser?.name || "",
      email: initialGoogleUser?.email || "",
      password: "",
      title: "",
      about: "",
      skills: "React, Node.js, TypeScript"
    }
  });

  const selectedRole = useWatch({ control, name: "role" });
  const watchPassword = watch("password");

  const toggleSkill = (skill) => {
    let updated;
    if (selectedSkills.includes(skill)) {
      updated = selectedSkills.filter((s) => s !== skill);
    } else {
      updated = [...selectedSkills, skill];
    }
    setSelectedSkills(updated);
    setValue("skills", updated.join(", "));
  };

  // Check if account already exists with this Google account before proceeding to step 2
  const handleGoogleSuccessVerification = async (profile) => {
    setIsGoogleLoading(true);
    setApiError(null);
    setExistingAccountError(null);

    try {
      // Check backend to see if account already exists
      const checkRes = await authService.googleCheck({
        email: profile.email,
        googleId: profile.googleId
      });

      if (checkRes.data?.exists) {
        setIsGoogleLoading(false);
        setExistingAccountError({
          email: profile.email,
          message: "An account already exists with this Google email. Please sign in instead."
        });
        return;
      }

      // Email is verified and is a new user! Advance to Step 2 to collect remaining data
      setGoogleVerifiedUser(profile);
      setEmailCredentials(null);
      setValue("fullName", profile.name);
      setValue(
        "title",
        selectedRole === "developer"
          ? "Full Stack & AI Engineer"
          : "Project Founder & Technical Lead"
      );
      setIsGoogleLoading(false);
      setStep(2);
    } catch (err) {
      console.error("Google check error:", err);
      // If check fails due to network, still allow setting up profile
      setGoogleVerifiedUser(profile);
      setEmailCredentials(null);
      setValue("fullName", profile.name);
      setIsGoogleLoading(false);
      setStep(2);
    }
  };

  // Real Google OAuth Handler using Google Identity Services tokenClient
  const handleRealGoogleVerify = () => {
    setIsGoogleLoading(true);
    setApiError(null);
    setExistingAccountError(null);

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "834975556689-jaaj80oo5i0isihhaacgc45u703a1tjk.apps.googleusercontent.com";

    const triggerPopup = () => {
      try {
        if (!window.google?.accounts?.oauth2) {
          throw new Error("Google SDK loading. Please check your internet connection.");
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setIsGoogleLoading(false);
              if (tokenResponse.error === "popup_closed_by_user") {
                setApiError("Google Sign-In popup was closed.");
              } else {
                setApiError(
                  `Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}. (Tip: Add http://localhost:3000 in Authorised JavaScript origins)`
                );
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Fetch verified profile from Google
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`
                  }
                });

                if (!userInfoRes.ok) {
                  throw new Error("Could not retrieve Google profile.");
                }

                const googleUser = await userInfoRes.json();
                if (!googleUser.email) {
                  setIsGoogleLoading(false);
                  setApiError("Google account did not return a valid email address.");
                  return;
                }

                const verifiedProfile = {
                  name: googleUser.name || googleUser.email.split("@")[0],
                  email: googleUser.email,
                  avatar: googleUser.picture || "",
                  googleId: googleUser.sub,
                  isVerified: googleUser.email_verified ?? true,
                  accessToken: tokenResponse.access_token
                };

                await handleGoogleSuccessVerification(verifiedProfile);
              } catch (fetchErr) {
                console.error("Google user fetch error:", fetchErr);
                setIsGoogleLoading(false);
                setApiError("Failed to fetch verified user details from Google.");
              }
            } else {
              setIsGoogleLoading(false);
            }
          }
        });

        // Open native Google Account Chooser
        client.requestAccessToken({ prompt: "select_account" });
      } catch (err) {
        setIsGoogleLoading(false);
        setApiError(err.message || "Failed to initialize Google Sign-In.");
      }
    };

    if (!window.google?.accounts?.oauth2) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => triggerPopup();
      script.onerror = () => {
        setIsGoogleLoading(false);
        setApiError("Unable to load Google Identity SDK.");
      };
      document.head.appendChild(script);
    } else {
      triggerPopup();
    }
  };

  // Step 1: Fallback Email & Password Form Handler
  const onStep1EmailSubmit = (data) => {
    setApiError(null);
    setExistingAccountError(null);

    if (!data.fullName || !data.email || !data.password) {
      setApiError("Please fill in your name, email, and password.");
      return;
    }
    if (data.password.length < 6) {
      setApiError("Password must be at least 6 characters.");
      return;
    }

    setEmailCredentials({
      name: data.fullName,
      email: data.email,
      password: data.password
    });
    setGoogleVerifiedUser(null);
    setStep(2); // Advance to profile customization
  };

  // Step 2: Final Submission of remaining profile data to backend
  const onFinalSubmit = async (data) => {
    setApiError(null);
    try {
      let user = null;
      let token = null;

      if (googleVerifiedUser) {
        // Authenticate via Google Register intent
        const payload = {
          name: data.fullName || googleVerifiedUser.name,
          email: googleVerifiedUser.email,
          googleId: googleVerifiedUser.googleId,
          avatar: googleVerifiedUser.avatar,
          role: selectedRole,
          title:
            data.title ||
            (selectedRole === "developer" ? "Software Developer" : "Project Founder"),
          headline: data.title,
          about: data.about || "",
          skills: selectedSkills.length > 0 ? selectedSkills : ["React", "Node.js"],
          experienceLevel: expLevel.toLowerCase().split(" ")[0],
          college: selectedCollege?.college || null,
          collegeName: selectedCollege?.collegeName || selectedCollege?.name || "",
          collegeCountry: selectedCollege?.collegeCountry || selectedCollege?.country || "",
          collegeCity: selectedCollege?.collegeCity || selectedCollege?.city || "",
          collegeLogoUrl: selectedCollege?.collegeLogoUrl || "",
          collegeLogoSource: selectedCollege?.collegeLogoSource || "favicon",
          collegeInitials: selectedCollege?.collegeInitials || "",
          collegeWebsite: selectedCollege?.collegeWebsite || "",
          isVerifiedCollege: Boolean(selectedCollege?.isVerifiedCollege),
        };

        const response = await authService.googleRegister(payload);
        user = response.data?.user || response.data?.data?.user;
        token = response.data?.token || response.data?.data?.token;
      } else if (emailCredentials) {
        // Authenticate via Standard Registration
        const registerPayload = {
          name: data.fullName || emailCredentials.name,
          email: emailCredentials.email,
          password: emailCredentials.password,
          role: selectedRole,
          title:
            data.title ||
            (selectedRole === "developer" ? "Software Developer" : "Project Founder"),
          headline: data.title,
          about: data.about || "",
          skills: selectedSkills.length > 0 ? selectedSkills : ["React", "Node.js"],
          experienceLevel: expLevel.toLowerCase().split(" ")[0],
          college: selectedCollege?.college || null,
          collegeName: selectedCollege?.collegeName || selectedCollege?.name || "",
          collegeCountry: selectedCollege?.collegeCountry || selectedCollege?.country || "",
          collegeCity: selectedCollege?.collegeCity || selectedCollege?.city || "",
          collegeLogoUrl: selectedCollege?.collegeLogoUrl || "",
          collegeLogoSource: selectedCollege?.collegeLogoSource || "favicon",
          collegeInitials: selectedCollege?.collegeInitials || "",
          collegeWebsite: selectedCollege?.collegeWebsite || "",
          isVerifiedCollege: Boolean(selectedCollege?.isVerifiedCollege),
        };

        const response = await authService.register(registerPayload);
        user = response.data?.user || response.data?.data?.user;
        token = response.data?.token || response.data?.data?.token;
      } else {
        setApiError("Please verify your Google email first.");
        setStep(1);
        return;
      }

      if (user && token) {
        loginUserStore(user, token);

        // Sync companion profile in backend
        profileService
          .updateProfile({
            title: data.title || user.title,
            about: data.about || "",
            skills: selectedSkills,
            contactEmail: user.email
          })
          .catch(() => {});

        // Direct real-time workspace entry or pre-launch holding room
        navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive(user) ? "/pre-launch" : "/dashboard");
        return;
      }

      setApiError("Session initialization failed.");
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.accountExists) {
        setExistingAccountError({
          email: googleVerifiedUser?.email || emailCredentials?.email,
          message: "An account with this email already exists. Please log in."
        });
      } else {
        setApiError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-5 sm:p-6 relative overflow-hidden">
        {/* Top Brand Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary-600 via-rose-500 to-red-500" />

        {/* Existing Account Notice Banner */}
        {existingAccountError && (
          <div className="mb-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Account Already Exists</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-snug">
              An account for <span className="font-semibold underline">{existingAccountError.email}</span> already exists. Please log in to your account.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate("/login")}
              className="w-full text-xs font-bold py-1.5 shadow-sm shadow-primary-500/20 cursor-pointer"
            >
              Go to Sign In
            </Button>
          </div>
        )}

        {/* Global Error Banner */}
        {apiError && !existingAccountError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{apiError}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: FIRST, CONTINUE WITH GOOGLE BUTTON (Email Verify)
           ======================================================== */}
        {step === 1 && (
          <div className="space-y-4 text-center">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex justify-center mb-1">
                <img
                  src="/devquox-icon.png"
                  alt="Devquox Logo"
                  className="w-10 h-10 object-contain drop-shadow-xs"
                />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Create Your Devquox Account
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Step 1: Verify your Google email to begin setting up your profile
              </p>
            </div>

            {/* Prominent Real Google Verification Button */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleRealGoogleVerify}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-800 text-sm font-black flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                    <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying with Google...</span>
                  </div>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <span>🔒 Real-Time Google OAuth</span>
                <span>•</span>
                <span>Instant Email Verification</span>
              </div>
            </div>

            {/* Expandable Fallback: Email/Password Registration */}
            <div className="pt-2 border-t border-slate-100">
              {!showEmailFallback ? (
                <button
                  type="button"
                  onClick={() => setShowEmailFallback(true)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                >
                  Or register with standard email address →
                </button>
              ) : (
                <form onSubmit={handleSubmit(onStep1EmailSubmit)} className="space-y-2.5 pt-2 text-left">
                  <div className="space-y-0.5">
                    <label className="block text-[11px] font-bold text-slate-700">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        {...register("fullName")}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-[11px] font-bold text-slate-700">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        {...register("email")}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-[11px] font-bold text-slate-700">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        {...register("password")}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    {watchPassword && watchPassword.length > 0 && (
                      <PasswordStrength password={watchPassword} />
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full py-2 text-xs font-bold shadow-md shadow-primary-500/20 gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Profile Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}
            </div>

            {/* Already have an account */}
            <div className="pt-2 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: REMAINING DATA (Shown AFTER Google Email is Verified)
           ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-3.5">
            {/* Top Bar with Step Indicator */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Change Email</span>
              </button>

              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Step 2 of 2 • Profile Details
              </span>
            </div>

            {/* Verified Email Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {googleVerifiedUser?.avatar ? (
                  <img
                    src={googleVerifiedUser.avatar}
                    alt="Google Profile"
                    className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs">
                    {(googleVerifiedUser?.name || emailCredentials?.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>{googleVerifiedUser?.name || emailCredentials?.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {googleVerifiedUser?.email || emailCredentials?.email}
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                Email Verified
              </span>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">I want to join as *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue("role", "developer")}
                  className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedRole === "developer"
                      ? "border-primary-600 bg-primary-50/50 shadow-xs ring-1 ring-primary-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        selectedRole === "developer"
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </div>
                    {selectedRole === "developer" && (
                      <span className="w-2 h-2 rounded-full bg-primary-600" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">Developer</p>
                  <p className="text-[9px] text-slate-500">Build & Earn</p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("role", "client")}
                  className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedRole === "client"
                      ? "border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        selectedRole === "client"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    {selectedRole === "client" && (
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">Client / Founder</p>
                  <p className="text-[9px] text-slate-500">Hire & Post Specs</p>
                </button>
              </div>
            </div>

            {/* Full Name & Headline / Company */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-0.5">
                <label className="block text-[11px] font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    {...register("fullName", { required: "Name is required" })}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  {selectedRole === "developer" ? "Professional Headline *" : "Company Name *"}
                </label>
                <div className="relative">
                  {selectedRole === "developer" ? (
                    <Code2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  )}
                  <input
                    type="text"
                    placeholder={
                      selectedRole === "developer"
                        ? "e.g. Full Stack & AI Architect"
                        : "e.g. Nexus Technology Labs"
                    }
                    {...register("title")}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Experience Level / Budget */}
            {selectedRole === "developer" ? (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Experience Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExpLevel(lvl)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        expLevel === lvl
                          ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Project Budget Range</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BUDGET_OPTIONS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudgetRange(b)}
                      className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        budgetRange === b
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Core Tech Stack */}
            {selectedRole === "developer" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Core Tech Stack</span>
                  <span className="text-[10px] text-slate-400">Click to toggle</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEV_SKILL_OPTIONS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-primary-50 text-primary-700 border border-primary-200 font-bold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-primary-600" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <label className="block text-[11px] font-bold text-slate-700">Technologies Needed</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, AI/LLMs, AWS Cloud"
                  {...register("skills")}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none"
                />
              </div>
            )}

            {/* Bio */}
            <div className="space-y-0.5">
              <label className="block text-[11px] font-bold text-slate-700">
                {selectedRole === "developer" ? "Bio / Specialties" : "Project Vision"}
              </label>
              <textarea
                rows={2}
                placeholder={
                  selectedRole === "developer"
                    ? "Briefly describe your engineering background..."
                    : "Describe the software product you plan to build on Devquox..."
                }
                {...register("about")}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none resize-none"
              />
            </div>

            {/* Worldwide College & Academic Affiliation (Optional) */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">College / University (Optional)</span>
                <span className="text-[10px] text-slate-400">Worldwide directory</span>
              </div>
              <CollegeSelector
                value={selectedCollege}
                onChange={(col) => setSelectedCollege(col)}
                placeholder="Search college, engineering, medical or university..."
              />
            </div>

            {/* Submit Action */}
            <div className="pt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                className="w-1/3 py-2 text-xs font-bold border-slate-300 cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-2/3 py-2 text-xs font-bold shadow-md shadow-primary-500/20 gap-1.5 cursor-pointer"
              >
                <span>Complete Profile & Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
