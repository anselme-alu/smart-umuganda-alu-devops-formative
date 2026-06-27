import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
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
import IssueDetailPage from "./IssueDetailPage";

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
  description: "A test issue description",
  type: "umuganda_absence" as const,
  status: "pending" as const,
  reportedBy: "1",
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  replies: [],
};

function renderWithRoute(role = "user") {
  vi.mocked(useAuth).mockReturnValue({
    user: { ...baseUser, role: role as "user" | "admin" | "system_user" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/issues/issue-1"]}>
      <Routes>
        <Route path="/issues/:id" element={<IssueDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockGetByUrl(issueData: unknown, rejectIssue = false) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    if (u.includes("/issues/issue-1")) {
      if (rejectIssue) return Promise.reject(new Error("Not found"));
      return Promise.resolve({ data: issueData });
    }
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("IssueDetailPage", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    renderWithRoute();
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("shows error when issue not found", async () => {
    mockGetByUrl(null, true);
    renderWithRoute();

    await waitFor(() => {
      expect(
        screen.getByText("Issue not found or access denied."),
      ).toBeInTheDocument();
    });
  });

  it("renders issue details for regular user", async () => {
    mockGetByUrl(mockIssue);
    renderWithRoute("user");

    await waitFor(() => {
      expect(screen.getByText("Community Issue")).toBeInTheDocument();
      expect(screen.getByText("A test issue description")).toBeInTheDocument();
    });
  });

  it("does not show reply form for regular user", async () => {
    mockGetByUrl(mockIssue);
    renderWithRoute("user");

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Write a reply..."),
      ).not.toBeInTheDocument();
    });
  });

  it("shows reply form and status dropdown for admin", async () => {
    mockGetByUrl(mockIssue);
    renderWithRoute("admin");

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Write a reply..."),
      ).toBeInTheDocument();
      expect(screen.getByText("Update Status")).toBeInTheDocument();
    });
  });

  it("submits a reply successfully for admin", async () => {
    const mockReply = {
      id: "reply-1",
      issueId: "issue-1",
      userId: "admin-1",
      message: "Working on it",
      createdAt: "2024-01-15T00:00:00.000Z",
    };
    mockGetByUrl(mockIssue);
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockReply });

    renderWithRoute("admin");

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Write a reply..."),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Write a reply..."), {
      target: { value: "Working on it" },
    });
    fireEvent.click(screen.getByText("Reply"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/issues/issue-1/replies", {
        message: "Working on it",
      });
    });
  });

  it("shows replies when they exist", async () => {
    const issueWithReply = {
      ...mockIssue,
      replies: [
        {
          id: "reply-1",
          issueId: "issue-1",
          userId: "admin-1",
          message: "We are reviewing this",
          createdAt: "2024-01-16T00:00:00.000Z",
        },
      ],
    };
    mockGetByUrl(issueWithReply);
    renderWithRoute("user");

    await waitFor(() => {
      expect(screen.getByText("We are reviewing this")).toBeInTheDocument();
    });
  });

  it("shows reply error on failure", async () => {
    mockGetByUrl(mockIssue);
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Server error"));

    renderWithRoute("admin");

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Write a reply..."),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Write a reply..."), {
      target: { value: "Some reply" },
    });
    fireEvent.click(screen.getByText("Reply"));

    await waitFor(() => {
      expect(screen.getByText("Failed to send reply.")).toBeInTheDocument();
    });
  });

  it("updates status when dropdown changes", async () => {
    const updatedIssue = { ...mockIssue, status: "reviewed" as const };
    mockGetByUrl(mockIssue);
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updatedIssue });

    renderWithRoute("admin");

    await waitFor(() => {
      expect(screen.getByText("Update Status")).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(statusSelect, { target: { value: "reviewed" } });

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(`/issues/${mockIssue.id}/status`, {
        status: "reviewed",
      });
    });
  });

  it("shows error when status update fails", async () => {
    mockGetByUrl(mockIssue);
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("Server error"));

    renderWithRoute("admin");

    await waitFor(() => {
      expect(screen.getByText("Update Status")).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(statusSelect, { target: { value: "closed" } });

    await waitFor(() => {
      expect(screen.getByText("Failed to update status.")).toBeInTheDocument();
    });
  });
});
