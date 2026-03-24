import { render, screen, waitFor } from "@testing-library/react";
import ExamIdPage from "@/src/app/(pages)/exam-planner/[id]/page";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getMyExams } from "@/src/app/actions/examActions";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    useParams: () => ({ id: "exam-123" }),
}));

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
}));

jest.mock("@/src/app/actions/examActions", () => ({
    getMyExams: jest.fn(),
}));

jest.mock("@/src/components/layout/LunarThemeWrapper", () => ({
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>,
}));

describe("Exam detail page [id]", () => {
    const mockExam = {
        id: "exam-123",
        title: "Mathematics",
        examDate: "2026-06-15:T00:00:00.000Z",
        tasks: [{ id: "t1", status: "todo", title: "Calculus" }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: "u1" }},
            status: "authenticated",
        });
    });

    it("fetches and displays the specific exam details", async () => {
        (getMyExams as jest.Mock).mockResolvedValue([mockExam]);

        render(<ExamIdPage />)

        expect(await screen.findByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("Calculus")).toBeInTheDocument();
    });

    it("shows loading state", () => {
        (useSession as jest.Mock).mockReturnValue({ status: "loading" });
        render(<ExamIdPage />)
        expect(screen.getByText(/Loading session/i)).toBeInTheDocument();
    });
});