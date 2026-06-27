import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
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
import IssuesPage from "./IssuesPage";

const baseUser = {
  id: "1",
  name: "Jean Baptiste",
  email: "jean@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

const mockIssue = {
  id: "issue-1",
  title: "Community Issue",
  description: "A test issue",
  type: "umuganda_absence" as const,
  status: "pending" as const,
  reportedBy: "1",
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

function mockGetByUrl(overrides: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    if (u === "/issues")
      return Promise.resolve({ data: overrides["/issues"] ?? [] });
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: baseUser,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
});

describe("IssuesPage", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("renders list of issues for regular user", async () => {
    mockGetByUrl({ "/issues": [mockIssue] });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Community Issue")).toBeInTheDocument();
    });
    expect(screen.getByText("My Issues")).toBeInTheDocument();
  });

  it("shows 'All Issues' title for admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...baseUser, role: "admin" },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockGetByUrl({ "/issues": [] });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("All Issues")).toBeInTheDocument();
    });
  });

  it("shows empty state when no issues", async () => {
    mockGetByUrl({ "/issues": [] });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No issues found.")).toBeInTheDocument();
    });
  });

  it("shows error alert on API failure", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      return Promise.reject(new Error("Network error"));
    });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load issues.")).toBeInTheDocument();
    });
  });

  it("renders correct status badge for pending issue", async () => {
    mockGetByUrl({ "/issues": [mockIssue] });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  it("renders reported_to_police status label", async () => {
    const policeIssue = { ...mockIssue, status: "reported_to_police" as const };
    mockGetByUrl({ "/issues": [policeIssue] });

    render(
      <MemoryRouter>
        <IssuesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Reported to Police")).toBeInTheDocument();
    });
  });
});
