import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

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
import AnnouncementDetailPage from "./AnnouncementDetailPage";

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

function renderWithRoute(role = "user") {
  vi.mocked(useAuth).mockReturnValue({
    user: { ...baseUser, role: role as "user" | "admin" | "system_user" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/announcements/ann-1"]}>
      <Routes>
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockGetByUrl(annData: unknown, rejectAnn = false) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    if (u.includes("/announcements/ann-1")) {
      if (rejectAnn) return Promise.reject(new Error("Not found"));
      return Promise.resolve({ data: annData });
    }
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AnnouncementDetailPage", () => {
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

  it("shows error when announcement not found", async () => {
    mockGetByUrl(null, true);
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText("Announcement not found.")).toBeInTheDocument();
    });
  });

  it("renders announcement details", async () => {
    mockGetByUrl(mockAnnouncement);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRoute("user");

    await waitFor(() => {
      expect(screen.getByText("Community Meeting")).toBeInTheDocument();
      expect(
        screen.getByText("There will be a meeting this Saturday"),
      ).toBeInTheDocument();
    });
  });

  it("auto-marks as read when not yet read", async () => {
    mockGetByUrl({ ...mockAnnouncement, isRead: false });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRoute("user");

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/announcements/ann-1/read");
    });
  });

  it("does not call mark-read when already read", async () => {
    mockGetByUrl({ ...mockAnnouncement, isRead: true });
    renderWithRoute("user");

    await waitFor(() => {
      expect(screen.getByText("Community Meeting")).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows Edit and Delete buttons for admin", async () => {
    mockGetByUrl(mockAnnouncement);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRoute("admin");

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("shows Edit but not Delete for system_user", async () => {
    mockGetByUrl(mockAnnouncement);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    renderWithRoute("system_user");

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });
  });

  it("deletes announcement when Delete is clicked by admin", async () => {
    mockGetByUrl(mockAnnouncement);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    renderWithRoute("admin");

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/announcements/ann-1");
    });
  });

  it("shows error when delete fails", async () => {
    mockGetByUrl(mockAnnouncement);
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    vi.mocked(api.delete).mockRejectedValueOnce(new Error("Server error"));
    renderWithRoute("admin");

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to delete announcement."),
      ).toBeInTheDocument();
    });
  });
});
