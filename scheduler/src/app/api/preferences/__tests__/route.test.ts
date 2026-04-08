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
		userPreferences: {
			findUnique: jest.fn(),
			upsert: jest.fn(),
		},
	},
}));

const mockedFindUnique = prisma.userPreferences.findUnique as jest.Mock;
const mockedUpsert = prisma.userPreferences.upsert as jest.Mock;

function mockRequest(url: string, body?: any) {
	return {
		url,
		json: jest.fn().mockResolvedValue(body),
	} as any;
}

describe("/api/preferences GET", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 400 when userId is missing", async () => {
		const req = mockRequest("http://localhost/api/preferences");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data.error).toBe("userId required");
		expect(mockedFindUnique).not.toHaveBeenCalled();
	});

	it("returns preferences when found", async () => {
		mockedFindUnique.mockResolvedValue({
			userId: "u1",
			workStartTime: "08:00",
		});

		const req = mockRequest("http://localhost/api/preferences?userId=u1");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(mockedFindUnique).toHaveBeenCalledWith({
			where: { userId: "u1" },
		});
		expect(data.preferences).toEqual({
			userId: "u1",
			workStartTime: "08:00",
		});
	});

	it("returns null when no preferences exist", async () => {
		mockedFindUnique.mockResolvedValue(null);

		const req = mockRequest("http://localhost/api/preferences?userId=u2");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.preferences).toBeNull();
	});

	it("handles GET database error", async () => {
		mockedFindUnique.mockRejectedValue(new Error("db fail"));

		const req = mockRequest("http://localhost/api/preferences?userId=u3");

		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to fetch preferences");
	});
});

describe("/api/preferences POST", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 400 when userID is missing", async () => {
		const req = mockRequest("http://localhost/api/preferences", {
			workStartTime: "08:00",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data.error).toBe("User ID required");
		expect(mockedUpsert).not.toHaveBeenCalled();
	});

	it("upserts preferences using provided values", async () => {
		mockedUpsert.mockResolvedValue({
			userId: "u1",
			workStartTime: "07:00",
			workEndTime: "15:00",
		});

		const body = {
			userID: "u1",
			workStartTime: "07:00",
			workEndTime: "15:00",
			daysOff: ["Sat"],
			sessionLength: 50,
			breakLength: 10,
			breaksPerDay: 2,
			taskOrder: "easy-first",
			maxTasksPerDay: 5,
			defaultTaskDuration: 45,
			reminderDays: 4,
		};

		const req = mockRequest("http://localhost/api/preferences", body);

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(mockedUpsert).toHaveBeenCalledWith({
			where: { userId: "u1" },
			update: {
				workStartTime: "07:00",
				workEndTime: "15:00",
				daysOff: ["Sat"],
				sessionLength: 50,
				breakLength: 10,
				breaksPerDay: 2,
				taskOrder: "easy-first",
				maxTasksPerDay: 5,
				defaultTaskDuration: 45,
				reminderDays: 4,
			},
			create: {
				userId: "u1",
				workStartTime: "07:00",
				workEndTime: "15:00",
				daysOff: ["Sat"],
				sessionLength: 50,
				breakLength: 10,
				breaksPerDay: 2,
				taskOrder: "easy-first",
				maxTasksPerDay: 5,
				defaultTaskDuration: 45,
				reminderDays: 4,
			},
		});
		expect(data.success).toBe(true);
		expect(data.preferences).toEqual({
			userId: "u1",
			workStartTime: "07:00",
			workEndTime: "15:00",
		});
	});

	it("uses defaults for missing create values", async () => {
		mockedUpsert.mockResolvedValue({
			userId: "u2",
		});

		const req = mockRequest("http://localhost/api/preferences", {
			userID: "u2",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(mockedUpsert).toHaveBeenCalledWith({
			where: { userId: "u2" },
			update: {
				workStartTime: undefined,
				workEndTime: undefined,
				daysOff: undefined,
				sessionLength: undefined,
				breakLength: undefined,
				breaksPerDay: undefined,
				taskOrder: undefined,
				maxTasksPerDay: undefined,
				defaultTaskDuration: undefined,
				reminderDays: undefined,
			},
			create: {
				userId: "u2",
				workStartTime: "09:00",
				workEndTime: "17:00",
				daysOff: [],
				sessionLength: 90,
				breakLength: 15,
				breaksPerDay: 3,
				taskOrder: "hard-first",
				maxTasksPerDay: 8,
				defaultTaskDuration: 60,
				reminderDays: 2,
			},
		});
		expect(data.success).toBe(true);
	});

	it("uses nullish coalescing defaults only for null or undefined", async () => {
		mockedUpsert.mockResolvedValue({
			userId: "u3",
		});

		const req = mockRequest("http://localhost/api/preferences", {
			userID: "u3",
			workStartTime: null,
			workEndTime: undefined,
			daysOff: [],
			sessionLength: 0,
			breakLength: 0,
			breaksPerDay: 0,
			taskOrder: "",
			maxTasksPerDay: 0,
			defaultTaskDuration: 0,
			reminderDays: 0,
		});

		await POST(req);

		expect(mockedUpsert).toHaveBeenCalledWith({
			where: { userId: "u3" },
			update: {
				workStartTime: null,
				workEndTime: undefined,
				daysOff: [],
				sessionLength: 0,
				breakLength: 0,
				breaksPerDay: 0,
				taskOrder: "",
				maxTasksPerDay: 0,
				defaultTaskDuration: 0,
				reminderDays: 0,
			},
			create: {
				userId: "u3",
				workStartTime: "09:00",
				workEndTime: "17:00",
				daysOff: [],
				sessionLength: 0,
				breakLength: 0,
				breaksPerDay: 0,
				taskOrder: "",
				maxTasksPerDay: 0,
				defaultTaskDuration: 0,
				reminderDays: 0,
			},
		});
	});

	it("handles request.json failure", async () => {
		const req = {
			url: "http://localhost/api/preferences",
			json: jest.fn().mockRejectedValue(new Error("bad json")),
		} as any;

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to save preferences");
	});

	it("handles POST database error", async () => {
		mockedUpsert.mockRejectedValue(new Error("db fail"));

		const req = mockRequest("http://localhost/api/preferences", {
			userID: "u4",
			workStartTime: "10:00",
		});

		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data.error).toBe("Failed to save preferences");
	});
});
