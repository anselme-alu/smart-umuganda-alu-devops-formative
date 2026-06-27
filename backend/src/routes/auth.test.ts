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

vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

import { db } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import router from "./auth";

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
const mockUserWithHash = { ...mockUser, passwordHash: "hashed-password" };

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
  vi.mocked(jwt.sign).mockReturnValue("mock-token" as never);
});

describe("POST /register", () => {
  it("returns 400 for invalid body (missing name)", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "test@example.com",
        password: "short",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockUserWithHash]) as never,
    );
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Email already in use");
  });

  it("returns 201 with token and user on success", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    vi.mocked(db.insert).mockReturnValue(makeChain([mockUser]) as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "new@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      token: string;
      user: { email: string };
    };
    expect(body.token).toBe("mock-token");
    expect(body.user.email).toBe("test@example.com");
  });

  it("returns 500 when insert returns no user", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    vi.mocked(db.insert).mockReturnValue(makeChain([]) as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
    const res = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "new@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(500);
  });
});

describe("POST /login", () => {
  it("returns 400 for invalid body", async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "notanemail", password: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "none@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when password does not match", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockUserWithHash]) as never,
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpass",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("returns token and user without passwordHash on success", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockUserWithHash]) as never,
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      user: Record<string, unknown>;
    };
    expect(body.token).toBe("mock-token");
    expect(body.user).not.toHaveProperty("passwordHash");
    expect(body.user["email"]).toBe("test@example.com");
  });
});

describe("GET /me", () => {
  it("returns 401 without Authorization header", async () => {
    const res = await fetch(`${baseUrl}/me`);
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid");
    });
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: "Bearer bad-token" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(404);
  });

  it("returns user without passwordHash on success", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockUserWithHash]) as never,
    );
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["email"]).toBe("test@example.com");
    expect(body).not.toHaveProperty("passwordHash");
  });
});
