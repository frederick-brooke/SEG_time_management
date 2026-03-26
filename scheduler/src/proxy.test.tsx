import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { proxy, config } from "./proxy";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a minimal mock request with a given pathname. */
const mockReq = (pathname: string) => ({
  nextUrl: { pathname },
  url: `https://example.com${pathname}`,
});

const mockNext     = { type: "next" };
const mockRedirect = { type: "redirect" };

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (NextResponse.next as jest.Mock).mockReturnValue(mockNext);
  (NextResponse.redirect as jest.Mock).mockReturnValue(mockRedirect);
});

// ── Bypass routes — no token required ─────────────────────────────────────────

describe("bypass routes", () => {
  const bypassPaths = [
    "/api/auth/signin",
    "/login",
    "/register",
    "/banned",
  ];

  test.each(bypassPaths)(
    "passes through %s without checking the token",
    async (pathname) => {
      (getToken as jest.Mock).mockResolvedValue(null);
      const req = mockReq(pathname);

      const result = await proxy(req);

      expect(NextResponse.next).toHaveBeenCalledTimes(1);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(result).toBe(mockNext);
    }
  );
});

// ── Deleted account ────────────────────────────────────────────────────────────

describe("deleted account", () => {
  test("redirects to /account-deleted when token.isDeleted is true", async () => {
    (getToken as jest.Mock).mockResolvedValue({ isDeleted: true });
    const req = mockReq("/dashboard");

    const result = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/account-deleted", req.url)
    );
    expect(result).toBe(mockRedirect);
  });
});

// ── No token ──────────────────────────────────────────────────────────────────

describe("missing token", () => {
  test("calls next() when there is no token", async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = mockReq("/dashboard");

    const result = await proxy(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNext);
  });
});

// ── Banned account ────────────────────────────────────────────────────────────

describe("banned account", () => {
  test("redirects to /banned when token.isBanned is true", async () => {
    (getToken as jest.Mock).mockResolvedValue({ isBanned: true });
    const req = mockReq("/dashboard");

    const result = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/banned", req.url)
    );
    expect(result).toBe(mockRedirect);
  });
});

// ── Admin route guard ─────────────────────────────────────────────────────────

describe("admin route", () => {
  test("redirects to /unauthorised when role is not SUPERUSER", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "USER" });
    const req = mockReq("/admin/dashboard");

    const result = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/unauthorised", req.url)
    );
    expect(result).toBe(mockRedirect);
  });

  test("passes through when role is SUPERUSER", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "SUPERUSER" });
    const req = mockReq("/admin/dashboard");

    const result = await proxy(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNext);
  });
});

// ── Authenticated non-admin route ─────────────────────────────────────────────

describe("authenticated standard route", () => {
  test("passes through for a valid token on a non-admin route", async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: "USER" });
    const req = mockReq("/dashboard");

    const result = await proxy(req);

    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockNext);
  });
});

// ── Config export ─────────────────────────────────────────────────────────────

describe("config", () => {
  test("exports the correct matcher paths", () => {
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/profile/:path*",
      "/admin/:path*",
    ]);
  });
});