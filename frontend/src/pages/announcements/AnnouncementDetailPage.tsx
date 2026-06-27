import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, Edit, Trash2 } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import type { Announcement } from "../../types";

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "system_user";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!id) return;
    api
      .get<Announcement>(`/announcements/${id}`)
      .then((res) => {
        setAnnouncement(res.data);
        if (!res.data.isRead) {
          void api.post(`/announcements/${id}/read`);
        }
      })
      .catch(() => setError("Announcement not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!announcement) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${announcement.id}`);
      navigate("/announcements");
    } catch {
      setError("Failed to delete announcement.");
      setDeleting(false);
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

  if (error || !announcement) {
    return (
      <Layout>
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error ?? "Announcement not found."}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          className="btn btn-ghost btn-sm gap-1.5"
          onClick={() => navigate("/announcements")}
        >
          <ArrowLeft size={16} />
          Back to Announcements
        </button>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{announcement.title}</h1>
                <p className="text-sm text-base-content/60 mt-1">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isStaff && (
                <div className="flex gap-2">
                  <Link
                    to={`/announcements/${announcement.id}/edit`}
                    className="btn btn-ghost btn-sm gap-1"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                  {isAdmin && (
                    <button
                      className="btn btn-error btn-sm gap-1"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="divider my-0" />

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{announcement.content}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
