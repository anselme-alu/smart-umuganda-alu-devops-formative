import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "../api/client";

function TestConsumer() {
  const { user, isLoading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? "loading" : "ready"}</span>
      <span data-testid="user">{user ? user.email : "null"}</span>
      <button onClick={() => login("a@b.com", "pass")}>login</button>
      <button onClick={() => register("Name", "a@b.com", "pass")}>
        register
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it("starts loading and shows null user when no token", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("no token"));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("fetches current user when token is in localStorage", async () => {
    localStorage.setItem("token", "existing-token");
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@example.com");
    });
  });

  it("clears token when /auth/me fails", async () => {
    localStorage.setItem("token", "bad-token");
    vi.mocked(api.get).mockRejectedValue(new Error("unauthorized"));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });
});

describe("login", () => {
  it("sets token and user on successful login", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("no token"));
    vi.mocked(api.post).mockResolvedValue({
      data: { token: "new-token", user: mockUser },
    });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    await act(async () => {
      screen.getByText("login").click();
    });
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(screen.getByTestId("user").textContent).toBe("test@example.com");
  });
});

describe("register", () => {
  it("sets token and user on successful registration", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("no token"));
    vi.mocked(api.post).mockResolvedValue({
      data: { token: "reg-token", user: mockUser },
    });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    await act(async () => {
      screen.getByText("register").click();
    });
    expect(localStorage.getItem("token")).toBe("reg-token");
    expect(screen.getByTestId("user").textContent).toBe("test@example.com");
  });
});

describe("logout", () => {
  it("clears user and token", async () => {
    localStorage.setItem("token", "some-token");
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@example.com");
    });
    act(() => {
      screen.getByText("logout").click();
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });
});

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const BadComponent = () => {
      useAuth();
      return null;
    };
    expect(() => render(<BadComponent />)).toThrow(
      "useAuth must be used within AuthProvider",
    );
    consoleError.mockRestore();
  });
});
