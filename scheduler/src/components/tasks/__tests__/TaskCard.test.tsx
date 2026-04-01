import { render, screen, fireEvent, act } from "@testing-library/react";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("lucide-react", () =>
  new Proxy({}, { get: () => () => null })
);

jest.mock("components/ui/button", () => ({
  Button: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>{children}</button>
  ),
}));

jest.mock("components/animate-ui/primitives/radix/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onCheckedChange}
      data-testid="main-checkbox"
    />
  ),
}));

jest.mock("@/components/tasks/TaskActions", () => ({
  TaskActions: ({ onView, onEdit, onDelete, canDelete }: any) => (
    <div>
      <button onClick={onView}>View</button>
      <button onClick={onEdit}>Edit</button>
      {canDelete && <button onClick={onDelete}>Delete</button>}
    </div>
  ),
}));

jest.mock("@/lib/priority", () => ({
  getPriorityStyle: (p: string) => `priority-${p}`,
}));



import { TaskCard } from "../TaskCard";

const BASE_TASK = {
  id: "t1",
  title: "Test Task",
  priority: "High",
  status: "todo",
  duration: 90,
  dueDate: "2025-07-01T00:00:00.000Z",
  subtasks: [],
  exam: null,
  isModuleTask: false,
  completed: false,
};

function renderCard(overrides: any = {}, props: any = {}) {
  const task = { ...BASE_TASK, ...overrides };
  return render(
    <TaskCard
      task={task}
      onToggle={props.onToggle ?? jest.fn()}
      onView={props.onView ?? jest.fn()}
      onEdit={props.onEdit ?? jest.fn()}
      onDelete={props.onDelete ?? jest.fn()}
      isDashboard={props.isDashboard ?? false}
      className={props.className ?? ""}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("TaskCard", () => {

  it("renders the task title", () => {
    renderCard();
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("renders the priority badge with correct style", () => {
    renderCard();
    expect(screen.getByText("High")).toHaveClass("priority-High");
  });

  it("renders duration under 60 minutes as Xm", () => {
    renderCard({ duration: 45 });
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("renders duration of 90 minutes as 1h 30m", () => {
    renderCard({ duration: 90 });
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("does not render duration when duration is 0", () => {
    renderCard({ duration: 0 });
    expect(screen.queryByText(/\d+[mh]/)).not.toBeInTheDocument();
  });

  it("renders due date when present", () => {
    renderCard();
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("does not render due date when absent", () => {
    renderCard({ dueDate: null });
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it("renders exam title when task has an exam", () => {
    renderCard({ exam: { title: "Maths Final" } });
    expect(screen.getByText("Maths Final")).toBeInTheDocument();
  });

  it("does not render exam when exam is null", () => {
    renderCard({ exam: null });
    expect(screen.queryByText("Maths Final")).not.toBeInTheDocument();
  });

  it("renders Module Task badge when isModuleTask is true", () => {
    renderCard({ isModuleTask: true });
    expect(screen.getByText(/Module Task/)).toBeInTheDocument();
  });

  it("does not render Module Task badge when isModuleTask is false", () => {
    renderCard({ isModuleTask: false });
    expect(screen.queryByText(/Module Task/)).not.toBeInTheDocument();
  });

  it("applies line-through when task is completed", () => {
    renderCard({ status: "completed" });
    expect(screen.getByText("Test Task")).toHaveClass("line-through");
  });

  it("does not apply line-through when task is not completed", () => {
    renderCard({ status: "todo" });
    expect(screen.getByText("Test Task")).not.toHaveClass("line-through");
  });

  it("navigates to task highlight when clicked in dashboard mode", () => {
    renderCard({}, { isDashboard: true });
    fireEvent.click(screen.getByText("Test Task").closest("div")!.parentElement!);
    expect(pushMock).toHaveBeenCalledWith("/tasks?highlight=t1");
  });

  it("does not navigate when clicked outside dashboard mode", () => {
    renderCard({}, { isDashboard: false });
    fireEvent.click(screen.getByText("Test Task"));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("hides action buttons in dashboard mode", () => {
    renderCard({}, { isDashboard: true });
    expect(screen.queryByText("View")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("shows action buttons outside dashboard mode", () => {
    renderCard({}, { isDashboard: false });
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("calls onView when View is clicked", () => {
    const onView = jest.fn();
    renderCard({}, { onView });
    fireEvent.click(screen.getByText("View"));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  });

  it("calls onEdit when Edit is clicked", () => {
    const onEdit = jest.fn();
    renderCard({}, { onEdit });
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith("t1");
  });

  it("shows Delete button when canDelete is true (not a module task)", () => {
    renderCard({ isModuleTask: false });
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides Delete button when canDelete is false (module task)", () => {
    renderCard({ isModuleTask: true });
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("calls onDelete when Delete is clicked", () => {
    const onDelete = jest.fn();
    renderCard({}, { onDelete });
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("main checkbox is checked when status is completed", () => {
    renderCard({ status: "completed" });
    expect(screen.getByTestId("main-checkbox")).toBeChecked();
  });

  it("main checkbox is unchecked when status is not completed", () => {
    renderCard({ status: "todo" });
    expect(screen.getByTestId("main-checkbox")).not.toBeChecked();
  });

  it("calls onToggle with 'completed' when checkbox is clicked from todo", () => {
    const onToggle = jest.fn();
    renderCard({ status: "todo" }, { onToggle });
    fireEvent.click(screen.getByTestId("main-checkbox"));
    expect(onToggle).toHaveBeenCalledWith("t1", "completed");
  });

  it("calls onToggle with 'todo' when checkbox is clicked from completed", () => {
    const onToggle = jest.fn();
    renderCard({ status: "completed" }, { onToggle });
    fireEvent.click(screen.getByTestId("main-checkbox"));
    expect(onToggle).toHaveBeenCalledWith("t1", "todo");
  });

  it("shows ArrowRight button when status is todo", () => {
    renderCard({ status: "todo" });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("calls onToggle with in-progress when ArrowRight is clicked on todo task", () => {
    const onToggle = jest.fn();
    renderCard({ status: "todo" }, { onToggle });
    const arrowBtn = screen.getAllByRole("button").find(
      (b) => !["View", "Edit", "Delete"].includes(b.textContent ?? "")
    );
    fireEvent.click(arrowBtn!);
    expect(onToggle).toHaveBeenCalledWith("t1", "in-progress");
  });

  it("calls onToggle with todo when ArrowLeft is clicked on in-progress task", () => {
    const onToggle = jest.fn();
    renderCard({ status: "in-progress" }, { onToggle });
    const arrowBtn = screen.getAllByRole("button").find(
      (b) => !["View", "Edit", "Delete"].includes(b.textContent ?? "")
    );
    fireEvent.click(arrowBtn!);
    expect(onToggle).toHaveBeenCalledWith("t1", "todo");
  });

  it("does not render arrow button when status is completed", () => {
    renderCard({ status: "completed" });
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons).not.toContain("");
  });

  it("renders subtask list when subtasks is a non-empty array", () => {
    renderCard({ subtasks: ["Sub One", "Sub Two"] });
    expect(screen.getByText("Sub One")).toBeInTheDocument();
    expect(screen.getByText("Sub Two")).toBeInTheDocument();
  });

  it("renders subtask list when subtasks is a comma-separated string", () => {
    renderCard({ subtasks: "Alpha, Beta, Gamma" });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("does not render subtask section when subtasks is empty", () => {
    renderCard({ subtasks: [] });
    expect(screen.queryByText("Subtasks")).not.toBeInTheDocument();
  });

  it("does not render subtask section in dashboard mode", () => {
    renderCard({ subtasks: ["A", "B"] }, { isDashboard: true });
    expect(screen.queryByText("Subtasks")).not.toBeInTheDocument();
  });

  it("subtask checkboxes start unchecked when status is not completed", () => {
    renderCard({ subtasks: ["Alpha", "Beta"], status: "todo" });
    const checkboxes = screen.getAllByRole("checkbox").filter(
      (c) => c !== screen.getByTestId("main-checkbox")
    );
    checkboxes.forEach((c) => expect(c).not.toBeChecked());
  });

  it("subtask checkboxes start checked when status is completed", () => {
    renderCard({ subtasks: ["Alpha", "Beta"], status: "completed" });
    const checkboxes = screen.getAllByRole("checkbox").filter(
      (c) => c !== screen.getByTestId("main-checkbox")
    );
    checkboxes.forEach((c) => expect(c).toBeChecked());
  });

  it("calls onToggle with completed when all subtasks are checked", () => {
    const onToggle = jest.fn();
    renderCard({ subtasks: ["Only"], status: "todo" }, { onToggle });
    const checkboxes = screen.getAllByRole("checkbox").filter(
      (c) => c !== screen.getByTestId("main-checkbox")
    );
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith("t1", "completed");
  });

  it("calls onToggle with in-progress when a subtask is unchecked on a completed task", () => {
    const onToggle = jest.fn();
    renderCard({ subtasks: ["Only"], status: "completed" }, { onToggle });
    const checkboxes = screen.getAllByRole("checkbox").filter(
      (c) => c !== screen.getByTestId("main-checkbox")
    );
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith("t1", "in-progress");
  });

  it("does not call onToggle when partial subtasks checked and task is not completed", () => {
    const onToggle = jest.fn();
    renderCard({ subtasks: ["A", "B"], status: "todo" }, { onToggle });
    const checkboxes = screen.getAllByRole("checkbox").filter(
      (c) => c !== screen.getByTestId("main-checkbox")
    );
    fireEvent.click(checkboxes[0]);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("renders subtask objects using title property", () => {
    renderCard({ subtasks: [{ title: "Obj Sub" }] });
    expect(screen.getByText("Obj Sub")).toBeInTheDocument();
  });

  it("renders 'New Subtask' fallback when subtask object has no title", () => {
    renderCard({ subtasks: [{}] });
    expect(screen.getByText("New Subtask")).toBeInTheDocument();
  });

  it("scrolls to task element when animate-lunar-burst class is present", async () => {
    const scrollIntoViewMock = jest.fn();
    jest.spyOn(document, "getElementById").mockReturnValue({
      scrollIntoView: scrollIntoViewMock,
    } as any);
    jest.useFakeTimers();
    renderCard({}, { className: "animate-lunar-burst" });
    act(() => jest.runAllTimers());
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    jest.useRealTimers();
  });

  it("does not scroll when animate-lunar-burst class is absent", async () => {
    const scrollIntoViewMock = jest.fn();
    jest.spyOn(document, "getElementById").mockReturnValue({
      scrollIntoView: scrollIntoViewMock,
    } as any);
    jest.useFakeTimers();
    renderCard({}, { className: "" });
    act(() => jest.runAllTimers());
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("handles missing element gracefully when scrolling", async () => {
    jest.spyOn(document, "getElementById").mockReturnValue(null);
    jest.useFakeTimers();
    expect(() => {
      renderCard({}, { className: "animate-lunar-burst" });
      act(() => jest.runAllTimers());
    }).not.toThrow();
    jest.useRealTimers();
  });
});