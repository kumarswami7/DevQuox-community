import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import {
  Users,
  Shield,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Kanban,
  Activity,
  ArrowLeft,
  UserX,
  LogOut,
  ChevronRight,
  Sparkles,
  GitBranch,
  X,
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Edit3,
  Lock,
  ShieldCheck,
  Loader2,
  Globe,
  Github,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { milestoneService } from '../services/milestoneService';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store';
import { useWorkspacePermissions } from '../hooks/useWorkspacePermissions';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';

// Workspace Phase 7 Components
import { FinancialsTab } from '../components/financials/FinancialsTab';

// Workspace Phase 6 Components
import { ChatWindow } from '../components/chat/ChatWindow';

// Workspace Phase 5 Components
import { ProjectProgressWidget } from '../components/workspace/ProjectProgressWidget';
import { TaskKanbanBoard } from '../components/workspace/TaskKanbanBoard';
import { TaskListView } from '../components/workspace/TaskListView';
import { TaskModal } from '../components/workspace/TaskModal';
import { TaskDetailModal } from '../components/workspace/TaskDetailModal';
import { MilestoneSection } from '../components/workspace/MilestoneSection';
import { MilestoneModal } from '../components/workspace/MilestoneModal';
import { ProjectDetailsEditModal } from '../components/workspace/ProjectDetailsEditModal';
import { WorkspaceOverviewTab } from '../components/workspace/WorkspaceOverviewTab';
import { WorkspaceActivityTab } from '../components/workspace/WorkspaceActivityTab';
import { WorkspaceTeamTab } from '../components/workspace/WorkspaceTeamTab';
import { WorkspaceSettingsTab } from '../components/workspace/WorkspaceSettingsTab';

export const ProjectWorkspacePage = () => {
  const { projectId, id } = useParams();
  const effectiveProjectId = projectId || id;
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Default to 'overview' per modern SaaS spec!

  // Phase 6 Real-time Team Chat State
  const [projectConversation, setProjectConversation] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // Phase 5 Task & Milestone States
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksViewMode, setTasksViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Task Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [milestoneFilter, setMilestoneFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedMilestoneForEdit, setSelectedMilestoneForEdit] = useState(null);

  // Project Owner Edit Details Modal
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'task' | 'milestone', id, title }

  // Action feedback
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Membership Modals
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removalReason, setRemovalReason] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const permissions = useWorkspacePermissions(workspace?.project, null, currentUser, workspace?.membership);
  const isOwner = permissions.isOwner || Boolean(workspace?.isOwner);
  const userRole = workspace?.membership?.role || 'member';
  const isElevated = permissions.isElevated;

  // Load Primary Workspace Data
  const loadWorkspace = async () => {
    if (!effectiveProjectId) return;
    try {
      setError(null);
      const res = await projectService.getProjectWorkspace(effectiveProjectId);
      if (res.data?.success && res.data?.workspace) {
        setWorkspace(res.data.workspace);
      } else {
        setWorkspace(res.data);
      }
    } catch (err) {
      console.error('Workspace fetch error:', err);
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? 'Access denied. You do not have active workspace access to this project.'
          : 'Failed to load project workspace.');
      setError({
        status: err.response?.status || 500,
        code: err.response?.data?.code || 'ERROR',
        message: errorMsg,
      });
    }
  };

  // Load Tasks
  const loadTasks = async () => {
    if (!effectiveProjectId) return;
    setLoadingTasks(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
      if (assigneeFilter && assigneeFilter !== 'all') params.assignee = assigneeFilter;
      if (milestoneFilter && milestoneFilter !== 'all') params.milestone = milestoneFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await taskService.getProjectTasks(effectiveProjectId, params);
      if (res.data?.success) {
        setTasks(res.data.tasks || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Load Milestones
  const loadMilestones = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await milestoneService.getProjectMilestones(effectiveProjectId);
      if (res.data?.success) {
        setMilestones(res.data.milestones || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load milestones:', err);
    }
  };

  // Load Progress Overview
  const loadProgress = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await projectService.getProjectProgress(effectiveProjectId);
      if (res.data?.success) {
        setProgress(res.data.progress || res.data.data || null);
      }
    } catch (err) {
      console.error('Failed to load project progress:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadWorkspace();
      setLoading(false);
    };
    init();
  }, [effectiveProjectId]);

  // Load Phase 5 data once workspace is ready or filters change
  useEffect(() => {
    if (workspace) {
      loadTasks();
      loadMilestones();
      loadProgress();
    }
  }, [effectiveProjectId, workspace?.project?._id, statusFilter, priorityFilter, assigneeFilter, milestoneFilter, searchQuery]);

  // Phase 6: Load Project Conversation when Chat tab is selected
  useEffect(() => {
    if (activeTab === 'chat' && effectiveProjectId) {
      setLoadingChat(true);
      chatService
        .getProjectConversation(effectiveProjectId)
        .then((res) => {
          if (res.data?.conversation) {
            setProjectConversation(res.data.conversation);
          }
        })
        .catch((err) => {
          console.error('[ProjectWorkspace] Failed to fetch project conversation:', err);
        })
        .finally(() => {
          setLoadingChat(false);
        });
    }
  }, [activeTab, effectiveProjectId]);

  // =========================================================================
  // Phase 12 Real-Time WebSocket Connectivity & State Synchronization
  // =========================================================================
  const { connectionStatus, onlineUsers, reconnect } = useWorkspaceSocket({
    projectId: effectiveProjectId,
    onTaskEvent: (event) => {
      if (event.type === 'task:created') {
        setTasks((prev) => {
          const newTask = event.data || event;
          const exists = prev.some((t) => (t._id || t.id) === (newTask._id || newTask.id));
          return exists ? prev : [newTask, ...prev];
        });
        loadProgress();
      } else if (
        event.type === 'task:updated' ||
        event.type === 'task:statusChanged' ||
        event.type === 'task:assigned' ||
        event.type === 'task:reviewRequested' ||
        event.type === 'task:approved' ||
        event.type === 'task:reopened'
      ) {
        const updatedTask = event.data || event;
        setTasks((prev) =>
          prev.map((t) =>
            (t._id || t.id) === (updatedTask._id || updatedTask.id) ? { ...t, ...updatedTask } : t
          )
        );
        setSelectedTaskForDetail((prev) =>
          prev && (prev._id || prev.id) === (updatedTask._id || updatedTask.id)
            ? { ...prev, ...updatedTask }
            : prev
        );
        loadProgress();
      } else if (event.type === 'task:deleted') {
        const deletedId = event.data?.taskId || event.resourceId || event.data?._id;
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== deletedId));
        setSelectedTaskForDetail((prev) =>
          prev && (prev._id || prev.id) === deletedId ? null : prev
        );
        loadProgress();
      }
    },
    onMilestoneEvent: (event) => {
      if (event.type === 'milestone:created') {
        setMilestones((prev) => {
          const newM = event.data || event;
          const exists = prev.some((m) => (m._id || m.id) === (newM._id || newM.id));
          return exists ? prev : [...prev, newM];
        });
        loadProgress();
      } else if (event.type === 'milestone:updated' || event.type === 'milestone:completed') {
        const updatedM = event.data || event;
        setMilestones((prev) =>
          prev.map((m) =>
            (m._id || m.id) === (updatedM._id || updatedM.id) ? { ...m, ...updatedM } : m
          )
        );
        loadProgress();
      } else if (event.type === 'milestone:deleted') {
        const deletedId = event.data?.milestoneId || event.resourceId;
        setMilestones((prev) => prev.filter((m) => (m._id || m.id) !== deletedId));
        loadProgress();
      }
    },
    onProjectEvent: () => {
      loadWorkspace();
    },
    onMemberEvent: () => {
      loadWorkspace();
    },
    onActivityEvent: (activity) => {
      setWorkspace((prev) => {
        if (!prev) return prev;
        const currentActivities = prev.recentActivity || [];
        return {
          ...prev,
          recentActivity: [activity, ...currentActivities.slice(0, 19)],
        };
      });
    },
    onRevoked: (payload) => {
      setActionError(payload?.reason || 'Your workspace access to this project has been revoked.');
      setTimeout(() => {
        navigate('/projects', { replace: true });
      }, 2000);
    },
  });

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.updateMemberRole(effectiveProjectId, userId, newRole);
      setActionSuccess(`Team member role updated to ${newRole}`);
      await loadWorkspace();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update member role.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirm Remove Member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.removeMember(effectiveProjectId, memberToRemove.user._id, removalReason);
      setActionSuccess(`${memberToRemove.user.name} has been removed from the team.`);
      setShowRemoveModal(false);
      setMemberToRemove(null);
      setRemovalReason('');
      await loadWorkspace();
      await loadTasks();
      await loadProgress();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Confirm Leave Project
  const handleConfirmLeave = async () => {
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.leaveProject(effectiveProjectId);
      setShowLeaveModal(false);
      navigate(`/projects/${effectiveProjectId}`, {
        state: { message: 'You have successfully departed from the project team.' },
      });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to leave project.');
      setIsProcessing(false);
    }
  };

  // ==========================================
  // Task Handlers
  // ==========================================
  const handleOpenCreateTask = () => {
    setSelectedTaskForEdit(null);
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setSelectedTaskForEdit(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData) => {
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (selectedTaskForEdit) {
        await taskService.updateTask(selectedTaskForEdit._id, taskData);
        setActionSuccess('Task updated successfully.');
      } else {
        await taskService.createTask(effectiveProjectId, taskData);
        setActionSuccess('Task created successfully.');
      }
      setShowTaskModal(false);
      setSelectedTaskForEdit(null);
      await loadTasks();
      await loadProgress();
      await loadMilestones();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Optimistic Status Change Handler
  const handleTaskStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;

    setActionError('');
    setActionSuccess('');

    // Save previous state for rollback
    const previousTasks = [...tasks];

    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await taskService.updateTaskStatus(task._id, newStatus);
      if (res.data?.success) {
        setActionSuccess(`Task status moved to ${newStatus}.`);
        if (selectedTaskForDetail && selectedTaskForDetail._id === task._id) {
          setSelectedTaskForDetail(res.data.task);
        }
      }
      await loadProgress();
      await loadMilestones();
    } catch (err) {
      console.error('Status change error:', err);
      // Revert optimistic update
      setTasks(previousTasks);
      setActionError(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleDeleteTaskClick = (task) => {
    setItemToDelete({ type: 'task', id: task._id, title: task.title });
    setShowDeleteConfirm(true);
  };

  // ==========================================
  // Milestone Handlers
  // ==========================================
  const handleOpenCreateMilestone = () => {
    setSelectedMilestoneForEdit(null);
    setShowMilestoneModal(true);
  };

  const handleOpenEditMilestone = (milestone) => {
    setSelectedMilestoneForEdit(milestone);
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (milestoneData) => {
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (selectedMilestoneForEdit) {
        await milestoneService.updateMilestone(selectedMilestoneForEdit._id, milestoneData);
        setActionSuccess('Milestone updated successfully.');
      } else {
        await milestoneService.createMilestone(effectiveProjectId, milestoneData);
        setActionSuccess('Milestone created successfully.');
      }
      setShowMilestoneModal(false);
      setSelectedMilestoneForEdit(null);
      await loadMilestones();
      await loadProgress();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save milestone.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMilestoneStatusChange = async (milestone, newStatus) => {
    if (milestone.status === newStatus) return;
    setActionError('');
    setActionSuccess('');
    try {
      await milestoneService.updateMilestoneStatus(milestone._id, newStatus);
      setActionSuccess(`Milestone status updated to ${newStatus}.`);
      await loadMilestones();
      await loadProgress();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to change milestone status.');
    }
  };

  // Owner Exclusive: Save Project Details
  const handleSaveProjectDetails = async (updateData) => {
    if (!isOwner) {
      setActionError('Permission denied. Only the project owner can edit project details.');
      return;
    }
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      await projectService.updateProject(effectiveProjectId, updateData);
      setActionSuccess('Project details successfully updated by Project Owner.');
      setShowProjectEditModal(false);
      await loadWorkspace();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update project details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMilestoneClick = (milestone) => {
    setItemToDelete({ type: 'milestone', id: milestone._id, title: milestone.title });
    setShowDeleteConfirm(true);
  };

  // Delete Confirmation Handler (Tasks & Milestones)
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (itemToDelete.type === 'task') {
        await taskService.deleteTask(itemToDelete.id);
        setActionSuccess(`Task "${itemToDelete.title}" deleted.`);
        if (selectedTaskForDetail?._id === itemToDelete.id) {
          setShowDetailModal(false);
        }
        await loadTasks();
      } else if (itemToDelete.type === 'milestone') {
        await milestoneService.deleteMilestone(itemToDelete.id);
        setActionSuccess(`Milestone "${itemToDelete.title}" deleted and associated tasks unlinked.`);
        await loadMilestones();
        await loadTasks();
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await loadProgress();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Authenticating secure workspace permissions...
        </p>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="p-8 text-center space-y-6 border-rose-200 dark:border-rose-900/50 bg-white dark:bg-cardDark shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workspace Access Denied</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {error.message || 'You must be an active project member or project owner to access this workspace.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to={`/projects/${effectiveProjectId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Project Page</span>
              </Button>
            </Link>
            <Link to="/projects">
              <Button size="sm">Browse Projects</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!workspace || !workspace.project) return null;

  const { project, membership, team = [], activities = [], placeholders = {} } = workspace;

  const roleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'manager':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-primary-100 text-primary-800 border-primary-300 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between animate-fadeIn shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess('')} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50 flex items-center justify-between animate-fadeIn shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {actionError}
          </span>
          <button onClick={() => setActionError('')} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Project Workspace Master Banner */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-white via-slate-50/50 to-primary-50/20 dark:from-cardDark dark:via-cardDark dark:to-primary-950/20 border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                🔒 Protected Workspace
              </span>

              {/* Real-time Connection & Live Presence Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
                {connectionStatus === 'connected' ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Synced</span>
                    {onlineUsers.length > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ({onlineUsers.length} online)
                      </span>
                    )}
                  </span>
                ) : connectionStatus === 'reconnecting' ? (
                  <button
                    onClick={reconnect}
                    title="Click to reconnect"
                    className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Reconnecting...</span>
                  </button>
                ) : (
                  <button
                    onClick={reconnect}
                    title="Click to reconnect"
                    className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Offline (Retry)</span>
                  </button>
                )}
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Status: <strong className="text-slate-800 dark:text-slate-200 uppercase">{project.status}</strong>
              </span>
              <span className="text-xs text-slate-400">• {project.category}</span>

              {/* Owner Authority & Edit Action */}
              {isOwner ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProjectEditModal(true)}
                  className="gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs ml-auto"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Edit Project Details</span>
                </Button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto"
                  title="Only the project owner has authority to update project metadata and sprint settings."
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>🔒 Managed by Project Owner</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {project.title}
            </h1>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            {/* Project Owner & Links Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              {project.owner && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Owner:</span>
                  <Avatar
                    src={project.owner.avatar || project.owner.avatarUrl}
                    name={project.owner.name || 'Owner'}
                    size="xs"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{project.owner.name}</span>
                </div>
              )}

              {(project.githubUrl || project.repoUrl) && (
                <a
                  href={project.githubUrl || project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Repository</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}

              {(project.liveDemoUrl || project.liveUrl) && (
                <a
                  href={project.liveDemoUrl || project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Live Demo</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}
            </div>

            {project.requiredSkills?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {project.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics / User Role Badge & Team Preview */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 backdrop-blur-sm shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Your Role</span>
              <span
                className={`inline-block mt-0.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide border ${roleBadgeStyle(
                  membership.role
                )}`}
              >
                {membership.role}
              </span>
            </div>

            {/* Team Members Avatar Stack */}
            <div className="text-left md:text-right border-l md:border-l-0 md:border-t border-slate-200 dark:border-slate-800 pl-4 md:pl-0 md:pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Active Team ({team.length})
              </span>
              <div className="flex items-center justify-end -space-x-2">
                {team.slice(0, 4).map((m, idx) => (
                  <Avatar
                    key={m.user?._id || idx}
                    src={m.user?.avatar || m.user?.avatarUrl}
                    name={m.user?.name || 'Member'}
                    size="xs"
                    className="ring-2 ring-white dark:ring-slate-900"
                  />
                ))}
                {team.length > 4 && (
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    +{team.length - 4}
                  </span>
                )}
              </div>
            </div>

            {!isOwner && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaveModal(true)}
                  className="text-xs gap-1.5 text-rose-500 hover:text-rose-600 border-rose-200 dark:border-rose-900"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Leave Team</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Phase 2.2 Seven Core Tabs + Chat & Financials) */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'board'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Milestones ({milestones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team ({team.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Team Chat</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'financials'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Contracts & Payments</span>
          </button>
        </div>
      </Card>

      {/* ========================================================== */}
      {/* TAB CONTENT: OVERVIEW DASHBOARD (Phase 2.3) */}
      {/* ========================================================== */}
      {activeTab === 'overview' && (
        <WorkspaceOverviewTab
          project={project}
          progress={progress}
          tasks={tasks}
          milestones={milestones}
          activities={activities}
          team={team}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onCreateTask={handleOpenCreateTask}
          onCreateMilestone={handleOpenCreateMilestone}
          onSelectTask={(task) => {
            setSelectedTaskForDetail(task);
            setShowDetailModal(true);
          }}
          canCreateTask={isElevated || permissions.isMember}
          canCreateMilestone={permissions.canCreateMilestone}
        />
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: TASKS LIST VIEW (Phase 2.5) */}
      {/* ========================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <ProjectProgressWidget progress={progress} loading={loadingTasks && !progress} />

          {/* Task Filters & Control Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks by title or keywords..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2.5 self-end lg:self-auto">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab('board')}
                    title="Switch to Kanban Board view"
                    className="p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all bg-white dark:bg-cardDark text-primary-600 dark:text-primary-400 shadow-xs"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                <Button size="sm" onClick={handleOpenCreateTask} className="gap-1.5 text-xs">
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </Button>
              </div>
            </div>

            {/* Filter Selectors Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters:
              </span>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Assignees</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
                {team.map((m) => (
                  <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                    {m.user?.name || 'Member'}
                  </option>
                ))}
              </select>

              <select
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Milestones</option>
                <option value="none">No Milestone</option>
                {milestones.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>

              {(statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                assigneeFilter !== 'all' ||
                milestoneFilter !== 'all' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setAssigneeFilter('all');
                    setMilestoneFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-semibold text-[11px]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <TaskListView
            tasks={tasks}
            onSelectTask={(task) => {
              setSelectedTaskForDetail(task);
              setShowDetailModal(true);
            }}
            onStatusChange={handleTaskStatusChange}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTaskClick}
            isElevated={isElevated}
            currentUserId={currentUser?._id}
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: TASK KANBAN BOARD (Phase 2.4) */}
      {/* ========================================================== */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          <ProjectProgressWidget progress={progress} loading={loadingTasks && !progress} />

          {/* Task Filters & Control Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks by title or keywords..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2.5 self-end lg:self-auto">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    className="p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all bg-white dark:bg-cardDark text-primary-600 dark:text-primary-400 shadow-xs"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    title="Switch to List view"
                    className="p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                <Button size="sm" onClick={handleOpenCreateTask} className="gap-1.5 text-xs">
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </Button>
              </div>
            </div>

            {/* Filter Selectors Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters:
              </span>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Assignees</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
                {team.map((m) => (
                  <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                    {m.user?.name || 'Member'}
                  </option>
                ))}
              </select>

              <select
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="all">All Milestones</option>
                <option value="none">No Milestone</option>
                {milestones.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>

              {(statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                assigneeFilter !== 'all' ||
                milestoneFilter !== 'all' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setAssigneeFilter('all');
                    setMilestoneFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-semibold text-[11px]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <TaskKanbanBoard
            tasks={tasks}
            onSelectTask={(task) => {
              setSelectedTaskForDetail(task);
              setShowDetailModal(true);
            }}
            onStatusChange={handleTaskStatusChange}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTaskClick}
            onCreateTask={handleOpenCreateTask}
            isElevated={isElevated}
            currentUserId={currentUser?._id}
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: MILESTONES (Phase 2.7) */}
      {/* ========================================================== */}
      {activeTab === 'milestones' && (
        <MilestoneSection
          milestones={milestones}
          onCreateMilestone={handleOpenCreateMilestone}
          onEditMilestone={handleOpenEditMilestone}
          onDeleteMilestone={handleDeleteMilestoneClick}
          onStatusChange={handleMilestoneStatusChange}
          isElevated={isElevated}
        />
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: TEAM ROSTER & GOVERNANCE (Phase 2.9) */}
      {/* ========================================================== */}
      {activeTab === 'team' && (
        <WorkspaceTeamTab
          team={team}
          onlineUsers={onlineUsers}
          isOwner={isOwner}
          currentUserId={currentUser?._id}
          onRoleChange={handleRoleChange}
          onRemoveMemberClick={(m) => {
            setMemberToRemove(m);
            setShowRemoveModal(true);
          }}
          onLeaveTeamClick={() => setShowLeaveModal(true)}
          isProcessing={isProcessing}
        />
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: AUDIT TRAIL (Phase 2.8) */}
      {/* ========================================================== */}
      {activeTab === 'activity' && (
        <WorkspaceActivityTab activities={activities} />
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: PROJECT SETTINGS (Phase 2.10) */}
      {/* ========================================================== */}
      {activeTab === 'settings' && (
        <WorkspaceSettingsTab
          project={project}
          isOwner={isOwner}
          onSaveProject={handleSaveProjectDetails}
          isProcessing={isProcessing}
        />
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: REAL-TIME TEAM CHAT (Phase 6) */}
      {/* ========================================================== */}
      {activeTab === 'chat' && (
        <div className="h-[650px] flex flex-col">
          {loadingChat ? (
            <Card className="flex-1 flex items-center justify-center p-12 glass-card">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </Card>
          ) : (
            <ChatWindow
              conversation={
                projectConversation || {
                  _id: `proj-${effectiveProjectId}`,
                  type: 'project',
                  title: project?.title || 'Project Workspace',
                  project: project,
                  participants: team.map((m) => m.user),
                }
              }
              className="h-full"
            />
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB CONTENT: FINANCIALS & CONTRACTS (Phase 7) */}
      {/* ========================================================== */}
      {activeTab === 'financials' && (
        <FinancialsTab
          projectId={effectiveProjectId}
          currentUser={currentUser}
          isOwner={isOwner}
          teamMembers={team}
        />
      )}

      {/* ========================================================== */}
      {/* TASK MODAL (Create & Edit) */}
      {/* ========================================================== */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTaskForEdit(null);
        }}
        onSubmit={handleSaveTask}
        task={selectedTaskForEdit}
        members={team}
        milestones={milestones}
        isProcessing={isProcessing}
      />

      {/* ========================================================== */}
      {/* TASK DETAIL MODAL */}
      {/* ========================================================== */}
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTaskForDetail(null);
        }}
        task={selectedTaskForDetail}
        onEdit={(task) => {
          setShowDetailModal(false);
          handleOpenEditTask(task);
        }}
        onDelete={(task) => {
          setShowDetailModal(false);
          handleDeleteTaskClick(task);
        }}
        onStatusChange={handleTaskStatusChange}
        isElevated={isElevated}
        currentUserId={currentUser?._id}
      />

      {/* ========================================================== */}
      {/* MILESTONE MODAL (Create & Edit) */}
      {/* ========================================================== */}
      <MilestoneModal
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          setSelectedMilestoneForEdit(null);
        }}
        onSubmit={handleSaveMilestone}
        milestone={selectedMilestoneForEdit}
        isProcessing={isProcessing}
      />

      {/* ========================================================== */}
      {/* PROJECT DETAILS EDIT MODAL (Owner Authority Only) */}
      {/* ========================================================== */}
      <ProjectDetailsEditModal
        isOpen={showProjectEditModal}
        onClose={() => setShowProjectEditModal(false)}
        project={workspace?.project}
        onSave={handleSaveProjectDetails}
        isProcessing={isProcessing}
      />

      {/* ========================================================== */}
      {/* DELETION CONFIRMATION MODAL */}
      {/* ========================================================== */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900 bg-white dark:bg-cardDark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Delete {itemToDelete.type === 'task' ? 'Task' : 'Milestone'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>"{itemToDelete.title}"</strong>?
              {itemToDelete.type === 'milestone' &&
                ' All associated tasks will be safely unlinked from this milestone without being deleted.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REMOVE MEMBER MODAL */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <UserX className="w-5 h-5" />
                <span>Remove Team Member</span>
              </h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setMemberToRemove(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>{memberToRemove.user?.name}</strong> from this project? They
              will immediately lose access to this protected workspace and all active task assignments will be safely unassigned.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Removal Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="e.g., Milestone completed, scope change, or inactivity..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRemoveModal(false);
                  setMemberToRemove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmRemove}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Removal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* LEAVE PROJECT MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                <span>Leave Project Team</span>
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to depart from <strong>{project.title}</strong>? Your active membership will be
              relinquished, workspace access revoked, and your task assignments safely unassigned.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmLeave}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Departure
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspacePage;
