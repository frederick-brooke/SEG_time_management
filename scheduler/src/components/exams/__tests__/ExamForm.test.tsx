//Tests for components/exams/ExamForm.tsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExamForm from "../ExamForm";
import { createExam, updateExamSettings } from "@/app/actions/examActions";

// Mock external dependencies
jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: { user: { id: "user1" } } }),
}));

jest.mock("@/app/actions/examActions", () => ({
    createExam: jest.fn(),
    updateExamSettings: jest.fn(),
}));

jest.mock("@/app/actions/notifications", () => ({
    createNotification: jest.fn(),
}));

jest.mock("@prisma/client", () => ({
    NotificationType: { INFO: "INFO", SUCCESS: "SUCCESS" },
}));

// Cast mocked actions for TypeScript visibility
const mockCreateExam = createExam as jest.Mock;
const mockUpdateExam = updateExamSettings as jest.Mock;

describe("Exam Form Component", () => {
    /**
     * Base properties used for rendering the component across tests.
     */
    const baseProps = {
        onExamAdded: jest.fn(),
        onExamUpdated: jest.fn(),
        editingExam: null,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    // Visual Rendering & UI Logic

    it("renders Save Exam button in create mode", () => {
        render(<ExamForm {...baseProps} />);
        expect(screen.getByText("Save Exam")).toBeInTheDocument();
    });

    it("renders Update Settings button in edit mode", () => {
        render(<ExamForm {...baseProps} editingExam={{
            id: "exam1", title: "Maths", examDate: new Date("2026-06-01"), maxTimePerDay: 60,
        }} />);
        expect(screen.getByText("Update Settings")).toBeInTheDocument();
    });

    //  Form Submission & API Integration

    it("calls createExam on submit in create mode", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "new1" } });
        render(<ExamForm {...baseProps} />);
    
        fireEvent.submit(document.querySelector("form")!);
    
        await waitFor(() => expect(mockCreateExam).toHaveBeenCalled());
    });

    it("calls updateExamSettings on submit in edit mode", async () => {
        mockUpdateExam.mockResolvedValue({ success: true, data: { id: "exam1" } });
        render(<ExamForm {...baseProps} editingExam={{
            id: "exam1", title: "Maths", examDate: new Date("2026-06-01"), maxTimePerDay: 60,
        }} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(mockUpdateExam).toHaveBeenCalled());
    });

    it("calls onExamAdded with result data upon successful creation", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "new1" } });
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onExamAdded).toHaveBeenCalledWith({ id: "new1" }));
    });

    it("calls onExamUpdated with result data upon successful update", async () => {
        mockUpdateExam.mockResolvedValue({ success: true, data: { id: "exam1" } });
        render(<ExamForm {...baseProps} editingExam={{
            id: "exam1", title: "Maths", examDate: new Date("2026-06-01"), maxTimePerDay: 60,
        }} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onExamUpdated).toHaveBeenCalledWith({ id: "exam1" }));
    });

    it("executes onSuccess callback after a successful form submission", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "new1" } });
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onSuccess).toHaveBeenCalled());
    });

    // Error Handling & Resilience

    it("displays a specific server-side error message when the result fails", async () => {
        mockCreateExam.mockResolvedValue({ success: false, error: "Failed to save exam details." });
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("Failed to save exam details.")).toBeInTheDocument());
    });

    it("displays a generic network error message upon promise rejection", async () => {
        mockCreateExam.mockRejectedValue(new Error("Network fail"));
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("A network error occurred. Please try again.")).toBeInTheDocument());
    });
});