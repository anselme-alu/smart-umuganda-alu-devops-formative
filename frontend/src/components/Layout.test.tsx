import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";
import Layout from "./Layout";

const adminUser = {
  id: "1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const regularUser = {
  ...adminUser,
  name: "Regular User",
  role: "user" as const,
};

beforeEach(() => {
  vi.mocked(api.get).mockResolvedValue({ data: { unreadCount: 0 } });
});

describe("Layout", () => {
  it("shows admin nav links for admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Locations").length).toBeGreaterThan(0);
  });

  it("hides admin nav links for regular users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Locations")).not.toBeInTheDocument();
  });

  it("shows events navigation for regular users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Events").length).toBeGreaterThan(0);
  });

  it("shows user first name in the navbar", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("calls logout and navigates to login on logout click", () => {
    const mockLogout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Logout"));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
  });

  it("renders children", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>My child content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText("My child content")).toBeInTheDocument();
  });

  it("shows unread count badge when there are unread announcements", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { unreadCount: 3 } });
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    });
  });

  it("shows Issues and Announcements nav links for all users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: regularUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Issues").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Announcements").length).toBeGreaterThan(0);
  });
});
