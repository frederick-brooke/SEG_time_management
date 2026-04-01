/**
 * Testing for exam-planner page.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ExamPlannerPage from "../page";
import { useSession } from "next-auth/react";
import { getMyExams, deleteExam } from "@/app/actions/examActions";
import { Button } from "@/components/ui/Button";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
}));

jest.mock("@/app/actions/examActions", () => ({
    getMyExams: jest.fn(),
    deleteExam: jest.fn(),
}));

jest.mock("@/components/exams/ExamFormDialog", () => ({
    __esModule: true,
    default: ({ onExamAdded, onExamUpdated, editingExam }: any) => (
        <div>
            <Button 
                data-testid="add-trigger"
                onClick={() => onExamAdded({ id: "new", title: "New Exam"})}>
                    Add Mock Exam
            </Button>
            {editingExam && (
                <Button 
                    data-testid="update-trigger"
                    onClick={() => onExamUpdated({...editingExam, title: "Updated Exam" })}>
                        Updated Mock Exam
                </Button>
            )}
        </div>
    ),
}));

describe("Exam planner page coverage", () => {
    const mockExams = [
        {
            id: "exam-1",
            title: "Software engineering",
            examDate: "2026-05-20T00:00:00.000Z",
            maxTimePerDay: 120,
            tasks: [{ status: "completed" }, { status: "todo" }],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: "u1" }},
            status: "authenticated",
        });
        (getMyExams as jest.Mock).mockReturnValue(mockExams);
    });

    it("redirects to login if unauthenticated", async () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: "unauthenticated"});
        render(<ExamPlannerPage />);
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    });

    it("renders a list of exams and calculates progress correctly", async () => {
        render(<ExamPlannerPage />);
        expect(await screen.findByText("Software engineering")).toBeInTheDocument();
        expect(screen.getByText(/50/)).toBeInTheDocument();
    });

    it("shows fallback message when no exams are returned", async () => {
        (getMyExams as jest.Mock).mockResolvedValue([]);
        render(<ExamPlannerPage />);
        expect(await screen.findByText(/No exams found/i)).toBeInTheDocument();
    });

    it("handles exam deletion with browser confirmation", async () => {
        window.confirm = jest.fn(() => true);
        render(<ExamPlannerPage />);
        const deleteBtn = await screen.findByText(/Delete exam/i);
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(deleteExam).toHaveBeenCalledWith("exam-1");
        });
    });

    it("shows loading state when status is loading", () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: "loading" });
        render(<ExamPlannerPage/>);
        expect(screen.getByText("Loading session")).toBeInTheDocument();
    });

    it("handles delete error gracefully",  async () => {
        window.confirm = jest.fn(() => true);
        window.alert = jest.fn();
        (deleteExam as jest.Mock).mockRejectedValue(new Error("Delete failed"));
        render(<ExamPlannerPage/>);
        const deleteBtn = await screen.findByText(/Delete exam/i);
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Could not delete exam");
        });     
    });

    it("renders singular Task text when there is exactly one task", async () => {
        const singleTaskExam = [
            {
                id: "exam-singular",
                title: "Maths",
                examDate: "2026-05-20T00:00:00.000Z",
                maxTimePerDay: 60,
                tasks: [{ status: "todo" }],
            },
        ];
        (getMyExams as jest.Mock).mockResolvedValue(singleTaskExam);
        render(<ExamPlannerPage/>);
        expect(await screen.findByText(/1 Task/i)).toBeInTheDocument();
    });

    it("renders 0% progress when exam has no tasks", async () => {
        const noTaskExam = [
            {
                id: "exam-no-tasks",
                title: "Empty exam",
                examDate: "2026-05-20T00:00:00.000Z",
                maxTimePerDay: 30,
                tasks: [],
            },
        ];
        (getMyExams as jest.Mock).mockResolvedValue(noTaskExam);
        render(<ExamPlannerPage/>);
        expect(await screen.findByText("0")).toBeInTheDocument();
    });

    it("does nothing if exam deletion is cancelled", async () => {
        window.confirm = jest.fn(() => false);
        render(<ExamPlannerPage/>);
        const deleteBtn = await screen.findByText(/Delete exam/i);
        fireEvent.click(deleteBtn);
        expect(deleteExam).not.toHaveBeenCalled();
    });

    it("executes all internal state update functions", async () => {
        render(<ExamPlannerPage/>);
        const addBtn = await screen.findByTestId("add-trigger");
        fireEvent.click(addBtn);
        expect(await screen.findByText("New Exam")).toBeInTheDocument();

        const updateBtn = (await screen.findAllByTestId("update-trigger"))[0];
        fireEvent.click(updateBtn);
        expect(await screen.findByText("Updated Exam")).toBeInTheDocument();
    })

})