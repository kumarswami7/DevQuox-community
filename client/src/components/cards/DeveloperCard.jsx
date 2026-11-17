import { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import {
  Star,
  CheckCircle2,
  MessageSquare,
  Send,
  X,
  Bookmark,
  MapPin,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store";
import { chatService } from "../../services/chatService";
import { TechnologyIcon } from "../skills/TechnologyIcon";

export const DeveloperCard = ({
  developer,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(
    `Hi ${developer.name}! I saw your verified profile on DevConnect and would love to collaborate on our upcoming project.`
  );
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sentInvite, setSentInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const isClient = currentUser?.role === "client";
  const devId = developer._id || developer.id;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteMessage.trim()) return;

    setSendingInvite(true);
    setInviteError("");

    try {
      // 1. Get or initialize direct conversation with the target developer
      const convRes = await chatService.getDirectConversation(devId);
      const conv =
        convRes.data?.conversation ||
        convRes.data?.data ||
        convRes.data;
      const convId = conv?._id || conv?.id;

      // 2. Persist introduction/proposal message in conversation
      if (convId) {
        await chatService.sendMessageToConversation(convId, {
          content: inviteMessage.trim(),
        });
      }

      setSentInvite(true);
      setTimeout(() => {
        setIsInviteOpen(false);
        setSentInvite(false);
        navigate(
          `/messages?user=${encodeURIComponent(
            developer.username || developer.name
          )}&conversationId=${convId || ""}&invite=true`
        );
      }, 900);
    } catch (err) {
      console.warn("Direct invite persistence notice:", err);
      // Fallback navigation with recipient prefilled
      setIsInviteOpen(false);
      navigate(
        `/messages?user=${encodeURIComponent(
          developer.username || developer.name
        )}&invite=true`
      );
    } finally {
      setSendingInvite(false);
    }
  };

  const rawAvailability = developer.availability?.toLowerCase() || "available";
  const isAvailable = rawAvailability === "available";
  const isOpenOffers = rawAvailability === "open_to_offers";
  const availabilityLabel =
    rawAvailability === "open_to_offers"
      ? "Open to Offers"
      : rawAvailability === "not_available"
      ? "Not Available"
      : rawAvailability.charAt(0).toUpperCase() + rawAvailability.slice(1);

  const availabilityVariant =
    rawAvailability === "available"
      ? "success"
      : rawAvailability === "open_to_offers"
      ? "accent"
      : "warning";

  const completedCount =
    developer.completedProjectsCount ?? developer.completedProjects ?? 0;
  const ratingValue =
    typeof developer.rating === "number" ? developer.rating.toFixed(1) : "5.0";
  const headline =
    developer.headline || developer.title || "Full-Stack Software Engineer";
  const bio = developer.bio || developer.about || "";
  const skills = Array.isArray(developer.skills) ? developer.skills : [];

  return (
    <>
      <Card className="glass-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden border border-slate-200/90 dark:border-slate-800/80 shadow-sm hover:shadow-lg rounded-2xl bg-white/90 dark:bg-cardDark/90">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

        <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 flex-1 flex flex-col">
          {/* Top Row: Avatar + Name & Headline + Status Dot & Bookmark */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar
                src={developer.avatar || developer.avatarUrl}
                name={developer.name}
                size="sm"
                status={isAvailable ? "online" : "idle"}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    to={`/profile/${devId}`}
                    className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:text-primary-600 transition-colors truncate block"
                    title={developer.name}
                  >
                    {developer.name}
                  </Link>
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-primary-600 fill-primary-600/20 shrink-0"
                    title="Verified Developer Profile"
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5" title={headline}>
                  {headline}
                </p>
                {developer.location && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{developer.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Right: Green/Red/Amber Status Indicator Dot + Bookmark */}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {/* Clean Status Dot: Green (Available), Amber (Offers), Red (Unavailable) */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isAvailable
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30"
                    : isOpenOffers
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500/30"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-500/30"
                }`}
                title={`Status: ${availabilityLabel}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAvailable
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse"
                      : isOpenOffers
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
              </div>

              {isAuthenticated && onToggleBookmark && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleBookmark();
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    isBookmarked
                      ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title={isBookmarked ? "Saved in Bookmarks" : "Save Developer"}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      isBookmarked ? "fill-amber-500 text-amber-500" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Badges Bar: Rating, Experience Level */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
              <span>{ratingValue}</span>
              <span className="text-[9px] sm:text-[10px] font-normal text-slate-400 dark:text-slate-500">
                ({completedCount} built)
              </span>
            </div>

            {developer.experienceLevel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                {developer.experienceLevel}
              </span>
            )}
          </div>

          {/* Bio / Summary with adjusted compact text size */}
          {bio ? (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1 min-h-[2rem]">
              {bio}
            </p>
          ) : (
            <div className="flex-1 min-h-[2rem]" />
          )}

          {/* Skill Chips with compact text size */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-primary-500/40 transition-colors whitespace-nowrap"
              >
                <TechnologyIcon name={skill} size="xs" />
                <span>{skill}</span>
              </span>
            ))}
            {skills.length > 5 && (
              <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">
                +{skills.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Footer with compact height */}
        <div className="p-2.5 sm:p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center justify-between gap-2">
          <Link to={`/profile/${devId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full text-xs font-bold h-8 sm:h-8.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
              View Profile
            </Button>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsInviteOpen(true)}
            className="gap-1.5 flex-1 shadow-sm text-xs font-bold h-8 sm:h-8.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isClient ? "Hire / Invite" : "Message"}</span>
          </Button>
        </div>
      </Card>

      {/* Real Invite & Proposal Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-4 sm:p-6 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <Avatar
                src={developer.avatar || developer.avatarUrl}
                name={developer.name}
                size="md"
                status="online"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Message {developer.name}
                </h3>
                <p className="text-xs text-slate-500">{headline}</p>
              </div>
            </div>

            {sentInvite ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Invitation Sent! Opening Chat Room...
                </h4>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Introduction / Collaboration Scope *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Describe your project, required technical skills, timeline, and proposed compensation..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 leading-relaxed"
                  />
                </div>

                {inviteError && (
                  <p className="text-xs text-rose-500 font-medium">{inviteError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={sendingInvite}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="gap-2 font-bold"
                    disabled={sendingInvite}
                  >
                    {sendingInvite ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{sendingInvite ? "Sending..." : "Send & Open Chat"}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DeveloperCard;
