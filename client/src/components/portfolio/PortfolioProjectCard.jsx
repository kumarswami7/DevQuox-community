import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ExternalLink, Github, CheckCircle2, Calendar, Lock, Edit2, Trash2, Layers } from "lucide-react";
import { TechnologyIcon } from "../skills/TechnologyIcon";

export const PortfolioProjectCard = ({
  project,
  isOwn = false,
  onEdit,
  onDelete,
}) => {
  const isDevConnect = project.source === "devconnect" || project.isVerified;
  const techList = project.technologies?.length > 0 ? project.technologies : project.skills || [];

  return (
    <Card className="glass-card flex flex-col justify-between h-full group relative overflow-hidden border-slate-200/90 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="space-y-3.5">
        {/* Top Badges: Category & DevConnect Verified / Visibility */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 uppercase tracking-wider">
              {project.category || "Project"}
            </span>

            {isDevConnect && (
              <Badge variant="success" className="gap-1 text-[10px] py-0.5">
                <CheckCircle2 className="w-3 h-3" /> Devquox Verified
              </Badge>
            )}

            {project.inProgress && (
              <Badge variant="warning" className="text-[10px] py-0.5">
                In Progress
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {project.visibility === "private" && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            )}

            {isOwn && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(project)}
                    className="p-1 text-slate-400 hover:text-primary-500 rounded-md transition-colors"
                    title="Edit project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(project._id || project.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail if provided */}
        {project.thumbnail && (
          <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Project Title & Role */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
            {project.title}
          </h3>
          {project.role && (
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400 mt-0.5">
              Role: {project.role}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {project.description || "No description provided."}
        </p>

        {/* Contribution Details */}
        {project.contributionDescription && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
              Key Contribution:
            </span>
            <p className="line-clamp-2 leading-relaxed">{project.contributionDescription}</p>
          </div>
        )}

        {/* Dates if provided */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Started"}{" "}
              —{" "}
              {project.inProgress
                ? "Present"
                : project.endDate
                ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                : "Completed"}
            </span>
          </div>
        )}

        {/* Skills / Tech Stack Chips */}
        {techList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techList.map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                <TechnologyIcon name={tech} size="xs" />
                <span>{tech}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Links: Repo & Demo */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> Code
            </a>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:underline transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
            </a>
          )}
        </div>

        {isDevConnect && project.projectRef && (
          <span className="text-[10px] text-slate-400 font-medium">
            Devquox Project
          </span>
        )}
      </div>
    </Card>
  );
};

export default PortfolioProjectCard;
