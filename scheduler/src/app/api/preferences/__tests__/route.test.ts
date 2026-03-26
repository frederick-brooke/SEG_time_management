import { GET, POST } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        userPreferences: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
        },
    },
}));

jest.mock("next/server", () => ({
    NextResponse: {
        json: jest.fn((data, init) => ({
            status: init?.status || 200,
            json: async () => data,
        })),
    },
}));

describe("Preferences API Route", () => {
    const userId = "test-user-123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET", () => {
        it("returns 400 if userId is missing", async () => {
            const req = {
                url: "http://localhost/api/preferences"
            } as any;
            const res = await GET(req);
            expect(res.status).toBe(400);
        });

        it("returns preferences for a valid userId", async () => {
            const mockPrefs = { userId, workStartTime: "09:00" };
            (prisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(mockPrefs);

            const req = {
                url: `http://localhost/api/preferences?userId=${userId}`
            } as any;
            const res = await GET(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.preferences).toEqual(mockPrefs);
        });
    });

    describe("POST", () => {
        it("returns 400 is userId is missing in body", async () => {
            const req = {
                json: async () => ({ workStartTime: "10:00" })
            } as any;
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it("successfully upserts preferences", async () => {
            const body = { userID: userId, workStartTime: "08:00"};
            (prisma.userPreferences.upsert as jest.Mock).mockResolvedValue({ ...body, id: "1"});
            
            const req = {
                json: async () => body
            } as any;
            
            const res = await POST(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.userPreferences.upsert).toHaveBeenCalled();
        });
    });
});