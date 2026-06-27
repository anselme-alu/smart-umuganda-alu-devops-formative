import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

import { useAuth } from "../../contexts/AuthContext";
import RegisterPage from "./RegisterPage";

const mockRegister = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
  });
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

function fillStep1(
  name = "Test User",
  email = "test@example.com",
  password = "password123",
  confirm = "password123",
) {
  fireEvent.change(screen.getByPlaceholderText("Jean de Dieu Nkurunziza"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByPlaceholderText("Repeat your password"), {
    target: { value: confirm },
  });
}

describe("RegisterPage", () => {
  it("renders step 1 fields and step indicator", () => {
    renderRegister();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Jean de Dieu Nkurunziza"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Minimum 8 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Repeat your password"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    renderRegister();
    fillStep1("Test User", "test@example.com", "password123", "different123");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    renderRegister();
    fillStep1("Test User", "test@example.com", "short", "short");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters."),
      ).toBeInTheDocument();
    });
  });

  it("advances to step 2 on valid step 1 submission", async () => {
    renderRegister();
    fillStep1();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Choose your location")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /skip for now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete/i }),
    ).toBeInTheDocument();
  });

  it("calls register without locationId when skipping step 2", async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegister();
    fillStep1();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByRole("button", { name: /skip for now/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "Test User",
        "test@example.com",
        "password123",
        undefined,
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("goes back to step 1 when back button is clicked", async () => {
    renderRegister();
    fillStep1();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByRole("button", { name: /back/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });
  });

  it("shows generic error on non-axios failure and returns to step 1", async () => {
    mockRegister.mockRejectedValue(new Error("network"));
    renderRegister();
    fillStep1();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByRole("button", { name: /skip for now/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred."),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("shows sign in link", () => {
    renderRegister();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });
});
