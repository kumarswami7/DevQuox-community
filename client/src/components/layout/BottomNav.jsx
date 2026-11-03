import { NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, MessageSquare, User } from "lucide-react";
import { cn } from "../../utils";
const mobileNavItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: Briefcase },
  { name: "Devs", path: "/developers", icon: Users },
  { name: "Chat", path: "/messages", icon: MessageSquare },
  { name: "Profile", path: "/profile/me", icon: User }
];
export const BottomNav = () => {
  return <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">{mobileNavItems.map((item) => {
    const Icon = item.icon;
    return <NavLink
      key={item.name}
      to={item.path}
      className={({ isActive }) => cn(
        "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-colors",
        isActive ? "text-primary-600 font-bold" : "text-slate-500 hover:text-slate-900"
      )}
    ><Icon className="w-5 h-5" /><span>{item.name}</span></NavLink>;
  })}</nav>;
};
