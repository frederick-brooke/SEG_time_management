//test for components/exams/ExamFormDialog.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ExamFormDialog from "../ExamFormDialog";
import { Button } from "@/components/ui/Button";

// Mocks the underlying form to isolate dialog open/close logic
jest.mock("../ExamForm", () => {
    const React = require("react");
    return function MockExamForm({ onSuccess }) {
        return <Button onClick={onSuccess}>MockSubmit</Button>;
    };
});

describe("ExamFormDialog", () => {
    it("renders Add Exam button in create mode", () => {
        render(<ExamFormDialog />);
        expect(screen.getByText("+ Add Exam")).toBeInTheDocument();
    });

    it("renders Edit Details button when editingExam is provided", () => {
        render(<ExamFormDialog editingExam={{ id: "e1", title: "Maths" }}/>);
        expect(screen.getByText("Edit Details")).toBeInTheDocument();
    });

    it("opens dialog when trigger button is clicked", () => {
        render(<ExamFormDialog/>);
        fireEvent.click(screen.getByText("+ Add Exam"));
        expect(screen.getByText("Setup New Exam")).toBeInTheDocument();
    });

    it("shows Edit Exam title when editingExam is provided", () => {
        render(<ExamFormDialog editingExam={{ id: "e1", title: "Maths" }}/>);
        fireEvent.click(screen.getByText("Edit Details"));
        expect(screen.getByText("Edit Exam")).toBeInTheDocument();
    });

    it("closes dialog when onSuccess is called", () => {
        render(<ExamFormDialog/>);
        fireEvent.click(screen.getByText("+ Add Exam"));
        expect(screen.getByText("Setup New Exam")).toBeInTheDocument();
        fireEvent.click(screen.getByText("MockSubmit"));
        expect(screen.queryByText("Setup New Exam")).not.toBeInTheDocument();
    });
})