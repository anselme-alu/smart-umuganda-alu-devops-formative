import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../contexts/AuthContext";
import AdminRoute from "./AdminRoute";

const adminUser = {
  id: "1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const regularUser = { ...adminUser, role: "user" as const };

describe("AdminRoute", () => {
  it("redirects to dashboard when user is not admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<div>Admin Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });

  it("redirects to dashboard when user is system_user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...adminUser, role: "system_user" },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<div>Admin Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders child route when user is admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<div>Admin Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });
});
