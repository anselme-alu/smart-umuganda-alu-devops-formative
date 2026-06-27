import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MapPin,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/events", label: "Events", Icon: CalendarDays },
  { to: "/admin/users", label: "Users", Icon: Users, adminOnly: true },
  { to: "/admin/locations", label: "Locations", Icon: MapPin, adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const roleBadgeClass: Record<string, string> = {
    admin: "badge-error",
    system_user: "badge-warning",
    user: "badge-info",
  };

  const links = navLinks.filter((l) => !l.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4 sticky top-0 z-50">
        <div className="navbar-start">
          <Link
            to="/dashboard"
            className="btn btn-ghost text-xl font-bold text-primary"
          >
            Smart Umuganda
          </Link>
        </div>

        <div className="navbar-center hidden md:flex gap-1">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`btn btn-ghost btn-sm gap-1.5 ${location.pathname === to ? "btn-active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar-end gap-2">
          {user && (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost flex items-center gap-2 px-3"
              >
                <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={14} className="opacity-60" />
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-56 p-2 shadow"
              >
                <li className="menu-title px-2">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-base-content/60">
                    {user.email}
                  </span>
                  <span
                    className={`badge badge-sm mt-1 ${roleBadgeClass[user.role] ?? "badge-ghost"}`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </li>
                <div className="divider my-0" />
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-error flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden bg-base-100 border-t border-base-200 flex justify-around py-1">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`btn btn-ghost btn-sm flex-col h-auto py-2 gap-0.5 ${location.pathname === to ? "btn-active" : ""}`}
          >
            <Icon size={18} />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>

      <main className="container mx-auto px-4 py-6 max-w-6xl">{children}</main>
    </div>
  );
}
