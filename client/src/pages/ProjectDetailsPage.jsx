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
  Edit3,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { useAuthStore } from '../store';
import { ShareModal } from '../components/ui/ShareModal';
import { TechnologyIcon } from '../components/skills/TechnologyIcon';
import { ProjectDetailsEditModal } from '../components/workspace/ProjectDetailsEditModal';

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
  const [selectedRole, setSelectedRole] = useState('Full Stack Developer');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState(['']);
  const [relevantSkills, setRelevantSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [availability, setAvailability] = useState('Immediate / Flexible');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingAppId, setProcessingAppId] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [applicationTab, setApplicationTab] = useState('all');
  const [compareApplicants, setCompareApplicants] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [togglingAppStatus, setTogglingAppStatus] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
    if (!isAppOpen) {
      setApplyError('Applications for this project are currently closed.');
      return;
    }
    setApplyError('');
    setSubmittingApply(true);
    try {
      await projectService.applyToProject(id, {
        coverLetter: coverLetter.trim(),
        relevantRole: selectedRole,
        estimatedDuration: estimatedDuration.trim() || undefined,
        portfolioLinks: portfolioLinks.filter((l) => Boolean(l && l.trim())),
        relevantSkills,
        availability,
      });
      setShowApplyModal(false);
      setActionSuccess('Your proposal was successfully sent to the project owner!');
      await loadProject();
      await loadTeamAndApplications();
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
      await loadTeamAndApplications();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  const handleToggleApplicationStatus = async () => {
    if (!project?._id || togglingAppStatus) return;
    const currentStatus = (project.applicationStatus || 'open') === 'open' && project.status === 'open' ? 'open' : 'closed';
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      setTogglingAppStatus(true);
      setActionError('');
      // Optimistic update
      setProject((prev) => ({
        ...prev,
        applicationStatus: nextStatus,
        status: nextStatus === 'open' && prev.status === 'paused' ? 'open' : prev.status,
      }));
      const res = await projectService.toggleProjectApplicationStatus(project._id, nextStatus);
      if (res.data?.project) {
        setProject(res.data.project);
      }
      setActionSuccess(`Project applications are now ${nextStatus === 'open' ? 'OPEN' : 'CLOSED'}`);
    } catch (err) {
      setProject((prev) => ({ ...prev, applicationStatus: currentStatus }));
      setActionError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setTogglingAppStatus(false);
    }
  };

  const handleSaveProjectDetails = async (payload) => {
    try {
      setIsUpdatingProject(true);
      setActionError('');
      const res = await projectService.updateProject(id, payload);
      const updatedProj = res.data?.project || res.data?.data || res.data;
      if (updatedProj) {
        setProject(updatedProj);
      } else {
        await loadProject();
      }
      setShowEditModal(false);
      setActionSuccess('Project details updated successfully!');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update project details');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!id || isDeletingProject) return;
    try {
      setIsDeletingProject(true);
      setActionError('');
      await projectService.deleteProject(id);
      setActionSuccess('Project deleted successfully.');
      setShowDeleteConfirm(false);
      setTimeout(() => {
        navigate('/my-projects');
      }, 1000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete project.');
      setIsDeletingProject(false);
    }
  };

  const handleShortlistApplication = async (appId) => {
    setProcessingAppId(appId);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.shortlistApplication(appId);
      setActionSuccess('Applicant added to shortlist!');
      await loadTeamAndApplications();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to shortlist application');
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleDecisionConfirm = async () => {
    if (!decisionModal) return;
    const { appId, status, decisionReason } = decisionModal;
    setProcessingAppId(appId);
    setActionError('');
    setActionSuccess('');
    try {
      if (status === 'accepted') {
        await projectService.acceptApplication(appId, decisionReason?.trim() || undefined);
        setActionSuccess('Applicant accepted and added to project team!');
      } else if (status === 'rejected') {
        await projectService.rejectApplication(appId, decisionReason?.trim() || undefined);
        setActionSuccess('Applicant proposal rejected.');
      } else {
        await projectService.updateApplicationStatus(appId, {
          status,
          decisionReason: decisionReason?.trim() || undefined,
        });
      }
      setDecisionModal(null);
      await loadProject();
      await loadTeamAndApplications();
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
  const isAppOpen = (project.applicationStatus || 'open') === 'open' && project.status === 'open';

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
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-md border border-primary-100 dark:border-primary-900/50">
                {project.status ? project.status.replace('_', ' ') : 'Open Project'}
              </span>

              {/* Explicit Application Open / Closed Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isAppOpen
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAppOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isAppOpen ? 'Applications Open' : 'Applications Closed'}
              </span>

              <span className="text-xs font-semibold text-slate-400">• {project.category}</span>
              {project.projectType && (
                <span className="text-xs font-semibold text-slate-400">• {project.projectType.replace('_', ' ')}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">{project.title}</h1>

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

          {/* Action Buttons for Developer / Applicant / Owner */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
            {isOwner && (
              <>
                {/* 1. Toggle Application Status */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={togglingAppStatus}
                  onClick={handleToggleApplicationStatus}
                  className={`gap-1.5 whitespace-nowrap h-9 px-3 rounded-xl font-bold transition-all text-xs shrink-0 ${
                    isAppOpen
                      ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                  title={isAppOpen ? 'Close project to new applications' : 'Open project for applications'}
                >
                  {isAppOpen ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Close Applications</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Open Applications</span>
                    </>
                  )}
                </Button>

                {/* 2. Edit Project (Icon Only) */}
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 flex items-center justify-center transition-all shadow-xs shrink-0"
                  title="Edit Project Details"
                  aria-label="Edit Project"
                >
                  <Edit3 className="w-4 h-4 text-amber-500" />
                </button>

                {/* 3. Delete Project (Icon Only) */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-9 h-9 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 flex items-center justify-center transition-all shadow-xs shrink-0"
                  title="Delete Project"
                  aria-label="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Team Chat (Icon Only) */}
            {(isOwner || myMembership?.isMember || myApplication?.status === 'accepted') && (
              <Link to={`/messages?projectId=${project._id}`} className="shrink-0">
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center transition-all shadow-xs"
                  title="Project Team Chat"
                  aria-label="Project Team Chat"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </button>
              </Link>
            )}

            {/* Project Workspace (Primary Action) */}
            {(isOwner || myMembership?.isMember || myApplication?.status === 'accepted') && (
              <Link to={`/projects/${project._id}/workspace`} className="shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-2 shadow-glow-primary bg-primary-600 hover:bg-primary-700 text-white font-bold whitespace-nowrap h-9 px-4 rounded-xl transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>Project Workspace</span>
                </Button>
              </Link>
            )}

            {/* Share Button (Icon Only) */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 flex items-center justify-center transition-all shadow-xs shrink-0"
              title="Share Project"
              aria-label="Share Project"
            >
              <Share2 className="w-4 h-4 text-primary-500" />
            </button>

            {!isOwner && isAuthenticated && (
              <>
                {myApplication ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        myApplication.status === 'accepted'
                          ? 'success'
                          : myApplication.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      className="px-3 py-1.5 text-xs font-bold capitalize whitespace-nowrap rounded-xl"
                    >
                      Proposal: {myApplication.status}
                    </Badge>
                    {myApplication.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleWithdrawMyApplication}
                        className="text-xs text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900 whitespace-nowrap h-9 px-3 rounded-xl"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={isCapacityFull || !isAppOpen ? 'secondary' : 'primary'}
                    disabled={isCapacityFull || !isAppOpen}
                    onClick={() => setShowApplyModal(true)}
                    className="gap-2 shadow-glow-primary whitespace-nowrap h-9 px-4 rounded-xl font-bold"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isCapacityFull
                        ? 'Capacity Filled'
                        : !isAppOpen
                        ? 'Applications Closed'
                        : 'Apply to Project'}
                    </span>
                  </Button>
                )}
              </>
            )}

            {!isAuthenticated && (
              isAppOpen ? (
                <Link to="/login" className="shrink-0">
                  <Button size="sm" variant="primary" className="whitespace-nowrap h-9 px-4 rounded-xl font-bold">
                    Sign in to Apply
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="secondary" disabled className="whitespace-nowrap h-9 px-4 rounded-xl font-bold">
                  Applications Closed
                </Button>
              )
            )}
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
            <span className="text-slate-400 font-semibold block mb-0.5">Project Type</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {project.category || (project.projectType === 'collaboration' ? 'Community Project' : 'Developer Squad')}
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

        {/* Required Skills & Tech Stack with Official Technology Logos */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Required Skills & Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {(project.requiredSkills || []).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-400 dark:hover:border-primary-500 transition-colors shadow-2xs"
              >
                <TechnologyIcon name={skill} size="sm" />
                <span>{skill}</span>
              </span>
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
        <Card className="p-6 space-y-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Applicant Pipeline ({applications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Review applicant proposals, shortlist contenders, and accept developers to fill the {teamCapacity} position(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Capacity: {acceptedCount} of {teamCapacity} accepted
              </span>
              {compareApplicants.length >= 2 && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowCompareModal(true)}
                  className="text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  <span>Compare ({compareApplicants.length})</span>
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All', count: applications.length },
              { id: 'pending', label: 'Pending', count: applications.filter((a) => a.status === 'pending').length },
              { id: 'under_review', label: 'Under Review', count: applications.filter((a) => a.status === 'under_review').length },
              { id: 'shortlisted', label: 'Shortlisted', count: applications.filter((a) => a.status === 'shortlisted').length },
              { id: 'accepted', label: 'Accepted', count: applications.filter((a) => a.status === 'accepted').length },
              { id: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setApplicationTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  applicationTab === tab.id
                    ? 'bg-primary-500 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  applicationTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {(() => {
            const filteredApps = applicationTab === 'all'
              ? applications
              : applications.filter((a) => a.status === applicationTab);

            if (filteredApps.length === 0) {
              return (
                <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No proposals found in "{applicationTab.replace('_', ' ')}" stage.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const applicant = app.applicant || app.applicantSnapshot || {};
                  const isPending = app.status === 'pending' || app.status === 'under_review';
                  const isShortlisted = app.status === 'shortlisted';
                  const isSelectedForCompare = compareApplicants.some((ca) => ca._id === app._id);

                  return (
                    <div
                      key={app._id}
                      className={`p-4 rounded-xl border transition-all ${
                        app.status === 'accepted'
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : app.status === 'shortlisted'
                          ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                      } flex flex-col gap-3`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Checkbox for applicant comparison */}
                          <input
                            type="checkbox"
                            checked={isSelectedForCompare}
                            onChange={() => {
                              if (isSelectedForCompare) {
                                setCompareApplicants((prev) => prev.filter((ca) => ca._id !== app._id));
                              } else {
                                if (compareApplicants.length >= 3) {
                                  alert('You can compare a maximum of 3 applicants at once.');
                                  return;
                                }
                                setCompareApplicants((prev) => [...prev, app]);
                              }
                            }}
                            className="mt-1 rounded text-primary-500 focus:ring-primary-500 cursor-pointer"
                            title="Select for comparison"
                          />

                          <Avatar
                            src={applicant.avatar}
                            name={applicant.name || 'Applicant'}
                            size="md"
                          />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to={`/profile/${applicant.username || applicant._id}`}
                                className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-500"
                              >
                                {applicant.name || 'Anonymous Developer'}
                              </Link>

                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  app.status === 'accepted'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : app.status === 'shortlisted'
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                    : app.status === 'under_review'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : app.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : app.status === 'withdrawn'
                                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {app.status.replace('_', ' ')}
                              </span>

                              {app.rateType && (
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                  • {app.rateType}
                                </span>
                              )}
                            </div>

                            {applicant.headline && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {applicant.headline}
                              </p>
                            )}

                            {/* Cover Letter */}
                            <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-cardDark p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 whitespace-pre-line">
                              "{app.coverLetter || 'No cover letter provided.'}"
                            </p>

                            {/* Skills / Tech */}
                            {Array.isArray(app.relevantSkills) && app.relevantSkills.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 mr-1">Skills:</span>
                                {app.relevantSkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                                  >
                                    <TechnologyIcon name={sk} size="xs" />
                                    <span>{sk}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Portfolio Links */}
                            {Array.isArray(app.portfolioLinks) && app.portfolioLinks.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                <span className="font-bold text-slate-400">Links:</span>
                                {app.portfolioLinks.map((link, lidx) => (
                                  <a
                                    key={lidx}
                                    href={link.startsWith('http') ? link : `https://${link}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary-500 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Portfolio #{lidx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Rate, Duration, Availability, Date */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                              {app.proposedRate && (
                                <span className="font-bold text-emerald-500">Rate: {app.proposedRate}</span>
                              )}
                              {app.estimatedDuration && (
                                <span>Est. Duration: {app.estimatedDuration}</span>
                              )}
                              {app.availability && (
                                <span>Availability: {app.availability}</span>
                              )}
                              <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Owner Decision Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                          {/* Chat with applicant */}
                          {applicant._id && (
                            <Link to={`/messages?userId=${applicant._id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 border-slate-300 dark:border-slate-700"
                                title="Chat with Applicant"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
                                <span>Chat</span>
                              </Button>
                            </Link>
                          )}

                          {(isPending || isShortlisted) && (
                            <>
                              {!isShortlisted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingAppId === app._id}
                                  isLoading={processingAppId === app._id}
                                  onClick={() => handleShortlistApplication(app._id)}
                                  className="text-xs gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                >
                                  <span>Shortlist</span>
                                </Button>
                              )}

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
                          )}

                          {app.status === 'accepted' && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              ✓ Team Member
                            </span>
                          )}

                          {app.status === 'rejected' && (
                            <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>
      )}

      {/* Application Submission Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Project Proposal</h3>
                <p className="text-xs text-slate-500">{project.title}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
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
              {/* Cover Letter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Cover Letter & Solution Approach *
                  </label>
                  <span className={`text-[10px] font-mono ${coverLetter.length > 3000 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {coverLetter.length}/3000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, describe relevant engineering experience, architecture suggestions, and why you are the best fit for this project..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Target Contribution Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Target Role / Contribution Focus
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Mobile App Developer">Mobile App Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                  <option value="QA / Test Automation">QA / Test Automation</option>
                  <option value="Technical Contributor">Technical Contributor</option>
                </select>
              </div>

              {/* Estimated Duration & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g., 2 Weeks, 1 Month"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Immediate / Flexible">Immediate / Flexible</option>
                    <option value="10 - 20 hrs / week">Part-Time (10 - 20 hrs / week)</option>
                    <option value="Full-Time (35 - 40 hrs / week)">Full-Time (35 - 40 hrs / week)</option>
                    <option value="Weekends only">Weekends only</option>
                  </select>
                </div>
              </div>

              {/* Relevant Skills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Relevant Skills You Bring
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const s = newSkillInput.trim();
                        if (s && !relevantSkills.includes(s)) {
                          setRelevantSkills([...relevantSkills, s]);
                          setNewSkillInput('');
                        }
                      }
                    }}
                    placeholder="Type skill & press Enter (e.g. React, Docker, Python)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const s = newSkillInput.trim();
                      if (s && !relevantSkills.includes(s)) {
                        setRelevantSkills([...relevantSkills, s]);
                        setNewSkillInput('');
                      }
                    }}
                    className="text-xs"
                  >
                    Add
                  </Button>
                </div>
                {relevantSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {relevantSkills.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-900/40"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => setRelevantSkills(relevantSkills.filter((item) => item !== sk))}
                          className="hover:text-rose-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio & GitHub Links */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub & Portfolio Links</span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">(optional)</span>
                </label>
                {portfolioLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const updated = [...portfolioLinks];
                        updated[idx] = e.target.value;
                        setPortfolioLinks(updated);
                      }}
                      placeholder="https://github.com/myrepo or https://myportfolio.dev"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
                    />
                    {portfolioLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPortfolioLinks(portfolioLinks.filter((_, i) => i !== idx))}
                        className="text-xs text-rose-500"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {portfolioLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPortfolioLinks([...portfolioLinks, ''])}
                    className="text-xs font-semibold text-primary-500 hover:underline pt-0.5"
                  >
                    + Add Another Link
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submittingApply} className="gap-1.5 shadow-glow-primary">
                  <Send className="w-4 h-4" />
                  <span>Send Proposal</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Side-by-Side Applicant Comparison Modal */}
      {showCompareModal && compareApplicants.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-4xl p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Applicant Comparison ({compareApplicants.length} Candidates)
                </h3>
                <p className="text-xs text-slate-500">Side-by-side evaluation of proposals and qualifications</p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compareApplicants.map((app) => {
                const applicant = app.applicant || app.applicantSnapshot || {};
                return (
                  <div
                    key={app._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={applicant.avatar} name={applicant.name} size="md" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{applicant.name}</h4>
                        <p className="text-[11px] text-slate-500">{applicant.headline || 'Developer'}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 block uppercase text-[10px]">Role / Focus</span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">{app.relevantRole || 'Developer'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 block uppercase text-[10px]">Estimated Duration</span>
                      <span className="text-slate-800 dark:text-slate-200">{app.estimatedDuration || 'Not specified'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 block uppercase text-[10px]">Availability</span>
                      <span className="text-slate-800 dark:text-slate-200">{app.availability || 'Flexible'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 block uppercase text-[10px]">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {(app.relevantSkills || []).map((sk) => (
                          <span key={sk} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300/60 dark:border-slate-700">
                            <TechnologyIcon name={sk} size="xs" />
                            <span>{sk}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-400 block uppercase text-[10px]">Cover Letter</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-cardDark p-2 rounded border border-slate-200 dark:border-slate-800 line-clamp-4">
                        "{app.coverLetter}"
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setShowCompareModal(false);
                          setDecisionModal({
                            appId: app._id,
                            status: 'accepted',
                            applicantName: applicant.name || 'Applicant',
                            decisionReason: '',
                          });
                        }}
                        className="w-full text-xs"
                      >
                        Accept This Candidate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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
      {/* Project Details Edit Modal (Owner Authority) */}
      {isOwner && (
        <ProjectDetailsEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          project={project}
          onSave={handleSaveProjectDetails}
          isProcessing={isUpdatingProject}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isOwner && showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900 bg-white dark:bg-cardDark">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Project</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>"{project.title}"</strong>? All associated proposals and project data will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingProject}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteProject}
                isLoading={isDeletingProject}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingProject ? 'Deleting...' : 'Confirm Delete'}</span>
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
