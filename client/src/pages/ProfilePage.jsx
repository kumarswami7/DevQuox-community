import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Star,
  Mail,
  CheckCircle2,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  X,
  Check,
  Upload,
  LogOut,
  Sparkles,
  Activity,
  Github,
  Linkedin,
  ExternalLink,
  Code2,
  Briefcase,
  Building2,
  Globe,
  DollarSign,
  Users,
  ShieldCheck,
  Clock,
  Layers,
  Award,
  BookOpen,
  FolderGit2,
  MessageSquare,
  UserPlus,
  UserCheck,
  Bookmark,
  BookmarkCheck,
  Send,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Rocket,
  Lightbulb,
  BarChart2,
  Eye,
  Share2,
  FileText,
  Repeat2,
  Target,
  GraduationCap,
  Heart,
  TrendingUp,
  Camera,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { BannerPickerModal, BANNER_PRESETS } from "../components/profile/BannerPickerModal";
import { EditCompanyModal } from "../components/profile/EditCompanyModal";
import { ContactInfoModal } from "../components/profile/ContactInfoModal";
import { CompanyLogoBadge } from "../components/company/CompanySelector";
import { TechnologyIcon } from "../components/skills/TechnologyIcon";
import { SkillSelector } from "../components/skills/SkillSelector";
import { normalizeSkillKey } from "../constants/skillRegistry";
import { EditDeveloperModal } from "../components/profile/EditDeveloperModal";
import { OpenToWorkModal } from "../components/profile/OpenToWorkModal";
import { AddSectionModal } from "../components/profile/AddSectionModal";
import { EnhanceProfileModal } from "../components/profile/EnhanceProfileModal";
import {
  ProfileHistorySection,
  ProfileActivityTimeline,
  ProfileRecentHistoryPreview,
} from "../components/profile/ProfileHistorySection";
import {
  EducationCertificationsSection,
  EducationCertificationsPreview,
} from "../components/profile/EducationCertificationsSection";
import {
  WorkExperienceSection,
  WorkExperiencePreview,
} from "../components/profile/WorkExperienceSection";
import { ShareModal } from "../components/ui/ShareModal";
import { profileService } from "../services/profileService";
import { projectService } from "../services/projectService";
import { communityService } from "../services/communityService";
import { apiClient } from "../services/apiClient";
import { discoveryService } from "../services/discoveryService";
import { chatService } from "../services/chatService";
import { useAuthStore } from "../store";

export const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const logoutUser = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isEditDevOpen, setIsEditDevOpen] = useState(false);
  const [isOpenToWorkOpen, setIsOpenToWorkOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEnhanceProfileOpen, setIsEnhanceProfileOpen] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);

  // Visitor interaction state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  // Avatar upload loading
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Banner fit mode: 'cover' (fills container) or 'contain' (full uncropped image)
  const [bannerFit, setBannerFit] = useState(
    () => localStorage.getItem("devconnect_banner_fit") || "cover"
  );

  // More options dropdown state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Quick inline edit state
  const [editingSection, setEditingSection] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [newTech, setNewTech] = useState("");

  // Client project listings
  const [clientProjects, setClientProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("all");

  // Comprehensive User History: Projects, Community Pitches/Posts, and Applications
  const [userProjects, setUserProjects] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [postsAnalytics, setPostsAnalytics] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [shareModalConfig, setShareModalConfig] = useState({
    isOpen: false,
    url: "",
    title: "",
    description: "",
    type: "project",
  });

  const handleOpenShare = ({ title, description, url, type = "project" }) => {
    setShareModalConfig({
      isOpen: true,
      url: url || window.location.href,
      title: title || "Devquox Creator Item",
      description: description || "",
      type: type || "project",
    });
  };

  // Determine user identities
  const profileUser = profile?.user || (id ? null : currentUser);
  const profileUserId = profileUser?._id || profileUser?.id;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwnProfile = !id || (currentUserId && String(profileUserId) === String(currentUserId));
  const isClient = (profileUser?.role || (!id && currentUser?.role)) === "client";
  const isClientViewer = currentUser?.role === "client";

  // Fetch comprehensive projects, posts/ideas, and applications history
  useEffect(() => {
    const fetchUserHistory = async () => {
      const targetId = profileUserId || (isOwnProfile ? currentUserId : null);
      if (!targetId) return;
      setHistoryLoading(true);

      try {
        const projPromise = isOwnProfile
          ? projectService.getMyProjects()
          : projectService.getAllProjects({ owner: targetId });

        const postPromise = isOwnProfile
          ? communityService.getMyHistory()
          : apiClient.get("/community/posts", { params: { author: targetId } });

        const appPromise = isOwnProfile
          ? projectService.getMyApplications().catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] });

        const [projRes, postRes, appRes] = await Promise.allSettled([
          projPromise,
          postPromise,
          appPromise,
        ]);

        if (projRes.status === "fulfilled") {
          const pData = projRes.value?.data?.data || projRes.value?.data?.projects || projRes.value?.data || [];
          const pList = Array.isArray(pData) ? pData : [];
          setUserProjects(pList);
          setClientProjects(pList);
        }

        if (postRes.status === "fulfilled") {
          const rawPosts = postRes.value?.data?.data?.posts || postRes.value?.data?.posts || postRes.value?.data || [];
          const pList = Array.isArray(rawPosts) ? rawPosts : [];
          setUserPosts(pList);
          if (postRes.value?.data?.data?.stats) {
            setPostsAnalytics(postRes.value.data.data.stats);
          }
        }

        if (appRes.status === "fulfilled") {
          const rawApps = appRes.value?.data?.data || appRes.value?.data?.applications || appRes.value?.data || [];
          const aList = Array.isArray(rawApps) ? rawApps : [];
          setUserApplications(aList);
        }
      } catch (err) {
        console.warn("Failed to load user history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchUserHistory();
  }, [profileUserId, currentUserId, isOwnProfile]);

  // Fetch client's own open projects for the Invite Modal (if visitor is a client viewing a developer)
  const [myOpenProjects, setMyOpenProjects] = useState([]);
  useEffect(() => {
    if (!isOwnProfile && isClientViewer && !isClient) {
      projectService
        .getMyProjects()
        .then((res) => {
          const projs = res.data?.data || res.data || [];
          setMyOpenProjects(projs.filter((p) => p.status === "open" || !p.status));
          if (projs.length > 0) setInviteProjectId(projs[0]._id || projs[0].id);
        })
        .catch(() => setMyOpenProjects([]));
    }
  }, [isOwnProfile, isClientViewer, isClient]);

  // Fetch user profile from backend
  const fetchProfile = async () => {
    if (!id && (!isAuthenticated || !token)) {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setProfile({
        user: currentUser,
        title: currentUser?.headline || (currentUser?.role === "client" ? "Founder & Project Owner" : "Software Developer"),
        companyName: currentUser?.companyName || "",
        about: currentUser?.bio || "",
        skills: currentUser?.skills || [],
        techStack: [],
        experience: [],
        education: [],
        portfolio: [],
        openSource: [],
        reviews: [],
        certifications: [],
        bannerImage: BANNER_PRESETS[0].imageUrl
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const response = id
        ? await profileService.getProfileById(id)
        : await profileService.getCurrentProfile();
      if (response.data) {
        setProfile(response.data.data || response.data);
      }
    } catch (err) {
      console.warn("Profile fetch error:", err?.message || err);
      if (err?.response?.status === 404) {
        setFetchError("Profile not found. The user may not have registered or may have deactivated their account.");
      } else if (err?.response?.status === 401 && currentUser) {
        setProfile({
          user: currentUser,
          title: currentUser?.headline || (currentUser?.role === "client" ? "Founder & Project Owner" : "Software Developer"),
          companyName: currentUser?.companyName || "",
          about: currentUser?.bio || "",
          skills: currentUser?.skills || [],
          techStack: [],
          experience: [],
          education: [],
          portfolio: [],
          openSource: [],
          reviews: [],
          certifications: [],
          bannerImage: BANNER_PRESETS[0].imageUrl
        });
      } else {
        setFetchError("Unable to load profile. Please verify your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, isAuthenticated, token, currentUser]);

  // Sync state & backend for full/partial updates
  const syncUpdateToBackend = async (updatedFields) => {
    try {
      const res = await profileService.updateProfile(updatedFields);
      if (res.data) {
        setProfile(res.data.data || res.data);
      }
    } catch (err) {
      console.error("Error updating profile in backend:", err);
    }
  };

  // Profile completeness calculations
  const completeness = useMemo(() => {
    if (!profile) return { score: 0, missingSteps: [] };
    let score = 0;
    const missingSteps = [];

    if (isClient) {
      if (profile.companyName || profile.user?.companyName) score += 20;
      else missingSteps.push({ label: "Add company name", action: () => setIsEditCompanyOpen(true) });

      if (profile.about || profile.user?.bio) score += 20;
      else missingSteps.push({ label: "Add company mission & summary", action: () => setIsEditCompanyOpen(true) });

      if (profile.industry && profile.companySize) score += 20;
      else missingSteps.push({ label: "Set industry & company size", action: () => setIsEditCompanyOpen(true) });

      if (profile.hiringNeeds && profile.hiringNeeds.length > 0) score += 20;
      else missingSteps.push({ label: "List roles currently seeking", action: () => setIsEditCompanyOpen(true) });

      if (clientProjects && clientProjects.length > 0) score += 20;
      else missingSteps.push({ label: "Post your first project listing", link: "/projects/create" });
    } else {
      if (profile.title || profile.user?.headline) score += 20;
      else missingSteps.push({ label: "Add professional headline", action: () => setIsEditDevOpen(true) });

      if (profile.about || profile.user?.bio) score += 20;
      else missingSteps.push({ label: "Add technical bio & about", action: () => setIsEditDevOpen(true) });

      if (profile.skills && profile.skills.length > 0) score += 20;
      else missingSteps.push({ label: "Add core technical skills", action: () => setIsEditingSkills(true) });

      if (profile.portfolio && profile.portfolio.length > 0) score += 15;
      else missingSteps.push({ label: "Add showcase project", action: () => { setActiveTab("portfolio"); setEditingSection("addPortfolio"); } });

      if (profile.experience && profile.experience.length > 0) score += 15;
      else missingSteps.push({ label: "Add work experience", action: () => { setActiveTab("experience"); setEditingSection("addExperience"); } });

      if (profile.education && profile.education.length > 0) score += 10;
      else missingSteps.push({ label: "Add education credential", action: () => { setActiveTab("education"); setEditingSection("addEducation"); } });
    }

    return { score: Math.min(100, score), missingSteps };
  }, [profile, isClient, clientProjects]);

  const currentCompany = useMemo(() => {
    if (isClient) return profile?.companyName ? { company: profile.companyName } : null;
    if (profile?.experience && profile.experience.length > 0) {
      const active = profile.experience.find((e) => e.isCurrent);
      return active || profile.experience[0];
    }
    if (profile?.companyName) return { company: profile.companyName };
    return null;
  }, [profile, isClient]);

  const currentEducation = useMemo(() => {
    if (profile?.education && profile.education.length > 0) {
      return profile.education[0];
    }
    if (profile?.institution || profileUser?.institution) {
      return { institution: profile.institution || profileUser?.institution };
    }
    return null;
  }, [profile, profileUser]);

  // Modal Save Handlers
  const handleSaveModalData = (data) => {
    let updatedEducation = profile?.education || [];
    if (data.institution) {
      if (updatedEducation.length > 0) {
        updatedEducation = [
          {
            ...updatedEducation[0],
            institution: data.institution,
            university: data.university || updatedEducation[0]?.university,
            universityCountry: data.universityCountry || updatedEducation[0]?.universityCountry,
            universityLogoUrl: data.universityLogoUrl || updatedEducation[0]?.universityLogoUrl,
            universityDomain: data.universityDomain || updatedEducation[0]?.universityDomain,
            isVerifiedUniversity:
              data.isVerifiedUniversity !== undefined
                ? Boolean(data.isVerifiedUniversity)
                : updatedEducation[0]?.isVerifiedUniversity,
          },
          ...updatedEducation.slice(1)
        ];
      } else {
        updatedEducation = [
          {
            institution: data.institution,
            university: data.university || null,
            universityCountry: data.universityCountry || "",
            universityLogoUrl: data.universityLogoUrl || "",
            universityDomain: data.universityDomain || "",
            isVerifiedUniversity: Boolean(data.isVerifiedUniversity),
            degree: "Undergraduate / CSE",
            year: ""
          }
        ];
      }
    }

    const payload = {
      ...data,
      ...(data.institution && { education: updatedEducation })
    };

    setProfile((prev) => ({
      ...prev,
      ...payload,
      user: {
        ...prev.user,
        name: data.name || prev.user?.name,
        companyName: data.companyName || prev.user?.companyName,
        headline: data.title || prev.user?.headline,
        bio: data.about || prev.user?.bio,
        location: data.location || prev.user?.location
      }
    }));
    syncUpdateToBackend(payload);
  };

  const handleSelectSectionFromModal = (tabId, actionId) => {
    setActiveTab(tabId);
    if (actionId === "editSkills") {
      setIsEditingSkills(true);
    } else if (actionId) {
      setEditingSection(actionId);
    }
  };

  const handleApplyEnhancements = (enhancedData) => {
    setProfile((prev) => ({
      ...prev,
      ...enhancedData,
      user: {
        ...prev.user,
        headline: enhancedData.title,
        bio: enhancedData.about
      }
    }));
    syncUpdateToBackend(enhancedData);
  };

  // Real file upload to /api/v1/upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Image must be under 8MB");
        return;
      }
      setIsAvatarUploading(true);
      try {
        const uploadRes = await profileService.uploadImage(file);
        const newAvatarUrl = uploadRes?.url;
        if (newAvatarUrl) {
          setProfile((prev) => ({ ...prev, avatar: newAvatarUrl, avatarUrl: newAvatarUrl }));
          syncUpdateToBackend({ avatar: newAvatarUrl, avatarUrl: newAvatarUrl });
        }
      } catch (err) {
        console.warn("Server avatar upload fallback to local preview", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const fallbackUrl = reader.result;
          setProfile((prev) => ({ ...prev, avatar: fallbackUrl, avatarUrl: fallbackUrl }));
          syncUpdateToBackend({ avatar: fallbackUrl, avatarUrl: fallbackUrl });
        };
        reader.readAsDataURL(file);
      } finally {
        setIsAvatarUploading(false);
      }
    }
  };

  const handleSelectBanner = (bannerVal) => {
    setProfile((prev) => ({ ...prev, bannerImage: bannerVal }));
    syncUpdateToBackend({ bannerImage: bannerVal });
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // Visitor action handlers
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      if (profileUserId) {
        await discoveryService.followUser(profileUserId);
        setIsFollowing((prev) => !prev);
        setProfile((prev) => ({
          ...prev,
          followersCount: isFollowing ? Math.max(0, (prev.followersCount || 1) - 1) : (prev.followersCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error("Follow action error:", err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      if (profileUserId) {
        await discoveryService.toggleBookmark(profileUserId);
        setIsBookmarked((prev) => !prev);
      }
    } catch (err) {
      console.error("Bookmark action error:", err);
    }
  };

  const handleStartDirectMessage = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsMessageLoading(true);
    try {
      if (profileUserId) {
        const convRes = await chatService.getDirectConversation(profileUserId);
        const conv = convRes.data?.data || convRes.data;
        const convId = conv?._id || conv?.id;
        if (convId) {
          navigate(`/chat?conversation=${convId}`);
          return;
        }
      }
      navigate(`/chat?user=${encodeURIComponent(profileUser?.name || profileUserId)}`);
    } catch {
      navigate(`/chat?user=${encodeURIComponent(profileUser?.name || profileUserId)}`);
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleSendProjectInvite = (e) => {
    e.preventDefault();
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setIsInviteModalOpen(false);
      navigate(`/chat?user=${encodeURIComponent(profileUser?.name || profileUserId)}&invite=true`);
    }, 900);
  };

  // Skill management
  const handleAddSkill = (skillToAdd) => {
    const raw = typeof skillToAdd === "string" ? skillToAdd : newSkill;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const currentSkills = profile?.skills || [];
    const isDuplicate = currentSkills.some(
      (s) => normalizeSkillKey(s) === normalizeSkillKey(trimmed)
    );
    if (!isDuplicate) {
      const updatedSkills = [...currentSkills, trimmed];
      setProfile((prev) => ({ ...prev, skills: updatedSkills }));
      syncUpdateToBackend({ skills: updatedSkills });
    }
    setNewSkill("");
  };

  const handleDeleteSkill = (skillToDelete) => {
    const targetKey = normalizeSkillKey(skillToDelete);
    const updatedSkills = (profile?.skills || []).filter(
      (s) => normalizeSkillKey(s) !== targetKey
    );
    setProfile((prev) => ({ ...prev, skills: updatedSkills }));
    syncUpdateToBackend({ skills: updatedSkills });
  };

  const handleAddTech = (techToAdd) => {
    const raw = typeof techToAdd === "string" ? techToAdd : newTech;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const currentTech = profile?.techStack || [];
    const isDuplicate = currentTech.some(
      (t) => normalizeSkillKey(t) === normalizeSkillKey(trimmed)
    );
    if (!isDuplicate) {
      const updatedTech = [...currentTech, trimmed];
      setProfile((prev) => ({ ...prev, techStack: updatedTech }));
      syncUpdateToBackend({ techStack: updatedTech });
    }
    setNewTech("");
  };

  const handleDeleteTech = (techToDelete) => {
    const targetKey = normalizeSkillKey(techToDelete);
    const updatedTech = (profile?.techStack || []).filter(
      (t) => normalizeSkillKey(t) !== targetKey
    );
    setProfile((prev) => ({ ...prev, techStack: updatedTech }));
    syncUpdateToBackend({ techStack: updatedTech });
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-4 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 h-64 rounded-2xl w-full" />
        <div className="p-6 bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-32 h-32 rounded-full bg-slate-300 dark:bg-slate-700 -mt-20 border-4 border-white dark:border-cardDark" />
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError || !profile) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Profile Unavailable</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {fetchError || "The requested profile could not be loaded."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const bannerSource =
    profile?.bannerImage &&
    typeof profile.bannerImage === "string" &&
    profile.bannerImage !== "/banners/minimalist_desk.jpg" &&
    (profile.bannerImage.startsWith("/") ||
      profile.bannerImage.startsWith("http://") ||
      profile.bannerImage.startsWith("https://") ||
      profile.bannerImage.startsWith("data:image"))
      ? profile.bannerImage
      : BANNER_PRESETS[0].imageUrl;

  const filteredClientProjects = clientProjects.filter((p) => {
    if (projectFilter === "all") return true;
    if (projectFilter === "open") return p.status === "open" || !p.status;
    if (projectFilter === "in_progress") return p.status === "in_progress";
    if (projectFilter === "completed") return p.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER CARD (LinkedIn-Inspired Professional Design)               */}
      {/* ========================================================================= */}
      <Card className="p-0 overflow-hidden relative border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-cardDark rounded-2xl">
        {/* Banner (Cover Image) - Crisp Pro LinkedIn Aspect Ratio */}
        <div className="h-52 sm:h-60 md:h-68 lg:h-72 w-full relative overflow-hidden bg-slate-900 rounded-t-2xl border-b border-slate-200/80 dark:border-slate-800">
          <img
            src={bannerSource}
            alt={profile.companyName || profileUser?.name || "Profile Cover Banner"}
            className="w-full h-full object-cover object-[center_35%] select-none"
            onError={(e) => {
              e.currentTarget.src = BANNER_PRESETS[0].imageUrl;
            }}
          />

          {/* Subtle Top & Bottom Gradient for Button Contrast & Clean Separation */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />

          {/* Banner Edit Button (Inside banner, top-right) */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(true)}
              className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 z-10 hover:shadow-lg hover:scale-[1.02]"
              title="Edit cover photo"
              aria-label="Edit cover photo"
            >
              <Camera className="w-3.5 h-3.5 text-slate-700" />
              <span>Edit Banner</span>
            </button>
          )}
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative bg-white dark:bg-cardDark">
          {/* Top Row: Avatar overlapping banner (left) + Institutional Affiliations & Edit Button (right) */}
          <div className="flex items-end justify-between -mt-16 sm:-mt-20 md:-mt-24 mb-2">
            {/* Circular Profile Avatar */}
            <div className="relative shrink-0 z-20">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full border-4 sm:border-[5px] border-white dark:border-cardDark shadow-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                {profile.avatar || profile.avatarUrl || profileUser?.avatar ? (
                  <img
                    src={profile.avatar || profile.avatarUrl || profileUser?.avatar}
                    alt={profileUser?.name || profile.name || "User Avatar"}
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-3xl sm:text-4xl md:text-5xl flex items-center justify-center select-none">
                    {(profileUser?.name || profile.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload / Camera Button on Avatar */}
              {isOwnProfile && (
                <label
                  className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 z-30 hover:scale-105"
                  title="Update profile picture"
                  aria-label="Update profile picture"
                >
                  {isAvatarUploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary-600 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isAvatarUploading}
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            {/* Top-Right: Affiliations Stack & Edit Intro Button */}
            <div className="flex items-center gap-3 pb-2 z-10">
              {/* Institutional Affiliations Stack (Current Company & University) */}
              <div className="hidden sm:flex items-center gap-2.5">
                {currentCompany && (
                  <div
                    onClick={() => setActiveTab("experience")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer group bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                  >
                    <CompanyLogoBadge
                      name={currentCompany.company || currentCompany}
                      domain={currentCompany.domain}
                      logoUrl={currentCompany.logoUrl}
                      className="w-5 h-5 rounded-md shrink-0"
                      size="sm"
                    />
                    <span className="truncate max-w-[130px] font-bold group-hover:underline" title={currentCompany.company || currentCompany}>
                      {currentCompany.company || currentCompany}
                    </span>
                  </div>
                )}

                {currentEducation && (
                  <div
                    onClick={() => setActiveTab("education")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer group bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                  >
                    <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {currentEducation.logoUrl ? (
                        <img
                          src={currentEducation.logoUrl}
                          alt={currentEducation.institution}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <GraduationCap className="w-3 h-3 text-primary-600 shrink-0" />
                      )}
                    </div>
                    <span className="truncate max-w-[130px] font-bold group-hover:underline" title={currentEducation.institution}>
                      {currentEducation.institution}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Intro Pencil Button */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => (isClient ? setIsEditCompanyOpen(true) : setIsEditDevOpen(true))}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 shadow-2xs"
                  title="Edit intro & professional details"
                  aria-label="Edit intro & professional details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Main Profile Info Row: Left Info + Right Affiliations (Company & School) */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-1">
            {/* Left: Identity, Headline, Category, Location, Metadata */}
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Full Name & Verification */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                  {profileUser?.name || profile.name || "Member"}
                </h1>

                {(profileUser?.isVerified || profile.isVerified) && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60"
                    title="Verified DevConnect Account"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                    <span>Verified</span>
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {isClient ? "Client / Founder" : (profileUser?.role || "Developer")}
                </span>
              </div>

              {/* Username */}
              {profileUser?.username && (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  @{profileUser.username}
                </p>
              )}

              {/* Professional Role / Headline */}
              <p className="text-base sm:text-lg md:text-xl font-normal text-slate-800 dark:text-slate-200 leading-snug pt-1 break-words">
                {profile.title || profileUser?.headline || (isClient ? "Project Owner & Founder" : "Full Stack & AI Software Engineer")}
              </p>

              {/* Developer Category / Specialization Pill */}
              {(profile.category || profile.developerCategory) && (
                <div className="pt-0.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-900/40">
                    {profile.category || profile.developerCategory}
                  </span>
                </div>
              )}

              {/* Location & Contact Info */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-1.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.location || "Remote / Flexible"}</span>
                </span>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <button
                  type="button"
                  onClick={() => setIsContactInfoOpen(true)}
                  className="text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer"
                >
                  Contact info
                </button>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <strong className="text-slate-900 dark:text-white font-bold">{profile.followersCount || 0}</strong> followers
                </span>

                {!isClient && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${profile.hourlyRate || 50}/hr
                    </span>
                  </>
                )}

                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-bold text-amber-500 inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{profile.rating || 5.0} ({profile.reviews?.length || 0} reviews)</span>
                </span>
              </div>
            </div>

            {/* Mobile-Only Affiliations Stack (Visible only on xs screens, desktop has it in the top row) */}
            {(currentCompany || currentEducation) && (
              <div className="flex sm:hidden flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {currentCompany && (
                  <div
                    onClick={() => setActiveTab("experience")}
                    className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer group"
                  >
                    <CompanyLogoBadge
                      name={currentCompany.company || currentCompany}
                      domain={currentCompany.domain}
                      logoUrl={currentCompany.logoUrl}
                      className="w-7 h-7 rounded-lg shrink-0 shadow-2xs border border-slate-200 dark:border-slate-700"
                      size="sm"
                    />
                    <span className="truncate max-w-[200px] font-bold group-hover:underline" title={currentCompany.company || currentCompany}>
                      {currentCompany.company || currentCompany}
                    </span>
                  </div>
                )}

                {currentEducation && (
                  <div
                    onClick={() => setActiveTab("education")}
                    className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {currentEducation.logoUrl ? (
                        <img
                          src={currentEducation.logoUrl}
                          alt={currentEducation.institution}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <GraduationCap className="w-4 h-4 text-primary-600 shrink-0" />
                      )}
                    </div>
                    <span className="truncate max-w-[200px] font-bold group-hover:underline" title={currentEducation.institution}>
                      {currentEducation.institution}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2.5 flex-wrap pt-4">
            {isOwnProfile ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsOpenToWorkOpen(true)}
                  className="rounded-full px-4 py-2 text-xs font-bold shadow-xs cursor-pointer gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isClient ? "Hiring Preferences" : "Open to Work"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddSectionOpen(true)}
                  className="rounded-full px-4 py-2 text-xs font-bold border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 shadow-xs cursor-pointer gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEnhanceProfileOpen(true)}
                  className="rounded-full px-4 py-2 text-xs font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Enhance Profile</span>
                </Button>

                <div className="relative" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="More Options"
                    aria-label="More Options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-11 w-56 bg-white dark:bg-cardDark rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in duration-150">
                      <button
                        onClick={() => {
                          handleOpenShare({
                            title: `${profileUser?.name}'s DevConnect Profile`,
                            description: profile.about || profile.title,
                            url: window.location.href,
                            type: "profile"
                          });
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-primary-600" />
                        <span>Share Profile via Link</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Profile URL copied to clipboard!");
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Copy Public Link</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("activity");
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Activity & Analytics</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "primary"}
                  onClick={handleToggleFollow}
                  className="rounded-full px-5 py-2 text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                >
                  {isFollowing ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartDirectMessage}
                  disabled={isMessageLoading}
                  className="rounded-full px-5 py-2 text-xs font-bold gap-1.5 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 shadow-xs cursor-pointer"
                >
                  {isMessageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>Message</span>
                </Button>

                {isClientViewer && !isClient && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="rounded-full px-4 py-2 text-xs font-bold gap-1.5 shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Invite to Project</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={isBookmarked ? "primary" : "outline"}
                  onClick={handleToggleBookmark}
                  className="rounded-full px-3.5 py-2 text-xs font-bold gap-1.5 cursor-pointer"
                  title={isBookmarked ? "Saved to Bookmarks" : "Save Profile"}
                >
                  {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                </Button>

                <button
                  type="button"
                  onClick={() => handleOpenShare({
                    title: `${profileUser?.name}'s DevConnect Profile`,
                    description: profile.about || profile.title,
                    url: window.location.href,
                    type: "profile"
                  })}
                  className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Status Box: Open to Work OR Hiring Talent (LinkedIn Standard Card) */}
          {((isClient && (profile.hiringNeeds?.length > 0 || isOwnProfile)) ||
            (!isClient && (profile.availability !== "not_available" || isOwnProfile))) && (
            <div className="mt-4 p-4 rounded-xl border border-sky-100 dark:border-sky-950/60 bg-sky-50/50 dark:bg-sky-950/20 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{isClient ? "Hiring talent · Active client projects" : "Open to work · Available for opportunities"}</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {isClient
                      ? (profile.hiringNeeds && profile.hiringNeeds.length > 0
                          ? `Roles: ${profile.hiringNeeds.join(", ")}`
                          : "Looking for top engineers to build scoped software products")
                      : (profile.preferredRoles && profile.preferredRoles.length > 0
                          ? `${profile.preferredRoles.join(", ")} roles`
                          : `${profile.title || "Software engineering"} roles`)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {[
                      profile.location,
                      profile.workplaces && profile.workplaces.length > 0
                        ? profile.workplaces.join(", ")
                        : null,
                      profile.openTo && profile.openTo.length > 0
                        ? profile.openTo.map((t) => t.replace("_", " ")).join(", ")
                        : null
                    ].filter(Boolean).join(" · ") || "Remote / Flexible"}
                  </p>
                  {isOwnProfile && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => setIsOpenToWorkOpen(true)}
                        className="text-primary-600 dark:text-primary-400 font-bold text-xs hover:underline cursor-pointer"
                      >
                        See all details & update preferences
                      </button>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsOpenToWorkOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Status Preferences"
                  >
                    <Pencil className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Navigation Tab Bar (LinkedIn Standard 10 Tabs) */}
        <div className="flex overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-6 scrollbar-none bg-slate-50/50 dark:bg-slate-900/30">
          {(isClient
            ? [
                { id: "overview", label: "Company Overview", icon: Building2 },
                {
                  id: "history",
                  label: `Projects & Pitches (${userProjects.length + userPosts.length + (isOwnProfile ? userApplications.length : 0)})`,
                  icon: Briefcase,
                },
                { id: "hiring", label: "Hiring Needs & Terms", icon: Users },
                { id: "about", label: "About Company", icon: Layers },
                { id: "activity", label: "Timeline & Activity", icon: Activity },
              ]
            : [
                { id: "overview", label: "Overview", icon: Layers },
                {
                  id: "history",
                  label: `Posts & Projects History (${userProjects.length + userPosts.length + (isOwnProfile ? userApplications.length : 0)})`,
                  icon: Rocket,
                },
                { id: "about", label: "About", icon: Layers },
                {
                  id: "skills",
                  label: `Skills & Tools (${(profile.skills?.length || 0) + (profile.techStack?.length || 0)})`,
                  icon: Code2,
                },
                { id: "portfolio", label: `Portfolio (${profile.portfolio?.length || 0})`, icon: FolderGit2 },
                { id: "experience", label: `Experience (${profile.experience?.length || 0})`, icon: Briefcase },
                {
                  id: "education",
                  label: `Education & Certifications (${(profile.education?.length || 0) + (profile.certifications?.length || 0)})`,
                  icon: GraduationCap,
                },
                { id: "opensource", label: `Open Source (${profile.openSource?.length || 0})`, icon: Github },
                { id: "achievements", label: "Achievements", icon: Award },
                { id: "reviews", label: `Reviews (${profile.reviews?.length || 0})`, icon: MessageSquare },
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === "history" && activeTab === "projects");
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "border-primary-600 text-primary-600 dark:text-primary-400 bg-white dark:bg-cardDark shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. PROFILE COMPLETENESS WIDGET (Owner Only, Genuine Calculation)          */}
      {/* ========================================================================= */}
      {isOwnProfile && completeness.score < 100 && (
        <Card className="p-4 sm:p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-slate-900 dark:text-white">
                Profile Completeness: <strong className="text-primary-600">{completeness.score}%</strong>
              </span>
            </div>
            <span className="text-slate-400 font-medium text-[11px]">
              {completeness.score >= 80 ? "Almost complete" : "Improve your visibility to recruiters"}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness.score}%` }}
            />
          </div>

          {completeness.missingSteps.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested actions:</span>
              {completeness.missingSteps.map((step, idx) => (
                step.link ? (
                  <Link
                    key={idx}
                    to={step.link}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-colors"
                  >
                    + {step.label}
                  </Link>
                ) : (
                  <button
                    key={idx}
                    onClick={step.action}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-colors cursor-pointer"
                  >
                    + {step.label}
                  </button>
                )
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. CLIENT-SPECIFIC TAB VIEWS                                              */}
      {/* ========================================================================= */}
      {isClient && (
        <>
          {/* 3A. Client Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Company & Mission */}
                <Card className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-500" />
                      About {profile.companyName || "the Company"} & Mission
                    </h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditCompanyOpen(true)}
                        className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                  {profile.about ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {profile.about}
                    </p>
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <p className="text-xs text-slate-400">No company description or mission added yet.</p>
                      {isOwnProfile && (
                        <Button size="sm" variant="outline" onClick={() => setIsEditCompanyOpen(true)} className="cursor-pointer">
                          + Add Company Overview & Mission
                        </Button>
                      )}
                    </div>
                  )}
                </Card>

                {/* Active Project Openings Preview */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary-500" />
                        Active Project Openings ({clientProjects?.length || 0})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Live milestone-backed software specs open for developer applications.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("projects")}
                      className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>

                  {clientProjects && clientProjects.length > 0 ? (
                    <div className="space-y-3">
                      {clientProjects.slice(0, 3).map((proj) => (
                        <div
                          key={proj._id || proj.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 hover:border-primary-500/40 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                              {proj.title}
                            </h4>
                            <Badge variant={proj.status === "completed" ? "success" : "primary"} className="text-[10px] uppercase font-bold shrink-0">
                              {proj.status || "open"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {proj.category || (proj.projectType === "collaboration" ? "Community Project" : "Developer Squad")}
                            </span>
                            <Link
                              to={isOwnProfile ? `/projects/${proj._id || proj.id}/workspace` : `/projects/${proj._id || proj.id}`}
                              className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>{isOwnProfile ? "Workspace" : "View Details"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-400">No project listings posted yet.</p>
                      {isOwnProfile && (
                        <Link to="/projects/create">
                          <Button size="sm" variant="primary" className="font-bold cursor-pointer">
                            + Post Your First Project
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </Card>

                {/* Roles Currently Hiring */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-500" />
                      Roles Currently Seeking
                    </h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditCompanyOpen(true)}
                        className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                      >
                        + Manage Roles
                      </button>
                    )}
                  </div>
                  {profile.hiringNeeds && profile.hiringNeeds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.hiringNeeds.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-900/50 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                          <span>{role}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific roles listed yet.</p>
                  )}
                </Card>
              </div>

              {/* Right Column (Sidebar) */}
              <div className="space-y-6">
                {/* Company Snapshot Card */}
                <Card className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Company Snapshot
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Industry</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.industry || "Technology & Software"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Company Size</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.companySize || "1-10 Employees"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Funding Stage</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.companyStage || "Early Stage"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Typical Budget</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile.typicalBudgetRange || "$2,500 – $10,000"}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Payment Status</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Escrow Verified
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Company Web Presence */}
                <Card className="space-y-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Official Links
                  </h3>
                  <div className="space-y-2 text-xs">
                    {profile.companyWebsite ? (
                      <a
                        href={profile.companyWebsite.startsWith("http") ? profile.companyWebsite : `https://${profile.companyWebsite}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:underline font-bold"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Visit Website</span>
                        <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                      </a>
                    ) : (
                      <p className="text-slate-400 italic">No website specified</p>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary-600 font-medium"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Company LinkedIn</span>
                      </a>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 3B. Universal Posts & Projects History Tab */}
          {(activeTab === "history" || activeTab === "projects") && (
            <ProfileHistorySection
              userProjects={userProjects}
              userPosts={userPosts}
              userApplications={userApplications}
              postsAnalytics={postsAnalytics}
              isLoading={historyLoading}
              isOwnProfile={isOwnProfile}
              userName={profile.companyName || profileUser?.name || "Creator"}
              onShare={handleOpenShare}
            />
          )}

          {/* 3C. Client Hiring Tab */}
          {activeTab === "hiring" && (
            <Card className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-500" />
                    Hiring Roles & Engagement Terms
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard engagement criteria, payment escrow guidelines, and collaboration terms.
                  </p>
                </div>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditCompanyOpen(true)} className="cursor-pointer">
                    Edit Hiring Preferences
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Payment & Milestone Escrow
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    All project funds are escrow-backed upon contract creation. Milestones are verified against specific acceptance criteria and released promptly upon deliverable approval.
                  </p>
                  <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Typical Budget Range: {profile.typicalBudgetRange || "$2,500 – $10,000"}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-500" /> What We Look For in Developers
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>Transparent communication and regular sprint check-ins</li>
                    <li>Clean, documented code repositories with unit test coverage</li>
                    <li>Experience architecting scalable, modern software systems</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* 3D. Client About Tab */}
          {activeTab === "about" && (
            <Card className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                About {profile.companyName || "the Organization"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.about || "No detailed company narrative provided yet."}
              </p>
            </Card>
          )}

          {/* 3E. Client Activity Timeline Tab */}
          {activeTab === "activity" && (
            <ProfileActivityTimeline
              userProjects={userProjects}
              userPosts={userPosts}
              userApplications={userApplications}
              profileCreatedAt={profile.createdAt || profileUser?.createdAt}
              userName={profile.companyName || profileUser?.name || "Creator"}
            />
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. DEVELOPER-SPECIFIC TAB VIEWS                                           */}
      {/* ========================================================================= */}
      {!isClient && (
        <>
          {/* 4-Historical. Developer Posts & Projects History Tab */}
          {(activeTab === "history" || activeTab === "projects") && (
            <ProfileHistorySection
              userProjects={userProjects}
              userPosts={userPosts}
              userApplications={userApplications}
              postsAnalytics={postsAnalytics}
              isLoading={historyLoading}
              isOwnProfile={isOwnProfile}
              userName={profileUser?.name || "Developer"}
              onShare={handleOpenShare}
            />
          )}

          {/* 4A. Developer Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Developer Section */}
                <Card className="relative group space-y-3 p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary-500" />
                      About
                    </h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditDevOpen(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Bio"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {profile.about ? (
                    <div className="space-y-3">
                      <p
                        className={`text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line ${
                          !isAboutExpanded && profile.about.length > 280 ? "line-clamp-3" : ""
                        }`}
                      >
                        {profile.about}
                      </p>

                      {profile.about.length > 280 && (
                        <button
                          type="button"
                          onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                        >
                          {isAboutExpanded ? "…see less" : "…see more"}
                        </button>
                      )}

                      {/* Top Skills & Specializations Preview */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Top Skills & Specializations
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 select-none"
                              >
                                <TechnologyIcon name={skill} size="xs" />
                                <span>{skill}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <p className="text-xs text-slate-400">No professional summary added yet.</p>
                      {isOwnProfile && (
                        <Button size="sm" variant="outline" onClick={() => setIsEditDevOpen(true)} className="cursor-pointer">
                          + Add Bio & Professional Summary
                        </Button>
                      )}
                    </div>
                  )}
                </Card>

                {/* Primary Skills & Tech Stack */}
                <Card className="space-y-5 p-6 sm:p-7 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-primary-500" />
                        <span>Skills & Technology Stack ({profile.skills?.length || 0})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isEditingSkills
                          ? "Click ✕ to remove or use the inputs to add new technologies."
                          : "Verified technical proficiencies and tooling infrastructure."}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant={isEditingSkills ? "primary" : "outline"}
                        onClick={() => setIsEditingSkills(!isEditingSkills)}
                        className="gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        {isEditingSkills ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Done Editing</span>
                          </>
                        ) : (
                          <>
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Skills</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Skills Inline Input / Selector */}
                  {isEditingSkills && (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <SkillSelector
                        selectedSkills={profile.skills || []}
                        onAddSkill={handleAddSkill}
                        onRemoveSkill={handleDeleteSkill}
                        placeholder="Search & add skills (e.g. React, Node.js, Python)..."
                        showQuickPicks={true}
                      />
                    </div>
                  )}

                  {/* Skills Chips */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Technical Skills ({profile.skills?.length || 0})
                    </h4>
                    {profile.skills && profile.skills.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {(isSkillsExpanded ? profile.skills : profile.skills.slice(0, 8)).map((skill) => (
                            <div
                              key={skill}
                              className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                                isEditingSkills
                                  ? "bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 pl-2.5 pr-2 py-1 text-slate-800 dark:text-slate-200"
                                  : "bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 text-slate-800 dark:text-slate-200 shadow-2xs"
                              }`}
                            >
                              <TechnologyIcon name={skill} size="xs" />
                              <span>{skill}</span>
                              {isEditingSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSkill(skill)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                  title={`Remove ${skill}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Show all X skills toggle */}
                        {profile.skills.length > 8 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>
                                {isSkillsExpanded
                                  ? "Show fewer skills"
                                  : `Show all ${profile.skills.length} skills →`}
                              </span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No technical skills added yet.</p>
                    )}
                  </div>

                  {/* Tech Stack Sub-section */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tools & Infrastructure ({profile.techStack?.length || 0})
                    </h4>
                    {isEditingSkills && (
                      <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                        <SkillSelector
                          selectedSkills={profile.techStack || []}
                          onAddSkill={handleAddTech}
                          onRemoveSkill={handleDeleteTech}
                          placeholder="Search tools & cloud (e.g. Docker, AWS, Git)..."
                          showQuickPicks={false}
                        />
                      </div>
                    )}
                    {profile.techStack && profile.techStack.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.techStack.map((tech) => (
                          <div
                            key={tech}
                            className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold select-none ${
                              isEditingSkills
                                ? "bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 pl-2.5 pr-2 py-1 text-slate-800 dark:text-slate-200"
                                : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-slate-700 dark:text-slate-300 shadow-2xs"
                            }`}
                          >
                            <TechnologyIcon name={tech} size="xs" />
                            <span>{tech}</span>
                            {isEditingSkills && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTech(tech)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No tools or infrastructure listed yet.</p>
                    )}
                  </div>
                </Card>

                {/* Recent Platform Projects & Pitches Preview */}
                <ProfileRecentHistoryPreview
                  userProjects={userProjects}
                  userPosts={userPosts}
                  onViewAll={() => setActiveTab("history")}
                  isOwnProfile={isOwnProfile}
                />

                {/* Featured Portfolio Preview */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-primary-500" />
                      Featured Portfolio Projects ({profile.portfolio?.length || 0})
                    </h3>
                    <button
                      onClick={() => setActiveTab("portfolio")}
                      className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                    >
                      View All Showcase →
                    </button>
                  </div>
                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.portfolio.slice(0, 4).map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 hover:border-primary-500/40 transition-all"
                        >
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 pt-2 text-[11px]">
                            {item.liveUrl && (
                              <a
                                href={item.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                              >
                                Live Demo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {item.repoUrl && (
                              <a
                                href={item.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-1"
                              >
                                <Github className="w-3 h-3" /> Code
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No portfolio projects added yet.</p>
                  )}
                </Card>

                {/* Work Experience Preview */}
                <WorkExperiencePreview
                  experience={profile.experience || []}
                  isOwnProfile={isOwnProfile}
                  onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
                  syncUpdateToBackend={syncUpdateToBackend}
                  onViewAll={() => setActiveTab("experience")}
                />

                {/* Education & Certifications Preview */}
                <EducationCertificationsPreview
                  education={profile.education || []}
                  certifications={profile.certifications || []}
                  onViewAll={() => setActiveTab("education")}
                />

                {/* Open Source Contributions Preview */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Github className="w-4 h-4 text-primary-500" />
                      Open Source Repositories ({profile.openSource?.length || 0})
                    </h3>
                    <button
                      onClick={() => setActiveTab("opensource")}
                      className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                    >
                      View All / Sync →
                    </button>
                  </div>
                  {profile.openSource && profile.openSource.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.openSource.slice(0, 4).map((repo, idx) => (
                        <div
                          key={repo._id || idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {repo.repoName || repo.title}
                            </h4>
                            {repo.language && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{repo.description}</p>
                          )}
                          {repo.url && (
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary-600 hover:underline font-bold inline-flex items-center gap-1 pt-1"
                            >
                              <span>View Repository</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No open source repositories highlighted yet.</p>
                  )}
                </Card>

                {/* Client Reviews Preview */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary-500" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Recommendations & Reviews ({profile.reviews?.length || 0})
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className="text-xs text-primary-600 font-bold hover:underline cursor-pointer"
                    >
                      View All Reviews →
                    </button>
                  </div>
                  {profile.reviews && profile.reviews.length > 0 ? (
                    <div className="space-y-3">
                      {profile.reviews.slice(0, 2).map((rev, idx) => (
                        <div
                          key={rev._id || idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.authorName || rev.reviewer?.name || "Client"}</span>
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                              <Star className="w-3 h-3 fill-amber-500" /> {rev.rating || 5}
                            </div>
                          </div>
                          {rev.comment && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{rev.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No client reviews or peer endorsements yet.</p>
                  )}
                </Card>
              </div>

              {/* Right Column (Sidebar Widgets) */}
              <div className="space-y-6">
                {/* Public Profile & URL (LinkedIn Signature) */}
                <Card className="space-y-2.5 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Public Profile & URL
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Public profile link copied to clipboard!");
                      }}
                      className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 break-all font-mono">
                    {window.location.origin}/profile/{profileUser?.username || profileUser?._id || id || ""}
                  </p>
                </Card>

                {/* Developer Credentials Card */}
                <Card className="space-y-3 p-5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Developer Snapshot
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Hourly Rate</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "$50/hr"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Experience Level</span>
                      <span className="font-bold capitalize text-slate-900 dark:text-white">
                        {profile.experienceLevel || "Mid-Level"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Availability</span>
                      <span className="font-bold text-emerald-600 capitalize">
                        {profile.availability === "busy" ? "Busy on Project" : "Available for Hire"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Client Rating</span>
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {profile.rating || 5.0} / 5.0
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Verified Member</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" /> Active
                      </span>
                    </div>
                  </div>
                </Card>

                {/* External Links Card */}
                <Card className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Links & Profiles
                    </h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditDevOpen(true)}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit Links"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl.startsWith("http") ? profile.githubUrl : `https://${profile.githubUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors font-medium group"
                      >
                        <Github className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                        <span className="group-hover:underline">GitHub Profile</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors font-medium group"
                      >
                        <Linkedin className="w-4 h-4 text-[#0077B5] shrink-0" />
                        <span className="group-hover:underline">LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a
                        href={profile.websiteUrl.startsWith("http") ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors font-medium group"
                      >
                        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="group-hover:underline">Portfolio Website</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {profile.contactEmail && (
                      <a
                        href={`mailto:${profile.contactEmail}`}
                        className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors font-medium group"
                      >
                        <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="group-hover:underline truncate">{profile.contactEmail}</span>
                      </a>
                    )}
                    {!profile.githubUrl && !profile.linkedinUrl && !profile.websiteUrl && !profile.contactEmail && (
                      <p className="text-slate-400 italic">No external profile links added yet.</p>
                    )}
                  </div>
                </Card>

                {/* DevConnect Network Card */}
                <Card className="space-y-3 p-5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-500" />
                    <span>DevConnect Ecosystem</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Collaborate with engineers, pitch software concepts, and participate in verified milestone deliverables.
                  </p>
                  <div className="pt-1">
                    <Link
                      to="/developers"
                      className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <span>Explore Developer Directory</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 4B. Developer About Tab */}
          {activeTab === "about" && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Technical Biography & Background
                </h3>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditDevOpen(true)}>
                    Edit Biography
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.about || "No detailed technical biography added yet."}
              </p>
            </Card>
          )}

          {/* 4C. Developer Skills & Tools Tab */}
          {activeTab === "skills" && (
            <Card className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Skills & Technology Stack ({profile.skills?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified technical proficiencies and tooling infrastructure.
                  </p>
                </div>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant={isEditingSkills ? "primary" : "outline"}
                    onClick={() => setIsEditingSkills(!isEditingSkills)}
                    className="gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    {isEditingSkills ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Done Editing</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Skills</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Languages & Frameworks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Languages & Frameworks</h4>
                {isEditingSkills && (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <SkillSelector
                      selectedSkills={profile.skills || []}
                      onAddSkill={handleAddSkill}
                      onRemoveSkill={handleDeleteSkill}
                      placeholder="Search & add language/framework..."
                      showQuickPicks={true}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).map((s) => (
                    <span
                      key={s}
                      className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all ${
                        isEditingSkills
                          ? "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 pl-2.5 pr-2 py-1 text-slate-800 dark:text-slate-200"
                          : "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/80 px-2.5 py-1.5"
                      }`}
                    >
                      <TechnologyIcon name={s} size="xs" />
                      <span>{s}</span>
                      {isEditingSkills && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(s)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {(!profile.skills || profile.skills.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No primary skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Tools & Infrastructure */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tools & Infrastructure</h4>
                {isEditingSkills && (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <SkillSelector
                      selectedSkills={profile.techStack || []}
                      onAddSkill={handleAddTech}
                      onRemoveSkill={handleDeleteTech}
                      placeholder="Search & add tool/infrastructure..."
                      showQuickPicks={false}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(profile.techStack || []).map((t) => (
                    <span
                      key={t}
                      className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all ${
                        isEditingSkills
                          ? "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 pl-2.5 pr-2 py-1 text-slate-800 dark:text-slate-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5"
                      }`}
                    >
                      <TechnologyIcon name={t} size="xs" />
                      <span>{t}</span>
                      {isEditingSkills && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTech(t)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {(!profile.techStack || profile.techStack.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No tools or infrastructure listed yet.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 4D. Developer Portfolio Showcase Tab */}
          {activeTab === "portfolio" && (
            <Card className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Portfolio Projects & Showcase ({profile.portfolio?.length || 0})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Showcase of real-world software applications, architectures, and live demos.
                  </p>
                </div>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setEditingSection("addPortfolio")}
                    className="gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Showcase Project
                  </Button>
                )}
              </div>

              {/* Add Showcase Form */}
              {editingSection === "addPortfolio" && (
                <div className="p-5 rounded-2xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-950/20 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600" /> Add Project to Portfolio Showcase
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Project Title *"
                      id="pf_title"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Category (e.g. Web App, Cloud Backend)"
                      id="pf_category"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                  </div>
                  <textarea
                    placeholder="Project description and key technical contributions..."
                    id="pf_desc"
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Technologies & skills used (comma-separated, e.g. React, Node.js, Docker)"
                    id="pf_skills"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="url"
                      placeholder="Live Demo URL (https://...)"
                      id="pf_url"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                    <input
                      type="url"
                      placeholder="GitHub Repository URL (https://github.com/...)"
                      id="pf_github"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="cursor-pointer font-bold"
                      onClick={async () => {
                        const title = document.getElementById("pf_title")?.value;
                        const description = document.getElementById("pf_desc")?.value;
                        const category = document.getElementById("pf_category")?.value;
                        const liveUrl = document.getElementById("pf_url")?.value;
                        const repoUrl = document.getElementById("pf_github")?.value;
                        const skillsRaw = document.getElementById("pf_skills")?.value;
                        if (!title) return;
                        const skills = skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
                        try {
                          const res = await profileService.addPortfolioProject({
                            title,
                            description,
                            category: category || "Web Development",
                            liveUrl: liveUrl || undefined,
                            repoUrl: repoUrl || undefined,
                            skills
                          });
                          setProfile((prev) => ({ ...prev, portfolio: res.data || prev.portfolio }));
                          setEditingSection(null);
                        } catch (err) {
                          alert(err?.response?.data?.message || "Failed to save showcase project");
                        }
                      }}
                    >
                      Save Showcase Project
                    </Button>
                  </div>
                </div>
              )}

              {/* Projects Grid */}
              {profile.portfolio && profile.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.portfolio.map((item, idx) => {
                    const itemId = item._id || item.id;
                    return (
                      <div
                        key={itemId || idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {isOwnProfile && (
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this showcase project from your portfolio?")) return;
                              try {
                                if (itemId) {
                                  const res = await profileService.deletePortfolioProject(itemId);
                                  setProfile((prev) => ({ ...prev, portfolio: res.data || prev.portfolio.filter((_, i) => i !== idx) }));
                                }
                              } catch (err) {
                                console.error("Delete project error:", err);
                              }
                            }}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Delete Showcase Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="pr-8 space-y-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.title}</h4>
                          {item.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.skills && item.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          {item.liveUrl && (
                            <a
                              href={item.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 font-bold hover:underline"
                            >
                              Live Demo <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {item.repoUrl && (
                            <a
                              href={item.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-bold hover:underline"
                            >
                              <Github className="w-3 h-3" /> Repository
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-8 text-center">
                  No portfolio projects added yet. Click "+ Add Showcase Project" to highlight your work.
                </p>
              )}
            </Card>
          )}

          {/* 4E. Developer Experience Tab */}
          {activeTab === "experience" && (
            <WorkExperienceSection
              experience={profile.experience || []}
              isOwnProfile={isOwnProfile}
              onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
              syncUpdateToBackend={syncUpdateToBackend}
              triggerAction={editingSection}
              onClearAction={() => setEditingSection(null)}
            />
          )}

          {/* 4F. Education & Certifications Tab */}
          {activeTab === "education" && (
            <EducationCertificationsSection
              education={profile.education || []}
              certifications={profile.certifications || []}
              isOwnProfile={isOwnProfile}
              onProfileUpdate={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
              syncUpdateToBackend={syncUpdateToBackend}
              triggerAction={editingSection}
              onClearAction={() => setEditingSection(null)}
            />
          )}

          {/* 4G. Open Source Tab */}
          {activeTab === "opensource" && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  GitHub & Open Source Repositories ({profile.openSource?.length || 0})
                </h3>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setEditingSection("addOpenSource")}
                    className="cursor-pointer font-bold"
                  >
                    + Add Repository
                  </Button>
                )}
              </div>

              {/* Add Open Source Form */}
              {editingSection === "addOpenSource" && (
                <div className="p-5 rounded-2xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/20 dark:bg-primary-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Add Open Source Repository
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Repository Name *"
                      id="os_name"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Primary Language (e.g. JavaScript, Python)"
                      id="os_lang"
                      className="p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="GitHub Repository URL (https://github.com/...)"
                    id="os_url"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                  <textarea
                    placeholder="Brief description of the repository..."
                    id="os_desc"
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="cursor-pointer font-bold"
                      onClick={async () => {
                        const repoName = document.getElementById("os_name")?.value;
                        const language = document.getElementById("os_lang")?.value || "JavaScript";
                        const url = document.getElementById("os_url")?.value || "";
                        const description = document.getElementById("os_desc")?.value || "";
                        if (!repoName) return;
                        const newOS = { repoName, language, url, description };
                        try {
                          const res = await profileService.addOpenSource(newOS);
                          setProfile((prev) => ({ ...prev, openSource: res.data || [...(prev.openSource || []), newOS] }));
                        } catch {
                          const updated = [...(profile.openSource || []), newOS];
                          setProfile((prev) => ({ ...prev, openSource: updated }));
                          syncUpdateToBackend({ openSource: updated });
                        }
                        setEditingSection(null);
                      }}
                    >
                      Save Repository
                    </Button>
                  </div>
                </div>
              )}

              {profile.openSource && profile.openSource.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.openSource.map((os, idx) => (
                    <div
                      key={os._id || idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 relative group"
                    >
                      {isOwnProfile && (
                        <button
                          onClick={async () => {
                            if (os._id) {
                              try {
                                const res = await profileService.deleteOpenSource(os._id);
                                setProfile((prev) => ({ ...prev, openSource: res.data || prev.openSource.filter((_, i) => i !== idx) }));
                                return;
                              } catch (err) {
                                console.error(err);
                              }
                            }
                            const updated = profile.openSource.filter((_, i) => i !== idx);
                            setProfile((prev) => ({ ...prev, openSource: updated }));
                            syncUpdateToBackend({ openSource: updated });
                          }}
                          className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Github className="w-4 h-4" /> {os.repoName}
                      </h4>
                      {os.description && <p className="text-xs text-slate-500">{os.description}</p>}
                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        {os.language && <span className="font-semibold text-primary-600">{os.language}</span>}
                        {os.url && (
                          <a href={os.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline flex items-center gap-1 font-bold">
                            View on GitHub <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  No open source repositories added yet. Click "+ Add Repository" above.
                </p>
              )}
            </Card>
          )}

          {/* 4H. Reviews Tab */}
          {activeTab === "reviews" && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Client Reviews & Peer Endorsements ({profile.reviews?.length || 0})
                </h3>
                {!isOwnProfile && isAuthenticated && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setEditingSection("addReview")}
                    className="cursor-pointer font-bold"
                  >
                    + Write a Review
                  </Button>
                )}
              </div>

              {/* Add Review Form (Visitors Only) */}
              {editingSection === "addReview" && !isOwnProfile && (
                <div className="p-5 rounded-2xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/20 dark:bg-primary-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Write Endorsement / Review
                  </h4>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rating (1 to 5 Stars)</label>
                    <select
                      id="rev_rating"
                      defaultValue="5"
                      className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars - Very Good)</option>
                      <option value="3">⭐⭐⭐ (3 Stars - Satisfactory)</option>
                      <option value="2">⭐⭐ (2 Stars - Needs Improvement)</option>
                      <option value="1">⭐ (1 Star - Poor)</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Provide detailed feedback regarding communication, code quality, and delivery..."
                    id="rev_comment"
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="cursor-pointer font-bold"
                      onClick={async () => {
                        const comment = document.getElementById("rev_comment")?.value;
                        const rating = Number(document.getElementById("rev_rating")?.value) || 5;
                        if (!comment || !comment.trim()) {
                          alert("Please enter a review comment");
                          return;
                        }
                        try {
                          const targetId = profile._id || profile.id;
                          if (targetId) {
                            const res = await profileService.addReview(targetId, { comment, rating });
                            setProfile((prev) => ({ ...prev, reviews: res.data || prev.reviews }));
                            alert("Thank you! Your review has been recorded.");
                          }
                        } catch (err) {
                          alert(err?.response?.data?.message || "Failed to submit review");
                        }
                        setEditingSection(null);
                      }}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}

              {profile.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-3">
                  {profile.reviews.map((rev, idx) => (
                    <div
                      key={rev._id || idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rev.authorName}</h4>
                          {rev.role && <span className="text-xs text-slate-400">({rev.role})</span>}
                        </div>
                        <div className="flex items-center text-amber-500 text-xs gap-0.5">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{rev.comment}"</p>
                      {rev.createdAt && (
                        <p className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  No client reviews recorded yet. Completed project deliverables or endorsements will display here.
                </p>
              )}
            </Card>
          )}

          {/* 4H-2. Developer Achievements Tab */}
          {activeTab === "achievements" && (
            <Card className="space-y-6 p-6 sm:p-7">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Achievements & Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified milestone badges, community accolades, and platform credentials.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Founding Member Pass */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 text-white relative overflow-hidden shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                        VIP Early Access
                      </span>
                      <h4 className="text-base font-bold text-white mt-2">Devquox Founding Pass</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Founding Member #0001</p>
                    </div>
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 mt-4">
                    <span>Permanently locked in database</span>
                    <span className="text-emerald-400 font-semibold">Active & Verified</span>
                  </div>
                </div>

                {/* Verified Full Stack Developer */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Verified Full Stack Engineer
                        </h4>
                        <p className="text-xs text-slate-500">Platform Technical Verification</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                    Demonstrated production proficiency across MERN stack architectures, APIs, and responsive frontends.
                  </p>
                </div>

                {/* Milestone Delivery */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          100% On-Time Delivery
                        </h4>
                        <p className="text-xs text-slate-500">Milestone Track Record</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      Excellence
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                    Consistent sprint milestone execution with clean code deliverables and client satisfaction.
                  </p>
                </div>

                {/* Community Contributor */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Community Contributor
                        </h4>
                        <p className="text-xs text-slate-500">Devquox Ecosystem</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                      Top 5%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                    Active discussions, collaborative technical feedback, and shared open-source tooling.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 4I. Developer Activity Timeline Tab */}
          {activeTab === "activity" && (
            <ProfileActivityTimeline
              userProjects={userProjects}
              userPosts={userPosts}
              userApplications={userApplications}
              profileCreatedAt={profile.createdAt || profileUser?.createdAt}
              userName={profileUser?.name || "Developer"}
            />
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS                                                                 */}
      {/* ========================================================================= */}
      <BannerPickerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentBanner={profile.bannerImage || BANNER_PRESETS[0].imageUrl}
        onSelectBanner={handleSelectBanner}
        userName={isClient ? (profile.companyName || profileUser?.name) : profileUser?.name}
        userRole={profileUser?.role || currentUser?.role || "developer"}
      />

      <EditCompanyModal
        isOpen={isEditCompanyOpen}
        onClose={() => setIsEditCompanyOpen(false)}
        profile={profile}
        onSave={handleSaveModalData}
      />

      <EditDeveloperModal
        isOpen={isEditDevOpen}
        onClose={() => setIsEditDevOpen(false)}
        profile={profile}
        onSave={handleSaveModalData}
      />

      <OpenToWorkModal
        isOpen={isOpenToWorkOpen}
        onClose={() => setIsOpenToWorkOpen(false)}
        profile={profile}
        onSave={handleSaveModalData}
        isClient={isClient}
      />

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onSelectSection={handleSelectSectionFromModal}
        isClient={isClient}
      />

      <EnhanceProfileModal
        isOpen={isEnhanceProfileOpen}
        onClose={() => setIsEnhanceProfileOpen(false)}
        profile={profile}
        onApplyEnhancements={handleApplyEnhancements}
        isClient={isClient}
      />

      <ContactInfoModal
        isOpen={isContactInfoOpen}
        onClose={() => setIsContactInfoOpen(false)}
        profile={profile}
        userName={profileUser?.name}
      />

      {/* Invite to Project Modal (Client Visitor inviting Developer) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar || profileUser?.avatar}
                name={profileUser?.name || "Developer"}
                size="md"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invite {profileUser?.name} to Project
                </h3>
                <p className="text-xs text-slate-500">{profile.title || "Developer"}</p>
              </div>
            </div>

            {inviteSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Invitation Sent!</h4>
                <p className="text-xs text-slate-500">Redirecting to project conversation...</p>
              </div>
            ) : (
              <form onSubmit={handleSendProjectInvite} className="space-y-4">
                {myOpenProjects.length > 0 ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Project *
                    </label>
                    <select
                      value={inviteProjectId}
                      onChange={(e) => setInviteProjectId(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                    >
                      {myOpenProjects.map((p) => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.title} ({p.budget ? `$${p.budget.toLocaleString()}` : "Negotiable"})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
                    You do not currently have any active open project listings. You can still message this developer directly!
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Personalized Invitation Message
                  </label>
                  <textarea
                    rows={3}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={`Hi ${profileUser?.name || "there"}! I saw your portfolio and would like to collaborate on our project.`}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5 font-bold">
                    <Send className="w-3.5 h-3.5" /> Send Invitation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Universal Share Modal */}
      <ShareModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        shareUrl={shareModalConfig.url}
        title={shareModalConfig.title}
        description={shareModalConfig.description}
        type={shareModalConfig.type}
      />
    </div>
  );
};

export default ProfilePage;
