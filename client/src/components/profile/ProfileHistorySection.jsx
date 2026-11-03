import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Rocket,
  Lightbulb,
  MessageSquare,
  Briefcase,
  Share2,
  ExternalLink,
  Eye,
  BarChart2,
  Heart,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Users,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

// =============================================================================
// 1. FULL POSTS & PROJECTS HISTORY COMPONENT
// =============================================================================
export const ProfileHistorySection = ({
  userProjects = [],
  userPosts = [],
  userApplications = [],
  postsAnalytics = null,
  isLoading = false,
  isOwnProfile = false,
  userName = "Creator",
  onShare,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // 'all' | 'projects' | 'ideas' | 'posts' | 'applications'

  const userIdeas = useMemo(() => {
    return userPosts.filter(
      (p) => p.postType === "idea" || p.ideaDetails || p.tags?.includes("idea")
    );
  }, [userPosts]);

  const userDiscussions = useMemo(() => {
    return userPosts.filter(
      (p) => p.postType !== "idea" && !p.ideaDetails && !p.tags?.includes("idea")
    );
  }, [userPosts]);

  const convertedCount = useMemo(() => {
    return userIdeas.filter((i) => i.convertedToProject).length;
  }, [userIdeas]);

  const totalImpressions = useMemo(() => {
    return (
      postsAnalytics?.totalImpressions ??
      userPosts.reduce((acc, p) => acc + (p.impressionsCount || 0), 0)
    );
  }, [postsAnalytics, userPosts]);

  const totalUpvotes = useMemo(() => {
    return (
      postsAnalytics?.totalUpvotes ??
      userPosts.reduce(
        (acc, p) => acc + (p.upvotes || p.likes?.length || 0),
        0
      )
    );
  }, [postsAnalytics, userPosts]);

  const totalCount =
    userProjects.length +
    userPosts.length +
    (isOwnProfile ? userApplications.length : 0);

  // Filtered lists
  const showProjects = filter === "all" || filter === "projects";
  const showIdeas = filter === "all" || filter === "ideas";
  const showDiscussions = filter === "all" || filter === "posts";
  const showApplications = isOwnProfile && (filter === "all" || filter === "applications");

  const totalDisplayed =
    (showProjects ? userProjects.length : 0) +
    (showIdeas ? userIdeas.length : 0) +
    (showDiscussions ? userDiscussions.length : 0) +
    (showApplications ? userApplications.length : 0);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CREATOR ANALYTICS & TELEMETRY BANNER                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-5 shadow-sm relative overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800">
                Platform Activity & Records
              </span>
              <span className="text-xs text-slate-400">
                • {totalCount} Total Submissions
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {isOwnProfile ? "My Posts & Projects History" : `${userName}'s Posts & Projects History`}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Complete log of software builds, community idea pitches, architectural discussions, and engagement telemetry.
            </p>
          </div>

          {isOwnProfile && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link to="/analytics">
                <Button size="sm" variant="outline" className="gap-1.5 font-bold border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Analytics Studio</span>
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5 font-bold border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pitch Idea</span>
                </Button>
              </Link>
              <Link to="/projects/create">
                <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-glow-primary">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Project</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Real-time Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
          {/* Projects Created */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
              <Rocket className="w-3.5 h-3.5 text-primary-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {userProjects.length}
            </div>
            <span className="text-[10px] text-slate-500">Live & completed</span>
          </div>

          {/* Ideas Pitched */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ideas Pitched</span>
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {userIdeas.length}
            </div>
            <span className="text-[10px] text-slate-500">
              {convertedCount > 0 ? `${convertedCount} launched` : "Community pitches"}
            </span>
          </div>

          {/* Discussions */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Discussions</span>
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {userDiscussions.length}
            </div>
            <span className="text-[10px] text-slate-500">Community threads</span>
          </div>

          {/* Reach / Impressions */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Feed Reach</span>
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalImpressions.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              Impressions
            </span>
          </div>

          {/* Upvotes */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Upvotes</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalUpvotes}
            </div>
            <span className="text-[10px] text-slate-500">Community likes</span>
          </div>

          {/* Proposals Sent (Own Profile) or Converted Projects */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isOwnProfile ? "Proposals" : "Launched"}
              </span>
              <Send className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {isOwnProfile ? userApplications.length : convertedCount}
            </div>
            <span className="text-[10px] text-slate-500">
              {isOwnProfile ? "Applications sent" : "Built into projects"}
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* INTERACTIVE FILTER TABS                                             */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 relative z-10">
          {[
            { id: "all", label: `All Activity (${totalCount})`, icon: Sparkles },
            { id: "projects", label: `Projects (${userProjects.length})`, icon: Rocket },
            { id: "ideas", label: `Ideas & Pitches (${userIdeas.length})`, icon: Lightbulb },
            { id: "posts", label: `Discussions (${userDiscussions.length})`, icon: MessageSquare },
            ...(isOwnProfile
              ? [{ id: "applications", label: `My Proposals (${userApplications.length})`, icon: Send }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? "text-primary-400 dark:text-primary-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MAIN STREAM: PROJECTS, IDEAS, POSTS, AND APPLICATIONS               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {totalDisplayed === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-2">
            <Rocket className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No Submissions Found in this Filter
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isOwnProfile
              ? "Start by posting a project idea to receive developer feedback or launch your own project listing!"
              : "This member has not posted any items in this category yet."}
          </p>
          {isOwnProfile && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5 font-bold">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pitch an Idea</span>
                </Button>
              </Link>
              <Link to="/projects/create">
                <Button size="sm" variant="primary" className="gap-1.5 font-bold shadow-glow-primary">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post a Project</span>
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 1. PROJECTS STREAM */}
          {showProjects && userProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-primary-500" />
                  <span>Software Projects ({userProjects.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProjects.map((p) => {
                  const pId = p._id || p.id;
                  const status = p.status || "open";
                  return (
                    <div
                      key={pId}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3 flex flex-col justify-between hover:border-primary-500/50 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/projects/${pId}`} className="group-hover:text-primary-600 transition-colors">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.title}
                            </h4>
                          </Link>
                          <Badge
                            variant={
                              status === "completed"
                                ? "success"
                                : status === "in_progress"
                                ? "accent"
                                : "primary"
                            }
                            className="text-[10px] uppercase font-bold shrink-0"
                          >
                            {status === "open" ? "Open for Proposals" : status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>
                              {p.budget
                                ? `$${p.budget.toLocaleString()}`
                                : p.budgetMin && p.budgetMax
                                ? `$${p.budgetMin.toLocaleString()} - $${p.budgetMax.toLocaleString()}`
                                : "Negotiable"}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.acceptedApplicantsCount || 0} members • {p.applicantsCount || 0} proposals</span>
                          </span>
                        </div>

                        {/* Skills */}
                        {Array.isArray(p.requiredSkills || p.skills) && (p.requiredSkills || p.skills).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(p.requiredSkills || p.skills).slice(0, 4).map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onShare?.({
                                title: p.title,
                                description: p.description,
                                url: `${window.location.origin}/projects/${pId}`,
                                type: "project",
                              })
                            }
                            className="text-slate-400 hover:text-primary-500 transition-colors p-1 rounded-lg"
                            title="Share Project"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2">
                            {isOwnProfile && (
                              <Link
                                to={`/projects/${pId}/workspace`}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <span>Workspace</span>
                              </Link>
                            )}
                            <Link
                              to={`/projects/${pId}`}
                              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                            >
                              <span>View Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. COMMUNITY IDEAS STREAM */}
          {showIdeas && userIdeas.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Project Ideas & Pitches ({userIdeas.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userIdeas.map((idea) => {
                  const ideaId = idea._id || idea.id;
                  const upvotes = idea.upvotes || idea.likes?.length || 0;
                  const impressions = idea.impressionsCount || 0;
                  const views = idea.viewsCount || 0;
                  const comments = idea.commentsCount || 0;
                  return (
                    <div
                      key={ideaId}
                      className="p-5 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/20 via-white to-orange-50/10 dark:from-amber-950/20 dark:via-cardDark dark:to-orange-950/10 space-y-3 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/communities?post=${ideaId}`} className="group-hover:text-amber-600 transition-colors">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {idea.title || "Untitled Community Idea"}
                            </h4>
                          </Link>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70 shrink-0">
                            <Lightbulb className="w-3 h-3 text-amber-500 fill-amber-500/30" />
                            <span>Idea Pitch</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {idea.content}
                        </p>
                      </div>

                      {/* Idea Details Metadata */}
                      {idea.ideaDetails && (
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/30 text-[11px]">
                          {idea.ideaDetails.estimatedBudget && (
                            <div className="truncate">
                              <span className="text-slate-400">Budget: </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {idea.ideaDetails.estimatedBudget}
                              </span>
                            </div>
                          )}
                          {idea.ideaDetails.targetAudience && (
                            <div className="truncate">
                              <span className="text-slate-400">Audience: </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {idea.ideaDetails.targetAudience}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Telemetry Strip & Actions */}
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] font-semibold" title="Impressions">
                              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{impressions}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold" title="Viewers">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>{views}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500" title="Upvotes">
                              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                              <span>{upvotes}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500" title="Reviews">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{comments}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onShare?.({
                                title: idea.title,
                                description: idea.content,
                                url: `${window.location.origin}/communities?post=${ideaId}`,
                                type: "idea",
                              })
                            }
                            className="text-slate-400 hover:text-amber-500 transition-colors p-1 rounded-lg"
                            title="Share Idea"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Launch Action */}
                        <div className="flex items-center justify-between pt-1">
                          <Link
                            to={`/communities?post=${ideaId}`}
                            className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                          >
                            <span>Read Pitch & Feedback</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {idea.convertedToProject ? (
                            <Link to={`/projects/${idea.convertedToProject._id || idea.convertedToProject}`}>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-all">
                                <Rocket className="w-3 h-3 text-emerald-500" />
                                <span>Project Active ↗</span>
                              </span>
                            </Link>
                          ) : isOwnProfile ? (
                            <Link to={`/projects/create?fromIdea=${ideaId}`}>
                              <Button size="xs" variant="primary" className="gap-1 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                                <Rocket className="w-3 h-3" />
                                <span>Launch as Project</span>
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DISCUSSIONS & GENERAL POSTS STREAM */}
          {showDiscussions && userDiscussions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Discussions & Community Posts ({userDiscussions.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userDiscussions.map((post) => {
                  const postId = post._id || post.id;
                  return (
                    <div
                      key={postId}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/communities?post=${postId}`} className="group-hover:text-indigo-600 transition-colors">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {post.title || post.content?.slice(0, 50)}
                            </h4>
                          </Link>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize shrink-0">
                            {post.postType || "Discussion"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                            <span>{post.upvotes || 0}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{post.commentsCount || 0}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              onShare?.({
                                title: post.title || post.content?.slice(0, 50),
                                description: post.content,
                                url: `${window.location.origin}/communities?post=${postId}`,
                                type: "post",
                              })
                            }
                            className="text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/communities?post=${postId}`}
                            className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <span>Open Thread</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. MY APPLICATIONS & PROPOSALS (OWN PROFILE ONLY) */}
          {showApplications && userApplications.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-500" />
                  <span>My Project Proposals ({userApplications.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userApplications.map((app) => {
                  const appId = app._id || app.id;
                  const proj = app.project || {};
                  const projId = proj._id || proj.id;
                  const status = app.status || "pending";
                  return (
                    <div
                      key={appId}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-cardDark space-y-3 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/projects/${projId}`} className="group-hover:text-blue-600 transition-colors">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {proj.title || "Software Project Proposal"}
                            </h4>
                          </Link>
                          <Badge
                            variant={
                              status === "accepted"
                                ? "success"
                                : status === "rejected"
                                ? "danger"
                                : "warning"
                            }
                            className="text-[10px] uppercase font-bold shrink-0 capitalize"
                          >
                            {status === "accepted" ? "Accepted into Team" : status}
                          </Badge>
                        </div>
                        {app.coverLetter && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                            "{app.coverLetter}"
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Proposed: {app.proposedRate ? `$${app.proposedRate}` : "Standard budget"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {status === "accepted" ? (
                            <Link
                              to={`/messages?projectId=${projId}`}
                              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <span>Project Team Chat ↗</span>
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-400">Awaiting client decision</span>
                          )}

                          <Link
                            to={`/projects/${projId}`}
                            className="font-bold text-primary-600 hover:underline flex items-center gap-1"
                          >
                            <span>View Project</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 2. TIMELINE & ACTIVITY FEED COMPONENT
// =============================================================================
export const ProfileActivityTimeline = ({
  userProjects = [],
  userPosts = [],
  userApplications = [],
  profileCreatedAt = null,
  userName = "Creator",
}) => {
  const timelineEvents = useMemo(() => {
    const list = [
      ...userProjects.map((p) => ({
        id: `proj-${p._id || p.id}`,
        title: `Launched Project: "${p.title}"`,
        subtitle: `${p.category || "Software"} • Budget: $${p.budget?.toLocaleString() || "Negotiable"}`,
        date: p.createdAt || Date.now(),
        link: `/projects/${p._id || p.id}`,
        icon: Rocket,
        color: "text-primary-500 bg-primary-50 dark:bg-primary-950/60 border-primary-200 dark:border-primary-800",
        badge: p.status || "open",
      })),
      ...userPosts.map((p) => ({
        id: `post-${p._id || p.id}`,
        title:
          p.postType === "idea"
            ? `Pitched Project Concept: "${p.title || "Community Idea"}"`
            : `Shared Discussion: "${p.title || p.content?.slice(0, 45)}"`,
        subtitle: `${p.impressionsCount || 0} impressions • ${p.upvotes || 0} upvotes • ${p.commentsCount || 0} comments`,
        date: p.createdAt || Date.now(),
        link: `/communities?post=${p._id || p.id}`,
        icon: p.postType === "idea" ? Lightbulb : MessageSquare,
        color:
          p.postType === "idea"
            ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
            : "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
        badge: p.postType === "idea" ? "Idea Pitch" : "Discussion",
      })),
      ...userApplications.map((a) => ({
        id: `app-${a._id || a.id}`,
        title: `Submitted Proposal for: "${a.project?.title || "Project"}"`,
        subtitle: `Rate: ${a.proposedRate ? `$${a.proposedRate}` : "Negotiable"} • Status: ${a.status || "pending"}`,
        date: a.createdAt || Date.now(),
        link: `/projects/${a.project?._id || a.project}`,
        icon: Send,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        badge: a.status || "pending",
      })),
      {
        id: "joined",
        title: `${userName} joined Devquox Platform`,
        subtitle: "Account verified and connected to real-time developer network",
        date: profileCreatedAt || Date.now(),
        link: null,
        icon: ShieldCheck,
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        badge: "Verified Member",
      },
    ];

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [userProjects, userPosts, userApplications, profileCreatedAt, userName]);

  return (
    <Card className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-6">
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-500" />
          <span>Chronological Timeline & Contribution Feed</span>
        </h3>
        <p className="text-xs text-slate-500">
          Historical activity stream tracking milestones, pitches, and projects across Devquox.
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {timelineEvents.map((ev) => {
          const Icon = ev.icon;
          return (
            <div key={ev.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${ev.color}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>

              {/* Event content */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {new Date(ev.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                    {ev.badge}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {ev.link ? (
                    <Link to={ev.link} className="hover:text-primary-600 transition-colors">
                      {ev.title}
                    </Link>
                  ) : (
                    <span>{ev.title}</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">{ev.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// =============================================================================
// 3. OVERVIEW TAB COMPACT PREVIEW COMPONENT
// =============================================================================
export const ProfileRecentHistoryPreview = ({
  userProjects = [],
  userPosts = [],
  onViewAll,
  isOwnProfile = false,
}) => {
  const recentItems = useMemo(() => {
    const list = [
      ...userProjects.map((p) => ({
        id: `p-${p._id || p.id}`,
        title: p.title,
        type: "project",
        tag: "Project Listing",
        date: p.createdAt,
        link: `/projects/${p._id || p.id}`,
        icon: Rocket,
        color: "text-primary-500",
      })),
      ...userPosts.map((p) => ({
        id: `post-${p._id || p.id}`,
        title: p.title || p.content?.slice(0, 45),
        type: p.postType === "idea" ? "idea" : "post",
        tag: p.postType === "idea" ? "Project Idea Pitch" : "Community Post",
        date: p.createdAt,
        link: `/communities?post=${p._id || p.id}`,
        icon: p.postType === "idea" ? Lightbulb : MessageSquare,
        color: p.postType === "idea" ? "text-amber-500" : "text-indigo-500",
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return list.slice(0, 3);
  }, [userProjects, userPosts]);

  const totalCount = userProjects.length + userPosts.length;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary-500" />
            <span>Recent Projects & Pitches ({totalCount})</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Latest creations, active project specs, and brainstorm pitches.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-primary-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>View All ({totalCount})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentItems.length > 0 ? (
        <div className="space-y-2.5">
          {recentItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.link}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {item.tag} • {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600 shrink-0 ml-2" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <p className="text-xs text-slate-400">No project listings or idea pitches shared yet.</p>
          {isOwnProfile && (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="cursor-pointer gap-1 text-xs">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Pitch First Idea</span>
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
};

