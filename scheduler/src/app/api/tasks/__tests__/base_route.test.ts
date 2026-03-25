jest.mock("next/server", () => ({
    NextResponse: {
        json: (body: any, init?: any) => new Response(JSON.stringify(body), {
            ...init,
            headers: { "Content-Type": "application/json" },
        }),
    },
}));

import { scheduleTasks } from "@/lib/scheduling/scheduler";
import { GET, POST } from "../route";
import { prisma } from "@/lib/prisma";
import { relativeOffsetLabel } from "@/lib/ui";
import { NextRequest } from "next/server";

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

    it("GET: returns 400 when userId is missing", async () => {
        const req = new Request("http://localhost/api/tasks");
        const res = await GET(req);
        expect(res.status).toBe(400);
    })

    it("GET: returns 500 on prisma error", async () => {
        (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));
        const req = new Request("http://localhost/api/tasks?userId=u1");
        const res = await GET(req);
        expect(res.status).toBe(500);
    })

    it("POST: covers daily recurrence where cursor is in the past", async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        
        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_daily",
            start: pastDate.toISOString(),
            recurrence: { type: "daily" }
        });

        const req = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify({
                tasks: [{
                    title: "Daily past",
                    userId: "u1",
                    eventId: "e_daily",
                    relativeOffsetDays: 1,
                    scheduleTime: false,
                }]
            }),
        });
        
        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("POST: covers monthly recurrence where cursor is in the past", async () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 2);
        
        (prisma.event.findUnique as jest.Mock).mockResolvedValue({
            id: "e_monthly_past",
            start: pastDate.toISOString(),
            recurrence: { type: "monthly" }
        });

        const req = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify({
                tasks: [{
                    title: "Monthly past",
                    userId: "u1",
                    eventId: "e_monthly_past",
                    relativeOffsetDays: 0,
                    scheduleTime: true,
                    specificTime: "09:00"
                }]
            }),
        });
        
        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("POST: single task with examId none clears exam", async () => {
        (prisma.exam.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.exam.create as jest.Mock).mockResolvedValue({ id: "t1", title: "No exam" });
        
        const req = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify({ title: "No exam task", userId: "u1", examId: "none"}),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it("POST: returns 500 on error", async () => {
        (prisma.exam.create as jest.Mock).mockResolvedValue(new Error("DB error"));
        
        const req = new Request("http://localhost/api/tasks", {
            method: "POST",
            body: JSON.stringify({ title: "Fail", userId: "u1"}),
        });

        const res = await POST(req);
        expect(res.status).toBe(500);
    });




})