import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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
import LocationsPage from "./LocationsPage";

const adminUser = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const mockProvince = {
  id: "loc-1",
  name: "Northern Province",
  type: "province" as const,
  parentId: null,
  createdAt: "2024-01-01",
};

const mockDistrict = {
  id: "loc-2",
  name: "Burera District",
  type: "district" as const,
  parentId: "loc-1",
  createdAt: "2024-01-01",
};

afterEach(() => {
  vi.restoreAllMocks();
});

function mockGetByUrl(locationsData: unknown) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    return Promise.resolve({ data: locationsData });
  });
}

let locationsCallCount = 0;
function mockGetByUrlSequential(firstData: unknown, secondData: unknown) {
  locationsCallCount = 0;
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const u = url as string;
    if (u.includes("unread-count"))
      return Promise.resolve({ data: { unreadCount: 0 } });
    locationsCallCount++;
    return Promise.resolve({
      data: locationsCallCount <= 1 ? firstData : secondData,
    });
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
      <LocationsPage />
    </MemoryRouter>,
  );
}

describe("LocationsPage", () => {
  it("shows loading spinner initially", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("shows empty state for active tab", async () => {
    mockGetByUrl([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No provinces found/i)).toBeInTheDocument();
    });
  });

  it("renders location list for active tab", async () => {
    mockGetByUrl([mockProvince, mockDistrict]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Northern Province")).toBeInTheDocument();
    });
    expect(screen.queryByText("Burera District")).not.toBeInTheDocument();
  });

  it("switches tab to district and shows district list", async () => {
    mockGetByUrl([mockProvince, mockDistrict]);
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByRole("button", { name: "district" }));
    expect(screen.getByText("Burera District")).toBeInTheDocument();
    // Northern Province still appears as the parent name in the district row
    // but the province row itself is hidden — check the district's type badge instead
    expect(screen.getAllByText("district").length).toBeGreaterThan(0);
  });

  it("shows parent name in table row", async () => {
    mockGetByUrl([mockProvince, mockDistrict]);
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByRole("button", { name: "district" }));
    expect(screen.getByText("Northern Province")).toBeInTheDocument();
  });

  it('opens add location modal when "Add Location" button is clicked', async () => {
    mockGetByUrl([]);
    renderPage();
    await waitFor(() => screen.getByText(/No provinces found/i));
    fireEvent.click(screen.getByRole("button", { name: /add location/i }));
    // After click, the modal opens with a heading and a name input
    expect(
      screen.getByRole("heading", { name: "Add Location" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter province name"),
    ).toBeInTheDocument();
  });

  it("closes modal when cancel is clicked", async () => {
    mockGetByUrl([]);
    renderPage();
    await waitFor(() => screen.getByText(/No provinces found/i));
    fireEvent.click(screen.getByRole("button", { name: /add location/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Enter province name"),
      ).not.toBeInTheDocument();
    });
  });

  it("creates a province on form submit", async () => {
    mockGetByUrlSequential([], [mockProvince]);
    vi.mocked(api.post).mockResolvedValue({ data: mockProvince });
    renderPage();
    await waitFor(() => screen.getByText(/No provinces found/i));
    fireEvent.click(screen.getByRole("button", { name: /add location/i }));
    fireEvent.change(screen.getByPlaceholderText("Enter province name"), {
      target: { value: "Northern Province" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/locations",
        expect.objectContaining({
          name: "Northern Province",
          type: "province",
        }),
      );
    });
  });

  it("opens edit modal with pre-filled name", async () => {
    mockGetByUrl([mockProvince]);
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByTitle("Edit"));
    expect(screen.getByDisplayValue("Northern Province")).toBeInTheDocument();
    expect(screen.getByText("Edit Northern Province")).toBeInTheDocument();
  });

  it("updates a location on edit submit", async () => {
    mockGetByUrlSequential(
      [mockProvince],
      [{ ...mockProvince, name: "Updated Province" }],
    );
    vi.mocked(api.patch).mockResolvedValue({
      data: { ...mockProvince, name: "Updated Province" },
    });
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByTitle("Edit"));
    fireEvent.change(screen.getByDisplayValue("Northern Province"), {
      target: { value: "Updated Province" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/locations/loc-1",
        expect.objectContaining({
          name: "Updated Province",
        }),
      );
    });
  });

  it("shows delete confirmation modal", async () => {
    mockGetByUrl([mockProvince]);
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByTitle("Delete"));
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
  });

  it("deletes a location and refreshes", async () => {
    mockGetByUrlSequential([mockProvince], []);
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByTitle("Delete"));
    // Modal opens — click Delete within the modal-box
    await waitFor(() => screen.getByText("Confirm Delete"));
    const modalBox = screen.getByText("Confirm Delete").closest(".modal-box");
    fireEvent.click(
      within(modalBox as HTMLElement).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/locations/loc-1");
    });
  });

  it("shows parent selector when creating a district", async () => {
    mockGetByUrl([mockProvince]);
    renderPage();
    await waitFor(() => screen.getByText("Northern Province"));
    fireEvent.click(screen.getByRole("button", { name: /add location/i }));
    // Change the type select — target by its current display value 'province'
    const typeSelect = screen.getByDisplayValue("province");
    fireEvent.change(typeSelect, { target: { value: "district" } });
    // Parent province selector should now appear
    await waitFor(() => {
      expect(screen.getByText(/Select province/i)).toBeInTheDocument();
    });
    const parentOptions = screen.getAllByRole("option");
    expect(
      parentOptions.some((o) => o.textContent?.includes("Northern Province")),
    ).toBe(true);
  });

  it("shows form error on failed save", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: "Save failed" } },
    };
    mockGetByUrl([]);
    vi.mocked(api.post).mockRejectedValue(axiosError);
    const { default: axios } = await import("axios");
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    renderPage();
    await waitFor(() => screen.getByText(/No provinces found/i));
    fireEvent.click(screen.getByRole("button", { name: /add location/i }));
    fireEvent.change(screen.getByPlaceholderText("Enter province name"), {
      target: { value: "Test Province" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
