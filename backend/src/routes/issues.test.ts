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
import router from "./issues";

function makeChain(result: unknown[]) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain["from"] = vi.fn().mockReturnValue(chain);
  chain["where"] = vi.fn().mockReturnValue(chain);
  chain["limit"] = vi.fn().mockReturnValue(p);
  chain["values"] = vi.fn().mockReturnValue(chain);
  chain["set"] = vi.fn().mockReturnValue(chain);
  chain["returning"] = vi.fn().mockReturnValue(p);
  chain["orderBy"] = vi.fn().mockReturnValue(p);
  chain["then"] = p.then.bind(p);
  chain["catch"] = p.catch.bind(p);
  chain["finally"] = p.finally.bind(p);
  return chain;
}

const mockIssue = {
  id: "issue-1",
  title: "Test Issue",
  description: "This is a test issue description",
  type: "umuganda_absence" as const,
  status: "pending" as const,
  reportedBy: "user-1",
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReply = {
  id: "reply-1",
  issueId: "issue-1",
  userId: "admin-1",
  message: "We are looking into this",
  createdAt: new Date(),
};

const adminHeaders = { Authorization: "Bearer admin-token" };
const systemUserHeaders = { Authorization: "Bearer system-token" };
const userHeaders = { Authorization: "Bearer user-token" };

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

describe("POST /", () => {
  it("creates an issue", async () => {
    vi.mocked(db.insert).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Issue",
        description: "This is a test issue description",
        type: "umuganda_absence",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe("Test Issue");
  });

  it("returns 400 for invalid type", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Issue",
        description: "This is a test issue description",
        type: "invalid_type",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing description", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", type: "other" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for short title", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "AB",
        description: "This is a test issue description",
        type: "other",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Issue",
        description: "This is a test issue description",
        type: "other",
      }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /", () => {
  it("returns all issues for admin", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns only own issues for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/`, { headers: userHeaders });
    expect(res.status).toBe(200);
  });

  it("returns all issues for system_user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "system-1",
      role: "system_user",
    } as never);
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/`, { headers: systemUserHeaders });
    expect(res.status).toBe(200);
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(401);
  });
});

describe("GET /:id", () => {
  it("returns issue with replies for admin", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockIssue]) as never)
      .mockReturnValueOnce(makeChain([mockReply]) as never);
    const res = await fetch(`${baseUrl}/issue-1`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; replies: unknown[] };
    expect(body.title).toBe("Test Issue");
    expect(Array.isArray(body.replies)).toBe(true);
  });

  it("returns 404 when issue not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent`, {
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when user tries to see another user's issue", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "other-user",
      role: "user",
    } as never);
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/issue-1`, { headers: userHeaders });
    expect(res.status).toBe(403);
  });

  it("allows owner user to view own issue", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockIssue]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/issue-1`, { headers: userHeaders });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /:id/status", () => {
  it("updates issue status for admin", async () => {
    vi.mocked(db.update).mockReturnValue(
      makeChain([{ ...mockIssue, status: "reviewed" }]) as never,
    );
    const res = await fetch(`${baseUrl}/issue-1/status`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reviewed" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("reviewed");
  });

  it("updates issue status to reported_to_police", async () => {
    vi.mocked(db.update).mockReturnValue(
      makeChain([{ ...mockIssue, status: "reported_to_police" }]) as never,
    );
    const res = await fetch(`${baseUrl}/issue-1/status`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reported_to_police" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("reported_to_police");
  });

  it("returns 400 for invalid status", async () => {
    const res = await fetch(`${baseUrl}/issue-1/status`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/issue-1/status`, {
      method: "PATCH",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reviewed" }),
    });
    expect(res.status).toBe(403);
  });

  it("allows system_user to update status", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "system-1",
      role: "system_user",
    } as never);
    vi.mocked(db.update).mockReturnValue(
      makeChain([{ ...mockIssue, status: "closed" }]) as never,
    );
    const res = await fetch(`${baseUrl}/issue-1/status`, {
      method: "PATCH",
      headers: { ...systemUserHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when issue not found", async () => {
    vi.mocked(db.update).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent/status`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reviewed" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /:id/replies", () => {
  it("adds a reply for admin", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    vi.mocked(db.insert).mockReturnValue(makeChain([mockReply]) as never);
    const res = await fetch(`${baseUrl}/issue-1/replies`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "We are looking into this" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("We are looking into this");
  });

  it("returns 403 for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/issue-1/replies`, {
      method: "POST",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when issue not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent/replies`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for empty message", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockIssue]) as never);
    const res = await fetch(`${baseUrl}/issue-1/replies`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /:id", () => {
  it("deletes issue for admin", async () => {
    vi.mocked(db.delete).mockReturnValue(
      makeChain([{ id: "issue-1" }]) as never,
    );
    const res = await fetch(`${baseUrl}/issue-1`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Issue deleted");
  });

  it("returns 404 when issue not found", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/issue-1`, {
      method: "DELETE",
      headers: userHeaders,
    });
    expect(res.status).toBe(403);
  });
});
