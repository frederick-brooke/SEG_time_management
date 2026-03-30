/**
 * Testing for categories api route.
 */

import { GET, POST, PATCH, DELETE } from "@/app/api/categories/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Mocks

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

const mockSession = {
  user: { id: "user-1" },
};

// Tests

describe("Category API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET({} as any);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns categories for user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const categories = [{ id: "1" }];
      (prisma.category.findMany as jest.Mock).mockResolvedValue(categories);

      const res = await GET({} as any);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.categories).toEqual(categories);
    });
  });

  describe("POST", () => {
    it("returns 401 if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = { json: async () => ({}) } as any;
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 if missing fields", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = { json: async () => ({ name: "" }) } as any;
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Name and color required");
    });

    it("creates category", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const category = { id: "1" };
      (prisma.category.create as jest.Mock).mockResolvedValue(category);

      const req = {
        json: async () => ({ name: "Test", color: "#fff" }),
      } as any;

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.category).toEqual(category);
    });
  });

  describe("PATCH", () => {
    it("returns 401 if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = { json: async () => ({}) } as any;
      const res = await PATCH(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 if no id", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = { json: async () => ({}) } as any;
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ID required");
    });

    it("updates category", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const updated = { id: "1" };
      (prisma.category.update as jest.Mock).mockResolvedValue(updated);

      const req = {
        json: async () => ({
          id: "1",
          name: "Updated",
          color: "#000",
        }),
      } as any;

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.category).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns 401 if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = { url: "http://localhost?id=1" } as any;
      const res = await DELETE(req);

      expect(res.status).toBe(401);
    });

    it("returns 400 if no id", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const req = { url: "http://localhost" } as any;
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ID required");
    });

    it("prevents deleting last category", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.category.count as jest.Mock).mockResolvedValue(1);

      const req = { url: "http://localhost?id=1" } as any;
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Cannot delete last category");
    });

    it("deletes category", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.category.count as jest.Mock).mockResolvedValue(2);

      const req = { url: "http://localhost?id=1" } as any;
      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});