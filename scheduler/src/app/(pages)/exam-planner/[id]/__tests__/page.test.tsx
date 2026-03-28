/**
 * Testing for exam-planner/[id] page
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ExamIdPage from "@/app/(pages)/exam-planner/[id]/page";
import { useSession } from "next-auth/react";
import { getExamById } from "@/app/actions/examActions";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    useParams: () => ({ id: "exam-123" }),
}));

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
}));

jest.mock("@/app/actions/examActions", () => ({
    getExamById: jest.fn(),
    generateExamPlan: jest.fn(),
    updateExamUnavailableDays: jest.fn(),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/to-do-list", () => ({
    __esModule: true,
    ToDoList: ({ children }: any) => <div data-testid="todo-list">mocked</div>,
}));

describe("Exam detail page [id]", () => {
    const mockExam = {
        id: "exam-123",
        title: "Mathematics",
        examDate: "2026-06-15T00:00:00.000Z",
        maxTimePerDay: 60,
        unavailableDays: [],
        userId: "u1",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: "u1" }},
            status: "authenticated",
        });
    });

    it("fetches and displays the specific exam details", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);

        render(<ExamIdPage />)

        expect(await screen.findByText(/Mathematics Hub/i)).toBeInTheDocument();
    });

    it("shows loading state", () => {
        (useSession as jest.Mock).mockReturnValue({ status: "loading" });
        render(<ExamIdPage />)
        expect(screen.getByText(/Loading exam hub/i)).toBeInTheDocument();
    });

    it("adds a new topic when Add is clicked", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        render(<ExamIdPage />);
        await screen.findByText(/Mathematics Hub/i);
        const addButton = screen.getByText("+ Add Topic");
        fireEvent.click(addButton);
        const inputs = screen.getAllByPlaceholderText("Topic Name");
        expect(inputs).toHaveLength(2);
    });

    it("removes a topic when remove is clicked", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        render(<ExamIdPage />);
        await screen.findByText(/Mathematics Hub/i);
        fireEvent.click(screen.getByText("+ Add Topic"));
        expect(screen.getAllByPlaceholderText("Topic Name")).toHaveLength(2);
        fireEvent.click(screen.getAllByText("x")[0]);
        expect(screen.getAllByPlaceholderText("Topic Name")).toHaveLength(1);
    });

    it("updates a topic field when user types", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        render(<ExamIdPage />);
        await screen.findByText(/Mathematics Hub/i);
        const input = screen.getByPlaceholderText("Topic Name");
        fireEvent.change(input, { target: { value: "Algebra"}});
        expect(input).toHaveValue("Algebra");
    });

    it("calls generateExamPlan when Generate Study Plan is clicked", async () => {
        const { generateExamPlan } = require("@/app/actions/examActions");
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        generateExamPlan.mockResolvedValue({});
        
        delete (window as any).location;
        (window as any).location = { reload: jest.fn() };

        render(<ExamIdPage />);
        await screen.findByText(/Mathematics Hub/i);

        fireEvent.change(screen.getByPlaceholderText("Topic Name"), {
            target: { value: "Calculus" },
        });

        await act(async () => {
            fireEvent.click(screen.getByText("Generate Study Plan"));
        })

        expect(generateExamPlan).toHaveBeenCalledWith("exam-123", expect.any(Array));
    });

    it("calls updateExamUnavailableDays when a calendar day is selected", async () => {
        const { updateExamUnavailableDays } = require("@/app/actions/examActions");
        updateExamUnavailableDays.mockResolvedValue({ data: mockExam });
        (getExamById as jest.Mock).mockResolvedValue(mockExam);

        render(<ExamIdPage/>);
        await screen.findByText(/Mathematics Hub/i);

        const dayButtons = screen.getAllByRole("button", { name: /[0-9]+/});
        await act(async () => {
            fireEvent.click(dayButtons[0]);
        });

        expect(updateExamUnavailableDays).toHaveBeenCalledWith("exam-123", expect.any(Array));
    });  

    it("updates topic duration and URL fields", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        render(<ExamIdPage/>);
        await screen.findByText(/Mathematics Hub/i);
        const durationInput = screen.getByDisplayValue("45");
        const urlInput = screen.getByPlaceholderText(/Resource URL/i);
        fireEvent.change(durationInput, { target: { value: "60" }});
        fireEvent.change(urlInput, { target: { value: "https://test.com" }});
        expect(durationInput).toHaveValue(60);
        expect(urlInput).toHaveValue("https://test.com");
    });

    it("prevents negative signs and 'e' in the duration input", async () => {
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        render(<ExamIdPage />);
        const durationInput = await screen.findByDisplayValue("45");
        const dashEvent = fireEvent.keyDown(durationInput, { key: '-', code: 'Minus'});
        expect(dashEvent).toBe(false);
        const eEvent = fireEvent.keyDown(durationInput, { key: 'e', code: 'KeyE'});
        expect(eEvent).toBe(false);
    });

    it("logs an error when generateExamPlan fails", async () => {
        const { generateExamPlan } = require("@/app/actions/examActions");
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (getExamById as jest.Mock).mockResolvedValue(mockExam);
        
        generateExamPlan.mockRejectedValue(new Error("API Error"));

        render(<ExamIdPage />);
        const titleInput = await screen.findByPlaceholderText("Topic Name");
        fireEvent.change(titleInput, { target: { value: "Physics"}});

        await act(async () => {
            fireEvent.click(screen.getByText("Generate Study Plan"));
        });
    
        expect(consoleSpy).toHaveBeenCalledWith("Failed to generate plan:", expect.any(Error));
        consoleSpy.mockRestore();
    });
});