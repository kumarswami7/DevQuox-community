import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchemas";
import { PasswordInput } from "../components/PasswordInput";
import { Button } from "../../../components/ui/Button";
import { Mail, ArrowRight, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../../services/authService";
import { useAuthStore } from "../../../store";
import { PRE_LAUNCH_CONFIG } from "../../../utils/preLaunchConfig";

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

export const LoginPage = () => {
  const navigate = useNavigate();
  const loginUserStore = useAuthStore((state) => state.login);
  const [apiError, setApiError] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const [needsRegistrationUser, setNeedsRegistrationUser] = useState(null);

  // Standard Email/Password login
  const onSubmit = async (data) => {
    setApiError(null);
    setNeedsRegistrationUser(null);
    try {
      const response = await authService.login(data);
      const user = response.data?.data?.user || response.data?.user;
      const token =
        response.data?.data?.token ||
        response.data?.data?.accessToken ||
        response.data?.token ||
        response.data?.accessToken;
      if (user && token) {
        loginUserStore(user, token);
        navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive(user) ? "/pre-launch" : "/dashboard");
        return;
      }
      setApiError("Authentication response missing credentials");
    } catch (err) {
      setApiError(err.response?.data?.message || "Invalid email or password");
    }
  };

  // Real Google Sign-In
  const handleRealGoogleLogin = () => {
    setIsGoogleLoading(true);
    setApiError(null);
    setNeedsRegistrationUser(null);

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "834975556689-jaaj80oo5i0isihhaacgc45u703a1tjk.apps.googleusercontent.com";

    const triggerPopup = () => {
      try {
        if (!window.google?.accounts?.oauth2) {
          throw new Error("Google SDK loading. Please try again.");
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
                  `Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}. (Ensure http://localhost:3000 is in Authorised JavaScript origins)`
                );
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Fetch real profile from Google
                const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userRes.json();

                if (!userInfo.email) {
                  setIsGoogleLoading(false);
                  setApiError("Google did not return a valid email address.");
                  return;
                }

                // Authenticate with backend using intent: 'login'
                try {
                  const backendRes = await authService.googleLogin({
                    email: userInfo.email,
                    name: userInfo.name || userInfo.email.split("@")[0],
                    avatar: userInfo.picture || "",
                    googleId: userInfo.sub
                  });

                  if (backendRes.data?.needsRegistration) {
                    setIsGoogleLoading(false);
                    setNeedsRegistrationUser({
                      email: userInfo.email,
                      name: userInfo.name || userInfo.email.split("@")[0],
                      avatar: userInfo.picture || "",
                      googleId: userInfo.sub
                    });
                    return;
                  }

                  const user = backendRes.data?.user || backendRes.data?.data?.user;
                  const token = backendRes.data?.token || backendRes.data?.data?.token;

                  if (user && token) {
                    loginUserStore(user, token);
                    navigate(PRE_LAUNCH_CONFIG.isPreLaunchActive(user) ? "/pre-launch" : "/dashboard");
                    return;
                  }

                  setIsGoogleLoading(false);
                  setApiError("Session initialization failed.");
                } catch (authErr) {
                  setIsGoogleLoading(false);
                  if (authErr.response?.status === 404 || authErr.response?.data?.needsRegistration) {
                    setNeedsRegistrationUser({
                      email: userInfo.email,
                      name: userInfo.name || userInfo.email.split("@")[0],
                      avatar: userInfo.picture || "",
                      googleId: userInfo.sub
                    });
                  } else {
                    setApiError(authErr.response?.data?.message || "Google Sign-In failed.");
                  }
                }
              } catch (e) {
                console.error("Google user fetch error:", e);
                setIsGoogleLoading(false);
                setApiError("Failed to fetch verified user profile from Google.");
              }
            } else {
              setIsGoogleLoading(false);
            }
          }
        });

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

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-5 sm:p-6 relative overflow-hidden">
        {/* Top Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary-600 via-rose-500 to-red-500" />

        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <img
              src="/devquox-icon.png"
              alt="Devquox Logo"
              className="w-10 h-10 object-contain drop-shadow-xs"
            />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Welcome to Devquox
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Access your talent feed, project pipeline, and developer workspace
          </p>
        </div>

        {needsRegistrationUser ? (
          <div className="mb-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Account Not Found</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-snug">
              No Devquox account exists for <span className="font-semibold underline">{needsRegistrationUser.email}</span>. Please register to create your developer or client workspace.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate("/register", { state: { prefilledGoogleUser: needsRegistrationUser } })}
              className="w-full text-xs font-bold py-1.5 shadow-sm shadow-primary-500/20 cursor-pointer"
            >
              Register with this Google Account
            </Button>
          </div>
        ) : apiError ? (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{apiError}</span>
          </div>
        ) : null}

        {/* Real Google Sign-In Button */}
        <button
          type="button"
          onClick={handleRealGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full mb-3 py-2.5 px-3 rounded-xl border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-800 text-xs font-black flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
              <span className="w-3.5 h-3.5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-[1px] bg-slate-200" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            or sign in with email
          </span>
          <div className="flex-1 h-[1px] bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                autoComplete="username email"
                placeholder="name@example.com"
                {...register("email")}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.email
                    ? "border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-rose-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer font-medium">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="w-3.5 h-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full py-2 text-xs font-bold shadow-md shadow-primary-500/20 gap-1.5 cursor-pointer"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          {/* Create Account Link */}
          <div className="text-center pt-1 text-[11px] text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
