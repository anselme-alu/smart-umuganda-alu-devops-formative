import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, vi } from "vitest";

vi.mock("./api/client", () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error("no server")),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import App from "./App";

describe("App", () => {
  it("redirects to login page when not authenticated", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });
  });

  it("renders the Smart Umuganda brand name", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText("Smart Umuganda").length).toBeGreaterThan(0);
    });
  });
});
