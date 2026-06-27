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
import AnnouncementsPage from "./AnnouncementsPage";

const baseUser = {
  id: "1",
  name: "Jean Baptiste",
  email: "jean@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

const mockAnnouncement = {
  id: "ann-1",
  title: "Community Meeting",
  content: "There will be a meeting this Saturday",
  createdBy: "admin-1",
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  isRead: false,
};

function mockGetByUrl(announcementsData: unknown, rejectAnnouncements = false) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    if (u === "/announcements") {
      if (rejectAnnouncements)
        return Promise.reject(new Error("Network error"));
      return Promise.resolve({ data: announcementsData });
    }
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

describe("AnnouncementsPage", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("renders announcements list", async () => {
    mockGetByUrl([mockAnnouncement]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Community Meeting")).toBeInTheDocument();
    });
  });

  it("shows empty state when no announcements", async () => {
    mockGetByUrl([]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("No announcements yet.")).toBeInTheDocument();
    });
  });

  it("shows error on API failure", async () => {
    mockGetByUrl(null, true);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load announcements."),
      ).toBeInTheDocument();
    });
  });

  it("does not show New Announcement button for regular user", async () => {
    mockGetByUrl([]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("New Announcement")).not.toBeInTheDocument();
    });
  });

  it("shows New Announcement button for admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...baseUser, role: "admin" },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockGetByUrl([]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("New Announcement")).toBeInTheDocument();
    });
  });

  it("shows New Announcement button for system_user", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...baseUser, role: "system_user" },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockGetByUrl([]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("New Announcement")).toBeInTheDocument();
    });
  });

  it("marks announcement as read when clicking Mark read", async () => {
    mockGetByUrl([mockAnnouncement]);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Marked as read" },
    });

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Mark read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark read"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/announcements/ann-1/read");
    });
  });

  it("marks announcement as unread when clicking Mark unread", async () => {
    const readAnnouncement = { ...mockAnnouncement, isRead: true };
    mockGetByUrl([readAnnouncement]);
    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { message: "Marked as unread" },
    });

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Mark unread")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark unread"));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/announcements/ann-1/read");
    });
  });
});
