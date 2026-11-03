import React, { useState } from "react";
import { Award, ExternalLink, Calendar, Plus, Trash2, X } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const CertificationSection = ({
  certifications = [],
  isOwn = false,
  onAddCertification,
  onDeleteCertification,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [credentialId, setCredentialId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) return;

    if (onAddCertification) {
      await onAddCertification({
        name: name.trim(),
        issuer: issuer.trim(),
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        credentialUrl: credentialUrl.trim(),
        credentialId: credentialId.trim(),
      });
    }

    setName("");
    setIssuer("");
    setIssueDate("");
    setExpiryDate("");
    setCredentialUrl("");
    setCredentialId("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-primary-500" />
          Certifications & Accreditations
        </h3>

        {isOwn && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Certification
          </Button>
        )}
      </div>

      {certifications.length === 0 ? (
        <Card className="p-6 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-cardDark/50 border-dashed">
          No professional certifications listed.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certifications.map((cert, idx) => (
            <Card
              key={cert._id || idx}
              className="p-4 glass-card relative group hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {isOwn && onDeleteCertification && (
                <button
                  onClick={() => onDeleteCertification(cert._id)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove certification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500 shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {cert.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {cert.issuer}
                    </p>
                  </div>
                </div>

                {cert.issueDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Issued {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      {cert.expiryDate && ` • Expires ${new Date(cert.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}
                    </span>
                  </div>
                )}

                {cert.credentialId && (
                  <p className="text-[10px] text-slate-400">
                    Credential ID: <span className="font-mono">{cert.credentialId}</span>
                  </p>
                )}
              </div>

              {cert.credentialUrl && (
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-500 hover:underline"
                  >
                    Verify Credential <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Certification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-500" /> Add Certification
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Certification Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  required
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Credential Verification URL
                </label>
                <input
                  type="url"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Credential ID / Serial
                </label>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="e.g. AWS-1234567"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Certification
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CertificationSection;
