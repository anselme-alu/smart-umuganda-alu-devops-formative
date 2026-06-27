import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return { ...mod, useNavigate: () => mockNavigate };
});

import { useAuth } from "../../contexts/AuthContext";
import LoginPage from "./LoginPage";

const mockLogin = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
  });
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("renders heading and form fields", () => {
    renderLogin();
    expect(screen.getByText("Smart Umuganda")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows register link", () => {
    renderLogin();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("calls login with email and password on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error message when login fails with axios error", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: "Invalid credentials" } },
    };
    mockLogin.mockRejectedValue(axiosError);
    // Make axios.isAxiosError return true for this object
    const { default: axios } = await import("axios");
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows generic error when login throws non-axios error", async () => {
    mockLogin.mockRejectedValue(new Error("network error"));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("An unexpected error occurred."),
      ).toBeInTheDocument();
    });
  });
});
