import { GET } from "@/app/api/tasks/search/route";
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
  return new Request(url);
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

    expect(prisma.task.findMany).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(body.totalTaskPages).toBe(0);
  });

  it("applies all filters together", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(10);

    await GET(
      createRequest(
        "http://localhost?search=test&status=OPEN&priority=HIGH&completed=true&startDate=2024-01-01&endDate=2024-12-31"
      )
    );

    const call = (prisma.task.findMany as jest.Mock).mock.calls[0][0];

    expect(call.where.AND.length).toBeGreaterThan(1);
  });

  it("handles completed false", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.task.count as jest.Mock).mockResolvedValue(5);

    await GET(createRequest("http://localhost?completed=false"));

    const call = (prisma.task.findMany as jest.Mock).mock.calls[0][0];

    expect(call.where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ completed: false }),
      ])
    );
  });

  it("applies pagination and sorting", async () => {
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