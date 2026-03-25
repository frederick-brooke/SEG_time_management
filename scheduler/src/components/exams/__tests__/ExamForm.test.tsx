import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExamForm from "../ExamForm";

jest.mock("next-auth/react", () => ({
    useSession: () => ({ data: { user: { id: "user1" }}}),
}));

jest.mock("@/src/app/actions/examActions", () => ({
    createExam: jest.fn(),
    updateExamSettings: jest.fn(),
}));

jest.mock("@/src/app/actions/notifications", () => ({
    createNotification: jest.fn(),
}));

jest.mock("@prisma/client", () => ({
    NotificationType: { INFO: "INFO", SUCCESS: "SUCCESS" },
}));

import { createExam, updateExamSettings } from "@/src/app/actions/examActions";
const mockCreateExam = createExam as jest.Mock;
const mockUpdateExam = updateExamSettings as jest.Mock;

describe("Exam Form", () => {
    const baseProps = {
        onExamAdded: jest.fn(),
        onExamUpdated: jest.fn(),
        editingExam: null,
        onSuccess: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

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

    it("calls onSuccess when cancel is clicked", () => {
        render(<ExamForm {...baseProps} />);
        fireEvent.click(screen.getByText("Cancel"));
        expect(baseProps.onSuccess).toHaveBeenCalled();
    });

    it("calls createExam on submit in create mode", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "new1" }});
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(mockCreateExam).toHaveBeenCalled());
    });

    it("calls updateExamSettings on submit in edit mode", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "exam1" }});
        render(<ExamForm {...baseProps} editingExam={{
            id: "exam1", title: "Maths", examDate: new Date("2026-06-01"), maxTimePerDay: 60,
        }} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(mockUpdateExam).toHaveBeenCalled());
    });

    it("show error message when result fails", async () => {
        mockCreateExam.mockResolvedValue({ success: false, error: "Failed to save exam details." });
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("Failed to save exam details.")).toBeInTheDocument());
    });

    it("show network error on exception", async () => {
        mockCreateExam.mockRejectedValue(new Error("Network fail"));
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(screen.getByText("A network error occurred. Please try again.")).toBeInTheDocument());
    });

    it("calls onSuccess after successful submit", async () => {
        mockCreateExam.mockResolvedValue({ success: true, date: { id: "new1" }});
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onSuccess).toHaveBeenCalled());
    });

    it("calls onExamAdded with result data in create mode", async () => {
        mockCreateExam.mockResolvedValue({ success: true, data: { id: "new1" }});
        render(<ExamForm {...baseProps} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onExamAdded).toHaveBeenCalledWith({ id: "new1" }));
    });

    it("calls onExamUpdated with result data in edit mode", async () => {
        mockUpdateExam.mockResolvedValue({ success: true, data: { id: "exam1" }});
        render(<ExamForm {...baseProps} editingExam={{
            id: "exam1", title: "Maths", examDate: new Date("2026-06-01"), maxTimePerDay: 60,
        }} />);
        fireEvent.submit(document.querySelector("form")!);
        await waitFor(() => expect(baseProps.onExamUpdated).toHaveBeenCalledWith({ id: "exam1" }));
    });

});