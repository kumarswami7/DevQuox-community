import { useState, useRef, useEffect } from "react";
import { useAuthStore, useUIStore } from "../../store";
import {
  Bell,
  Search,
  Menu,
  MessageSquare,
  Plus,
  Sparkles,
  ChevronDown,
  User,
  Bookmark,
  Briefcase,
  LogOut,
  ExternalLink,
  Zap,
  Code2,
  Settings,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Link, useNavigate } from "react-router-dom";
import { chatService } from "../../services/chatService";
import { notificationService } from "../../services/notificationService";
import { NotificationBell } from "../chat/NotificationBell";
import { DevquoxLogo } from "../ui/DevquoxLogo";
export const Navbar = () => {
  const { user, isAuthenticated, token, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatus, setUserStatus] = useState("available");
  const [navChats, setNavChats] = useState([]);
  const [navNotifications, setNavNotifications] = useState([]);
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNavChats([]);
      setNavNotifications([]);
      return;
    }
    chatService.getConversations().then((res) => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) setNavChats(data);
    }).catch(() => {
    });
    notificationService.getNotifications().then((res) => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) setNavNotifications(data);
    }).catch(() => {
    });
  }, [isAuthenticated, token]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(e.target)) {
        setMessagesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const isClient = user?.role === "client";
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xs transition-colors">{
    /* Top subtle brand red accent line */
  }<div className="h-[2.5px] w-full bg-gradient-to-r from-primary-600 via-rose-500 to-red-500 opacity-95" /><div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-[1920px] mx-auto">{
    /* Left Side: Logo & Mobile Hamburger */
  }<div className="flex items-center gap-3"><button
    onClick={toggleSidebar}
    className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition-colors"
    aria-label="Toggle Menu"
  ><Menu className="w-5 h-5" /></button><Link to="/dashboard" className="flex items-center gap-2.5 group">
    <DevquoxLogo size="md" />
  </Link></div>{
    /* Center: Sleek Search Bar */
  }<div className="hidden md:flex items-center flex-1 max-w-md mx-6"><div className="relative w-full"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" /><input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onFocus={() => setSearchFocused(true)}
    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
    placeholder="Search projects, AI stacks, developers..."
    className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-slate-100/90 border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-xs"
  /><div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/80 text-[10px] font-mono text-slate-500"><span>⌘</span>K
            </div>{
    /* Quick Search Preview Dropdown */
  }{searchFocused && searchQuery.length > 0 && <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Quick Results
                </p><div
    onMouseDown={() => navigate("/projects")}
    className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between"
  ><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary-500" /><span className="text-xs font-semibold">Search projects for "{searchQuery}"</span></div><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></div><div
    onMouseDown={() => navigate("/developers")}
    className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between"
  ><div className="flex items-center gap-2"><User className="w-4 h-4 text-primary-500" /><span className="text-xs font-semibold">Search developers for "{searchQuery}"</span></div><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></div></div>}</div></div>{
    /* Right Side: Role Toggle, Actions, Dropdowns, Avatar */
  }<div className="flex items-center gap-2 sm:gap-3">{
    !isAuthenticated || !user ? (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 font-bold text-xs">
            Sign In
          </Button>
        </Link>
        <Link to="/register">
          <Button variant="primary" size="sm" className="font-bold text-xs shadow-sm shadow-primary-500/20">
            Get Started
          </Button>
        </Link>
      </div>
    ) : (
      <>
        {/* Authenticated Account Role Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-800">
          {isClient ? (
            <>
              <Briefcase className="w-3.5 h-3.5 text-slate-900" />
              <span>Client / Founder</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5 text-primary-600" />
              <span>Verified Developer</span>
            </>
          )}
        </div>

        {/* Primary Action Button */}
        {isClient ? (
          <Link to="/projects/create" className="hidden sm:inline-block">
            <Button size="sm" variant="primary" className="gap-1.5 shadow-glow-primary">
              <Plus className="w-4 h-4" />
              <span>Post Project</span>
            </Button>
          </Link>
        ) : (
          <Link to="/projects" className="hidden sm:inline-block">
            <Button size="sm" variant="primary" className="gap-1.5 shadow-glow-primary">
              <Sparkles className="w-4 h-4" />
              <span>Browse Projects</span>
            </Button>
          </Link>
        )}

        {/* Messages Dropdown */}
        <div className="relative" ref={msgRef}>
          <button
            onClick={() => {
              setMessagesOpen(!messagesOpen);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 relative transition-colors cursor-pointer"
            aria-label="Messages"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 ring-2 ring-white" />
          </button>
          {messagesOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-88 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Active Chats</h4>
                  <Badge variant="primary">3 New</Badge>
                </div>
                <Link
                  to="/messages"
                  onClick={() => setMessagesOpen(false)}
                  className="text-[11px] font-semibold text-primary-500 hover:underline"
                >
                  Open Messenger
                </Link>
              </div>
              <div className="space-y-1">
                {navChats.length > 0 ? (
                  navChats.slice(0, 3).map((conv) => (
                    <Link
                      key={conv.id || conv._id}
                      to="/messages"
                      onClick={() => setMessagesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Avatar src={conv.user?.avatar} name={conv.user?.name || "Contact"} size="sm" status="online" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{conv.user?.name || "User"}</p>
                          <span className="text-[10px] text-slate-400">
                            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage || "Start conversation"}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 p-3 text-center">No recent messages</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
              setMessagesOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || "User"}
              size="sm"
              status={userStatus === "available" ? "online" : userStatus === "busy" ? "away" : "offline"}
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                  <Badge variant={isClient ? "secondary" : "primary"}>{isClient ? "Client" : "Developer"}</Badge>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                {/* Status Picker */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="bg-slate-100 text-slate-700 rounded-lg px-2 py-0.5 font-semibold text-[11px] focus:outline-none cursor-pointer"
                  >
                    <option value="available">🟢 Available</option>
                    <option value="sprint">🟡 In Sprint</option>
                    <option value="busy">🔴 Busy</option>
                  </select>
                </div>
              </div>
              <div className="p-1.5 space-y-0.5 text-xs font-medium">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-primary-500" />
                  <span>My Public Profile</span>
                </Link>
                <Link
                  to="/bookmarks"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>Saved & Bookmarks</span>
                </Link>
                <Link
                  to="/applications"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>{isClient ? "Applications Received" : "My Applications"}</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Account Settings</span>
                </Link>
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )}
  </div></div></header>;
};
