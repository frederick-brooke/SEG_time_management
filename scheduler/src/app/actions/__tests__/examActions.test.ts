/**
 * Testing for examActions.
 */

import { createExam, getMyExams, generateExamPlan, updateExamSettings, getExamById, updateExamUnavailableDays, deleteExam } from "../examActions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { checkUpcomingDeadlines, saveTopicAsTask } from "../examNotifications";
import { examPlannerLogic } from "@/lib/examPlannerLogic";
import { getServers } from "node:dns";
import { mock } from "node:test";

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
        category: { create: jest.fn() },
        event: { 
            deleteMany: jest.fn(),
        },
        task: { 
            deleteMany: jest.fn(),
        },
    },
}));

jest.mock("../examNotifications", () => ({
    saveTopicAsTask: jest.fn().mockResolvedValue(true),
    checkUpcomingDeadlines: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/examPlannerLogic", () => ({
    examPlannerLogic: {
        getAvailableDates: jest.fn().mockReturnValue([new Date(), new Date(), new Date()]),
    },
}));

// Tests

describe("examActions", () => {
    const mockUser = { id: "user-1"};
    beforeEach(() => jest.clearAllMocks());
    describe("createExam", () => {
        it("returns unauthorised if no session exists", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            const result = await createExam(new FormData());
            expect(result.success).toBe(false);
            expect(result.error).toBe("Unauthorised");
        });

        it("successfully creates exam with transaction", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
            const formData = new FormData();
            formData.append("title", "Science");
            formData.append("examDate", "2026-12-01");
            formData.append("startTime", "09:00");
            formData.append("endTime", "11:00");
            formData.append("maxTimePerDay", "120");

            (prisma.$transaction as jest.Mock).mockResolvedValue({ id: "exam-1" });

            const result = await createExam(formData);
            expect(result.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalled();
        });

        it("hits the catch block when createExam fails", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "user-1" }});
            (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error("Transaction Failed"));
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
                unavailableDays: []
            };
            (prisma.exam.findUnique as jest.Mock).mockResolvedValue(mockExam);

            const topics = [
                { title: "T1", duration: 40 },
                { title: "T2", duration: 30 }
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
            (prisma.exam.findUnique as jest.Mock).mockRejectedValueOnce(new Error("Crash"));
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
            (prisma.exam.update as jest.Mock).mockRejectedValueOnce(new Error("DB Fail"));
            const result = await updateExamSettings("1", {});
            expect(result.success).toBe(false);
        });
    });

    describe("deleteExam", () => {
        it("deletes exam successfully", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });

            (prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({
                id: "exam-1",
                title: "Test Exam"
            });

            (prisma.$transaction as jest.Mock).mockResolvedValueOnce([{}, {}, {}]);

            const result = await deleteExam("exam-1");

            expect(result.success).toBe(true);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("returns error on failure", async () => {
            (prisma.exam.delete as jest.Mock).mockRejectedValueOnce(new Error("Delete failed"));
            const result = await deleteExam("1");
            expect(result.success).toBe(false);
        });
    });

    describe("getExamById", () => {
        it("returns the exam when found", async () => {
            (prisma.exam.findUnique as jest.Mock).mockResolvedValueOnce({ id: "1", title: "Test" });
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
            (prisma.exam.update as jest.Mock).mockRejectedValueOnce(new Error());
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
            (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-1" }});
            (prisma.exam.findMany as jest.Mock).mockResolvedValueOnce([{ id: "e1", title: "Test" }]);
            const result = await getMyExams();
            expect(result.length).toBe(1);
        });
    });
});