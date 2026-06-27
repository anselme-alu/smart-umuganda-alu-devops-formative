import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import type { IssueType } from "../../types";

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: "bad_citizen", label: "Bad Citizen Behaviour" },
  { value: "umuganda_absence", label: "Umuganda Absence" },
  { value: "other", label: "Other" },
];

export default function IssueFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IssueType>("other");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/issues", { title, description, type });
      navigate("/issues");
    } catch {
      setError("Failed to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report an Issue</h1>
          <p className="text-base-content/60 mt-1">
            Report community issues for review by local authorities.
          </p>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            {error && (
              <div className="alert alert-error" role="alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Issue Type</legend>
                <select
                  className="select select-bordered w-full"
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType)}
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Title</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Brief summary of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Description</legend>
                <textarea
                  className="textarea textarea-bordered h-32 w-full"
                  placeholder="Provide details about the issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={10}
                />
              </fieldset>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Submit Issue"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate("/issues")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
