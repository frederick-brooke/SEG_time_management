/**
 * Testing for tasks api route.
 */

// Mocks

jest.mock("next/server", () => ({
    NextResponse: {
        json: (body: any, init?: any) => new Response(JSON.stringify(body), {
            ...init,
            headers: { "Content-Type": "application/json" },
        }),
    },
}));

import { GET, POST } from "../route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        task: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        event: {
            findUnique: jest.fn(),
        },
        exam: {
            findUnique: jest.fn(),
            create: jest.fn(),
        }
    },
}));

// Helpers

const makePostReq = (body: object) =>
    new Request("http://localhost/api/tasks", { method: "POST", body: JSON.stringify(body) });

const mockEvent = (overrides = {}) =>
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "e1", start: new Date().toISOString(), ...overrides });

// Tests

describe("Base tasks route /api/tasks", () => {
    beforeEach(() => jest.clearAllMocks());

    // GET

    it("GET: returns 200 with user tasks", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([{ title: "Task 1" }]);
        const res = await GET(new Request("http://localhost/api/tasks?userId=user123"));
        expect(res.status).toBe(200);
    });

    it("GET: returns 400 when userId is missing", async () => {
        const res = await GET(new Request("http://localhost/api/tasks"));
        expect(res.status).toBe(400);
    });

    it("GET: returns 500 on prisma error", async () => {
        (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));
        const res = await GET(new Request("http://localhost/api/tasks?userId=u1"));
        expect(res.status).toBe(500);
    });

    // POST

    it("POST: daily recurrence with future start date", async () => {
        mockEvent({ id: "e1", start: "2026-03-24T10:00:00Z", recurrence: { type: "daily" } });
        const res = await POST(makePostReq({
            tasks: [{ title: "Bulk task", userId: "u1", eventId: "e1", relativeOffsetDays: 2, scheduleTime: true, specificTime: "10:00" }]
        }));
        expect(res.status).toBe(200);
    });

    it("POST: daily recurrence where cursor is in the past", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        mockEvent({ id: "e_daily", start: pastDate.toISOString(), recurrence: { type: "daily" } });
        const res = await POST(makePostReq({
            tasks: [{ title: "Daily past", userId: "u1", eventId: "e_daily", relativeOffsetDays: 1, scheduleTime: false }]
        }));
        expect(res.status).toBe(200);
    });

    it("POST: monthly recurrence with future start", async () => {
        mockEvent({ id: "e_monthly", recurrence: { type: "monthly" } });
        const res = await POST(makePostReq({
            tasks: [{ title: "Monthly task", userId: "u1", eventId: "e_monthly", relativOffsetDays: 1, scheduleTime: true, specificTime: "12:00" }]
        }));
        expect(res.status).toBe(200);
    });

    it("POST: monthly recurrence where cursor is in the past", async () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 2);
        mockEvent({ id: "e_monthly_past", start: pastDate.toISOString(), recurrence: { type: "monthly" } });
        const res = await POST(makePostReq({
            tasks: [{ title: "Monthly past", userId: "u1", eventId: "e_monthly_past", relativeOffsetDays: 0, scheduleTime: true, specificTime: "09:00" }]
        }));
        expect(res.status).toBe(200);
    });

    it("POST: weekly recurrence with all days and future until date", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);
        mockEvent({
            id: "e_weekly",
            start: pastDate.toISOString(),
            recurrence: { type: "weekly", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], until: new Date(Date.now() + 86400000).toISOString() }
        });
        const res = await POST(makePostReq({
            tasks: [{ title: "Weekly coverage", userId: "u1", eventId: "e_weekly", relativeOffsetDays: 0, scheduleTime: true, specificTime: "08:00" }]
        }));
        expect(res.status).toBe(200);
    });

    it("POST: unknown recurrence type falls back gracefully", async () => {
        mockEvent({ id: "e_fail", recurrence: { type: "unknown_type" } });
        await POST(makePostReq({
            tasks: [{ title: "Fallback task", userId: "u1", eventId: "e_fail", relativeOffsetDays: 0 }]
        }));
    });

    it("POST: null recurrence falls back gracefully", async () => {
        mockEvent({ id: "e_none", recurrence: null });
        await POST(makePostReq({
            tasks: [{ title: "Fallback", eventId: "e_none", relativeOffsetDays: 1 }]
        }));
    });

    it("POST: custom relativeMode uses customDate", async () => {
        await POST(makePostReq({
            tasks: [{ title: "Custom", relativeMode: "custom", customDate: "2026-6-01" }]
        }));
    });

    it("POST: isRecurring task uses recurrence.startDate", async () => {
        await POST(makePostReq({
            tasks: [{ title: "Recurring", isRecurring: true, recurrence: { startDate: "2026-07-01" } }]
        }));
    });

    it("POST: single task with examId creates task", async () => {
        mockEvent({ title: "Final exam" });
        const res = await POST(makePostReq({ title: "Single", userId: "u1", examId: "exam_id" }));
        expect(res.status).toBe(200);
    });

    it("POST: single task with examId 'none' clears exam", async () => {
        (prisma.exam.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.exam.create as jest.Mock).mockResolvedValue({ id: "t1", title: "No exam" });
        const res = await POST(makePostReq({ title: "No exam task", userId: "u1", examId: "none" }));
        expect(res.status).toBe(200);
    });

    it("POST: single task without examId creates task", async () => {
        (prisma.task.create as jest.Mock).mockResolvedValue({ id: "t1", title: "Bare task" });
        const res = await POST(makePostReq({ title: "Bare task", userId: "u1" }));
        expect(res.status).toBe(200);
    });

    it("POST: returns 500 on prisma error", async () => {
        (prisma.task.create as jest.Mock).mockRejectedValue(new Error("DB error"));
        const res = await POST(makePostReq({ title: "Fail", userId: "u1" }));
        expect(res.status).toBe(500);
    });
});