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
} from 'lucide-react';
import { projectService } from '../services/projectService';

export const MyProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

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

                <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link to={`/projects/${proj._id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 shadow-sm text-xs">
                      <Users className="w-4 h-4" />
                      <span>Review Applicants</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
    </div>
  );
};

export default MyProjectsPage;
