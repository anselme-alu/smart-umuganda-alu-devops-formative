import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import type { Announcement } from "../../types";

interface FormProps {
  mode: "create" | "edit";
}

export default function AnnouncementFormPage({ mode }: FormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api
      .get<Announcement>(`/announcements/${id}`)
      .then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
      })
      .catch(() => setError("Failed to load announcement."))
      .finally(() => setFetching(false));
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "create") {
        await api.post("/announcements", { title, content });
      } else {
        await api.patch(`/announcements/${id}`, { title, content });
      }
      navigate("/announcements");
    } catch {
      setError(
        mode === "create"
          ? "Failed to create announcement."
          : "Failed to update announcement.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === "create" ? "New Announcement" : "Edit Announcement"}
          </h1>
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
                <legend className="fieldset-legend">Title</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Content</legend>
                <textarea
                  className="textarea textarea-bordered h-40 w-full"
                  placeholder="Write your announcement here"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
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
                  ) : mode === "create" ? (
                    "Publish"
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate("/announcements")}
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
