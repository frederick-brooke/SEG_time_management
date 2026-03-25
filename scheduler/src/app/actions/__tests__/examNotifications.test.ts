import { saveTopicAsTask, checkUpcomingDeadlines } from "../examNotifications";
import { prisma } from "@/lib/prisma";
import { createNotification } from "../notifications";
import { create } from "domain";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        exam: { findUnique: jest.fn(), findMany: jest.fn() },
        task: { create: jest.fn(), findMany: jest.fn() },
        revisionMaterial: { create: jest.fn() },
    },
}));

jest.mock("../notifications", () => ({
    createNotification: jest.fn(),
}));

describe("examNotifications Actions", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("saveTopicAsTask", () => {
        it("creates a task and revision material if URL is provided", async () => {
            (prisma.exam.findUnique as jest.Mock).mockResolvedValue({ title: "Maths" });
            const topic = { title: "Algebra", duration: 60, url: "http://test.com" };
            const dueDate = new Date();
            await saveTopicAsTask("exam-1", "user-1", topic, dueDate);

            expect(prisma.task.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ title: "Algebra", url: "http://test.com" })                
            }));
            expect(prisma.revisionMaterial.create).toHaveBeenCalled();
        });
    });

    describe("checkUpcomingDeadlines", () => {
        it("triggers notifications for tasks and exams within 72 hours", async () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            (prisma.task.findMany as jest.Mock).mockResolvedValue([{ title: "Task 1", dueDate: futureDate }]);
            (prisma.exam.findMany as jest.Mock).mockResolvedValue([{ title: "Exam 1", examDate: futureDate }]);
            await checkUpcomingDeadlines("user-1");
            expect(createNotification).toHaveBeenCalledTimes(2);
            expect(createNotification).toHaveBeenCalledWith("user-1", "Task Due Soon", expect.any(String), "WARNING");
        });
    });
});