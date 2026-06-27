import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Send } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import type { Issue, IssueStatus } from "../../types";

const STATUS_BADGE: Record<IssueStatus, string> = {
  pending: "badge-warning",
  reviewed: "badge-info",
  reported_to_police: "badge-error",
  closed: "badge-success",
};

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "reported_to_police", label: "Reported to Police" },
  { value: "closed", label: "Closed" },
];

const TYPE_LABEL: Record<string, string> = {
  bad_citizen: "Bad Citizen Behaviour",
  umuganda_absence: "Umuganda Absence",
  other: "Other",
};

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "system_user";

  useEffect(() => {
    if (!id) return;
    api
      .get<Issue>(`/issues/${id}`)
      .then((res) => setIssue(res.data))
      .catch(() => setError("Issue not found or access denied."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    setStatusLoading(true);
    try {
      const res = await api.patch<Issue>(`/issues/${issue.id}/status`, {
        status,
      });
      setIssue((prev) => (prev ? { ...prev, ...res.data } : prev));
    } catch {
      setError("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !replyMessage.trim()) return;
    setReplyLoading(true);
    setReplyError(null);
    try {
      const res = await api.post(`/issues/${issue.id}/replies`, {
        message: replyMessage,
      });
      setIssue((prev) =>
        prev ? { ...prev, replies: [...(prev.replies ?? []), res.data] } : prev,
      );
      setReplyMessage("");
    } catch {
      setReplyError("Failed to send reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </Layout>
    );
  }

  if (error || !issue) {
    return (
      <Layout>
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error ?? "Issue not found."}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          className="btn btn-ghost btn-sm gap-1.5"
          onClick={() => navigate("/issues")}
        >
          <ArrowLeft size={16} />
          Back to Issues
        </button>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{issue.title}</h1>
                <p className="text-sm text-base-content/60 mt-1">
                  {TYPE_LABEL[issue.type] ?? issue.type} &middot;{" "}
                  {new Date(issue.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`badge ${STATUS_BADGE[issue.status]}`}>
                {STATUS_OPTIONS.find((o) => o.value === issue.status)?.label ??
                  issue.status}
              </span>
            </div>

            <p className="text-base-content/80">{issue.description}</p>

            {isStaff && (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Update Status</legend>
                <select
                  className="select select-bordered select-sm w-full max-w-xs"
                  value={issue.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as IssueStatus)
                  }
                  disabled={statusLoading}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <h2 className="card-title text-base">
              Replies ({issue.replies?.length ?? 0})
            </h2>

            {issue.replies?.length === 0 && (
              <p className="text-sm text-base-content/50">No replies yet.</p>
            )}

            <div className="space-y-3">
              {issue.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-base-200 rounded-lg p-3 text-sm"
                >
                  <p>{reply.message}</p>
                  <p className="text-xs text-base-content/50 mt-1">
                    {new Date(reply.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {isStaff && (
              <form onSubmit={handleReply} className="space-y-3 pt-2">
                {replyError && (
                  <div className="alert alert-error text-sm" role="alert">
                    <AlertCircle size={14} />
                    <span>{replyError}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Write a reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm gap-1"
                    disabled={replyLoading || !replyMessage.trim()}
                  >
                    {replyLoading ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Send size={14} />
                    )}
                    Reply
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
