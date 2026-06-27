import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Bell, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import type { Announcement } from "../../types";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.role === "admin" || user?.role === "system_user";

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch(() => setError("Failed to load announcements."))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.post(`/announcements/${id}/read`);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
      );
    } catch {
      // silently fail
    }
  };

  const markUnread = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}/read`);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: false } : a)),
      );
    } catch {
      // silently fail
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-base-content/60 mt-1">
              Community announcements from local authorities.
            </p>
          </div>
          {isStaff && (
            <Link
              to="/announcements/new"
              className="btn btn-primary btn-sm gap-1.5"
            >
              <Plus size={16} />
              New Announcement
            </Link>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center py-12 text-center">
              <Bell size={40} className="text-base-content/30" />
              <p className="text-base-content/60 mt-2">No announcements yet.</p>
            </div>
          </div>
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`card bg-base-100 shadow transition-opacity ${a.isRead ? "opacity-70" : ""}`}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!a.isRead && (
                          <span className="badge badge-primary badge-xs" />
                        )}
                        <Link
                          to={`/announcements/${a.id}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {a.title}
                        </Link>
                      </div>
                      <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                        {a.content}
                      </p>
                      <p className="text-xs text-base-content/40 mt-2">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {a.isRead ? (
                        <button
                          className="btn btn-ghost btn-xs gap-1"
                          onClick={() => markUnread(a.id)}
                          title="Mark as unread"
                        >
                          Mark unread
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs gap-1 text-success"
                          onClick={() => markRead(a.id)}
                          title="Mark as read"
                        >
                          <CheckCircle size={14} />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
