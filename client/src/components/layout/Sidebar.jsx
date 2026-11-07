import { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { useUIStore, useAuthStore } from "../../store";
import { IdeaPitchModal } from "../community/IdeaPitchModal";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Bookmark,
  Globe2,
  LogOut,
  PlusCircle,
  User,
  Settings,
  Sparkles,
  CheckCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { cn } from "../../utils";

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const currentUser = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const isClient = currentUser?.role === "client";

  const [pitchModalOpen, setPitchModalOpen] = useState(false);

  // Real, dynamic platform & user statistics (no hardcoded fallback numbers)
  const [sidebarStats, setSidebarStats] = useState({
    projectsCount: null,
    ideasCount: null,
    communitiesCount: null,
    developersCount: null,
    myProjectsCount: null,
    applicationsCount: null,
    unreadMessagesCount: 0,
    bookmarksCount: null,
  });

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const { dashboardService } = await import("../../services/dashboardService");
        const res = await dashboardService.getDashboardSummary();
        const data = res.data?.data || res.data || {};
        if (mounted) {
          const s = data.stats || {};
          const sb = data.sidebarCounts || {};
          setSidebarStats({
            projectsCount: sb.projectsCount ?? s.totalProjects ?? (Array.isArray(data.recentProjects) ? data.recentProjects.length : null),
            ideasCount: sb.ideasCount ?? s.totalIdeas ?? (Array.isArray(data.recentPosts) ? data.recentPosts.filter((p) => p.postType === "idea" || p.ideaDetails).length : null),
            communitiesCount: sb.communitiesCount ?? s.totalCommunities ?? (Array.isArray(data.communities) ? data.communities.length : null),
            developersCount: sb.developersCount ?? s.totalDevelopers ?? null,
            myProjectsCount: sb.myProjectsCount ?? s.myProjectsCount ?? (Array.isArray(data.myProjects) ? data.myProjects.length : 0),
            applicationsCount: sb.applicationsCount ?? s.applicationsReceived ?? s.totalApplications ?? (Array.isArray(data.recentApplications) ? data.recentApplications.length : 0),
            unreadMessagesCount: sb.unreadMessagesCount ?? s.unreadMessagesCount ?? 0,
            bookmarksCount: sb.bookmarksCount ?? s.bookmarksCount ?? 0,
          });
        }
      } catch (e) {
        // graceful handling without hardcoded mock overrides
      }
    };

    fetchCounts();

    // Real-time synchronization via Socket.IO
    let cleanupSocket = null;
    import("../../services/socket").then(({ getSocket }) => {
      const socket = getSocket();
      if (socket && mounted) {
        const handleNewMessage = () => {
          setSidebarStats((prev) => ({
            ...prev,
            unreadMessagesCount: (prev.unreadMessagesCount || 0) + 1,
          }));
        };
        const handleConversationRead = () => {
          fetchCounts();
        };

        socket.on("message:new", handleNewMessage);
        socket.on("conversation:read", handleConversationRead);

        cleanupSocket = () => {
          socket.off("message:new", handleNewMessage);
          socket.off("conversation:read", handleConversationRead);
        };
      }
    }).catch(() => {});

    return () => {
      mounted = false;
      if (cleanupSocket) cleanupSocket();
    };
  }, [currentUser?._id]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const navSections = [
    {
      title: "Platform Hub",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          end: true,
          icon: LayoutDashboard,
        },
        {
          name: "Projects Feed",
          path: "/projects",
          icon: Briefcase,
          badge: sidebarStats.projectsCount != null && sidebarStats.projectsCount > 0
            ? `${sidebarStats.projectsCount} Live`
            : undefined,
          badgeVariant: "live",
        },
        {
          name: "Project Ideas Feed",
          path: "/communities?type=idea",
          icon: Lightbulb,
          badge: sidebarStats.ideasCount != null && sidebarStats.ideasCount > 0
            ? `${sidebarStats.ideasCount} Ideas`
            : undefined,
          badgeVariant: "idea",
        },
        {
          name: "Developer Directory",
          path: "/developers",
          icon: Users,
          badge: sidebarStats.developersCount != null && sidebarStats.developersCount > 0
            ? String(sidebarStats.developersCount)
            : undefined,
          badgeVariant: "subtle",
        },
        {
          name: "Communities",
          path: "/communities",
          icon: Globe2,
          badge: sidebarStats.communitiesCount != null && sidebarStats.communitiesCount > 0
            ? String(sidebarStats.communitiesCount)
            : undefined,
          badgeVariant: "subtle",
        },
      ],
    },
    {
      title: "Workspaces",
      items: [
        {
          name: "Create Project",
          path: "/projects/create",
          icon: PlusCircle,
          highlight: true,
        },
        {
          name: "Pitch Project Idea",
          isAction: true,
          icon: Lightbulb,
          action: () => setPitchModalOpen(true),
          badge: "Pitch",
          badgeVariant: "ideaAction",
        },
        {
          name: "My Posted Projects",
          path: "/my-projects",
          icon: Briefcase,
          badge: sidebarStats.myProjectsCount != null && sidebarStats.myProjectsCount > 0
            ? String(sidebarStats.myProjectsCount)
            : undefined,
          badgeVariant: "subtle",
        },
        {
          name: "Creator Analytics",
          path: "/analytics",
          icon: BarChart3,
        },
        {
          name: "Proposal Pipeline",
          path: "/applications",
          icon: CheckCircle,
          badge: sidebarStats.applicationsCount != null && sidebarStats.applicationsCount > 0
            ? String(sidebarStats.applicationsCount)
            : undefined,
          badgeVariant: "subtle",
        },
        {
          name: "Messages & Team Chat",
          path: "/messages",
          icon: MessageSquare,
          badge: sidebarStats.unreadMessagesCount > 0
            ? String(sidebarStats.unreadMessagesCount)
            : "Live",
          badgeVariant: sidebarStats.unreadMessagesCount > 0 ? "unread" : "live",
        },
        {
          name: "Saved & Bookmarks",
          path: "/bookmarks",
          icon: Bookmark,
          badge: sidebarStats.bookmarksCount != null && sidebarStats.bookmarksCount > 0
            ? String(sidebarStats.bookmarksCount)
            : undefined,
          badgeVariant: "subtle",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        { name: "My Profile", path: "/profile", icon: User },
        { name: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ];

  const renderBadge = (badge, variant) => {
    if (!badge) return null;
    if (variant === "unread") {
      return (
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary-600 text-white shadow-xs animate-pulse">
          {badge}
        </span>
      );
    }
    if (variant === "idea") {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
          {badge}
        </span>
      );
    }
    if (variant === "ideaAction") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
          + {badge}
        </span>
      );
    }
    if (variant === "live") {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {badge}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        {badge}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200/90 bg-white/95 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 space-y-6">
          {/* User Profile Card (Clickable to /profile) */}
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 transition-all group cursor-pointer shadow-xs"
            title="View My Profile"
          >
            <div className="relative shrink-0">
              <Avatar
                src={currentUser?.avatar}
                name={currentUser?.name || "User"}
                size="md"
                status="online"
                className="ring-2 ring-primary-500/20 group-hover:ring-primary-500/50 transition-all rounded-full"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors"
                title={currentUser?.name}
              >
                {currentUser?.name || "User"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800">
                  {isClient ? "Client / Founder" : "Developer"}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Sections */}
          <div className="space-y-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;

                  // 1. Interactive Action Item (e.g. Pitch Project Idea Modal)
                  if (item.isAction) {
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          item.action?.();
                        }}
                        className="group relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-amber-500 transition-transform group-hover:scale-110" />
                          <span>{item.name}</span>
                        </div>
                        {renderBadge(item.badge, item.badgeVariant)}
                      </button>
                    );
                  }

                  // 2. Standard NavLink Route Item
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={Boolean(item.end)}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-primary-500/10 text-primary-600 font-bold border border-primary-500/25 shadow-xs"
                            : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                "w-4 h-4 transition-colors",
                                isActive
                                  ? "text-primary-600"
                                  : "text-slate-400 group-hover:text-slate-700"
                              )}
                            />
                            <span>{item.name}</span>
                          </div>
                          {renderBadge(item.badge, item.badgeVariant)}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-500" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Card */}
        <div className="p-4 space-y-3 border-t border-slate-200/90">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary-600 via-rose-600 to-red-600 text-white shadow-lg shadow-primary-500/25 text-xs relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Devquox Pro</span>
            </div>
            <p className="text-[11px] text-white/90 mb-2.5 leading-snug">
              Boost your visibility and get instant talent matching.
            </p>
            <NavLink
              to="/pricing"
              className="inline-block w-full text-center py-1.5 px-3 bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-xl shadow-xs transition-colors text-xs"
            >
              Learn More
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Idea Pitch Modal triggered directly from the Sidebar */}
      {pitchModalOpen && (
        <IdeaPitchModal
          isOpen={pitchModalOpen}
          onClose={() => setPitchModalOpen(false)}
          onIdeaCreated={(newIdea) => {
            setPitchModalOpen(false);
            setSidebarStats((prev) => ({
              ...prev,
              ideasCount: (prev.ideasCount || 0) + 1,
            }));
            navigate("/communities?type=idea");
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
