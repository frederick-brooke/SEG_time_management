/**
 * Testing for auth/reset-password api route
 */

import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";

// Mocks

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => {
  class MockResponse {
    status: number;
    body: any;

    constructor(body: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
    }

    async json() {
      return this.body;
    }
  }

  return {
    NextResponse: {
      json: (data: any, init?: any) => new MockResponse(data, init),
    },
  };
});

jest.mock("@/lib/password", () => ({
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
}));

const mockFindFirst = prisma.user.findFirst as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockValidatePassword = validatePassword as jest.Mock;

// Fixtures

const mockUser = {
  id: "user123",
  email: "test@example.com",
  passwordHash: "oldhash",
  passwordResetToken: "valid-token",
  passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
};

const createMockRequest = (body: any) =>
  ({
    json: async () => body,
  } as any);

// Setup / Teardown

beforeEach(() => {
  jest.clearAllMocks();
  mockHashPassword.mockResolvedValue("newhash");
  mockValidatePassword.mockReturnValue(null);
  mockUpdate.mockResolvedValue({ ...mockUser, passwordHash: "newhash" });
});

// Tests

describe("POST /api/auth/reset-password", () => {
  describe("Request Validation", () => {
    it("rejects request with missing token", async () => {
      const req = createMockRequest({ password: "NewPassword123!" });
      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Token");
    });

    it("rejects request with missing password", async () => {
      const req = createMockRequest({ token: "valid-token" });
      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password");
    });

    it("rejects request with non-string token", async () => {
      const req = createMockRequest({ token: 123, password: "NewPassword123!" });
      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Token");
    });

    it("rejects request with non-string password", async () => {
      const req = createMockRequest({ token: "valid-token", password: 123 });
      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password");
    });

    it("rejects invalid JSON request", async () => {
      const req = {
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as any;

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid request format");
    });
  });

  describe("Token Validation", () => {
    it("rejects request with non-existent token", async () => {
      mockFindFirst.mockResolvedValue(null);
      const req = createMockRequest({
        token: "invalid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("rejects request with null passwordResetExpires", async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: null,
      });
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("rejects request with expired token", async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
      });
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  });

  describe("Password Validation", () => {
    beforeEach(() => {
      mockFindFirst.mockResolvedValue(mockUser);
    });

    it("rejects invalid password", async () => {
      mockValidatePassword.mockReturnValue("Password too short");
      const req = createMockRequest({
        token: "valid-token",
        password: "weak",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Password too short");
    });

    it("calls validatePassword with provided password", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      await POST(req);

      expect(mockValidatePassword).toHaveBeenCalledWith("NewPassword123!");
    });
  });

  describe("Password Update", () => {
    beforeEach(() => {
      mockFindFirst.mockResolvedValue(mockUser);
    });

    it("hashes password before storing", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      await POST(req);

      expect(mockHashPassword).toHaveBeenCalledWith("NewPassword123!");
    });

    it("updates user with new password hash", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      await POST(req);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: {
          passwordHash: "newhash",
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });

    it("clears reset token and expiry after update", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      await POST(req);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: expect.objectContaining({
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      });
    });

    it("returns success response on successful reset", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on database error during user lookup", async () => {
      mockFindFirst.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Unable to reset password");
    });

    it("returns 500 on database error during password update", async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockUpdate.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Unable to reset password");
    });

    it("returns 500 on password hashing error", async () => {
      mockFindFirst.mockResolvedValue(mockUser);
      mockHashPassword.mockRejectedValue(new Error("Hashing failed"));
      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Unable to reset password");
    });

    it("logs errors to console", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockFindFirst.mockRejectedValue(new Error("Test error"));

      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      await POST(req);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockFindFirst.mockResolvedValue(mockUser);
    });

    it("handles token expiry at exact boundary", async () => {
      const now = new Date();
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: now,
      });

      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("accepts token expiring 1 second in future", async () => {
      mockFindFirst.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: new Date(Date.now() + 1000),
      });

      const req = createMockRequest({
        token: "valid-token",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("handles empty string token", async () => {
      const req = createMockRequest({
        token: "",
        password: "NewPassword123!",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Token");
    });

    it("handles empty string password", async () => {
      const req = createMockRequest({
        token: "valid-token",
        password: "",
      });

      const res: any = await POST(req);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Password");
    });
  });
});
