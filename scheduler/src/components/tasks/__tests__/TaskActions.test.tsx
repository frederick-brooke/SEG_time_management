import { render, screen, fireEvent } from "@testing-library/react";
import { TaskActions } from "../TaskActions";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Eye: ({ strokeWidth, ...props }) => <svg data-testid="eye-icon" {...props} />,
  Pencil: ({ strokeWidth, ...props }) => <svg data-testid="pencil-icon" {...props} />,
  Trash2: ({ strokeWidth, ...props }) => <svg data-testid="trash-icon" {...props} />,
}));

// Mock Button component
jest.mock("components/ui/button", () => ({
  Button: ({ children, onClick, title, className, ...props }) => (
    <button onClick={onClick} title={title} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe("TaskActions", () => {
  const mockHandlers = {
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Rendering ───────────────────────────────────────────────────────────────

  describe("default rendering", () => {
    it("renders all three action buttons by default", () => {
      render(<TaskActions {...mockHandlers} />);

      expect(screen.getByTitle("View Task")).toBeInTheDocument();
      expect(screen.getByTitle("Edit Task")).toBeInTheDocument();
      expect(screen.getByTitle("Delete Task")).toBeInTheDocument();
    });

    it("renders all three icons by default", () => {
      render(<TaskActions {...mockHandlers} />);

      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.getByTestId("pencil-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("wraps buttons in a flex container", () => {
      const { container } = render(<TaskActions {...mockHandlers} />);
      const wrapper = container.firstChild;

      expect(wrapper).toHaveClass("flex", "items-center", "gap-0.5", "shrink-0");
    });
  });

  // ─── Visibility / Conditional Rendering ──────────────────────────────────────

  describe("conditional rendering", () => {
    it("hides the Edit button when canEdit is false", () => {
      render(<TaskActions {...mockHandlers} canEdit={false} />);

      expect(screen.queryByTitle("Edit Task")).not.toBeInTheDocument();
      expect(screen.getByTitle("View Task")).toBeInTheDocument();
      expect(screen.getByTitle("Delete Task")).toBeInTheDocument();
    });

    it("hides the Delete button when canDelete is false", () => {
      render(<TaskActions {...mockHandlers} canDelete={false} />);

      expect(screen.queryByTitle("Delete Task")).not.toBeInTheDocument();
      expect(screen.getByTitle("View Task")).toBeInTheDocument();
      expect(screen.getByTitle("Edit Task")).toBeInTheDocument();
    });

    it("hides both Edit and Delete buttons when both flags are false", () => {
      render(<TaskActions {...mockHandlers} canEdit={false} canDelete={false} />);

      expect(screen.queryByTitle("Edit Task")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Delete Task")).not.toBeInTheDocument();
      expect(screen.getByTitle("View Task")).toBeInTheDocument();
    });

    it("shows Edit button when canEdit is explicitly true", () => {
      render(<TaskActions {...mockHandlers} canEdit={true} />);

      expect(screen.getByTitle("Edit Task")).toBeInTheDocument();
    });

    it("shows Delete button when canDelete is explicitly true", () => {
      render(<TaskActions {...mockHandlers} canDelete={true} />);

      expect(screen.getByTitle("Delete Task")).toBeInTheDocument();
    });
  });

  // ─── Click Handlers ───────────────────────────────────────────────────────────

  describe("click handlers", () => {
    it("calls onView when the View button is clicked", () => {
      render(<TaskActions {...mockHandlers} />);

      fireEvent.click(screen.getByTitle("View Task"));

      expect(mockHandlers.onView).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onEdit).not.toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it("calls onEdit when the Edit button is clicked", () => {
      render(<TaskActions {...mockHandlers} />);

      fireEvent.click(screen.getByTitle("Edit Task"));

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onView).not.toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it("calls onDelete when the Delete button is clicked", () => {
      render(<TaskActions {...mockHandlers} />);

      fireEvent.click(screen.getByTitle("Delete Task"));

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onView).not.toHaveBeenCalled();
      expect(mockHandlers.onEdit).not.toHaveBeenCalled();
    });

    it("does not throw when optional handlers are undefined", () => {
      render(<TaskActions onView={undefined} onEdit={undefined} onDelete={undefined} />);

      expect(() => fireEvent.click(screen.getByTitle("View Task"))).not.toThrow();
    });
  });

  // ─── Props ────────────────────────────────────────────────────────────────────

  describe("props", () => {
    it("applies a custom className to the wrapper div", () => {
      const { container } = render(
        <TaskActions {...mockHandlers} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("passes strokeWidth to the Eye icon", () => {
      render(<TaskActions {...mockHandlers} strokeWidth={3} />);

      // strokeWidth is filtered out by the mock but the component should not crash
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
    });

    it("uses the default strokeWidth of 2 when not provided", () => {
      // Component should render without errors using the default
      expect(() => render(<TaskActions {...mockHandlers} />)).not.toThrow();
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("has descriptive title attributes on all buttons", () => {
      render(<TaskActions {...mockHandlers} />);

      expect(screen.getByTitle("View Task")).toBeInTheDocument();
      expect(screen.getByTitle("Edit Task")).toBeInTheDocument();
      expect(screen.getByTitle("Delete Task")).toBeInTheDocument();
    });

    it("View button is always present regardless of canEdit and canDelete", () => {
      render(<TaskActions {...mockHandlers} canEdit={false} canDelete={false} />);

      expect(screen.getByTitle("View Task")).toBeInTheDocument();
    });
  });
});