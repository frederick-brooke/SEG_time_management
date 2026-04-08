/**
 * Testing for examActions.
 */

import {
	createExam,
	getMyExams,
	generateExamPlan,
	updateExamSettings,
	getExamById,
	updateExamUnavailableDays,
	deleteExam,
} from "../examActions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { saveTopicAsTask } from "../examNotifications";
import { examPlannerLogic } from "@/lib/examPlannerLogic";
import { createNotification } from "../notifications";
import { NotificationType } from "@prisma/client";
// Mocks

jest.mock("next-auth", () => ({
	__esModule: true,
	default: jest.fn(),
	getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
	authOptions: {},
}));

jest.mock("next/cache", () => ({
	revalidatePath: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
	prisma: {
		exam: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		$transaction: jest.fn(),
		category: {
			create: jest.fn(),
			deleteMany: jest.fn(),
		},
		event: {
			create: jest.fn(),
			deleteMany: jest.fn(),
		},
		task: {
			deleteMany: jest.fn(),
		},
	},
}));

jest.mock("../notifications", () => ({
	createNotification: jest.fn().mockResolvedValue({
		notification: null,
		error: null,
	}),
}));

jest.mock("../examNotifications", () => ({
	saveTopicAsTask: jest.fn().mockResolvedValue(true),
	checkUpcomingDeadlines: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/examPlannerLogic", () => ({
	examPlannerLogic: {
		getAvailableDates: jest
			.fn()
			.mockReturnValue([new Date(), new Date(), new Date()]),
	},
}));

// Tests

describe("examActions", () => {
	const mockUser = { id: "user-1" };
	beforeEach(() => {
		jest.clearAllMocks();
		(getServerSession as jest.Mock).mockResolvedValue({
			user: { id: "user-1" },
		});
	});
	describe("createExam", () => {
		it("returns unauthorised if no session exists", async () => {
			(getServerSession as jest.Mock).mockResolvedValue(null);
			const result = await createExam(new FormData());
			expect(result.success).toBe(false);
			expect(result.error).toBe("Unauthorised");
		});

		it("successfully creates exam with transaction", async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: mockUser,
			});

			const formData = new FormData();
			formData.append("title", "Science");
			formData.append("examDate", "2026-12-01");
			formData.append("startTime", "09:00");
			formData.append("endTime", "11:00");
			formData.append("maxTimePerDay", "120");

			const mockCategory = { name: "Science" };
			const mockExam = { id: "exam-1" };

			const tx = {
				category: {
					create: jest.fn().mockResolvedValue(mockCategory),
				},
				exam: {
					create: jest.fn().mockResolvedValue(mockExam),
				},
				event: {
					create: jest.fn().mockResolvedValue({ id: "event-1" }),
				},
			};

			(prisma.$transaction as jest.Mock).mockImplementation(
				async (callback) => {
					return callback(tx);
				},
			);

			const result = await createExam(formData);

			expect(tx.category.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					name: "Science",
					color: "#ef4444",
				},
			});

			expect(tx.exam.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					title: "Science",
					examDate: new Date("2026-12-01T09:00:00"),
					endTime: new Date("2026-12-01T11:00:00"),
					maxTimePerDay: 120,
					unavailableDays: [],
				},
			});

			expect(tx.event.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					title: "Exam: Science",
					start: new Date("2026-12-01T09:00:00"),
					end: new Date("2026-12-01T11:00:00"),
					category: "Science",
				},
			});

			expect(result).toEqual({
				success: true,
				data: mockExam,
			});

			expect(revalidatePath).toHaveBeenCalledWith("/exam-planner");
			expect(revalidatePath).toHaveBeenCalledWith("/calendar");
		});

		it("hits the catch block when createExam fails", async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: "user-1" },
			});
			(prisma.$transaction as jest.Mock).mockRejectedValueOnce(
				new Error("Transaction Failed"),
			);
			const formData = new FormData();
			formData.append("title", "Fail Test");
			const result = await createExam(formData);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to create exam");
		});
	});

	describe("generateExamPlan", () => {
		it("handles the logic for spilling topics over to the next day", async () => {
			const mockExam = {
				userId: "user-1",
				examDate: new Date("2026-12-05"),
				maxTimePerDay: 60,
				unavailableDays: [],
			};
			(prisma.exam.findUnique as jest.Mock).mockResolvedValue(mockExam);

			const topics = [
				{ title: "T1", duration: 40 },
				{ title: "T2", duration: 30 },
			];

			const result = await generateExamPlan("exam-1", topics);

			expect(result.success).toBe(true);
		});

		it("returns error if exam is not found", async () => {
			(prisma.exam.findUnique as jest.Mock).mockResolvedValue(null);
			const result = await generateExamPlan("non-existent", []);
			expect(result.error).toBe("Exam not found");
		});

		it("hits catch block for plan generation", async () => {
			(prisma.exam.findUnique as jest.Mock).mockRejectedValueOnce(
				new Error("Crash"),
			);
			const result = await generateExamPlan("1", []);
			expect(result.success).toBe(false);
		});
	});

	describe("updateExamSettings", () => {
		it("updates settings successfully", async () => {
			(prisma.exam.update as jest.Mock).mockResolvedValue({ id: "1" });
			const result = await updateExamSettings("1", { title: "Updated" });
			expect(result.success).toBe(true);
		});

		it("fails when unauthorised", async () => {
			(getServerSession as jest.Mock).mockResolvedValueOnce(null);
			const result = await updateExamSettings("1", {});
			expect(result.success).toBe(false);
		});

		it("hits catch block on database error", async () => {
			(prisma.exam.update as jest.Mock).mockRejectedValueOnce(
				new Error("DB Fail"),
			);
			const result = await updateExamSettings("1", {});
			expect(result.success).toBe(false);
		});
	});

	describe("deleteExam", () => {
		it("deletes exam successfully", async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: mockUser,
			});

			(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
				title: "Test Exam",
			});

			(prisma.event.deleteMany as jest.Mock).mockResolvedValue({});
			(prisma.task.deleteMany as jest.Mock).mockResolvedValue({});
			(prisma.category.deleteMany as jest.Mock).mockResolvedValue({});
			(prisma.exam.delete as jest.Mock).mockResolvedValue({});

			(prisma.$transaction as jest.Mock).mockResolvedValueOnce([
				{},
				{},
				{},
				{},
			]);

			const result = await deleteExam("exam-1");

			expect(prisma.event.deleteMany).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					title: "Exam: Test Exam",
				},
			});

			expect(prisma.task.deleteMany).toHaveBeenCalledWith({
				where: { examId: "exam-1" },
			});

			expect(prisma.category.deleteMany).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					name: "Test Exam",
				},
			});

			expect(prisma.exam.delete).toHaveBeenCalledWith({
				where: { id: "exam-1", userId: "user-1" },
			});

			expect(prisma.$transaction).toHaveBeenCalled();
			expect(result).toEqual({ success: true });

			expect(revalidatePath).toHaveBeenCalledWith("/exam-planner");
			expect(revalidatePath).toHaveBeenCalledWith("/calendar");
			expect(revalidatePath).toHaveBeenCalledWith("/exam-hub");
		});

		it("returns error on failure", async () => {
			(prisma.exam.delete as jest.Mock).mockRejectedValueOnce(
				new Error("Delete failed"),
			);
			const result = await deleteExam("1");
			expect(result.success).toBe(false);
		});
	});

	describe("getExamById", () => {
		it("returns the exam when found", async () => {
			(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
				id: "1",
				title: "Test",
			});
			const result = await getExamById("1");
			expect(result?.id).toBe("1");
		});

		it("returns null if no session", async () => {
			(getServerSession as jest.Mock).mockResolvedValueOnce(null);
			expect(await getExamById("1")).toBeNull();
		});
	});

	describe("updateExamUnavailableDays", () => {
		it("updates with cleaned dates", async () => {
			(prisma.exam.update as jest.Mock).mockResolvedValue({ id: "1" });
			const result = await updateExamUnavailableDays("1", [new Date()]);
			expect(result.success).toBe(true);
		});

		it("handles undefine days branch", async () => {
			(prisma.exam.update as jest.Mock).mockResolvedValue({ id: "1" });
			const result = await updateExamUnavailableDays("1", undefined);
			expect(result.success).toBe(true);
		});

		it("hits catch block", async () => {
			(prisma.exam.update as jest.Mock).mockRejectedValueOnce(
				new Error(),
			);
			const result = await updateExamUnavailableDays("1", []);
			expect(result.success).toBe(false);
		});
	});

	describe("getMyExams", () => {
		it("returns empty array if user is not authenticated", async () => {
			(getServerSession as jest.Mock).mockResolvedValueOnce(null);
			const result = await getMyExams();
			expect(result).toEqual([]);
		});

		it("fetches exam when authenticated", async () => {
			(getServerSession as jest.Mock).mockResolvedValueOnce({
				user: { id: "user-1" },
			});
			(prisma.exam.findMany as jest.Mock).mockResolvedValueOnce([
				{ id: "e1", title: "Test" },
			]);
			const result = await getMyExams();
			expect(result.length).toBe(1);
		});
	});

	it("returns unauthorised when deleting exam without session", async () => {
		(getServerSession as jest.Mock).mockResolvedValueOnce(null);

		const result = await deleteExam("exam-1");

		expect(result).toEqual({
			success: false,
			error: "Unauthorised",
		});
	});

	it("returns exam not found when exam does not exist", async () => {
		(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce(null);

		const result = await deleteExam("missing-exam");

		expect(result).toEqual({
			success: false,
			error: "Exam not found",
		});
	});

	it("returns unauthorised when updating unavailable days without session", async () => {
		(getServerSession as jest.Mock).mockResolvedValueOnce(null);

		const result = await updateExamUnavailableDays("exam-1", []);

		expect(result).toEqual({
			success: false,
			error: "Unauthorised",
		});
	});

	it("updates settings with user-scoped where clause", async () => {
		(prisma.exam.update as jest.Mock).mockResolvedValueOnce({
			id: "1",
			title: "Updated",
		});

		const result = await updateExamSettings("1", { title: "Updated" });

		expect(prisma.exam.update).toHaveBeenCalledWith({
			where: { id: "1", userId: "user-1" },
			data: { title: "Updated" },
		});

		expect(revalidatePath).toHaveBeenCalledWith("/exam-planner/1");
		expect(result).toEqual({
			success: true,
			data: { id: "1", title: "Updated" },
		});
	});

	it("keeps topics on the same day when max time is not exceeded", async () => {
		const availableDates = [
			new Date("2026-12-01"),
			new Date("2026-12-02"),
			new Date("2026-12-03"),
		];

		(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
			userId: "user-1",
			examDate: new Date("2026-12-05"),
			maxTimePerDay: 120,
			unavailableDays: [],
		});

		(examPlannerLogic.getAvailableDates as jest.Mock).mockReturnValueOnce(
			availableDates,
		);

		const topics = [
			{ title: "T1", duration: 40 },
			{ title: "T2", duration: 30 },
		];

		const result = await generateExamPlan("exam-1", topics);

		expect(result).toEqual({ success: true });

		expect(saveTopicAsTask).toHaveBeenNthCalledWith(
			1,
			"exam-1",
			"user-1",
			topics[0],
			availableDates[0],
		);

		expect(saveTopicAsTask).toHaveBeenNthCalledWith(
			2,
			"exam-1",
			"user-1",
			topics[1],
			availableDates[0],
		);
	});

	it("stops scheduling when there are no more available dates", async () => {
		const availableDates = [new Date("2026-12-01")];

		(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
			userId: "user-1",
			examDate: new Date("2026-12-05"),
			maxTimePerDay: 30,
			unavailableDays: [],
		});

		(examPlannerLogic.getAvailableDates as jest.Mock).mockReturnValueOnce(
			availableDates,
		);

		const topics = [
			{ title: "T1", duration: 20 },
			{ title: "T2", duration: 20 },
			{ title: "T3", duration: 20 },
		];

		const result = await generateExamPlan("exam-1", topics);

		expect(result).toEqual({ success: true });
		expect(saveTopicAsTask).toHaveBeenCalledTimes(1);
	});

	it("queries the exam with the expected select fields before generating a plan", async () => {
		const mockExam = {
			userId: "user-1",
			examDate: new Date("2026-12-05"),
			maxTimePerDay: 120,
			unavailableDays: [],
		};

		(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce(mockExam);

		const topics = [{ title: "Topic 1", duration: 30 }];

		const result = await generateExamPlan("exam-1", topics);

		expect(prisma.exam.findUnique).toHaveBeenCalledWith({
			where: { id: "exam-1" },
			select: {
				examDate: true,
				unavailableDays: true,
				maxTimePerDay: true,
				userId: true,
			},
		});

		expect(examPlannerLogic.getAvailableDates).toHaveBeenCalled();
		expect(createNotification).toHaveBeenCalledWith(
			"user-1",
			"Study Plan Generated",
			"Your revision plan for this exam is ready.",
			NotificationType.SUCCESS,
		);

		expect(result).toEqual({ success: true });
	});

	it("returns failure when deleteExam transaction throws", async () => {
		(getServerSession as jest.Mock).mockResolvedValue({
			user: { id: "user-1" },
		});

		(prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
			title: "Test Exam",
		});

		(prisma.event.deleteMany as jest.Mock).mockResolvedValue({});
		(prisma.task.deleteMany as jest.Mock).mockResolvedValue({});
		(prisma.category.deleteMany as jest.Mock).mockResolvedValue({});
		(prisma.exam.delete as jest.Mock).mockResolvedValue({});

		(prisma.$transaction as jest.Mock).mockRejectedValueOnce(
			new Error("transaction failed"),
		);

		const result = await deleteExam("exam-1");

		expect(result).toEqual({
			success: false,
			error: "Failed to delete exam",
		});
	});
});
