import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

import { authenticate, adminOnly, staffOnly } from "./auth";
import jwt from "jsonwebtoken";

function mockRes(): Response {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
}

describe("authenticate", () => {
  beforeEach(() => {
    process.env["JWT_SECRET"] = "test-secret";
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with Bearer", () => {
    const req = {
      headers: { authorization: "Basic xyz" },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user and calls next when token is valid", () => {
    const payload = { userId: "abc", role: "user" };
    vi.mocked(jwt.verify).mockReturnValue(payload as never);
    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
  });

  it("returns 401 when jwt.verify throws", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const req = {
      headers: { authorization: "Bearer bad-token" },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when JWT_SECRET is not set", () => {
    delete process.env["JWT_SECRET"];
    const req = {
      headers: { authorization: "Bearer token" },
    } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("adminOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next when user is admin", () => {
    const req = { user: { userId: "1", role: "admin" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    adminOnly(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not admin", () => {
    const req = { user: { userId: "1", role: "user" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is undefined", () => {
    const req = { user: undefined } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for system_user role", () => {
    const req = { user: { userId: "1", role: "system_user" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("staffOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next when user is admin", () => {
    const req = { user: { userId: "1", role: "admin" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    staffOnly(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next when user is system_user", () => {
    const req = { user: { userId: "1", role: "system_user" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    staffOnly(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 for regular user", () => {
    const req = { user: { userId: "1", role: "user" } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    staffOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is undefined", () => {
    const req = { user: undefined } as unknown as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    staffOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
