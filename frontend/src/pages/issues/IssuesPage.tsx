import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, AlertCircle } from "lucide-react";
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

const STATUS_LABEL: Record<IssueStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  reported_to_police: "Reported to Police",
  closed: "Closed",
};

const TYPE_LABEL: Record<string, string> = {
  bad_citizen: "Bad Citizen",
  umuganda_absence: "Umuganda Absence",
  other: "Other",
};

export default function IssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Issue[]>("/issues")
      .then((res) => setIssues(res.data))
      .catch(() => setError("Failed to load issues."))
      .finally(() => setLoading(false));
  }, []);

  const isStaff = user?.role === "admin" || user?.role === "system_user";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isStaff ? "All Issues" : "My Issues"}
            </h1>
            <p className="text-base-content/60 mt-1">
              {isStaff
                ? "Review and manage community-reported issues."
                : "Track the issues you have reported."}
            </p>
          </div>
          <Link to="/issues/new" className="btn btn-primary btn-sm gap-1.5">
            <Plus size={16} />
            Report Issue
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center py-12 text-center">
              <AlertCircle size={40} className="text-base-content/30" />
              <p className="text-base-content/60 mt-2">No issues found.</p>
              <Link to="/issues/new" className="btn btn-primary btn-sm mt-3">
                Report your first issue
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="card bg-base-100 shadow overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover">
                    <td className="font-medium max-w-xs truncate">
                      {issue.title}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {TYPE_LABEL[issue.type] ?? issue.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${STATUS_BADGE[issue.status]}`}
                      >
                        {STATUS_LABEL[issue.status]}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
