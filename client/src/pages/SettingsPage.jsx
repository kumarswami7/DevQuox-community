import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store";
import { profileService } from "../services/profileService";
import { authService } from "../services/authService";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  Globe,
  Bell,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  ExternalLink,
  Plus,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  MapPin,
  Clock,
  Laptop,
} from "lucide-react";

const TIMEZONES = [
  "UTC (Coordinated Universal Time)",
  "America/New_York (EST / EDT - UTC-5)",
  "America/Chicago (CST / CDT - UTC-6)",
  "America/Denver (MST / MDT - UTC-7)",
  "America/Los_Angeles (PST / PDT - UTC-8)",
  "Europe/London (GMT / BST - UTC+0)",
  "Europe/Berlin (CET / CEST - UTC+1)",
  "Asia/Dubai (GST - UTC+4)",
  "Asia/Kolkata (IST - UTC+5:30)",
  "Asia/Singapore (SGT - UTC+8)",
  "Asia/Tokyo (JST - UTC+9)",
  "Australia/Sydney (AEST / AEDT - UTC+10)",
];

const PREFERRED_PROJECT_OPTIONS = [
  { id: "fixed_price", label: "Fixed-Price Contracts" },
  { id: "hourly", label: "Hourly Engagements" },
  { id: "open_source", label: "Open-Source Contributions" },
];

const OPEN_TO_OPTIONS = [
  { id: "full_time", label: "Full-Time Roles" },
  { id: "freelance", label: "Freelance & Gigs" },
  { id: "contract", label: "Contract Engagements" },
  { id: "open_source", label: "Open Source Collaboration" },
];

export const SettingsPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const updateUserStore = useAuthStore((s) => s.updateUser);
  const logoutUser = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Profile State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [languages, setLanguages] = useState(["English"]);
  const [newLanguageInput, setNewLanguageInput] = useState("");

  // 2. Work Preferences State
  const [availability, setAvailability] = useState("available");
  const [openTo, setOpenTo] = useState(["full_time", "freelance"]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [preferredProjectTypes, setPreferredProjectTypes] = useState([
    "fixed_price",
    "hourly",
  ]);

  // 3. Social Links State
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  // 4. Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailAlerts: true,
    projectUpdates: true,
    directMessages: true,
    applicationAlerts: true,
    communityMentions: true,
    marketingNewsletter: false,
  });

  // 5. Security & Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // 6. Danger Zone State
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);

  // Clear banners after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Load User Data from MongoDB
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadUserData = async () => {
      try {
        const res = await profileService.getMyUser();
        const user = res.data?.user || res.data?.data?.user || currentUser;

        if (user && isMounted) {
          setName(user.name || "");
          setUsername(user.username || "");
          setEmail(user.email || "");
          setAvatarUrl(user.avatar || user.avatarUrl || "");
          setHeadline(user.headline || "");
          setBio(user.bio || "");
          setLocation(user.location || "");
          setTimezone(user.timezone || "");
          setLanguages(
            Array.isArray(user.languages) && user.languages.length > 0
              ? user.languages
              : ["English"]
          );

          setAvailability(user.availability || "available");
          setOpenTo(
            Array.isArray(user.openTo) && user.openTo.length > 0
              ? user.openTo
              : ["full_time", "freelance"]
          );
          setHourlyRate(Number(user.hourlyRate) || 0);
          setExperienceLevel(user.experienceLevel || "mid");
          setSkills(Array.isArray(user.skills) ? user.skills : []);
          setPreferredProjectTypes(
            Array.isArray(user.preferredProjectTypes)
              ? user.preferredProjectTypes
              : ["fixed_price", "hourly"]
          );

          setGithubUrl(user.githubUrl || "");
          setLinkedinUrl(user.linkedinUrl || "");
          setWebsiteUrl(user.websiteUrl || "");
          setTwitterUrl(user.twitterUrl || "");

          if (user.notificationPreferences) {
            setNotificationPreferences((prev) => ({
              ...prev,
              ...user.notificationPreferences,
            }));
          }
        }
      } catch (err) {
        console.warn("[SettingsPage] Error fetching user data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save General Profile / Work / Social / Notifications
  const handleSaveSettings = async (overrideData = null) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validate Username
      if (username) {
        const unameRegex = /^[a-z0-9_]{3,30}$/;
        if (!unameRegex.test(username.toLowerCase())) {
          throw new Error(
            "Username must be 3-30 characters long and can only contain letters, numbers, and underscores."
          );
        }
      }

      const payload = overrideData || {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        avatar: avatarUrl.trim(),
        avatarUrl: avatarUrl.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        timezone,
        languages,
        availability,
        openTo,
        hourlyRate: Math.max(0, Number(hourlyRate) || 0),
        experienceLevel,
        skills,
        preferredProjectTypes,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        notificationPreferences,
      };

      const res = await profileService.updateMyUser(payload);
      const updatedUser = res.data?.user || res.data?.data || payload;

      updateUserStore(updatedUser);
      setSuccessMessage("Your settings have been saved successfully!");
    } catch (err) {
      console.error("[SettingsPage] Update error:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // Skill Add / Remove
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    if (skills.length >= 25) {
      setErrorMessage("Maximum 25 skills allowed.");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Language Add / Remove
  const handleAddLanguage = (e) => {
    e?.preventDefault();
    const trimmed = newLanguageInput.trim();
    if (!trimmed) return;
    if (languages.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setNewLanguageInput("");
      return;
    }
    setLanguages((prev) => [...prev, trimmed]);
    setNewLanguageInput("");
  };

  const handleRemoveLanguage = (langToRemove) => {
    setLanguages((prev) => prev.filter((l) => l !== langToRemove));
  };

  // Toggle helpers for Open To & Project Types
  const toggleOpenTo = (typeId) => {
    setOpenTo((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleProjectType = (typeId) => {
    setPreferredProjectTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setSuccessMessage("Password changed successfully! Keep it secure.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Deactivate Account
  const handleDeactivateAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to deactivate your account? Your profile will be hidden from the developer directory."
      )
    ) {
      return;
    }

    setDeactivatingAccount(true);
    try {
      await profileService.deactivateAccount();
      alert("Account deactivated. You are now being signed out.");
      logoutUser();
      navigate("/login");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to deactivate account."
      );
      setDeactivatingAccount(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      setErrorMessage('Please type "DELETE" to confirm permanent deletion.');
      return;
    }

    setDeletingAccount(true);
    try {
      await profileService.deleteAccount({ password: deletePassword });
      alert("Your account has been deleted. We are sorry to see you go.");
      logoutUser();
      navigate("/register");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to delete account."
      );
      setDeletingAccount(false);
    }
  };

  const navTabs = [
    { id: "profile", label: "Profile & Identity", icon: User },
    { id: "work", label: "Work & Availability", icon: Briefcase },
    { id: "social", label: "Social & Portfolio Links", icon: Globe },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell },
    { id: "security", label: "Security & Password", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold tracking-wide">
          Loading your account settings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Account Settings</span>
            <Badge variant="primary" className="text-[10px] uppercase font-bold">
              {currentUser?.role || "Developer"}
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, work availability, notification alerts, and security credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Profile</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="gap-1.5 shadow-glow-primary"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Save All Changes</span>
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2.5 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Body: Left Navigation Tabs & Right Content Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tab Selector Nav */}
        <div className="md:col-span-1 space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? tab.danger
                      ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900"
                      : "bg-primary-500 text-white shadow-sm shadow-primary-500/25"
                    : tab.danger
                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3">
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === "profile" && (
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-cardDark/80 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your identity details, avatar, and headline shown to recruiters and peers.
                </p>
              </div>

              {/* Avatar Row */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <Avatar
                  src={avatarUrl}
                  name={name || "User"}
                  size="xl"
                  className="ring-2 ring-primary-500/30"
                />
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary-500" />
                    <span>Profile Photo URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Direct HTTPS link to your profile picture or GitHub avatar.
                  </p>
                </div>
              </div>

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your legal or display name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    3-30 chars, letters, numbers, and underscores only.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or London, UK"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Professional Headline
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {headline.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior MERN Architect | React Specialist | Open Source Enthusiast"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Biography */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Biography / About You
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {bio.length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients and developers about your background, key achievements, and what excites you..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 resize-none leading-relaxed"
                />
              </div>

              {/* Timezone & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span>Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select your timezone</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Languages Spoken
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add language..."
                      value={newLanguageInput}
                      onChange={(e) => setNewLanguageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLanguage();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddLanguage}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(lang)}
                          className="hover:text-rose-500 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="gap-1.5 shadow-glow-primary"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile Info</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: WORK & AVAILABILITY */}
          {activeTab === "work" && (
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-cardDark/80 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Work & Availability Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control your availability status in the talent directory, rates, and desired engagements.
                </p>
              </div>

              {/* Availability Status Radio Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Current Availability Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "available",
                      label: "🟢 Available for Work",
                      desc: "Actively looking for projects and team positions.",
                    },
                    {
                      id: "open_to_offers",
                      label: "🟡 Open to Offers",
                      desc: "Considering exceptional opportunities or part-time gigs.",
                    },
                    {
                      id: "busy",
                      label: "🟠 In Sprint / Busy",
                      desc: "Currently focused on active client contracts.",
                    },
                    {
                      id: "not_available",
                      label: "🔴 Not Available",
                      desc: "Temporarily unavailable for new invitations.",
                    },
                  ].map((status) => (
                    <label
                      key={status.id}
                      onClick={() => setAvailability(status.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        availability === status.id
                          ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{status.label}</span>
                        <input
                          type="radio"
                          name="availability"
                          checked={availability === status.id}
                          onChange={() => setAvailability(status.id)}
                          className="accent-primary-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {status.desc}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hourly Rate & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Hourly Rate (USD $/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="e.g. 65"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Set 0 for negotiable or contract-only pricing.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Seniority / Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="entry">Entry-Level (0 - 1 years)</option>
                    <option value="junior">Junior Engineer (1 - 2 years)</option>
                    <option value="mid">Mid-Level Engineer (2 - 5 years)</option>
                    <option value="senior">Senior Engineer (5 - 8 years)</option>
                    <option value="lead">Lead / Architect (8+ years)</option>
                  </select>
                </div>
              </div>

              {/* Skills Tag Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Core Technical Skills & Stack ({skills.length}/25)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Press Enter or click Add
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. React, Node.js, GraphQL, PostgreSQL..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddSkill}
                    className="gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 min-h-[50px]">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/60 shadow-xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-500"
                          title="Remove skill"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">
                      No skills added yet. Add your top frameworks and languages.
                    </span>
                  )}
                </div>
              </div>

              {/* Open To & Preferred Project Types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Open to Work Types
                  </label>
                  <div className="space-y-1.5">
                    {OPEN_TO_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={openTo.includes(opt.id)}
                          onChange={() => toggleOpenTo(opt.id)}
                          className="rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Preferred Contract Structures
                  </label>
                  <div className="space-y-1.5">
                    {PREFERRED_PROJECT_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={preferredProjectTypes.includes(opt.id)}
                          onChange={() => toggleProjectType(opt.id)}
                          className="rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="gap-1.5 shadow-glow-primary"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Work Preferences</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL & PORTFOLIO LINKS */}
          {activeTab === "social" && (
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-cardDark/80 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Social & Portfolio Profiles
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect your developer profiles and showcase repositories to boost credibility.
                </p>
              </div>

              <div className="space-y-4">
                {/* GitHub */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                      <span>GitHub Profile URL</span>
                    </label>
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* LinkedIn */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>LinkedIn Profile URL</span>
                    </label>
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Portfolio / Personal Website */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Personal Portfolio or Agency Website</span>
                    </label>
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourname.dev"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Twitter / X */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-sky-500" />
                      <span>Twitter / X Handle or Profile</span>
                    </label>
                    {twitterUrl && (
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Visit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="gap-1.5 shadow-glow-primary"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Social Links</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & ALERTS */}
          {activeTab === "notifications" && (
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-cardDark/80 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select which platform alerts, invitations, and direct messaging emails you wish to receive.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  {
                    key: "directMessages",
                    title: "Real-Time Direct Messages",
                    desc: "Notify you when team members or clients send direct chat messages.",
                  },
                  {
                    key: "projectUpdates",
                    title: "Project Milestone & Workspace Updates",
                    desc: "Get notified of task completions, milestone reviews, and repository commits.",
                  },
                  {
                    key: "applicationAlerts",
                    title: "Proposal & Application Status Alerts",
                    desc: "Instant updates when your application is accepted, reviewed, or shortlisted.",
                  },
                  {
                    key: "communityMentions",
                    title: "Community Mentions & Post Replies",
                    desc: "Alerts when someone comments on your knowledge posts or mentions your handle.",
                  },
                  {
                    key: "emailAlerts",
                    title: "Email Digest Notifications",
                    desc: "Forward high-priority project invites and contract notices to your email.",
                  },
                  {
                    key: "marketingNewsletter",
                    title: "Platform News & Tech Highlights",
                    desc: "Weekly curated DevConnect articles, new AI tools, and developer features.",
                  },
                ].map((item, idx) => {
                  const isChecked = Boolean(notificationPreferences[item.key]);
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between gap-4 ${
                        idx > 0 ? "pt-4" : ""
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        onClick={() =>
                          setNotificationPreferences((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            isChecked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="gap-1.5 shadow-glow-primary"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Notification Preferences</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-cardDark/80 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Security & Authentication
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your account password and review device authentication sessions.
                </p>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current account password"
                      className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={changingPassword}
                    className="gap-1.5 shadow-glow-primary"
                  >
                    {changingPassword ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>Update Password</span>
                  </Button>
                </div>
              </form>

              {/* Active Session & Two-Factor Information */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Authentication & Active Sessions
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Current Active Session</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-600">
                          Online
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        JWT Token Authentication with automatic refresh encryption.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logoutUser();
                      navigate("/login");
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 glass-card space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Danger Zone</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actions here can pause your account or delete all profile information permanently.
                </p>
              </div>

              {/* Deactivate Account */}
              <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Deactivate Account
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Temporarily hide your profile from search, discovery, and invitations. You can reactivate anytime by logging back in.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeactivateAccount}
                  disabled={deactivatingAccount}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0"
                >
                  {deactivatingAccount ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Deactivate"
                  )}
                </Button>
              </div>

              {/* Delete Account Permanently */}
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-rose-600">
                    Delete Account Permanently
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Once deleted, all your active applications, messages, and profile information will be permanently removed. This action cannot be undone.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Type <span className="font-mono text-rose-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />

                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1 block">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password for verification"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={
                      deleteConfirmationText.trim().toUpperCase() !== "DELETE" ||
                      deletingAccount
                    }
                    className="gap-1.5"
                  >
                    {deletingAccount ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>Permanently Delete Account</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

