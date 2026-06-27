import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "user-1" }),
  };
});

import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import UserEditPage from "./UserEditPage";

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const adminUser = { ...mockUser, id: "admin-1", role: "admin" as const };

function mockGetByUrl(userData: unknown, locationsData: unknown = []) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    if (u.includes("/users/")) return Promise.resolve({ data: userData });
    if (u.includes("/locations"))
      return Promise.resolve({ data: locationsData });
    return Promise.resolve({ data: {} });
  });
}

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
      <UserEditPage />
    </MemoryRouter>,
  );
}

describe("UserEditPage", () => {
  it("shows loading spinner while fetching", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it('shows "User not found" when API returns no user', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: "Not found" } },
    };
    vi.mocked(api.get).mockRejectedValue(axiosError);
    const { default: axios } = await import("axios");
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("User not found.")).toBeInTheDocument();
    });
  });

  it("renders the form pre-populated with user data", async () => {
    mockGetByUrl(mockUser, []);
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });
  });

  it("submits form and shows success alert", async () => {
    mockGetByUrl(mockUser, []);
    vi.mocked(api.patch).mockResolvedValue({ data: mockUser });
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Changes saved successfully."),
      ).toBeInTheDocument();
    });
    expect(api.patch).toHaveBeenCalledWith(
      "/users/user-1",
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
      }),
    );
  });

  it("shows error when save fails", async () => {
    mockGetByUrl(mockUser, []);
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: "Update failed" } },
    };
    vi.mocked(api.patch).mockRejectedValue(axiosError);
    const { default: axios } = await import("axios");
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("renders location dropdown with locations", async () => {
    const mockLocation = {
      id: "loc-1",
      name: "Northern Province",
      type: "province",
      parentId: null,
      createdAt: "2024-01-01",
    };
    mockGetByUrl(mockUser, [mockLocation]);
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText("Northern Province (province)"),
      ).toBeInTheDocument();
    });
  });

  it('navigates back to users list on success "Back to Users" click', async () => {
    mockGetByUrl(mockUser, []);
    vi.mocked(api.patch).mockResolvedValue({ data: mockUser });
    renderPage();
    await waitFor(() => screen.getByDisplayValue("Test User"));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => screen.getByText("Changes saved successfully."));
    fireEvent.click(screen.getByRole("button", { name: /back to users/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });
});
