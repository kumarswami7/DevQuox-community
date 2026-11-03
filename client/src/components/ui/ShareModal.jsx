import React, { useState } from "react";
import { X, Check, Copy, ExternalLink, Share2, Mail, Smartphone } from "lucide-react";

// Crisp SVG Icons for Social Platforms
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.414z" />
  </svg>
);

const LinkedInIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const XTwitterIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const RedditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

export const ShareModal = ({
  isOpen,
  onClose,
  shareUrl,
  title = "Devquox Project",
  description = "",
  type = "project", // "project" | "idea" | "post"
}) => {
  const [copied, setCopied] = useState(false);
  const [hasShared, setHasShared] = useState(null);

  if (!isOpen) return null;

  const url = shareUrl || window.location.href;
  const cleanTitle = title || "Devquox Community";
  const cleanDesc = description || "Explore this on Devquox developer platform.";

  const handleCopyLink = async (e) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handlePlatformShare = (platform, shareLink, e) => {
    e?.stopPropagation();
    setHasShared(platform);
    setTimeout(() => setHasShared(null), 3000);

    if (platform === "native") {
      if (navigator.share) {
        navigator.share({
          title: cleanTitle,
          text: cleanDesc,
          url: url,
        }).catch(() => {});
        return;
      }
    }

    if (platform === "email") {
      window.location.href = shareLink;
      return;
    }

    window.open(shareLink, "_blank", "noopener,noreferrer,width=650,height=580");
  };

  // Pre-configured social URLs
  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      subtitle: "Chats & Groups",
      bgColor: "bg-emerald-500 hover:bg-emerald-600 text-white",
      cardBg: "hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: WhatsAppIcon,
      actionUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `*${cleanTitle}*\n\n${cleanDesc ? `${cleanDesc.slice(0, 160)}...\n\n` : ""}${url}`
      )}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      subtitle: "Network & Feed",
      bgColor: "bg-[#0A66C2] hover:bg-[#004182] text-white",
      cardBg: "hover:bg-blue-50/70 dark:hover:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/60",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: LinkedInIcon,
      actionUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      subtitle: "Tweet / Post",
      bgColor: "bg-black hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200",
      cardBg: "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-700",
      badgeColor: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      icon: XTwitterIcon,
      actionUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out "${cleanTitle}" on @Devquox:`
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      id: "telegram",
      name: "Telegram",
      subtitle: "Channels & Chats",
      bgColor: "bg-[#229ED9] hover:bg-[#1a85b9] text-white",
      cardBg: "hover:bg-sky-50/70 dark:hover:bg-sky-950/30 border-sky-200/60 dark:border-sky-800/60",
      badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      icon: TelegramIcon,
      actionUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cleanTitle)}`,
    },
    {
      id: "reddit",
      name: "Reddit",
      subtitle: "Subreddits",
      bgColor: "bg-[#FF4500] hover:bg-[#e03d00] text-white",
      cardBg: "hover:bg-orange-50/70 dark:hover:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/60",
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      icon: RedditIcon,
      actionUrl: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(cleanTitle)}`,
    },
    {
      id: "email",
      name: "Email",
      subtitle: "Mail Client",
      bgColor: "bg-violet-600 hover:bg-violet-700 text-white",
      cardBg: "hover:bg-violet-50/70 dark:hover:bg-violet-950/30 border-violet-200/60 dark:border-violet-800/60",
      badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      icon: Mail,
      actionUrl: `mailto:?subject=${encodeURIComponent(`Devquox: ${cleanTitle}`)}&body=${encodeURIComponent(
        `Hi,\n\nI wanted to share this with you on Devquox:\n\n${cleanTitle}\n\n${cleanDesc}\n\nLink: ${url}\n`
      )}`,
    },
  ];

  const typeLabel =
    type === "idea"
      ? "Project Idea & Pitch"
      : type === "post"
      ? "Community Discussion"
      : "Community Project";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden transition-all transform scale-100 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500/20 via-emerald-500/20 to-indigo-500/20 border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-800/60">
                  {typeLabel}
                </span>
                {hasShared && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    Opening {hasShared}...
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                Share with Developers & Friends
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 relative z-10 space-y-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
            {cleanTitle}
          </p>
          {cleanDesc && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {cleanDesc}
            </p>
          )}
          <div className="text-[10px] text-primary-600 dark:text-primary-400 font-mono truncate pt-0.5">
            {url}
          </div>
        </div>

        {/* Social Platforms Grid (Navigate directly to platform) */}
        <div className="relative z-10 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Choose Where to Share
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {platforms.map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => handlePlatformShare(p.id, p.actionUrl, e)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group bg-white dark:bg-slate-900/50 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${p.cardBg}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${p.bgColor}`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {p.subtitle}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Native Device Share Sheet (Mobile / Tablet / Supported Desktop) */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <div className="relative z-10">
            <button
              type="button"
              onClick={(e) => handlePlatformShare("native", "", e)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all border border-slate-200/80 dark:border-slate-700/80"
            >
              <Smartphone className="w-4 h-4 text-primary-500" />
              <span>More Options / System Share Menu</span>
            </button>
          </div>
        )}

        {/* Direct Link Copy Bar */}
        <div className="relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Or Copy Direct Link</span>
            {copied && (
              <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 normal-case">
                <Check className="w-3.5 h-3.5" /> Copied to clipboard!
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono truncate select-all">
              {url}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-primary-600 hover:bg-primary-700 text-white shadow-glow-primary active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

