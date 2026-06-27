import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { createServer, type Server } from "node:http";
import express from "express";

vi.mock("../db/index", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

import { db } from "../db/index";
import jwt from "jsonwebtoken";
import router from "./users";

function makeChain(result: unknown[]) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain["from"] = vi.fn().mockReturnValue(chain);
  chain["where"] = vi.fn().mockReturnValue(chain);
  chain["limit"] = vi.fn().mockReturnValue(p);
  chain["values"] = vi.fn().mockReturnValue(chain);
  chain["set"] = vi.fn().mockReturnValue(chain);
  chain["returning"] = vi.fn().mockReturnValue(p);
  chain["then"] = p.then.bind(p);
  chain["catch"] = p.catch.bind(p);
  chain["finally"] = p.finally.bind(p);
  return chain;
}

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const adminUser = { ...mockUser, id: "admin-1", role: "admin" as const };

const adminHeaders = { Authorization: "Bearer admin-token" };

let server: Server;
let baseUrl: string;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      process.env["JWT_SECRET"] = "test-secret";
      const app = express();
      app.use(express.json());
      app.use("/", router);
      server = createServer(app);
      server.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    }),
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    }),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(jwt.verify).mockReturnValue({
    userId: "admin-1",
    role: "admin",
  } as never);
});

describe("GET /", () => {
  it("returns all users", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockUser, adminUser]) as never,
    );
    const res = await fetch(`${baseUrl}/`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/`, {
      headers: { Authorization: "Bearer user-token" },
    });
    expect(res.status).toBe(403);
  });
});

describe("GET /:id", () => {
  it("returns a user by id", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockUser]) as never);
    const res = await fetch(`${baseUrl}/user-1`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email: string };
    expect(body.email).toBe("test@example.com");
  });

  it("returns 404 when user does not exist", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent-id`, {
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /:id", () => {
  it("returns 400 for invalid role value", async () => {
    const res = await fetch(`${baseUrl}/user-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "superuser" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when no fields provided", async () => {
    const res = await fetch(`${baseUrl}/user-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when user does not exist", async () => {
    vi.mocked(db.update).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent-id`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates and returns the user", async () => {
    const updated = { ...mockUser, name: "Updated Name" };
    vi.mocked(db.update).mockReturnValue(makeChain([updated]) as never);
    const res = await fetch(`${baseUrl}/user-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string };
    expect(body.name).toBe("Updated Name");
  });
});

describe("DELETE /:id", () => {
  it("returns 400 when deleting own account", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "admin",
    } as never);
    const res = await fetch(`${baseUrl}/user-1`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Cannot delete your own account");
  });

  it("returns 404 when user does not exist", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent-id`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it("deletes user and returns message", async () => {
    vi.mocked(db.delete).mockReturnValue(
      makeChain([{ id: "user-1" }]) as never,
    );
    const res = await fetch(`${baseUrl}/user-1`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("User deleted");
  });
});

describe("POST /:id/make-system-user", () => {
  it("returns 404 when user does not exist", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent/make-system-user`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to change an admin", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([adminUser]) as never);
    const res = await fetch(`${baseUrl}/admin-1/make-system-user`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("admin");
  });

  it("promotes user to system_user", async () => {
    const promoted = { ...mockUser, role: "system_user" as const };
    vi.mocked(db.select).mockReturnValue(makeChain([mockUser]) as never);
    vi.mocked(db.update).mockReturnValue(makeChain([promoted]) as never);
    const res = await fetch(`${baseUrl}/user-1/make-system-user`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { role: string };
    expect(body.role).toBe("system_user");
  });
});
