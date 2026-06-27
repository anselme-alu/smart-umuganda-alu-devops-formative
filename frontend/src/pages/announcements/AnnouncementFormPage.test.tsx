import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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
import AnnouncementFormPage from "./AnnouncementFormPage";

const baseUser = {
  id: "1",
  name: "Jean Baptiste",
  email: "jean@example.com",
  role: "admin" as const,
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

const mockAnnouncement = {
  id: "ann-1",
  title: "Community Meeting",
  content: "There will be a meeting",
  createdBy: "admin-1",
  locationId: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: baseUser,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    return Promise.resolve({ data: {} });
  });
});

describe("AnnouncementFormPage (create mode)", () => {
  function renderCreate() {
    return render(
      <MemoryRouter>
        <AnnouncementFormPage mode="create" />
      </MemoryRouter>,
    );
  }

  it("renders create form with correct heading", () => {
    renderCreate();
    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
  });

  it("renders title and content inputs", () => {
    renderCreate();
    expect(
      screen.getByPlaceholderText("Announcement title"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your announcement here"),
    ).toBeInTheDocument();
  });

  it("creates announcement on submit", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockAnnouncement });
    renderCreate();

    fireEvent.change(screen.getByPlaceholderText("Announcement title"), {
      target: { value: "Community Meeting" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Write your announcement here"),
      { target: { value: "Meeting details here" } },
    );
    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/announcements", {
        title: "Community Meeting",
        content: "Meeting details here",
      });
    });
  });

  it("clicks Cancel button to navigate away", () => {
    renderCreate();
    const cancelBtn = screen.getByText("Cancel");
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
  });

  it("shows error when create fails", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Server error"));
    renderCreate();

    fireEvent.change(screen.getByPlaceholderText("Announcement title"), {
      target: { value: "Community Meeting" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Write your announcement here"),
      { target: { value: "Meeting details" } },
    );
    fireEvent.click(screen.getByText("Publish"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create announcement."),
      ).toBeInTheDocument();
    });
  });
});

describe("AnnouncementFormPage (edit mode)", () => {
  function renderEdit() {
    return render(
      <MemoryRouter initialEntries={["/announcements/ann-1/edit"]}>
        <Routes>
          <Route
            path="/announcements/:id/edit"
            element={<AnnouncementFormPage mode="edit" />}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows loading while fetching", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
    renderEdit();
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("renders edit form with pre-filled data", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      if (u.includes("/announcements/ann-1"))
        return Promise.resolve({ data: mockAnnouncement });
      return Promise.resolve({ data: {} });
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText("Edit Announcement")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Community Meeting")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("There will be a meeting"),
      ).toBeInTheDocument();
    });
  });

  it("shows Save Changes button in edit mode", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      if (u.includes("/announcements/ann-1"))
        return Promise.resolve({ data: mockAnnouncement });
      return Promise.resolve({ data: {} });
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });
  });

  it("calls patch on submit in edit mode", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      if (u.includes("/announcements/ann-1"))
        return Promise.resolve({ data: mockAnnouncement });
      return Promise.resolve({ data: {} });
    });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockAnnouncement });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/announcements/ann-1",
        expect.objectContaining({
          title: "Community Meeting",
        }),
      );
    });
  });

  it("shows error when update fails", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      if (u.includes("/announcements/ann-1"))
        return Promise.resolve({ data: mockAnnouncement });
      return Promise.resolve({ data: {} });
    });
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("Server error"));

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to update announcement."),
      ).toBeInTheDocument();
    });
  });

  it("shows error when fetching fails", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const u = url as string;
      if (u.includes("unread-count"))
        return Promise.resolve({ data: { unreadCount: 0 } });
      return Promise.reject(new Error("Not found"));
    });

    renderEdit();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load announcement."),
      ).toBeInTheDocument();
    });
  });
});
