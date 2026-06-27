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
import router from "./locations";

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

const PROVINCE_ID = "550e8400-e29b-41d4-a716-446655440001";
const DISTRICT_ID = "550e8400-e29b-41d4-a716-446655440002";
const NONEXISTENT_ID = "550e8400-e29b-41d4-a716-446655440099";

const mockProvince = {
  id: PROVINCE_ID,
  name: "Northern Province",
  type: "province" as const,
  parentId: null,
  createdAt: new Date(),
};

const mockDistrict = {
  id: DISTRICT_ID,
  name: "Burera District",
  type: "district" as const,
  parentId: PROVINCE_ID,
  createdAt: new Date(),
};

const userHeaders = { Authorization: "Bearer user-token" };
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
  it("returns all locations", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockProvince, mockDistrict]) as never,
    );
    const res = await fetch(`${baseUrl}/`, { headers: userHeaders });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toHaveLength(2);
  });

  it("returns locations filtered by type", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockProvince]) as never);
    const res = await fetch(`${baseUrl}/?type=province`, {
      headers: userHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { type: string }[];
    expect(body[0]?.type).toBe("province");
  });

  it("returns locations filtered by type and parentId", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockDistrict]) as never);
    const res = await fetch(
      `${baseUrl}/?type=district&parentId=${PROVINCE_ID}`,
      { headers: userHeaders },
    );
    expect(res.status).toBe(200);
  });

  it("returns all locations without token (public endpoint for registration)", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockProvince, mockDistrict]) as never,
    );
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
  });

  it("falls through to all locations when type is invalid", async () => {
    vi.mocked(db.select).mockReturnValue(
      makeChain([mockProvince, mockDistrict]) as never,
    );
    const res = await fetch(`${baseUrl}/?type=unknown`, {
      headers: userHeaders,
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /:id", () => {
  it("returns a location by id", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockProvince]) as never);
    const res = await fetch(`${baseUrl}/${PROVINCE_ID}`, {
      headers: userHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string };
    expect(body.name).toBe("Northern Province");
  });

  it("returns 404 when location not found", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/${NONEXISTENT_ID}`, {
      headers: userHeaders,
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /", () => {
  it("returns 400 for invalid body", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "X", type: "invalid-type" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when province has a parent", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Northern Province",
        type: "province",
        parentId: PROVINCE_ID,
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Province cannot have a parent");
  });

  it("returns 400 when district is missing a parent", async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Burera District", type: "district" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("parent province");
  });

  it("returns 404 when parentId does not exist", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Burera District",
        type: "district",
        parentId: NONEXISTENT_ID,
      }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when parent type is wrong", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockDistrict]) as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Burera District",
        type: "district",
        parentId: DISTRICT_ID,
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("must be a province");
  });

  it("creates a province successfully", async () => {
    vi.mocked(db.insert).mockReturnValue(makeChain([mockProvince]) as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Northern Province", type: "province" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { name: string };
    expect(body.name).toBe("Northern Province");
  });

  it("creates a district with valid parent", async () => {
    vi.mocked(db.select).mockReturnValue(makeChain([mockProvince]) as never);
    vi.mocked(db.insert).mockReturnValue(makeChain([mockDistrict]) as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Burera District",
        type: "district",
        parentId: PROVINCE_ID,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { type: string };
    expect(body.type).toBe("district");
  });

  it("returns 403 for non-admin user", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      role: "user",
    } as never);
    const res = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Northern Province", type: "province" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /:id", () => {
  it("returns 400 when no fields provided", async () => {
    const res = await fetch(`${baseUrl}/loc-1`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when location does not exist", async () => {
    vi.mocked(db.update).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/${NONEXISTENT_ID}`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates a location name", async () => {
    const updated = { ...mockProvince, name: "Updated Province" };
    vi.mocked(db.update).mockReturnValue(makeChain([updated]) as never);
    const res = await fetch(`${baseUrl}/${PROVINCE_ID}`, {
      method: "PATCH",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Province" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string };
    expect(body.name).toBe("Updated Province");
  });
});

describe("DELETE /:id", () => {
  it("returns 404 when location does not exist", async () => {
    vi.mocked(db.delete).mockReturnValue(makeChain([]) as never);
    const res = await fetch(`${baseUrl}/${NONEXISTENT_ID}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(404);
  });

  it("deletes a location and returns message", async () => {
    vi.mocked(db.delete).mockReturnValue(
      makeChain([{ id: PROVINCE_ID }]) as never,
    );
    const res = await fetch(`${baseUrl}/${PROVINCE_ID}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Location deleted");
  });
});
