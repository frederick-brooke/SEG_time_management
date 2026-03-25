import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskViewDialog } from "@/components/tasks/TaskViewDialog";
import "@testing-library/jest-dom";


const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

global.fetch = jest.fn();

// Mock UI components
jest.mock("components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock("components/ui/lunar-card", () => ({
  LunarCard: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const baseTask = {
  id: "1",
  title: "Test Task",
  description: "Test description",
  priority: "High",
  duration: 90,
  url: "https://example.com",
  dueDate: "2025-01-01",
  exam: { title: "Math" },
  subtasks: ["Sub 1", "Sub 2"],
  status: "todo",
};

const renderComponent = (props = {}) =>
  render(
    <TaskViewDialog
      task={baseTask}
      isOpen={true}
      onClose={jest.fn()}
      getPriorityStyle={() => "priority-style"}
      {...props}
    />
  );

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────
describe("TaskViewDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Render conditions ───────────────────
  it("does not render when closed", () => {
    const { container } = render(
      <TaskViewDialog task={baseTask} isOpen={false} onClose={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when task is null", () => {
    const { container } = render(
      <TaskViewDialog task={null} isOpen={true} onClose={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  // ── Basic rendering ─────────────────────
  it("renders task details correctly", () => {
    renderComponent();

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.getByText("View Resource")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Sub 1")).toBeInTheDocument();
  });

  // ── Fallback values ─────────────────────
  it("shows fallback values when fields are missing", () => {
    renderComponent({
      task: {
        ...baseTask,
        description: null,
        priority: null,
        duration: 0,
        url: null,
        dueDate: null,
        exam: null,
        subtasks: [],
      },
    });

    expect(screen.getByText("No description provided")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("No estimate set")).toBeInTheDocument();
    expect(screen.getByText("No resource attached")).toBeInTheDocument();
    expect(screen.getByText("No due date set")).toBeInTheDocument();
    expect(screen.getByText("Not linked to an exam")).toBeInTheDocument();
    expect(screen.getByText("No subtasks")).toBeInTheDocument();
  });

  // ── Completed state ─────────────────────
  it("shows completed icon and hides button when completed", () => {
    renderComponent({
      task: { ...baseTask, status: "completed" },
    });

    expect(screen.queryByText("Mark as Done")).not.toBeInTheDocument();
  });


  it("calls onClose when clicking close button", () => {
    const onClose = jest.fn();

    renderComponent({ onClose });

    fireEvent.click(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalled();
  });

  // ── Complete task ───────────────────────
  it("calls API and handles success", async () => {
    const onClose = jest.fn();
    const onReward = jest.fn();

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        rewards: { xp: 10, coins: 5 },
      }),
    });

    renderComponent({ onClose, onReward });

    fireEvent.click(screen.getByText("Mark as Done"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed: true,
        }),
      });
    });

    expect(mockRefresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onReward).toHaveBeenCalledWith({ xp: 10, coins: 5 });
  });

  // ── No rewards case ─────────────────────
  it("does not call onReward if no rewards returned", async () => {
    const onReward = jest.fn();

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    renderComponent({ onReward });

    fireEvent.click(screen.getByText("Mark as Done"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(onReward).not.toHaveBeenCalled();
  });

  // ── Error handling ──────────────────────
  it("handles API failure gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("fail"));

    renderComponent();

    fireEvent.click(screen.getByText("Mark as Done"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  // ── Loading state ───────────────────────
  it("shows loading state while completing", async () => {
    let resolveFetch: any;

    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    );

    renderComponent();

    fireEvent.click(screen.getByText("Mark as Done"));

    expect(screen.getByText("Completing...")).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({}),
    });

    await waitFor(() => {
      expect(screen.getByText("Mark as Done")).toBeInTheDocument();
    });
  });
});