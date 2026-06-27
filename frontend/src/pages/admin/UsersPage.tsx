import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, UserCheck, X } from "lucide-react";
import axios from "axios";
import api from "../../api/client";
import Layout from "../../components/Layout";
import type { User, Role } from "../../types/index";

const roleBadgeClass: Record<Role, string> = {
  admin: "badge-error",
  system_user: "badge-warning",
  user: "badge-info",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Role | "all">("all");
  const [actionError, setActionError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to load users.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleMakeSystemUser = async (id: string) => {
    setActionError("");
    try {
      await api.post(`/users/${id}/make-system-user`);
      await fetchUsers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.error ?? "Action failed.");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionError("");
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      await fetchUsers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.error ?? "Delete failed.");
      }
    }
  };

  const filtered =
    filter === "all" ? users : users.filter((u) => u.role === filter);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex gap-2 flex-wrap">
            {(["all", "admin", "user", "system_user"] as const).map((r) => (
              <button
                key={r}
                className={`btn btn-sm ${filter === r ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilter(r)}
              >
                {r === "all" ? "All" : r.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {actionError && (
          <div role="alert" className="alert alert-error">
            <span>{actionError}</span>
            <button
              className="btn btn-sm btn-ghost ml-auto"
              onClick={() => setActionError("")}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-base-content/50"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-base-content/70">{user.email}</td>
                    <td>
                      <span className={`badge ${roleBadgeClass[user.role]}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/users/${user.id}/edit`}
                          className="btn btn-xs btn-ghost btn-square"
                          title="Edit user"
                        >
                          <Pencil size={14} />
                        </Link>
                        {user.role === "user" && (
                          <button
                            className="btn btn-xs btn-ghost btn-square text-warning"
                            title="Make system user"
                            onClick={() => handleMakeSystemUser(user.id)}
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-ghost btn-square text-error"
                          title="Delete user"
                          onClick={() => setDeleteId(user.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete this user? This cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteId(null)} />
        </div>
      )}
    </Layout>
  );
}
