import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ExamPlannerPage from "../page";
import { useSession } from "next-auth/react";
import { getMyExams, deleteExam } from "@/src/app/actions/examActions";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
}));

jest.mock("@/src/app/actions/examActions", () => ({
    getMyExams: jest.fn(),
    deleteExam: jest.fn(),
}));

jest.mock("@/src/components/exams/exam-form-dialog", () => ({
    __esModule: true,
    default: () => <div data-testid="exam-dialog">ExamFormDialog</div>,
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
        expect(screen.getByText("50%")).toBeInTheDocument();
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
})