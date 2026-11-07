import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, MessageSquare, User } from "lucide-react";
import { cn } from "../../utils";
import { useAuthStore } from "../../store";
import { chatService } from "../../services/chatService";
import { getSocket } from "../../services/socket";

const mobileNavItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: Briefcase },
  { name: "Devs", path: "/developers", icon: Users },
  { name: "Chat", path: "/messages", icon: MessageSquare, hasBadge: true },
  { name: "Profile", path: "/profile", icon: User },
];

export const BottomNav = () => {
  const { isAuthenticated, token } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = () => {
      chatService
        .getConversations()
        .then((res) => {
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) {
            const totalUnread = data.reduce((acc, c) => acc + (Number(c.unreadCount) || 0), 0);
            setUnreadCount(totalUnread);
          }
        })
        .catch(() => {});
    };

    fetchUnread();

    const socket = getSocket();
    const handleNewMessage = () => fetchUnread();

    if (socket) {
      socket.on("message:new", handleNewMessage);
      socket.on("conversation:read", handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.off("message:new", handleNewMessage);
        socket.off("conversation:read", handleNewMessage);
      }
    };
  }, [isAuthenticated, token]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around pb-safe">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-colors relative",
                isActive ? "text-primary-600 font-bold" : "text-slate-500 hover:text-slate-900"
              )
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.hasBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-primary-600 text-[9px] font-bold text-white flex items-center justify-center leading-none ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
