import { GET } from "@/app/api/tasks/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
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

function createRequest(url: string) {
  return { url } as Request;
}

describe("Tasks GET API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest("http://localhost"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("No session found. Please log in.");
  });

  it("returns tasks with no filters", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    const res = await GET(createRequest("http://localhost"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tasks).toEqual([]);
    expect(body.totalTasks).toBe(0);
    expect(body.totalTaskPages).toBe(0);
  });

  it("applies search filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?search=test"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies status filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?status=OPEN"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies priority filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?priority=HIGH"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies completed true filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?completed=true"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies completed false filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?completed=false"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies date range with startDate", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?startDate=2024-01-01"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies date range with endDate", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(createRequest("http://localhost?endDate=2024-12-31"));

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies full date range", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    await GET(
      createRequest(
        "http://localhost?startDate=2024-01-01&endDate=2024-12-31"
      )
    );

    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it("applies sorting and pagination", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(24);

    const res = await GET(
      createRequest(
        "http://localhost?page=2&limit=12&sortBy=title&order=asc"
      )
    );

    const body = await res.json();

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12,
        take: 12,
        orderBy: { title: "asc" },
      })
    );

    expect(body.totalTaskPages).toBe(2);
  });
});