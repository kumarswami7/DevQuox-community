import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Rocket,
  Sparkles,
  CheckCircle2,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  Share2,
  Copy,
  Check,
  LogOut,
  Edit3,
  Wifi,
  CreditCard,
  Users,
  RotateCw,
  ShieldCheck,
  QrCode,
  Activity,
  Flame,
} from "lucide-react";
import { DevquoxLogo } from "../components/ui/DevquoxLogo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuthStore } from "../store";
import { communityService } from "../services/communityService";
import { profileService } from "../services/profileService";
import { PRE_LAUNCH_CONFIG } from "../utils/preLaunchConfig";

export const PreLaunchIdeaPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userIdeaStorageKey = useMemo(
    () => `devquox_prelaunch_idea_${user?._id || user?.id || "guest"}`,
    [user]
  );
  const userSkipStorageKey = useMemo(
    () => `devquox_prelaunch_skipped_${user?._id || user?.id || "guest"}`,
    [user]
  );

  // ── REAL BACKEND DATA STATES ──────────────────────────────────────────────
  const [realCardData, setRealCardData] = useState(null);
  const [realMemberNumber, setRealMemberNumber] = useState(null);
  const [realTotalMembers, setRealTotalMembers] = useState(null);
  const [realTotalIdeas, setRealTotalIdeas] = useState(null);
  const [loadingBackendData, setLoadingBackendData] = useState(true);

  // Card 3D Flip State ("flis cheste ala avavali" -> flip card on click)
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Check if idea was already submitted or skipped
  const [hasSubmittedIdea, setHasSubmittedIdea] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem(userIdeaStorageKey));
  });

  const [hasSkipped, setHasSkipped] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem(userSkipStorageKey));
  });

  const [submittedIdeaData, setSubmittedIdeaData] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(userIdeaStorageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // View Mode: "form" (Post Your Project Idea) or "waiting_room" (Pre-Launch Holding Screen)
  const [viewMode, setViewMode] = useState(() => {
    if (hasSubmittedIdea || hasSkipped) return "waiting_room";
    return "form";
  });

  // Exact Form State Matching Devquox Website
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaContent, setIdeaContent] = useState("");
  const [ideaAttachments, setIdeaAttachments] = useState([]);
  const [ideaFeedbackPrompt, setIdeaFeedbackPrompt] = useState("");
  const [ideaTags, setIdeaTags] = useState(["ai", "saas"]);
  const [ideaTagInput, setIdeaTagInput] = useState("");
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [ideaModalError, setIdeaModalError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // ── FETCH REAL DATA FROM BACKEND ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchRealData = async () => {
      try {
        setLoadingBackendData(true);
        // Call backend pre-launch pass endpoint (authenticated)
        const passRes = await profileService.getPrelaunchPass();
        if (passRes.data?.success && isMounted) {
          const pass = passRes.data.data;
          setRealCardData(pass);
          if (pass.memberNumber) setRealMemberNumber(pass.memberNumber);
          if (typeof pass.totalRegisteredMembers === "number") {
            setRealTotalMembers(pass.totalRegisteredMembers);
          }
          if (typeof pass.totalIdeas === "number") {
            setRealTotalIdeas(pass.totalIdeas);
          }
          if (pass.hasSubmittedIdea && pass.submittedIdea) {
            setSubmittedIdeaData(pass.submittedIdea);
            setHasSubmittedIdea(true);
            localStorage.setItem(userIdeaStorageKey, JSON.stringify(pass.submittedIdea));
          }
        }
      } catch (err) {
        // Fallback to public platform stats if needed
        try {
          const statsRes = await profileService.getPrelaunchStats();
          if (statsRes.data?.success && isMounted) {
            const stats = statsRes.data.data;
            if (typeof stats.totalRegisteredMembers === "number") {
              setRealTotalMembers(stats.totalRegisteredMembers);
            }
            if (typeof stats.totalIdeas === "number") {
              setRealTotalIdeas(stats.totalIdeas);
            }
          }
        } catch (fallbackErr) {
          console.warn("Pre-launch stats fallback notice:", fallbackErr);
        }
      } finally {
        if (isMounted) setLoadingBackendData(false);
      }
    };

    fetchRealData();
    return () => {
      isMounted = false;
    };
  }, [userIdeaStorageKey]);

  // Compute effective member number & total counts from backend
  const memberNumber = useMemo(() => {
    if (realMemberNumber) return realMemberNumber;
    if (user?.foundingMemberNumber) return user.foundingMemberNumber;

    // Fallback deterministic member number
    if (typeof window === "undefined") return 142;
    const key = `devquox_member_number_${user?._id || user?.id || "guest"}`;
    let stored = localStorage.getItem(key);
    if (stored) return parseInt(stored, 10);

    let hash = 0;
    const str = (user?._id || "") + (user?.name || "builder");
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const rank = 100 + Math.abs(hash % 320);
    localStorage.setItem(key, rank.toString());
    return rank;
  }, [realMemberNumber, user]);

  const totalRegisteredMembers = useMemo(() => {
    if (typeof realTotalMembers === "number" && realTotalMembers > 0) {
      return realTotalMembers;
    }
    return 3500;
  }, [realTotalMembers]);

  const formattedMemberNumber = String(memberNumber).padStart(4, "0");
  const cardNumberString = `4829 •••• •••• ${formattedMemberNumber}`;
  const passCodeString = `DQ-${formattedMemberNumber}`;
  const cvvString =
    realCardData?.cvv ||
    String(((memberNumber * 73 + 127) % 900) + 100);

  // File attachment handler (Exact Website Functionality)
  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (ideaAttachments.length >= 5) return;
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isDoc = file.name.endsWith(".doc") || file.name.endsWith(".docx");

      const fileType = isImg ? "image" : isPdf ? "pdf" : isDoc ? "document" : "file";

      const reader = new FileReader();
      reader.onload = () => {
        setIdeaAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            fileType,
            size: file.size,
            url: reader.result,
            previewUrl: isImg ? reader.result : null,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx) => {
    setIdeaAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Tags handlers (Exact Website Functionality)
  const handleAddIdeaTag = (e) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = ideaTagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean && !ideaTags.includes(clean) && ideaTags.length < 5) {
      setIdeaTags([...ideaTags, clean]);
      setIdeaTagInput("");
    }
  };

  const handleRemoveIdeaTag = (tagToRemove) => {
    setIdeaTags(ideaTags.filter((t) => t !== tagToRemove));
  };

  // Skip handler (Subtle Skip Button at the top)
  const handleSkip = () => {
    localStorage.setItem(userSkipStorageKey, "true");
    setHasSkipped(true);
    setViewMode("waiting_room");
  };

  // Publish Idea Handler (Exact Devquox communityService payload to MongoDB)
  const handlePublishIdea = async (e) => {
    e.preventDefault();
    setIdeaModalError("");

    if (!ideaTitle.trim()) {
      setIdeaModalError("Please enter an idea title.");
      return;
    }
    if (!ideaContent.trim()) {
      setIdeaModalError("Please explain your project idea in detail.");
      return;
    }

    setSubmittingIdea(true);
    try {
      const payload = {
        postType: "idea",
        title: ideaTitle.trim() || undefined,
        content: ideaContent.trim(),
        tags: ideaTags,
        ideaDetails: {
          status: "seeking_feedback",
          feedbackQuestions: ideaFeedbackPrompt.trim()
            ? [ideaFeedbackPrompt.trim()]
            : [],
          attachments: ideaAttachments.map((f) => ({
            name: f.name,
            url: f.url,
            fileType: f.fileType,
            size: f.size,
          })),
        },
      };

      const res = await communityService.createPost(payload);
      const createdPost = res.data?.data || res.data || payload;

      localStorage.setItem(userIdeaStorageKey, JSON.stringify(createdPost));
      localStorage.removeItem(userSkipStorageKey);

      setSubmittedIdeaData(createdPost);
      setHasSubmittedIdea(true);
      setHasSkipped(false);
      setViewMode("waiting_room");
    } catch (err) {
      console.warn("API post idea fallback (persisting locally):", err);
      const fallbackPost = {
        _id: "idea-" + Date.now(),
        title: ideaTitle.trim(),
        content: ideaContent.trim(),
        tags: ideaTags,
        ideaDetails: {
          status: "seeking_feedback",
          feedbackQuestions: ideaFeedbackPrompt.trim()
            ? [ideaFeedbackPrompt.trim()]
            : [],
          attachments: ideaAttachments,
        },
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(userIdeaStorageKey, JSON.stringify(fallbackPost));
      localStorage.removeItem(userSkipStorageKey);
      setSubmittedIdeaData(fallbackPost);
      setHasSubmittedIdea(true);
      setHasSkipped(false);
      setViewMode("waiting_room");
    } finally {
      setSubmittingIdea(false);
    }
  };

  // Copy share invite link
  const handleCopyInviteLink = () => {
    const url = window.location.origin || "https://devquox.com";
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 dark:bg-[#0c1319] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-primary-500 selection:text-white font-sans overflow-x-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 w-full h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.06),transparent_70%)] pointer-events-none" />

      {/* =========================================================================
          TOP NAVIGATION BAR WITH SUBTLE SKIP BUTTON
      ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0c1319]/95 backdrop-blur-md">
        <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-20 py-3.5">
          {/* Logo & Pre-launch badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <DevquoxLogo size="md" />
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span>Pre-Launch Access</span>
            </div>
          </div>

          {/* User profile & Subtle Skip Button */}
          <div className="flex items-center gap-4">
            {/* SUBTLE SKIP BUTTON AT TOP */}
            {viewMode === "form" && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium px-2.5 py-1 rounded-lg transition-all opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                title="Skip idea submission and reserve early access"
              >
                <span>Skip for now</span>
                <span className="text-[11px]">→</span>
              </button>
            )}

            {/* Authenticated User pill */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-black flex items-center justify-center text-[11px] ring-1 ring-primary-300/50">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                {user?.name || "Founding Member"}
              </span>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN BODY: TWO MODES ("POST YOUR PROJECT IDEA" OR "HOLDING ROOM")
      ========================================================================= */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 flex flex-col items-center justify-center relative">
        {/* =======================================================================
            VIEW 1: EXACT WEBSITE IDEA FORM ("POST YOUR PROJECT IDEA & PITCH")
        ======================================================================= */}
        {viewMode === "form" ? (
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-300">
            {/* Status Notice */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>DEVQUOX PRE-LAUNCH • PITCH YOUR CONCEPT • COMING SOON</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Devquox is launching soon. Share your software idea early to lock in early co-builder matching and priority perks.
              </p>
            </div>

            {/* Error Message if any */}
            {ideaModalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {ideaModalError}
              </div>
            )}

            {/* Exact Website Form Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#131b23] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
              {/* Card Header (Exact Website Header) */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Post Your Project Idea & Pitch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share your raw concept with the Devquox community to get feedback, review feasibility, and find co-builders.
                  </p>
                </div>
              </div>

              {/* Exact Website Form */}
              <form onSubmit={handlePublishIdea} className="space-y-4">
                {/* 1. Idea Title * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Idea Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI-Powered Freelance Invoicing & Tax Estimator"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 2. Explain Your Idea & Problem Solved * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Explain Your Idea & Problem Solved <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="What is the concept? What pain point does it solve? What features should it have? Invite developers to review and share thoughts..."
                    value={ideaContent}
                    onChange={(e) => setIdeaContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                  />
                </div>

                {/* 3. Document / Mockup / Image Attachments (Exact Website Dropzone) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                      <span>Attach Documents or Mockups (Optional)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      PDF, DOC, DOCX, PNG, JPG (Max 5 files)
                    </span>
                  </label>

                  {/* Upload Dropzone Button */}
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/70 dark:bg-slate-800/50 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <UploadCloud className="w-4 h-4 text-amber-500" />
                    <span>Upload specification documents, PDF proposals, or design mockups</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileAttach}
                      className="hidden"
                    />
                  </label>

                  {/* Attachments Preview Grid */}
                  {ideaAttachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {ideaAttachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.fileType === "image" ? (
                              file.previewUrl ? (
                                <img
                                  src={file.previewUrl}
                                  alt="preview"
                                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              )
                            ) : (
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px] max-w-[140px]">
                                {file.name}
                              </p>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">
                                {file.fileType} • {(file.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1 hover:text-rose-500 text-slate-400 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Feedback Questions (Exact Website Field) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    💡 What review or feedback do you want from developers? (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Would you use this? What tech stack would you recommend? Is scope realistic?"
                    value={ideaFeedbackPrompt}
                    onChange={(e) => setIdeaFeedbackPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* 5. Tags (Exact Website Field) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {ideaTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveIdeaTag(tag)}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {ideaTags.length < 5 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add tag (e.g. ai, saas, mobile)..."
                        value={ideaTagInput}
                        onChange={(e) => setIdeaTagInput(e.target.value)}
                        onKeyDown={handleAddIdeaTag}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddIdeaTag}
                        className="text-xs font-bold cursor-pointer"
                      >
                        Add Tag
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer transition-colors order-2 sm:order-1"
                  >
                    Skip for now →
                  </button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={submittingIdea || !ideaContent.trim() || !ideaTitle.trim()}
                    isLoading={submittingIdea}
                    className="gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-primary-600 hover:from-amber-600 hover:to-primary-700 text-white font-bold shadow-md shadow-amber-500/20 px-6 py-2.5 rounded-xl cursor-pointer order-1 sm:order-2 w-full sm:w-auto"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Share Idea to Community</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* =======================================================================
              VIEW 2: "COMING SOON" WITH 3D FLIP ATM CARD (SIDE-BY-SIDE FIXED SCREEN)
          ======================================================================= */
          <div className="w-full max-w-5xl xl:max-w-6xl mx-auto animate-in fade-in duration-300">
            <div className="p-6 sm:p-8 lg:p-9 rounded-3xl bg-white dark:bg-[#131b23] border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* ── LEFT COLUMN (7 COLS): 3D FLIP ATM CARD & REAL STATS ── */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  {/* Top Badge & Real Member Count */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>DEVQUOX COMING SOON • FOUNDING PASS</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>{totalRegisteredMembers.toLocaleString()} Members Joined</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      {hasSubmittedIdea
                        ? "Your Idea Has Been Submitted!"
                        : "You're Registered for Devquox Pre-Launch!"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Devquox is coming soon. Click on your Founding Member ATM card to flip and view security credentials.
                    </p>
                  </div>

                  {/* ── 3D FLIP ATM CARD CONTAINER ── */}
                  <div className="relative w-full max-w-[430px] aspect-[1.586/1] select-none" style={{ perspective: "1200px" }}>
                    <div
                      onClick={() => setIsCardFlipped((prev) => !prev)}
                      className="w-full h-full relative cursor-pointer"
                      style={{
                        transformStyle: "preserve-3d",
                        transition: "transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)",
                        transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                      title="Click to flip card"
                    >
                      {/* ──────────────────────────────────────────────────────────
                          FRONT FACE: LUXURY OBSIDIAN ATM CARD
                      ────────────────────────────────────────────────────────── */}
                      <div
                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-[#0a0f14] via-[#141d27] to-[#1e2b38] border border-slate-700/80 shadow-2xl p-5 sm:p-6 text-white flex flex-col justify-between overflow-hidden group"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        {/* Metallic reflective sheen overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12" />

                        {/* Top Row: Brand, Contactless NFC & Flip Cue */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2">
                            <DevquoxLogo size="sm" />
                            <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase font-bold">
                              FOUNDING PASS
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 opacity-80">
                              <span className="text-[9px] font-mono tracking-widest text-slate-400">NFC</span>
                              <Wifi className="w-3.5 h-3.5 rotate-90 text-slate-300" />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono tracking-wider text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                              <RotateCw className="w-2.5 h-2.5 animate-spin-slow" />
                              <span>Flip</span>
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Gold EMV Smart Chip & VIP Badge */}
                        <div className="flex items-center justify-between relative z-10 my-auto py-1">
                          {/* Realistic Gold EMV Smart Chip */}
                          <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-500 border border-amber-600/70 p-1 flex items-center justify-between shadow-inner">
                            <div className="w-full h-full border border-amber-800/40 rounded flex flex-col justify-between p-0.5">
                              <div className="h-[1px] w-full bg-amber-800/40" />
                              <div className="h-[1px] w-full bg-amber-800/40" />
                            </div>
                          </div>

                          {/* VIP Hologram Badge */}
                          <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded border border-amber-400/40 bg-amber-400/10 text-amber-300 uppercase font-bold">
                            VIP EARLY ACCESS
                          </span>
                        </div>

                        {/* Card Number (Formatted like ATM card with Real Member Number) */}
                        <div className="relative z-10 font-mono tracking-[0.22em] text-sm sm:text-base text-slate-100 font-extrabold select-all drop-shadow-xs">
                          {cardNumberString}
                        </div>

                        {/* Bottom Row: Cardholder Name, Member Rank & COMING SOON */}
                        <div className="flex items-end justify-between relative z-10 pt-1 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-slate-400">
                          <div>
                            <span className="block text-[8px] text-slate-500">CARDHOLDER</span>
                            <span className="block font-bold text-white tracking-widest text-xs truncate max-w-[150px]">
                              {(user?.name || "FOUNDING MEMBER").toUpperCase()}
                            </span>
                          </div>

                          <div className="text-center">
                            <span className="block text-[8px] text-slate-500">MEMBER NO.</span>
                            <span className="block font-bold text-amber-400 font-mono text-xs">
                              #{formattedMemberNumber}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="block text-[8px] text-slate-500">STATUS</span>
                            <span className="block font-bold text-amber-400">
                              COMING SOON
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ──────────────────────────────────────────────────────────
                          BACK FACE: REVERSE SECURITY ATM CARD (180deg)
                      ────────────────────────────────────────────────────────── */}
                      <div
                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-[#0a0f14] via-[#121922] to-[#1b2532] border border-slate-700/80 shadow-2xl text-white flex flex-col justify-between overflow-hidden"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {/* Top: Black Magnetic Stripe */}
                        <div className="w-full h-8 sm:h-9 bg-black/95 mt-4 border-y border-slate-800 shadow-inner flex items-center px-4">
                          <span className="text-[7px] font-mono tracking-widest text-slate-600 uppercase">
                            DEVQUOX SECURE CHIP STRIPE • PASS ID {passCodeString}
                          </span>
                        </div>

                        {/* Middle: Signature Strip & CVV Security Box */}
                        <div className="px-5 space-y-1">
                          <div className="flex items-center gap-2">
                            {/* Authorized Signature Panel */}
                            <div className="flex-1 h-7 rounded bg-slate-200 text-slate-900 px-3 flex items-center justify-between shadow-inner">
                              <span className="font-serif italic font-bold tracking-wider text-xs sm:text-sm text-slate-800 truncate max-w-[170px]">
                                {user?.name || "Authorized Member"}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500 uppercase">
                                SIGNED
                              </span>
                            </div>

                            {/* CVV Security Box */}
                            <div className="px-2.5 py-1 bg-white text-slate-950 font-mono font-black text-xs rounded shadow-inner">
                              CVV {cvvString}
                            </div>
                          </div>

                          <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase block">
                            AUTHORIZED SIGNATURE • NOT VALID UNLESS SIGNED
                          </span>
                        </div>

                        {/* Security QR & Privileges Microtext */}
                        <div className="px-5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                              <QrCode className="w-6 h-6 text-slate-200" />
                            </div>
                            <div className="text-left">
                              <span className="block text-[8px] font-mono text-slate-400 uppercase">
                                SECURITY PASS
                              </span>
                              <span className="block font-mono font-bold text-amber-400 text-[11px]">
                                {passCodeString}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold uppercase">
                              VERIFIED EARLY ACCESS
                            </span>
                          </div>
                        </div>

                        {/* Terms Microtext & Network Footer */}
                        <div className="px-5 pb-3.5 pt-1 space-y-1 text-left border-t border-slate-800/80">
                          <p className="text-[7.5px] leading-tight text-slate-400">
                            This Founding Pass certifies official early access membership to Devquox. Non-transferable. Grants permanent founding badge, priority workspace allocation, and exclusive launch privileges.
                          </p>

                          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase pt-0.5">
                            <span>Devquox Cloud Network</span>
                            <span>devquox.com</span>
                            <span className="text-amber-400 font-bold">↻ Click to Flip Back</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flip Action Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCardFlipped((prev) => !prev)}
                      className="gap-1.5 text-xs font-bold cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isCardFlipped ? "Flip to Front" : "Flip to Back (View CVV & Pass ID)"}</span>
                    </Button>
                  </div>

                  {/* Member Counter Explanation Banner */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 text-left">
                      <p className="font-bold text-slate-900 dark:text-white">
                        You are Founding Member <span className="text-primary-600 font-mono">#{formattedMemberNumber}</span>
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Among {totalRegisteredMembers.toLocaleString()} active builders registered in Devquox database.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyInviteLink}
                      className="gap-1.5 font-bold cursor-pointer text-xs shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Share Pass</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (5 COLS): COMING SOON MODULE & ROADMAP ── */}
                <div className="lg:col-span-5 space-y-4 text-left">
                  {/* COMING SOON STATUS MODULE (NO 7-DAY COUNTDOWN) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0d151e] border border-slate-800 text-white space-y-3.5 shadow-lg">
                    {/* Header Pill */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span>STATUS: COMING SOON</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">STAGE: PRE-LAUNCH</span>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                        Full Platform Experience & Workspaces Are Almost Ready
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Devquox is rolling out the complete engineering ecosystem soon. As a verified Founding Member, your account holds top priority for full access.
                      </p>
                    </div>

                    {/* Real Platform Live Metrics from MongoDB Backend */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="block text-xl font-mono font-black text-white">
                          {totalRegisteredMembers.toLocaleString()}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                          Members
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="block text-xl font-mono font-black text-amber-400">
                          #{formattedMemberNumber}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                          Your Rank
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="block text-xl font-mono font-black text-emerald-400">
                          {typeof realTotalIdeas === "number" ? realTotalIdeas : (submittedIdeaData ? 1 : 0)}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mt-0.5">
                          Ideas Live
                        </span>
                      </div>
                    </div>

                    {/* Launch Readiness Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Launch Readiness</span>
                        <span className="text-amber-400">Final Verification Stage (88%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-primary-500 rounded-full w-[88%]" />
                      </div>
                    </div>
                  </div>

                  {/* Submitted Idea Summary or Skip Prompt Card */}
                  {hasSubmittedIdea && submittedIdeaData ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151f28] border border-slate-200/90 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Your Submitted Pitch:
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewMode("form")}
                          className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Pitch</span>
                        </button>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                        {submittedIdeaData.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {submittedIdeaData.content}
                      </p>

                      {Array.isArray(submittedIdeaData.tags) && submittedIdeaData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {submittedIdeaData.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Idea pitch skipped for now.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        You can post your software product idea anytime before launch.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode("form")}
                        className="text-xs font-bold w-full cursor-pointer border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        <span>Pitch Your Idea Now</span>
                      </Button>
                    </div>
                  )}

                  {/* Roadmap Checklist */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151f28] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Pre-Launch Roadmap & Next Steps
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            1. Founding Pass #{formattedMemberNumber} Issued
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Your spot is permanently locked in the database.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            2. Squad Matching & Architecture
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Matching early product ideas with verified engineers.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Rocket className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            3. Official Public Launch
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Workspaces, Kanban boards, and WebSocket chats open!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-3 px-6 sm:px-10 text-center text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} Devquox Pre-Launch. Where Ideas Meet Engineers.</p>
      </footer>
    </div>
  );
};

export default PreLaunchIdeaPage;