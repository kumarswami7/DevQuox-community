import React, { useState } from 'react';
import {
  X,
  Mail,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const ContactInfoModal = ({ isOpen, onClose, profile, userName }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const profileUser = profile?.user || {};
  const email = profile?.contactEmail || profileUser?.email || '';
  const linkedin = profile?.linkedinUrl || profileUser?.linkedinUrl || '';
  const github = profile?.githubUrl || profileUser?.githubUrl || '';
  const website = profile?.websiteUrl || profileUser?.websiteUrl || '';
  const location = profile?.location || profileUser?.location || '';
  const profileUrl = window.location.href;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {userName || profileUser?.name || 'Developer'}'s Contact Info
              </h3>
              <p className="text-xs text-slate-400">Direct professional communication channels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Items */}
        <div className="space-y-4 text-xs">
          {/* DevConnect Profile Link */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <Globe className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block">
                DevConnect Profile URL
              </span>
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline truncate block"
              >
                {profileUrl}
              </a>
            </div>
            <button
              onClick={() => handleCopy(profileUrl, 'profileUrl')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Copy Profile Link"
            >
              {copiedKey === 'profileUrl' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Email */}
          {email && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <Mail className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block">Email Address</span>
                <a
                  href={`mailto:${email}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline truncate block"
                >
                  {email}
                </a>
              </div>
              <button
                onClick={() => handleCopy(email, 'email')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Copy Email"
              >
                {copiedKey === 'email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* LinkedIn */}
          {linkedin && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <Linkedin className="w-4 h-4 text-[#0077B5] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block">LinkedIn</span>
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline truncate flex items-center gap-1"
                >
                  <span className="truncate">{linkedin}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* GitHub */}
          {github && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <Github className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block">GitHub</span>
                <a
                  href={github.startsWith('http') ? github : `https://${github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline truncate flex items-center gap-1"
                >
                  <span className="truncate">{github}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Personal Website */}
          {website && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block">Portfolio Website</span>
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline truncate flex items-center gap-1"
                >
                  <span className="truncate">{website}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block">Location</span>
                <span className="text-slate-600 dark:text-slate-300">{location}</span>
              </div>
            </div>
          )}

          {/* Member Join Date */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block">Joined DevConnect</span>
              <span className="text-slate-600 dark:text-slate-300">
                {profile?.createdAt || profileUser?.createdAt
                  ? new Date(profile.createdAt || profileUser.createdAt).toLocaleDateString(
                      undefined,
                      { month: 'long', year: 'numeric' }
                    )
                  : 'Founding Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoModal;

