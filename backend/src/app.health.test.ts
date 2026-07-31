import { describe, it, expect, afterAll } from "vitest";
import type { Server } from "node:http";
import { app } from "./app";

describe("GET /health", () => {
  let server: Server;

  afterAll(() => {
    server?.close();
  });

  it("returns service metadata for load balancers and smoke tests", async () => {
    server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server to listen on a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = (await response.json()) as {
      ok: boolean;
      service: string;
      version: string;
      uptimeSeconds: number;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("smart-umuganda-api");
    expect(body.version).toBe("1.0.0");
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
