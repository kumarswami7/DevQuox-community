import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import {
  Briefcase,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { projectService } from "../services/projectService";

export const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [confirmWithdrawApp, setConfirmWithdrawApp] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getMyApplications();
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setApplications(list);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load your applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const normalizeStatus = (status) => (status ? status.toLowerCase() : "pending");

  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => normalizeStatus(a.status) === "pending").length;
  const acceptedCount = applications.filter((a) => normalizeStatus(a.status) === "accepted").length;
  const rejectedCount = applications.filter((a) => normalizeStatus(a.status) === "rejected").length;
  const withdrawnCount = applications.filter((a) => normalizeStatus(a.status) === "withdrawn").length;

  const handleConfirmWithdraw = async () => {
    if (!confirmWithdrawApp) return;
    const appId = confirmWithdrawApp._id || confirmWithdrawApp.id;
    const projectId =
      confirmWithdrawApp.project?._id ||
      confirmWithdrawApp.project?.id ||
      confirmWithdrawApp.project ||
      confirmWithdrawApp.projectId;

    setWithdrawingId(appId);
    setActionMessage({ type: "", text: "" });

    try {
      // Call application withdrawal endpoint
      if (appId) {
        await projectService.withdrawApplicationById(appId);
      } else if (projectId) {
        await projectService.withdrawMyApplication(projectId);
      }

      setActionMessage({
        type: "success",
        text: `Proposal for "${confirmWithdrawApp.project?.title || "Project"}" withdrawn successfully.`,
      });

      // Update state to mark proposal as withdrawn
      setApplications((prev) =>
        prev.map((app) =>
          (app._id || app.id) === appId ? { ...app, status: "withdrawn" } : app
        )
      );
      setConfirmWithdrawApp(null);
    } catch (err) {
      console.error("Error withdrawing application:", err);
      setActionMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to withdraw application. Please try again.",
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const status = normalizeStatus(app.status);
    if (filterStatus === "all") return true;
    return status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "accepted":
        return (
          <Badge variant="success" className="gap-1 font-bold">
            <CheckCircle className="w-3 h-3" /> Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="danger" className="gap-1 font-bold">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      case "withdrawn":
        return (
          <Badge variant="secondary" className="gap-1 font-bold">
            Withdrawn
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="warning" className="gap-1 font-bold">
            <Clock className="w-3 h-3" /> Under Review
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Proposal Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track status updates, reviews, client feedback, and team onboarding in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link to="/projects">
            <Button variant="accent" size="sm" className="gap-2 shadow-glow-accent">
              <Briefcase className="w-4 h-4" />
              <span>Explore Projects</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage({ type: "", text: "" })}
            className="text-xs font-bold underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card
          onClick={() => setFilterStatus("all")}
          className={`glass-card p-4 space-y-1 cursor-pointer transition-all ${
            filterStatus === "all" ? "border-primary-500 ring-2 ring-primary-500/20" : ""
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</h3>
        </Card>
        <Card
          onClick={() => setFilterStatus("pending")}
          className={`glass-card p-4 space-y-1 cursor-pointer transition-all ${
            filterStatus === "pending" ? "border-amber-500 ring-2 ring-amber-500/20" : ""
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Under Review</p>
          <h3 className="text-2xl font-black text-amber-500">{pendingCount}</h3>
        </Card>
        <Card
          onClick={() => setFilterStatus("accepted")}
          className={`glass-card p-4 space-y-1 cursor-pointer transition-all ${
            filterStatus === "accepted" ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Accepted</p>
          <h3 className="text-2xl font-black text-emerald-500">{acceptedCount}</h3>
        </Card>
        <Card
          onClick={() => setFilterStatus("rejected")}
          className={`glass-card p-4 space-y-1 cursor-pointer transition-all ${
            filterStatus === "rejected" ? "border-rose-500 ring-2 ring-rose-500/20" : ""
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Rejected</p>
          <h3 className="text-2xl font-black text-rose-500">{rejectedCount}</h3>
        </Card>
        <Card
          onClick={() => setFilterStatus("withdrawn")}
          className={`glass-card p-4 space-y-1 cursor-pointer transition-all ${
            filterStatus === "withdrawn" ? "border-slate-500 ring-2 ring-slate-500/20" : ""
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Withdrawn</p>
          <h3 className="text-2xl font-black text-slate-500 dark:text-slate-400">{withdrawnCount}</h3>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Proposals", value: "all", count: totalCount },
          { label: "Under Review", value: "pending", count: pendingCount },
          { label: "Accepted", value: "accepted", count: acceptedCount },
          { label: "Rejected", value: "rejected", count: rejectedCount },
          { label: "Withdrawn", value: "withdrawn", count: withdrawnCount },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterStatus === tab.value
                ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25"
                : "bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your proposal pipeline...</p>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to Load Proposals</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchApplications} variant="primary" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4 glass-card rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No applications match this filter
            </h3>
            <p className="text-xs text-slate-500">
              {filterStatus === "all"
                ? "You haven't submitted any project proposals yet."
                : `There are currently no proposals in "${filterStatus}" status.`}
            </p>
          </div>
          {filterStatus !== "all" ? (
            <Button onClick={() => setFilterStatus("all")} variant="outline" size="sm">
              Show All Applications
            </Button>
          ) : (
            <Link to="/projects">
              <Button variant="primary" size="sm">
                Browse Live Projects
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const appId = app._id || app.id;
            const project = app.project || {};
            const projectTitle = project.title || "Project Application";
            const projectId = project._id || project.id || project || app.projectId;
            const clientName = project.owner?.name || "Project Owner";
            const clientAvatar = project.owner?.avatar;
            const appliedDate = app.createdAt
              ? new Date(app.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recent";
            const statusNorm = normalizeStatus(app.status);
            const canWithdraw = statusNorm === "pending" || statusNorm === "accepted";

            return (
              <Card
                key={appId}
                className="glass-card p-5 hover:border-primary-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-200 dark:border-slate-800"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {projectId ? (
                      <Link
                        to={`/projects/${projectId}`}
                        className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary-500 transition-colors flex items-center gap-1.5"
                      >
                        <span>{projectTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                    ) : (
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {projectTitle}
                      </span>
                    )}
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Avatar src={clientAvatar} name={clientName} size="sm" />
                      <span>{clientName}</span>
                    </div>
                    <span>•</span>
                    <span>Submitted: {appliedDate}</span>
                    {app.proposedRate && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-emerald-500">
                          Proposed: {app.proposedRate}
                        </span>
                      </>
                    )}
                  </div>

                  {app.coverLetter && (
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                        "{app.coverLetter}"
                      </p>
                    </div>
                  )}

                  {/* Owner Feedback / Decision Reason */}
                  {app.decisionReason && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40 text-xs">
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        Owner Note:{" "}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400">
                        {app.decisionReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link to="/messages">
                    <Button size="sm" variant="outline" className="gap-1.5 shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </Button>
                  </Link>

                  {projectId && (
                    <Link to={`/projects/${projectId}`}>
                      <Button size="sm" variant="primary" className="gap-1.5 shadow-sm">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>View Project</span>
                      </Button>
                    </Link>
                  )}

                  {canWithdraw && (
                    <button
                      onClick={() => setConfirmWithdrawApp(app)}
                      disabled={withdrawingId === appId}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                      title="Withdraw Proposal"
                    >
                      {withdrawingId === appId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {confirmWithdrawApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-cardDark rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Withdraw Proposal?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to withdraw your proposal for{" "}
              <strong className="text-slate-900 dark:text-white">
                {confirmWithdrawApp.project?.title || "this project"}
              </strong>
              ?
              {normalizeStatus(confirmWithdrawApp.status) === "accepted" && (
                <span className="block mt-2 text-rose-600 dark:text-rose-400 font-medium">
                  Note: You were accepted into this project. Withdrawing will remove you from the
                  project team and reopen the seat for other applicants.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmWithdrawApp(null)}
                disabled={Boolean(withdrawingId)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
                disabled={Boolean(withdrawingId)}
                isLoading={Boolean(withdrawingId)}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Withdrawal</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
