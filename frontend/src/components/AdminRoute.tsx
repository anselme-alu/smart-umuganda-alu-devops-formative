import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
