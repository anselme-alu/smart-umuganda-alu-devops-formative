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
import router from "./announcements";

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

const mockAnnouncement = {
  id: "ann-1",
  title: "Community Meeting",
  content: "There will be a community meeting this Saturday",
  createdBy: "admin-1",
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe("GET /unread-count", () => {
  it("returns unread count when no reads exist", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([]) as never)
      .mockReturnValueOnce(makeChain([{ value: 5 }]) as never);
    const res = await fetch(`${baseUrl}/unread-count`, {
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unreadCount: number };
    expect(typeof body.unreadCount).toBe("number");
  });

  it("returns unread count when some reads exist", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([{ announcementId: "ann-1" }]) as never)
      .mockReturnValueOnce(makeChain([{ value: 2 }]) as never);
    const res = await fetch(`${baseUrl}/unread-count`, {
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unreadCount: number };
    expect(typeof body.unreadCount).toBe("number");
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/unread-count`);
    expect(res.status).toBe(401);
  });
});

describe("GET /", () => {
  it("returns announcements with isRead flag", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/`, { headers: userHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ isRead: boolean }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("isRead");
  });

  it("marks announcement as read when in reads list", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(makeChain([{ announcementId: "ann-1" }]) as never);
    const res = await fetch(`${baseUrl}/`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ isRead: boolean }>;
    expect(body[0]?.isRead).toBe(true);
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(401);
  });
});

describe("POST /", () => {
  it("creates announcement for admin", async () => {
    vi.mocked(db.insert).mockReturnValue(
      makeChain([mockAnnouncement]) as never,
    );
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Community Meeting",
        content: "There will be a community meeting this Saturday",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe("Community Meeting");
  });

  it("creates announcement for system_user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "system-1",
      role: "system_user",
    } as never);
    vi.mocked(db.insert).mockReturnValue(
      makeChain([mockAnnouncement]) as never,
    );
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...systemUserHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Community Meeting",
        content: "There will be a community meeting this Saturday",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("returns 403 for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Community Meeting",
        content: "There will be a community meeting this Saturday",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for short title", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "AB", content: "Valid content" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty content", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid Title", content: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /:id", () => {
  it("returns announcement with isRead false when not read", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/ann-1`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { isRead: boolean };
    expect(body.isRead).toBe(false);
  });

  it("returns announcement with isRead true when read", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(
        makeChain([
          {
            id: "read-1",
            announcementId: "ann-1",
            userId: "admin-1",
            readAt: new Date(),
          },
        ]) as never,
      );
    const res = await fetch(`${baseUrl}/ann-1`, { headers: adminHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { isRead: boolean };
    expect(body.isRead).toBe(true);
  });

  it("returns 404 when not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent`, {
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /:id", () => {
  it("updates announcement for admin", async () => {
    vi.mocked(db.update).mockReturnValue(
      makeChain([{ ...mockAnnouncement, title: "Updated Title" }]) as never,
    );
    const res = await fetch(`${baseUrl}/ann-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe("Updated Title");
  });

  it("returns 400 when no fields provided", async () => {
    const res = await fetch(`${baseUrl}/ann-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 for regular user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/ann-1`, {
      method: "PATCH",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when not found", async () => {
    vi.mocked(db.update).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /:id", () => {
  it("deletes announcement for admin", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([{ id: "ann-1" }]) as never);
    const res = await fetch(`${baseUrl}/ann-1`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Announcement deleted");
  });

  it("returns 403 for system_user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "system-1",
      role: "system_user",
    } as never);
    const res = await fetch(`${baseUrl}/ann-1`, {
      method: "DELETE",
      headers: systemUserHeaders,
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when not found", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /:id/read", () => {
  it("marks announcement as read", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(makeChain([]) as never);
    vi.mocked(db.insert).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/ann-1/read`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Marked as read");
  });

  it("returns 200 when already marked as read", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeChain([mockAnnouncement]) as never)
      .mockReturnValueOnce(
        makeChain([
          {
            id: "read-1",
            announcementId: "ann-1",
            userId: "admin-1",
            readAt: new Date(),
          },
        ]) as never,
      );
    const res = await fetch(`${baseUrl}/ann-1/read`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Already marked as read");
  });

  it("returns 404 when announcement not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/nonexistent/read`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /:id/read", () => {
  it("marks announcement as unread", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/ann-1/read`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Marked as unread");
  });

  it("returns 401 without token", async () => {
    const res = await fetch(`${baseUrl}/ann-1/read`, { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
