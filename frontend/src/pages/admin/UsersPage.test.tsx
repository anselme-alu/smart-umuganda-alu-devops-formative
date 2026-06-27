import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => vi.fn() };
});

import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import UsersPage from "./UsersPage";

const adminUser = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const regularUser = {
  id: "user-1",
  name: "Regular User",
  email: "user@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: adminUser,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe("UsersPage", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("renders user list after loading", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [adminUser, regularUser] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    // "Admin User" appears in the navbar + table, use getAllByText
    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
  });

  it('shows "No users found" when list is empty', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  it("shows error alert when fetch fails", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: "Server error" } },
    };
    vi.mocked(api.get).mockRejectedValue(axiosError);
    const { default: axios } = await import("axios");
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("filters users by role when filter button clicked", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [adminUser, regularUser] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "admin" }));
    // regular user email should be hidden after filtering for admin
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
    // admin user is in table (and navbar), so getAllByText works
    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
  });

  it("shows delete confirmation modal when delete button clicked", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [regularUser] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Regular User")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle("Delete user"));
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
  });

  it("closes delete modal on cancel", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [regularUser] });
    renderPage();
    await waitFor(() => screen.getByText("Regular User"));
    fireEvent.click(screen.getByTitle("Delete user"));
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
    });
  });

  it("deletes user and refreshes list", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [regularUser] })
      .mockResolvedValueOnce({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    renderPage();
    await waitFor(() => screen.getByText("Regular User"));
    fireEvent.click(screen.getByTitle("Delete user"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/users/user-1");
    });
  });

  it("shows make-system-user button for regular users", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [regularUser] });
    renderPage();
    await waitFor(() => screen.getByText("Regular User"));
    expect(screen.getByTitle("Make system user")).toBeInTheDocument();
  });

  it("promotes user to system_user", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [regularUser] })
      .mockResolvedValueOnce({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderPage();
    await waitFor(() => screen.getByText("Regular User"));
    fireEvent.click(screen.getByTitle("Make system user"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/users/user-1/make-system-user");
    });
  });
});
