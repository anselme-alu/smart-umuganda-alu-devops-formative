import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import api from "../../api/client";
import Layout from "../../components/Layout";
import type { User, Location, Role } from "../../types/index";

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user" as Role,
    locationId: "" as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<User>(`/users/${id}`),
      api.get<Location[]>("/locations"),
    ])
      .then(([userRes, locRes]) => {
        const u = userRes.data;
        setUser(u);
        setForm({
          name: u.name,
          email: u.email,
          role: u.role,
          locationId: u.locationId,
        });
        setLocations(locRes.data);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error ?? "Failed to load user.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setSuccess(false);
    setIsSaving(true);
    try {
      await api.patch(`/users/${id}`, {
        name: form.name,
        email: form.email,
        role: form.role,
        locationId: form.locationId || null,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to save changes.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="alert alert-error">
          <span>User not found.</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/users" className="btn btn-ghost btn-sm gap-1">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="alert" className="alert alert-success">
            <span>Changes saved successfully.</span>
            <button
              className="btn btn-sm btn-ghost ml-auto"
              onClick={() => navigate("/admin/users")}
            >
              Back to Users
            </button>
          </div>
        )}

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Full Name</legend>
                <input
                  id="name"
                  type="text"
                  className="input input-bordered w-full"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  minLength={2}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email</legend>
                <input
                  id="email"
                  type="email"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Role</legend>
                <select
                  id="role"
                  className="select select-bordered w-full"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as Role }))
                  }
                >
                  <option value="user">User</option>
                  <option value="system_user">System User</option>
                  <option value="admin">Admin</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Assigned Location</legend>
                <select
                  id="location"
                  className="select select-bordered w-full"
                  value={form.locationId ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      locationId: e.target.value || null,
                    }))
                  }
                >
                  <option value="">— No location assigned —</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
                <p className="label">Optional</p>
              </fieldset>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <Link to="/admin/users" className="btn btn-ghost">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
