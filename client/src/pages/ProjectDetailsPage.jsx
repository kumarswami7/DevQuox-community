import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import {
  Users,
  Shield,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Send,
  X,
  Github,
  ExternalLink,
  Lightbulb,
  Share2,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../store';
import { ShareModal } from '../components/ui/ShareModal';

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingAppId, setProcessingAppId] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;
  const projectOwnerId = project?.owner?._id || project?.owner?.id || project?.owner;
  const isOwner = Boolean(currentUserId && projectOwnerId && String(projectOwnerId) === String(currentUserId));

  const loadProject = async () => {
    if (!id) return;
    try {
      const res = await projectService.getProjectById(id);
      const proj = res.data?.project || res.data;
      setProject(proj);
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  const loadTeamAndApplications = async () => {
    if (!id) return;
    try {
      // Load active team members
      try {
        const memRes = await projectService.getProjectMembers(id);
        setMembers(memRes.data?.members || memRes.data?.data || []);
      } catch (err) {
        console.error('Error loading members:', err);
      }

      if (isOwner) {
        const res = await projectService.getProjectApplications(id);
        const apps = res.data?.applications || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setApplications(apps);
      } else if (isAuthenticated) {
        const [appRes, memStatusRes] = await Promise.allSettled([
          projectService.getMyApplicationForProject(id),
          projectService.getMyMembership(id),
        ]);

        if (appRes.status === 'fulfilled' && appRes.value?.data?.hasApplied) {
          setMyApplication(appRes.value.data.application);
        } else {
          setMyApplication(null);
        }

        if (memStatusRes.status === 'fulfilled' && memStatusRes.value?.data?.isMember) {
          setMyMembership(memStatusRes.value.data);
        } else {
          setMyMembership(null);
        }
      }
    } catch (err) {
      console.error('Error loading team or applications:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadProject();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (project) {
      loadTeamAndApplications();
    }
  }, [project?._id, isOwner, isAuthenticated]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');
    setSubmittingApply(true);
    try {
      await projectService.applyToProject(id, {
        coverLetter: coverLetter.trim(),
        proposedRate: proposedRate.trim(),
      });
      setShowApplyModal(false);
      setActionSuccess('Your proposal was successfully sent to the project owner!');
      await loadProject();
      await loadApplications();
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit application. Please check requirements.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleWithdrawMyApplication = async () => {
    if (!window.confirm('Are you sure you want to withdraw your proposal from this project?')) return;
    try {
      await projectService.withdrawMyApplication(id);
      setActionSuccess('Proposal withdrawn successfully.');
      setMyApplication(null);
      await loadProject();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  const handleDecisionConfirm = async () => {
    if (!decisionModal) return;
    const { appId, status, decisionReason } = decisionModal;
    setProcessingAppId(appId);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.updateApplicationStatus(appId, {
        status,
        decisionReason: decisionReason?.trim() || undefined,
      });
      setActionSuccess(
        status === 'accepted'
          ? 'Applicant accepted and added to project team!'
          : 'Applicant proposal rejected.'
      );
      setDecisionModal(null);
      await loadProject();
      await loadApplications();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to update application to ${status}`);
    } finally {
      setProcessingAppId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-xs text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p>Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Project Not Found</h2>
        <p className="text-xs text-slate-500">This project may have been deleted, cancelled, or is marked private.</p>
        <Link to="/projects">
          <Button variant="outline" size="sm">
            Back to Projects Feed
          </Button>
        </Link>
      </div>
    );
  }

  const acceptedCount = project.acceptedApplicantsCount || (project.members ? project.members.length : 0);
  const teamCapacity = project.teamSize || 1;
  const isCapacityFull = acceptedCount >= teamCapacity;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project Feed
        </Link>

        {isOwner && (
          <Link to="/my-projects">
            <Button variant="outline" size="sm" className="text-xs">
              View All My Projects
            </Button>
          </Link>
        )}
      </div>

      {/* Success & Error Banners */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess('')} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {actionError}
          </span>
          <button onClick={() => setActionError('')} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Project Header Card */}
      <Card className="p-6 md:p-8 space-y-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-md border border-primary-100 dark:border-primary-900/50">
                {project.status ? project.status.replace('_', ' ') : 'Open Project'}
              </span>
              <span className="text-xs font-semibold text-slate-400">• {project.category}</span>
              {project.projectType && (
                <span className="text-xs font-semibold text-slate-400">• {project.projectType.replace('_', ' ')}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{project.title}</h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>Posted by</span>
              <Avatar src={project.owner?.avatar || project.owner?.avatarUrl} name={project.owner?.name || 'Client'} size="sm" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {project.owner?.name || 'Project Owner'}
              </span>
              {/* Creator Role Badge: Client/Founder vs Developer */}
              {project.owner?.role === 'client' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                  <Briefcase className="w-3 h-3" />
                  <span>Client / Founder</span>
                </span>
              ) : project.owner?.role === 'developer' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  <span>💻 Developer</span>
                </span>
              ) : project.owner?.role ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                  <span>{project.owner.role}</span>
                </span>
              ) : null}
              <span>• {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons for Developer / Applicant */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {(isOwner || myMembership?.isMember || myApplication?.status === 'accepted') && (
              <>
                <Link to={`/messages?projectId=${project._id}`}>
                  <Button
                    size="md"
                    variant="outline"
                    className="gap-2 border-[#00a884] text-[#00a884] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
                    title="Open Project Team Chat"
                  >
                    <MessageSquare className="w-4 h-4 text-[#00a884]" />
                    <span>Project Team Chat</span>
                  </Button>
                </Link>
                <Link to={`/projects/${project._id}/workspace`}>
                  <Button
                    size="md"
                    variant="primary"
                    className="gap-2 shadow-glow-primary bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Project Workspace</span>
                  </Button>
                </Link>
              </>
            )}

            {!isOwner && isAuthenticated && (
              <>
                {myApplication ? (
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        myApplication.status === 'accepted'
                          ? 'success'
                          : myApplication.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      className="px-3 py-1.5 text-xs font-bold capitalize"
                    >
                      Proposal: {myApplication.status}
                    </Badge>
                    {myApplication.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleWithdrawMyApplication}
                        className="text-xs text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900"
                      >
                        Withdraw Proposal
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    size="md"
                    variant={isCapacityFull ? 'secondary' : 'primary'}
                    disabled={isCapacityFull || project.status !== 'open'}
                    onClick={() => setShowApplyModal(true)}
                    className="gap-2 shadow-glow-primary"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isCapacityFull ? 'Capacity Filled' : 'Apply to Project'}</span>
                  </Button>
                )}
              </>
            )}

            {!isAuthenticated && (
              <Link to="/login">
                <Button size="md" variant="primary">
                  Sign in to Apply
                </Button>
              </Link>
            )}

            <Button
              size="md"
              variant="outline"
              onClick={() => setShowShareModal(true)}
              className="gap-2 font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Share Project"
            >
              <Share2 className="w-4 h-4 text-primary-500" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Origin Idea Pitch Banner */}
        {project.originIdeaPost && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-bold">Born from Community Idea & Pitch: </span>
              <span className="italic">"{project.originIdeaPost.title || 'Original Community Idea'}"</span>
            </div>
            <Link
              to="/communities"
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              Explore Discussions ↗
            </Link>
          </div>
        )}

        {/* Project Repositories & External Links */}
        {(project.githubRepoUrl || project.liveDemoUrl) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-primary-500 hover:text-primary-500 text-xs font-semibold transition-all shadow-xs"
              >
                <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <span>GitHub Repository</span>
              </a>
            )}
            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 text-xs font-semibold transition-all shadow-xs"
              >
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <span>Live Demo / Preview</span>
              </a>
            )}
          </div>
        )}

        {/* Project Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 font-semibold block mb-0.5">Budget</span>
            <span className="font-bold text-emerald-500 text-sm">
              {project.budget || 'Negotiable / Flexible'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block mb-0.5">Duration</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {project.duration || '1 - 2 Months'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block mb-0.5">Experience Level</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">
              {project.experienceLevel === 'all' ? 'All Levels' : (project.experienceLevel || 'All Levels')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block mb-0.5">Team Capacity</span>
            <span
              className={`font-bold text-sm ${
                isCapacityFull ? 'text-amber-500' : 'text-primary-500'
              }`}
            >
              {acceptedCount} / {teamCapacity} Filled
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Project</h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Skills & Tech Stack</h3>
          <div className="flex flex-wrap gap-1.5">
            {(project.requiredSkills || []).map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Active Project Team Members */}
      <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Project Team ({members.length})
            </h2>
            <p className="text-xs text-slate-500">
              Verified collaborators and active participants on this project
            </p>
          </div>

          {(isOwner || myMembership?.isMember || myApplication?.status === 'accepted') && (
            <Link to={`/projects/${project._id}/workspace`}>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/40">
                <Shield className="w-3.5 h-3.5" />
                <span>Go to Workspace</span>
              </Button>
            </Link>
          )}
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((m) => {
              const u = m.user;
              if (!u) return null;
              return (
                <div
                  key={m._id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-3 hover:border-primary-300 dark:hover:border-primary-800 transition-all"
                >
                  <Avatar src={u.avatar || u.avatarUrl} name={u.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        to={`/profile/${u.username || u._id}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500 truncate"
                      >
                        {u.name}
                      </Link>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          m.role === 'owner'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : m.role === 'manager'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    {u.headline ? (
                      <p className="text-[11px] text-slate-500 truncate">{u.headline}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">No active team members recorded yet.</p>
        )}
      </Card>

      {/* Project Owner: Incoming Applicants & Management */}
      {isOwner && (
        <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Submitted Proposals ({applications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Review applicant proposals and accept developers to fill the {teamCapacity} position(s)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Capacity: {acceptedCount} of {teamCapacity} accepted
            </span>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => {
                const applicant = app.applicant || app.applicantSnapshot || {};
                const isPending = app.status === 'pending';

                return (
                  <div
                    key={app._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar
                        src={applicant.avatar}
                        name={applicant.name || 'Applicant'}
                        size="md"
                      />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {applicant.name || 'Anonymous Developer'}
                          </h4>
                          <Badge
                            variant={
                              app.status === 'accepted'
                                ? 'success'
                                : app.status === 'rejected'
                                ? 'danger'
                                : app.status === 'withdrawn'
                                ? 'secondary'
                                : 'warning'
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {app.status}
                          </Badge>
                        </div>

                        {applicant.headline && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {applicant.headline}
                          </p>
                        )}

                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-cardDark p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          "{app.coverLetter || 'No cover letter provided.'}"
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                          {app.proposedRate && (
                            <span className="font-bold text-emerald-500">Rate: {app.proposedRate}</span>
                          )}
                          <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner Action Decision Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isPending ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isCapacityFull || processingAppId === app._id}
                            isLoading={processingAppId === app._id}
                            onClick={() =>
                              setDecisionModal({
                                appId: app._id,
                                status: 'accepted',
                                applicantName: applicant.name || 'Applicant',
                                decisionReason: '',
                              })
                            }
                            className="text-xs gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingAppId === app._id}
                            onClick={() =>
                              setDecisionModal({
                                appId: app._id,
                                status: 'rejected',
                                applicantName: applicant.name || 'Applicant',
                                decisionReason: '',
                              })
                            }
                            className="text-xs text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-400 italic block">
                            Decision: {app.status}
                          </span>
                          {app.decisionReason && (
                            <span className="text-[11px] text-slate-500 block max-w-xs truncate">
                              Note: {app.decisionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No proposals submitted for this project yet.</p>
            </div>
          )}
        </Card>
      )}

      {/* Application Submission Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply to Work on Project</h3>
                <p className="text-xs text-slate-500">{project.title}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applyError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Cover Letter / Introduction *
                </label>
                <textarea
                  required
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, describe relevant experience, and explain why you're a great fit for this project..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Proposed Rate / Compensation (Optional)
                </label>
                <input
                  type="text"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="e.g., $1,500 total or $40/hr"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submittingApply} className="gap-1.5">
                  <Send className="w-4 h-4" />
                  <span>Send Proposal</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Decision Review Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {decisionModal.status === 'accepted' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span>
                  {decisionModal.status === 'accepted' ? 'Accept Contributor' : 'Reject Proposal'}
                </span>
              </h3>
              <button
                onClick={() => setDecisionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {decisionModal.status === 'accepted' ? (
                <>
                  You are about to accept{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {decisionModal.applicantName}
                  </strong>{' '}
                  into this project. They will become an official project member and a seat will be reserved.
                </>
              ) : (
                <>
                  You are declining the proposal from{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {decisionModal.applicantName}
                  </strong>
                  . This decision is final.
                </>
              )}
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Decision Note or Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={decisionModal.decisionReason || ''}
                onChange={(e) =>
                  setDecisionModal((prev) => ({
                    ...prev,
                    decisionReason: e.target.value,
                  }))
                }
                placeholder={
                  decisionModal.status === 'accepted'
                    ? 'e.g., Welcome aboard! Look forward to working together.'
                    : 'e.g., Thank you for applying. We selected another candidate with different stack experience.'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDecisionModal(null)}
                disabled={Boolean(processingAppId)}
              >
                Cancel
              </Button>
              <Button
                variant={decisionModal.status === 'accepted' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleDecisionConfirm}
                disabled={Boolean(processingAppId)}
                isLoading={Boolean(processingAppId)}
                className="gap-1.5"
              >
                {decisionModal.status === 'accepted' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Acceptance</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Universal Share Modal */}
      {project && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={window.location.href}
          title={project.title}
          description={project.description}
          type="project"
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;
