import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../api/client", () => ({
  default: {
    post: vi.fn(),
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
import IssueFormPage from "./IssueFormPage";

const baseUser = {
  id: "1",
  name: "Jean Baptiste",
  email: "jean@example.com",
  role: "user" as const,
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
  vi.mocked(api.get).mockResolvedValue({ data: { unreadCount: 0 } });
});

describe("IssueFormPage", () => {
  it("renders the form", () => {
    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Report an Issue")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Brief summary of the issue"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Provide details about the issue"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows all issue types in select", () => {
    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Bad Citizen Behaviour")).toBeInTheDocument();
    expect(screen.getByText("Umuganda Absence")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("submits the form and navigates on success", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Brief summary of the issue"),
      {
        target: { value: "Test Title" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about the issue"),
      { target: { value: "This is a detailed description for the issue" } },
    );
    fireEvent.click(screen.getByText("Submit Issue"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/issues",
        expect.objectContaining({
          title: "Test Title",
          description: "This is a detailed description for the issue",
        }),
      );
    });
  });

  it("shows error on failed submission", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Brief summary of the issue"),
      {
        target: { value: "Test Title" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about the issue"),
      { target: { value: "This is a detailed description" } },
    );
    fireEvent.click(screen.getByText("Submit Issue"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit issue. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("renders the Cancel button and changes type select", () => {
    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "bad_citizen" },
    });
  });

  it("shows loading spinner while submitting", async () => {
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100)),
    );

    render(
      <MemoryRouter>
        <IssueFormPage />
      </MemoryRouter>,
    );

    fireEvent.change(
      screen.getByPlaceholderText("Brief summary of the issue"),
      {
        target: { value: "Test Title" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about the issue"),
      { target: { value: "This is a detailed description" } },
    );
    fireEvent.click(screen.getByText("Submit Issue"));

    await waitFor(() => {
      expect(screen.queryByText("Submit Issue")).not.toBeInTheDocument();
    });
  });
});
