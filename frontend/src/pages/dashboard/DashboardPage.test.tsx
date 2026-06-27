import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => vi.fn() };
});

import { useAuth } from "../../contexts/AuthContext";
import DashboardPage from "./DashboardPage";

const baseUser = {
  id: "1",
  name: "Jean Baptiste",
  email: "jean@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

describe("DashboardPage", () => {
  it("returns null when no user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("greets user by first name", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Welcome back, Jean!")).toBeInTheDocument();
  });

  it("shows user account info", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    // Email and name appear in both the navbar dropdown and the Account Info card
    expect(screen.getAllByText("jean@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jean Baptiste").length).toBeGreaterThan(0);
  });

  it("shows admin action cards for admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...baseUser, role: "admin" },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(screen.getByText("Manage Locations")).toBeInTheDocument();
  });

  it("hides admin action cards for regular users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Manage Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Locations")).not.toBeInTheDocument();
  });

  it("displays the role badge for regular user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    // "Regular User" appears in both the top badge and the account info card
    expect(screen.getAllByText("Regular User").length).toBeGreaterThan(0);
  });
});
