import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "./route";

const mockGetServerSession = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();

jest.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockSession = { user: { id: "user-123" } };

function makeRequest(
  method: string,
  body?: object,
  url = "http://localhost/api/categories"
): NextRequest {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/categories", () => {
  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns categories for the authenticated user", async () => {
    const categories = [
      { id: "cat-1", name: "Work", color: "#ff0000", userId: "user-123" },
      { id: "cat-2", name: "Personal", color: "#00ff00", userId: "user-123" },
    ];
    mockGetServerSession.mockResolvedValueOnce(mockSession);
    mockFindMany.mockResolvedValueOnce(categories);

    const res = await GET(makeRequest("GET"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ categories });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("POST /api/categories", () => {
  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await POST(makeRequest("POST", { name: "Work", color: "#ff0000" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when name is missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);

    const res = await POST(makeRequest("POST", { color: "#ff0000" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Name and color required" });
  });

  it("returns 400 when color is missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);

    const res = await POST(makeRequest("POST", { name: "Work" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Name and color required" });
  });

  it("returns 400 when both name and color are missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);

    const res = await POST(makeRequest("POST", {}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Name and color required" });
  });

  it("creates and returns a new category", async () => {
    const category = { id: "cat-1", name: "Work", color: "#ff0000", userId: "user-123" };
    mockGetServerSession.mockResolvedValueOnce(mockSession);
    mockCreate.mockResolvedValueOnce(category);

    const res = await POST(makeRequest("POST", { name: "Work", color: "#ff0000" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ category });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: "Work", color: "#ff0000", userId: "user-123" },
    });
  });
});

describe("PATCH /api/categories", () => {
  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest("PATCH", { id: "cat-1", name: "Updated", color: "#0000ff" })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when id is missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);

    const res = await PATCH(makeRequest("PATCH", { name: "Updated", color: "#0000ff" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "ID required" });
  });

  it("updates and returns the category", async () => {
    const category = { id: "cat-1", name: "Updated", color: "#0000ff", userId: "user-123" };
    mockGetServerSession.mockResolvedValueOnce(mockSession);
    mockUpdate.mockResolvedValueOnce(category);

    const res = await PATCH(
      makeRequest("PATCH", { id: "cat-1", name: "Updated", color: "#0000ff" })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ category });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "cat-1" },
      data: { name: "Updated", color: "#0000ff" },
    });
  });
});

describe("DELETE /api/categories", () => {
  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("DELETE", undefined, "http://localhost/api/categories?id=cat-1")
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when id query param is missing", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);

    const res = await DELETE(makeRequest("DELETE", undefined, "http://localhost/api/categories"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "ID required" });
  });

  it("returns 400 when trying to delete the last category", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);
    mockCount.mockResolvedValueOnce(1);

    const res = await DELETE(
      makeRequest("DELETE", undefined, "http://localhost/api/categories?id=cat-1")
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Cannot delete last category" });
    expect(mockCount).toHaveBeenCalledWith({ where: { userId: "user-123" } });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes the category when more than one exists", async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession);
    mockCount.mockResolvedValueOnce(2);

    const res = await DELETE(
      makeRequest("DELETE", undefined, "http://localhost/api/categories?id=cat-1")
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
  });
});