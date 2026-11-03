import React from "react";
import { motion } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { DevquoxLogo } from "../../../components/ui/DevquoxLogo";

export const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname.includes("/register");

  return (
    <div className="h-screen max-h-screen w-full bg-[#FAFAFC] text-slate-900 flex flex-col justify-between overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Ambient Top Glow & Engineering Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_10%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Compact Top Navigation Bar */}
      <header className="relative z-30 w-full shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-12 py-2.5 sm:py-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <DevquoxLogo size="md" />
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <span className="hidden sm:inline-block text-slate-300">|</span>

            {isRegister ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 hidden xs:inline">Already have an account?</span>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold transition-all shadow-xs"
                >
                  Log In
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 hidden xs:inline">New to Devquox?</span>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-sm shadow-primary-500/20"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Centered Main Stage (Zero Scroll Fit) */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-2 sm:py-4 overflow-y-auto lg:overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full flex justify-center my-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Compact Bottom Footer */}
      <footer className="relative z-20 shrink-0 border-t border-slate-200/80 bg-white/80 backdrop-blur-sm py-2 sm:py-2.5 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL Encrypted • Escrow Protected Marketplace</span>
          </div>

          <div className="flex items-center gap-4 font-semibold text-[11px] text-slate-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">Platform</Link>
            <Link to="/projects" className="hover:text-primary-600 transition-colors">Projects</Link>
            <Link to="/developers" className="hover:text-primary-600 transition-colors">Talent</Link>
            <span>© {new Date().getFullYear()} Devquox Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
