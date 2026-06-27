import { Link } from "react-router-dom";
import { Users, MapPin, User, Mail, Calendar, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "../../components/Layout";

const roleBadgeClass: Record<string, string> = {
  admin: "badge-error",
  system_user: "badge-warning",
  user: "badge-info",
};

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  system_user: "System User",
  user: "Regular User",
};

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-base-content/60 mt-1">
              Here&apos;s an overview of your account.
            </p>
          </div>
          <span
            className={`badge badge-lg ${roleBadgeClass[user.role] ?? "badge-ghost"}`}
          >
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body gap-3">
              <h2 className="card-title text-base">Account Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User size={15} className="text-base-content/40 shrink-0" />
                  <span className="text-base-content/60 w-20 shrink-0">
                    Name
                  </span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-base-content/40 shrink-0" />
                  <span className="text-base-content/60 w-20 shrink-0">
                    Email
                  </span>
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={15}
                    className="text-base-content/40 shrink-0"
                  />
                  <span className="text-base-content/60 w-20 shrink-0">
                    Role
                  </span>
                  <span
                    className={`badge badge-sm ${roleBadgeClass[user.role] ?? "badge-ghost"}`}
                  >
                    {roleLabel[user.role] ?? user.role}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar
                    size={15}
                    className="text-base-content/40 shrink-0"
                  />
                  <span className="text-base-content/60 w-20 shrink-0">
                    Joined
                  </span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {user.role === "admin" && (
            <>
              <Link
                to="/admin/users"
                className="card bg-primary text-primary-content shadow hover:opacity-90 transition-opacity"
              >
                <div className="card-body gap-3">
                  <Users size={32} strokeWidth={1.5} />
                  <h2 className="card-title">Manage Users</h2>
                  <p className="text-sm opacity-80">
                    View, edit, and manage user accounts and roles.
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/locations"
                className="card bg-secondary text-secondary-content shadow hover:opacity-90 transition-opacity"
              >
                <div className="card-body gap-3">
                  <MapPin size={32} strokeWidth={1.5} />
                  <h2 className="card-title">Manage Locations</h2>
                  <p className="text-sm opacity-80">
                    Configure Rwanda&apos;s administrative hierarchy.
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
