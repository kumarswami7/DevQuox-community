import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Rocket,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  FolderKanban,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { ProjectDetailsEditModal } from '../components/workspace/ProjectDetailsEditModal';

export const MyProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingProject, setEditingProject] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${projectTitle}"? This cannot be undone.`)) return;
    try {
      setDeletingId(projectId);
      setActionError('');
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setActionSuccess(`"${projectTitle}" was successfully deleted.`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProjectEdit = async (payload) => {
    if (!editingProject?._id) return;
    try {
      setIsSavingEdit(true);
      setActionError('');
      const res = await projectService.updateProject(editingProject._id, payload);
      const updated = res.data?.project || res.data?.data || res.data;
      setProjects((prev) => prev.map((p) => (p._id === editingProject._id ? { ...p, ...updated } : p)));
      setEditingProject(null);
      setActionSuccess('Project details updated successfully!');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update project.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getMyProjects();
      const list = res.data?.projects || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setProjects(list);
    } catch (err) {
      console.error('Failed to load owned projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const totalProjects = projects.length;
  const openCount = projects.filter((p) => p.status === 'open').length;
  const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  const filtered = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500 shadow-sm">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Posted Projects
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your published project postings, review incoming applicants, and build your team
            </p>
          </div>
        </div>
        <Link to="/projects/create">
          <Button variant="primary" size="sm" className="gap-2 shadow-glow-primary">
            <Plus className="w-4 h-4" />
            <span>Post New Project</span>
          </Button>
        </Link>
      </div>

      {/* Action Banners */}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Projects</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalProjects}</h3>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Actively Open</p>
          <h3 className="text-2xl font-black text-emerald-500">{openCount}</h3>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">In Progress</p>
          <h3 className="text-2xl font-black text-primary-500">{inProgressCount}</h3>
        </Card>
        <Card className="glass-card p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</p>
          <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300">{completedCount}</h3>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'open', 'in_progress', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              filterStatus === st
                ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/25'
                : 'bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching your projects from database...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((proj) => {
            const accepted = proj.acceptedApplicantsCount || (proj.members ? proj.members.length : 0);
            const capacity = proj.teamSize || 1;
            const isFull = accepted >= capacity;

            return (
              <Card
                key={proj._id}
                className="p-5 hover:border-primary-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/projects/${proj._id}`}
                      className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary-500 transition-colors"
                    >
                      {proj.title}
                    </Link>
                    <Badge
                      variant={
                        proj.status === 'open'
                          ? 'success'
                          : proj.status === 'in_progress'
                          ? 'primary'
                          : proj.status === 'completed'
                          ? 'secondary'
                          : 'danger'
                      }
                    >
                      {proj.status.replace('_', ' ')}
                    </Badge>
                    {((proj.applicationStatus || 'open') === 'open' && proj.status === 'open') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span><span className="hidden sm:inline">Applications </span>Open</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span><span className="hidden sm:inline">Applications </span>Closed</span>
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-400">• {proj.category}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-bold text-emerald-500">{proj.budget}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary-500" />
                      Team Capacity: {accepted} / {capacity} filled
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {proj.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setEditingProject(proj)}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all shadow-xs"
                    title="Edit project details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj._id, proj.title)}
                    disabled={deletingId === proj._id}
                    className="w-8 h-8 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-all shadow-xs"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link to={`/projects/${proj._id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 shadow-sm text-xs h-8 px-3 rounded-xl">
                      <Users className="w-3.5 h-3.5" />
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16 space-y-3 p-8 border-dashed">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No projects found in this category
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to find developers or team collaborators? Create your project idea and start receiving proposals!
          </p>
          <Link to="/projects/create">
            <Button variant="primary" size="sm" className="mt-2">
              Post Your First Project
            </Button>
          </Link>
        </Card>
      )}

      {/* Edit Project Details Modal */}
      {editingProject && (
        <ProjectDetailsEditModal
          isOpen={Boolean(editingProject)}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onSave={handleSaveProjectEdit}
          isProcessing={isSavingEdit}
        />
      )}
    </div>
  );
};

export default MyProjectsPage;
