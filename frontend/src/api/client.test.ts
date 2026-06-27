import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  localStorage.clear();
});

describe("api client", () => {
  it("exports an axios instance with baseURL configured", async () => {
    const api = (await import("./client")).default;
    expect(api).toBeDefined();
    expect(typeof api.get).toBe("function");
    expect(typeof api.post).toBe("function");
    expect(typeof api.patch).toBe("function");
    expect(typeof api.delete).toBe("function");
  });

  it("request interceptor attaches Authorization header when token is present", async () => {
    localStorage.setItem("token", "my-jwt-token");
    const api = (await import("./client")).default;
    let capturedHeaders: Record<string, string> = {};
    const mockAdapter = (config: { headers: Record<string, string> }) => {
      capturedHeaders = config.headers;
      return Promise.resolve({ data: {}, status: 200, headers: {}, config });
    };
    await api.get("/test", { adapter: mockAdapter as never });
    expect(capturedHeaders["Authorization"]).toBe("Bearer my-jwt-token");
  });

  it("request interceptor does not attach Authorization when token is absent", async () => {
    const api = (await import("./client")).default;
    let capturedHeaders: Record<string, string> = {};
    const mockAdapter = (config: { headers: Record<string, string> }) => {
      capturedHeaders = config.headers;
      return Promise.resolve({ data: {}, status: 200, headers: {}, config });
    };
    await api.get("/test", { adapter: mockAdapter as never });
    expect(capturedHeaders["Authorization"]).toBeUndefined();
  });
});
