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
      <Card className="glass-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden border-slate-200/90 dark:border-slate-800/80 shadow-sm hover:shadow-md rounded-2xl">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

        <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
          {/* Top Row: Avatar, Identity, Rating, Bookmark Button */}
          <div className="flex items-start justify-between gap-2 sm:gap-2.5">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Avatar
                src={developer.avatar || developer.avatarUrl}
                name={developer.name}
                size="md"
                status={rawAvailability === "available" ? "online" : "idle"}
                className="shrink-0 mt-0.5 aspect-square"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    to={`/profile/${devId}`}
                    className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:text-primary-600 transition-colors truncate block"
                  >
                    {developer.name}
                  </Link>
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-primary-600 fill-primary-600/20 shrink-0"
                    title="Verified Developer Profile"
                  />
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {headline}
                </p>

                <div className="flex items-center gap-1.5 mt-1 text-[11px] sm:text-xs text-amber-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500" />
                    <span>{ratingValue}</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">
                    ({completedCount} built)
                  </span>
                </div>
              </div>
            </div>

            {/* Availability & Bookmark Action */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1">
                {isAuthenticated && onToggleBookmark && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleBookmark();
                    }}
                    className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title={isBookmarked ? "Saved in Bookmarks" : "Save Developer"}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isBookmarked ? "fill-amber-500 text-amber-500" : ""
                      }`}
                    />
                  </button>
                )}
                <Badge variant={availabilityVariant} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
                  {availabilityLabel}
                </Badge>
              </div>

              {developer.experienceLevel && (
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {developer.experienceLevel}
                </span>
              )}
            </div>
          </div>

          {/* Location & Meta info */}
          {developer.location && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{developer.location}</span>
            </div>
          )}

          {/* Bio / Summary */}
          {bio && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {bio}
            </p>
          )}

          {/* Skill Chips */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
            {skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-500/20 whitespace-nowrap"
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

        {/* Action Buttons Footer */}
        <div className="p-2.5 sm:p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between gap-2">
          <Link to={`/profile/${devId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full text-xs font-semibold h-8 sm:h-9 rounded-xl">
              View Profile
            </Button>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsInviteOpen(true)}
            className="gap-1.5 flex-1 shadow-sm text-xs font-semibold h-8 sm:h-9 rounded-xl"
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
