import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Users, Check, Plus } from "lucide-react";
import { communityService } from "../../services/communityService";
export const CommunityCard = ({ community }) => {
  const [isJoined, setIsJoined] = useState(!!community.isJoined);
  const [memberCount, setMemberCount] = useState(
    community.membersCount || community.members?.length || 1200
  );
  const commId = community.id || community._id;
  const handleToggleJoin = async () => {
    const nextState = !isJoined;
    setIsJoined(nextState);
    setMemberCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const res = await communityService.joinCommunity(commId);
      if (res.data) {
        if (typeof res.data.membersCount === "number") {
          setMemberCount(res.data.membersCount);
        }
        if (res.data.joined !== undefined) {
          setIsJoined(Boolean(res.data.joined));
        }
      }
    } catch (err) {
      setIsJoined(!nextState);
      setMemberCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };
  return <Card className="p-0 overflow-hidden glass-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full border-slate-200/90 dark:border-slate-800/80 shadow-md hover:shadow-glow-subtle group"><div><div className="h-28 w-full relative bg-slate-800 overflow-hidden"><img
    src={community.banner}
    alt={community.name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
  /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" /><div className="absolute -bottom-5 left-5 w-14 h-14 rounded-2xl border-2 border-white dark:border-cardDark overflow-hidden shadow-lg bg-white"><img src={community.icon} alt={community.name} className="w-full h-full object-cover" /></div><div className="absolute top-3 right-3"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/20">
              Active Hub
            </span></div></div><div className="p-5 pt-8"><h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">{community.name}</h3><div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-3"><div className="flex items-center gap-1.5 font-semibold"><Users className="w-3.5 h-3.5 text-primary-500" /><span>{memberCount.toLocaleString()} Members</span></div><span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" /><div className="flex items-center gap-1 text-emerald-500 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span>Discussions Live</span></div></div><p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{community.description}</p><div className="flex flex-wrap gap-1.5 mb-2">{(community.categories || (community.category ? [community.category] : ["MERN", "Full Stack"])).map((cat, idx) => <span
    key={`${cat}-${idx}`}
    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
  >{cat}</span>)}</div></div></div><div className="p-5 pt-0"><Button
    onClick={handleToggleJoin}
    variant={isJoined ? "outline" : "primary"}
    size="sm"
    className="w-full gap-2 transition-all shadow-sm"
  >{isJoined ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span>Joined Member</span></> : <><Plus className="w-3.5 h-3.5" /><span>Join Circle</span></>}</Button></div></Card>;
};
