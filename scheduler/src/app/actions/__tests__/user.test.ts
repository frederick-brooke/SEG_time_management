/**
 * Testing for user actions
 */

import {
    getUsers,
    getUserByEmail,
    createUser,
  } from "@/app/actions/user";
  
import { prisma } from "lib/prisma";
import { revalidatePath } from "next/cache";

// Mocks

jest.mock("lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// Tests

describe("getUsers", () => {
  it("returns users with tasks and counts", async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        tasks: [{ id: "t1" }],
        _count: { tasks: 1 },
      },
    ]);

    const result = await getUsers();

    expect(result).toHaveLength(1);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
      include: {
        tasks: true,
        _count: { select: { tasks: true } },
      },
    });
  });

  it("throws on DB error", async () => {
    (prisma.user.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    await expect(getUsers()).rejects.toThrow("DB error");
  });
});


describe("getUserByEmail", () => {
  it("returns user with ordered tasks", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      tasks: [],
    });

    const result = await getUserByEmail("test@test.com");

    expect(result).toBeDefined();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  });

  it("throws on error", async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    await expect(getUserByEmail("test@test.com")).rejects.toThrow("fail");
  });
});


describe("createUser", () => {
  it("creates user successfully", async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "1",
      email: "a@b.com",
    });

    const result = await createUser(
      "a@b.com",
      "username",
      "John",
      "Doe"
    );

    expect(result).toEqual({
      id: "1",
      email: "a@b.com",
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "a@b.com",
        username: "username",
        fname: "John",
        lname: "Doe",
      },
    });

    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("throws if fields are missing", async () => {
    await expect(createUser("", "u", "f", "l")).rejects.toThrow(
      "All fields are required to create a user."
    );
  });

  it("throws on DB failure", async () => {
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error("DB crash")
    );

    await expect(
      createUser("a@b.com", "u", "f", "l")
    ).rejects.toThrow("DB crash");
  });
});