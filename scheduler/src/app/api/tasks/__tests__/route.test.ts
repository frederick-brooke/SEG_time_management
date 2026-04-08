import { GET, POST } from "../route";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
	NextResponse: {
		json: (body: any, init?: any) =>
			new Response(JSON.stringify(body), {
				status: init?.status ?? 200,
				headers: { "Content-Type": "application/json" },
			}),
	},
}));

jest.mock("@/lib/prisma", () => ({
	prisma: {
		task: {
			count: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
		},
		event: {
			findMany: jest.fn(),
		},
		exam: {
			findUnique: jest.fn(),
		},
	},
}));

function mockRequest(url: string, body?: any) {
	return {
		url,
		json: jest.fn().mockResolvedValue(body),
	} as any;
}

describe("GET /api/tasks", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 400 if no userId", async () => {
		const req = mockRequest("http://localhost/api/tasks");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data.error).toBe("User ID required");
	});

	it("returns tasks with pagination", async () => {
		(prisma.task.count as jest.Mock).mockResolvedValue(10);
		(prisma.task.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

		const req = mockRequest(
			"http://localhost/api/tasks?userId=1&page=1&limit=5",
		);

		const res = await GET(req);
		const data = await res.json();

		expect(data.tasks).toEqual([{ id: 1 }]);
		expect(data.pagination.total).toBe(10);
		expect(data.pagination.page).toBe(1);
		expect(data.pagination.limit).toBe(5);
		expect(data.pagination.pages).toBe(2);

		expect(prisma.task.count).toHaveBeenCalledWith({
			where: { userId: "1" },
		});
		expect(prisma.task.findMany).toHaveBeenCalledWith({
			where: { userId: "1" },
			include: { exam: true, event: true },
			orderBy: { createdAt: "desc" },
			take: 5,
			skip: 0,
		});
	});

	it("clamps invalid page and limit values", async () => {
		(prisma.task.count as jest.Mock).mockResolvedValue(0);
		(prisma.task.findMany as jest.Mock).mockResolvedValue([]);

		const req = mockRequest(
			"http://localhost/api/tasks?userId=u1&page=0&limit=999",
		);

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.pagination.page).toBe(1);
		expect(data.pagination.limit).toBe(100);

		expect(prisma.task.findMany).toHaveBeenCalledWith({
			where: { userId: "u1" },
			include: { exam: true, event: true },
			orderBy: { createdAt: "desc" },
			take: 100,
			skip: 0,
		});
	});

	it("handles GET error", async () => {
		(prisma.task.count as jest.Mock).mockRejectedValue(new Error("fail"));

		const req = mockRequest("http://localhost/api/tasks?userId=1");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to fetch tasks");
	});
});

describe("POST /api/tasks - bulk", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("creates bulk tasks with event mapping", async () => {
		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{ id: "e1", start: new Date(), recurrence: { type: "none" } },
		]);

		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t1" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Task 1",
					userId: "u1",
					eventId: "e1",
					relativeOffsetDays: 1,
					scheduleTime: false,
				},
			],
		});

		const res = await POST(req);
		const data = await res.json();

		expect(data.tasks.length).toBe(1);
		expect(prisma.event.findMany).toHaveBeenCalledWith({
			where: { id: { in: ["e1"] } },
		});
		expect(prisma.task.create).toHaveBeenCalled();
	});

	it("handles bulk with no events", async () => {
		(prisma.event.findMany as jest.Mock).mockResolvedValue([]);
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t1" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [{ title: "Task", userId: "u1" }],
		});

		const res = await POST(req);
		const data = await res.json();

		expect(data.tasks.length).toBe(1);
		expect(prisma.task.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				title: "Task",
				userId: "u1",
				scheduledDate: null,
				scheduledTime: null,
				duration: 60,
				priority: "Medium",
				eventId: null,
				examId: null,
				isRecurring: false,
				recurrence: null,
				bufferDays: null,
				url: null,
				scheduledRelativeTo: null,
				relativeOffsetDays: null,
				eventLinkMode: null,
				status: "todo",
				completed: false,
				subtasks: [],
			}),
		});
	});

	it("creates bulk task using custom date and specific time", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t-custom" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Custom task",
					userId: "u1",
					relativeMode: "custom",
					customDate: "2026-04-10T15:30:00.000Z",
					scheduleTime: true,
					specificTime: "14:45",
					description: "desc",
					duration: 30,
					priority: "High",
					bufferDays: 2,
					url: "https://example.com",
					scheduledRelativeTo: "event",
					relativeOffsetDays: 3,
					eventLinkMode: "before",
				},
			],
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.tasks).toEqual([{ id: "t-custom" }]);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.title).toBe("Custom task");
		expect(call.description).toBe("desc");
		expect(call.userId).toBe("u1");
		expect(call.duration).toBe(30);
		expect(call.priority).toBe("High");
		expect(call.bufferDays).toBe(2);
		expect(call.url).toBe("https://example.com");
		expect(call.scheduledRelativeTo).toBe("event");
		expect(call.relativeOffsetDays).toBe(3);
		expect(call.eventLinkMode).toBe("before");

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledDate.toISOString()).toBe(
			"2026-04-10T00:00:00.000Z",
		);

		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(14);
		expect(call.scheduledTime.getUTCMinutes()).toBe(45);
	});

	it("uses customRangeStart when customDate is absent", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t-range" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Range task",
					userId: "u1",
					relativeMode: "custom",
					customRangeStart: "2026-05-01T09:00:00.000Z",
					scheduleTime: true,
					specificTime: "09:15",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledDate.toISOString()).toBe(
			"2026-05-01T00:00:00.000Z",
		);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(9);
		expect(call.scheduledTime.getUTCMinutes()).toBe(15);
	});

	it("creates recurring bulk task from recurrence start date", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-recurring",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Recurring task",
					userId: "u1",
					isRecurring: true,
					recurrence: {
						startDate: "2026-06-20T12:00:00.000Z",
						type: "weekly",
					},
					scheduleTime: true,
					specificTime: "08:30",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.isRecurring).toBe(true);
		expect(call.recurrence).toEqual({
			startDate: "2026-06-20T12:00:00.000Z",
			type: "weekly",
		});
		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledDate.toISOString()).toBe(
			"2026-06-20T00:00:00.000Z",
		);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(8);
		expect(call.scheduledTime.getUTCMinutes()).toBe(30);
	});

	it("clears scheduledDate and scheduledTime when scheduleTime is false", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-unscheduled",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Unscheduled relative task",
					userId: "u1",
					relativeMode: "custom",
					customDate: "2026-04-15T10:00:00.000Z",
					scheduleTime: false,
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeNull();
		expect(call.scheduledTime).toBeNull();
	});

	it("computes date from non-recurring event when relativeOffsetDays is set", async () => {
		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "event-1",
				start: "2026-04-20T16:00:00.000Z",
				recurrence: { type: "none" },
			},
		]);
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t-event" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Relative event task",
					userId: "u1",
					eventId: "event-1",
					relativeOffsetDays: 2,
					scheduleTime: true,
					specificTime: "11:20",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.eventId).toBe("event-1");
		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledDate.toISOString()).toBe(
			"2026-04-22T00:00:00.000Z",
		);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(11);
		expect(call.scheduledTime.getUTCMinutes()).toBe(20);
	});

	it("computes date from weekly recurring event", async () => {
		const futureStart = new Date();
		futureStart.setUTCDate(futureStart.getUTCDate() + 1);
		futureStart.setUTCHours(10, 0, 0, 0);

		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "weekly-1",
				start: futureStart,
				recurrence: {
					type: "weekly",
					days: ["Mon", "Wed", "Fri"],
				},
			},
		]);
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t-weekly" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Weekly linked task",
					userId: "u1",
					eventId: "weekly-1",
					relativeOffsetDays: 0,
					scheduleTime: true,
					specificTime: "07:00",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(7);
		expect(call.scheduledTime.getUTCMinutes()).toBe(0);
	});

	it("falls back to event start when recurrence type is unsupported", async () => {
		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "weird-event",
				start: "2026-07-01T12:00:00.000Z",
				recurrence: {
					type: "yearly",
				},
			},
		]);
		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-fallback",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Fallback task",
					userId: "u1",
					eventId: "weird-event",
					relativeOffsetDays: 1,
					scheduleTime: true,
					specificTime: "10:10",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledDate.toISOString()).toBe(
			"2026-07-02T00:00:00.000Z",
		);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getUTCHours()).toBe(10);
		expect(call.scheduledTime.getUTCMinutes()).toBe(10);
	});

	it("does not fetch events when there are no eventIds in bulk payload", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t1" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{ title: "A", userId: "u1", eventId: null },
				{ title: "B", userId: "u1" },
			],
		});

		await POST(req);

		expect(prisma.event.findMany).not.toHaveBeenCalled();
		expect(prisma.task.create).toHaveBeenCalledTimes(2);
	});

	it("normalises examId none to null in bulk payload", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-exam-none",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Task",
					userId: "u1",
					examId: "none",
				},
			],
		});

		await POST(req);

		expect(prisma.task.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				examId: null,
			}),
		});
	});

	it("handles POST error in bulk branch", async () => {
		(prisma.task.create as jest.Mock).mockRejectedValue(new Error("fail"));

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [{ title: "Broken task", userId: "u1" }],
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to create task");
	});
});

describe("POST /api/tasks - single", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("creates single task with exam category", async () => {
		(prisma.exam.findUnique as jest.Mock).mockResolvedValue({
			title: "Math",
		});

		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t1" });

		const req = mockRequest("http://localhost/api/tasks", {
			title: "Study",
			userId: "u1",
			examId: "exam1",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(data.task).toEqual({ id: "t1" });
		expect(prisma.exam.findUnique).toHaveBeenCalledWith({
			where: { id: "exam1" },
		});
		expect(prisma.task.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				title: "Study",
				userId: "u1",
				examId: "exam1",
				category: "Math",
				completed: false,
				completedAt: null,
				priority: "Medium",
				duration: 0,
				subtasks: [],
				description: null,
				dueDate: null,
				eventId: null,
				isRecurring: false,
				recurrence: null,
				scheduledDate: null,
				scheduledTime: null,
				bufferDays: null,
				url: null,
				scheduledRelativeTo: null,
				relativeOffsetDays: null,
				eventLinkMode: null,
			}),
			include: { exam: true },
		});
	});

	it("creates single task without exam", async () => {
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t2" });

		const req = mockRequest("http://localhost/api/tasks", {
			title: "Task",
			userId: "u1",
			examId: "none",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(data.task).toEqual({ id: "t2" });
		expect(prisma.exam.findUnique).not.toHaveBeenCalled();
		expect(prisma.task.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				title: "Task",
				userId: "u1",
				examId: null,
				category: "General",
			}),
			include: { exam: true },
		});
	});

	it("uses General category when exam lookup returns null", async () => {
		(prisma.exam.findUnique as jest.Mock).mockResolvedValue(null);
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t3" });

		const req = mockRequest("http://localhost/api/tasks", {
			title: "Task",
			userId: "u1",
			examId: "missing-exam",
		});

		await POST(req);

		expect(prisma.task.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				examId: "missing-exam",
				category: "General",
			}),
			include: { exam: true },
		});
	});

	it("passes through all optional single-task fields", async () => {
		(prisma.exam.findUnique as jest.Mock).mockResolvedValue({
			title: "Physics",
		});
		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t4" });

		const req = mockRequest("http://localhost/api/tasks", {
			title: "Revise",
			description: "Chapter 1",
			dueDate: "2026-08-10T00:00:00.000Z",
			userId: "u1",
			priority: "High",
			duration: 90,
			subtasks: ["A", "B"],
			examId: "exam-1",
			eventId: "event-1",
			isRecurring: true,
			recurrence: { type: "weekly" },
			scheduledDate: "2026-08-01T00:00:00.000Z",
			scheduledTime: "2026-08-01T09:30:00.000Z",
			bufferDays: 4,
			url: "https://example.com/task",
			scheduledRelativeTo: "exam",
			relativeOffsetDays: 5,
			eventLinkMode: "after",
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0];

		expect(call.include).toEqual({ exam: true });
		expect(call.data).toEqual(
			expect.objectContaining({
				title: "Revise",
				description: "Chapter 1",
				userId: "u1",
				priority: "High",
				duration: 90,
				subtasks: ["A", "B"],
				examId: "exam-1",
				category: "Physics",
				eventId: "event-1",
				isRecurring: true,
				recurrence: { type: "weekly" },
				bufferDays: 4,
				url: "https://example.com/task",
				scheduledRelativeTo: "exam",
				relativeOffsetDays: 5,
				eventLinkMode: "after",
			}),
		);

		expect(call.data.dueDate).toBeInstanceOf(Date);
		expect(call.data.scheduledDate).toBeInstanceOf(Date);
		expect(call.data.scheduledTime).toBeInstanceOf(Date);
	});

	it("handles POST error", async () => {
		(prisma.task.create as jest.Mock).mockRejectedValue(new Error("fail"));

		const req = mockRequest("http://localhost/api/tasks", {
			title: "Task",
			userId: "u1",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to create task");
	});

	it("handles request.json throwing", async () => {
		const req = {
			url: "http://localhost/api/tasks",
			json: jest.fn().mockRejectedValue(new Error("bad json")),
		} as any;

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to create task");
	});

	it("computes date from daily recurring event after advancing from a past start", async () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(10, 0, 0, 0);

		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "daily-1",
				start: yesterday,
				recurrence: {
					type: "daily",
				},
			},
		]);

		(prisma.task.create as jest.Mock).mockResolvedValue({ id: "t-daily" });

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Daily linked task",
					userId: "u1",
					eventId: "daily-1",
					relativeOffsetDays: 1,
					scheduleTime: true,
					specificTime: "09:00",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getHours()).toBe(9);
		expect(call.scheduledTime.getMinutes()).toBe(0);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Since event started yesterday and recurs daily, next occurrence is today,
		// then offsetDays=1 should push it to tomorrow.
		const expected = new Date(today);
		expected.setDate(expected.getDate() + 1);

		expect(call.scheduledDate.getTime()).toBe(expected.getTime());
	});

	it("computes date from monthly recurring event after advancing from a past month", async () => {
		const lastMonth = new Date();
		lastMonth.setMonth(lastMonth.getMonth() - 1);
		lastMonth.setHours(12, 0, 0, 0);

		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "monthly-1",
				start: lastMonth,
				recurrence: {
					type: "monthly",
				},
			},
		]);

		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-monthly",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Monthly linked task",
					userId: "u1",
					eventId: "monthly-1",
					relativeOffsetDays: 0,
					scheduleTime: true,
					specificTime: "13:30",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getHours()).toBe(13);
		expect(call.scheduledTime.getMinutes()).toBe(30);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// We mainly want to prove it advanced through the monthly branch
		// and returned a valid occurrence on or after today.
		expect(call.scheduledDate.getTime()).toBeGreaterThanOrEqual(
			today.getTime(),
		);
	});

	it("falls back after weekly recurrence has no valid mapped days", async () => {
		const today = new Date();
		today.setHours(10, 0, 0, 0);

		const until = new Date(today);
		until.setHours(23, 59, 59, 999);

		(prisma.event.findMany as jest.Mock).mockResolvedValue([
			{
				id: "weekly-invalid",
				start: today,
				recurrence: {
					type: "weekly",
					days: ["NotADay"],
					until,
				},
			},
		]);

		(prisma.task.create as jest.Mock).mockResolvedValue({
			id: "t-weekly-invalid",
		});

		const req = mockRequest("http://localhost/api/tasks", {
			tasks: [
				{
					title: "Weekly invalid task",
					userId: "u1",
					eventId: "weekly-invalid",
					relativeOffsetDays: 2,
					scheduleTime: true,
					specificTime: "15:10",
				},
			],
		});

		await POST(req);

		const call = (prisma.task.create as jest.Mock).mock.calls[0][0].data;

		expect(call.scheduledDate).toBeInstanceOf(Date);
		expect(call.scheduledTime).toBeInstanceOf(Date);
		expect(call.scheduledTime.getHours()).toBe(15);
		expect(call.scheduledTime.getMinutes()).toBe(10);

		// Since no weekly day is valid, helper should fall back to event start + offset
		const expected = new Date(today);
		expected.setHours(0, 0, 0, 0);
		expected.setDate(expected.getDate() + 2);

		expect(call.scheduledDate.getTime()).toBe(expected.getTime());
	});
});
