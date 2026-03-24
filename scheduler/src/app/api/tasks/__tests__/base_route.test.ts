import { scheduleTasks } from "@/src/lib/scheduling/scheduler";
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
        }
    },
}));

describe("Base tasks route /api/tasks", () => {
    beforeEach(() => jest.clearAllMocks());

    it("GET: covers user tasks fetch", async () => {
        const req = new Request("http://localhost/api/tasks?userId=user123");
        (prisma.task.findMany as jest.Mock).mockResolvedValue([{ title: "Task 1" }]);

        const rest = await GET(req);
        expect(rest.status).toBe(200);
    });

    it("POST: covers: the massive date computation logic", async () => {
        const bulkPayload = {
            tasks: [{
                title: "Bulk task",
                userId: "u1",
                eventId: "e1",
                relativeOffsetDays: 2,
                scheduleTime: true,
                specificTime: "10:00"
            }]
        };

        const req = new Request("https://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify(bulkPayload),
        });

        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e1",
            start: "2026-03-24T10:00:00Z",
            recurrence: { type: "daily" }
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("POST: covers monthly recurrence and fallback branches", async () => {
        const monthlyPayload = {
            tasks: [{
                title: "Monthly task",
                userId: "u1",
                eventId: "e_monthly",
                relativOffsetDays: 1,
                scheduleTime: true,
                specificTime: "12:00"
            }]
        };

        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_monthly",
            start: new Date().toISOString(),
            recurrence: { type: "monthly" }
        });

        const reqMonthly = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify(monthlyPayload),
        });

        await POST(reqMonthly);

        const fallbackPayload = {
            tasks: [{ title: "Fallback task", userId: "u1", eventId: "e_fail", relativeOffsetDays: 0 }]            
        };

        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_fail",
            start: new Date().toISOString(),
            recurrence: { type: "unknown_type" }
        });

        const reqFallback = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify(fallbackPayload),
        });

        await POST(reqFallback);
    });

    it("POST: covers complex weekly branches", async () => {
        const weeklyPayload = {
            tasks: [{
                title: "Weekly coverage",
                userId: "u1",
                eventId: "e_weekly",
                relativeOffsetDays: 0,
                scheduleTime: true,
                specificTime: "08:00"
            }]
        };

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);

        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_weekly",
            start: pastDate.toISOString(),
            recurrence: {
                type: "weekly",
                days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                until: new Date(Date.now() + 86400000).toISOString()
            }
        });

        const req = new Request("http://localhost/api/tasks", {
            method: "POST", 
            body: JSON.stringify(weeklyPayload),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("POST", async () => {
        const customAndRecurring = {
            tasks: [
                { title: "Custom", relativeMode: "custom", customDate: "2026-6-01" },
                { title: "Recurring", isRecurring: true, recurrence: { startDate: "2026-07-01" }}
            ]
        };

        const fallbackTask = {
            tasks: [{ title: "Fallback", eventId: "e_none", relativeOffsetDays: 1}]            
        };

        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_none",
            start: new Date().toISOString(),
            recurrence: null
        });

        const singleTaskBody = { title: "Single", userId: "u1", examId: "exam_id" };
        (prisma.event.findUnique as jest.Mock).mockResolvedValue({ title: "Final exam" });

        await POST(new Request("http://localhost/api/tasks", {
            method: "POST", body: JSON.stringify(customAndRecurring)
        }));

        await POST(new Request("http://localhost/api/tasks", {
            method: "POST", body: JSON.stringify(fallbackTask)
        }));

        await POST(new Request("http://localhost/api/tasks", {
            method: "POST", body: JSON.stringify(singleTaskBody)
        }));

        await GET(new Request("http://localhost/api/tasks"));
    })
})