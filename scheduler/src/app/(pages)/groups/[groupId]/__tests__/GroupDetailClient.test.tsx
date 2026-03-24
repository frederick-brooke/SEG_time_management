import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupDetailClient from "../GroupDetailClient";
import {
  createGroupTask,
  updateGroupTask,
  deleteGroupTask,
  deleteGroupEvent,
  toggleGroupTaskComplete,
} from "@/app/actions/groups";

//mocks

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("@/app/actions/groups", () => ({
  createGroupTask: jest.fn(),
  updateGroupTask: jest.fn(),
  deleteGroupTask: jest.fn(),
  deleteGroupEvent: jest.fn(),
  toggleGroupTaskComplete: jest.fn(),
}));

// Mock subcomponents so we can trigger their callbacks and test the parent's state
jest.mock("components/groups/GroupHeader", () => ({
  __esModule: true,
  default: ({ onOpenTaskModal, onOpenEventModal, onOpenSettings }: any) => (
    <div data-testid="group-header">
      <button onClick={onOpenTaskModal}>Header - Create Task</button>
      <button onClick={onOpenEventModal}>Header - Create Event</button>
      <button onClick={onOpenSettings}>Header - Settings</button>
    </div>
  ),
}));

jest.mock("components/groups/GroupMembersList", () => ({
  __esModule: true,
  default: () => <div data-testid="group-members-list" />,
}));

jest.mock("components/groups/GroupEvents", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="group-events">
      <button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>Event - Edit</button>
      <button onClick={() => onDelete("event-grp-1")}>Event - Delete</button>
    </div>
  ),
}));

jest.mock("components/groups/GroupTasks", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onToggleComplete }: any) => (
    <div data-testid="group-tasks">
      <button onClick={() => onEdit({ groupTaskGroupId: "t1", title: "Test Task" })}>Task - Edit</button>
      <button onClick={() => onDelete("task-grp-1")}>Task - Delete</button>
      <button onClick={() => onToggleComplete({ groupTaskGroupId: "t1", currentUserCompleted: false })}>Task - Toggle</button>
    </div>
  ),
}));

jest.mock("components/groups/GroupSettingsModal", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="settings-modal">
      <button onClick={onClose}>Close Settings</button>
    </div>
  ),
}));

jest.mock("components/groups/GroupEventModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="event-modal">
      <button onClick={onClose}>Close Event Modal</button>
      <button onClick={onSuccess}>Success Event Modal</button>
    </div>
  ),
}));

jest.mock("components/tasks/TaskFormDialog", () => ({
  __esModule: true,
  TaskFormDialog: ({ onOpenChange, onSubmit, formData, onFormChange }: any) => (
    <div data-testid="task-modal">
      <button onClick={() => onOpenChange(false)}>Close Task Modal</button>
      <button onClick={onSubmit}>Submit Task Modal</button>
      {/* Expose form change so we can test validation */}
      <button onClick={() => onFormChange({ name: "New Task Name" })}>Simulate Typing Name</button>
    </div>
  ),
}));

//helpers

/**
 * Creates a mock group object for testing.
 * @param {object} overrides - Properties to override the default group data.
 * @return {object} The mock group data.
 */
const makeGroup = (overrides = {}) => ({
  id: "grp1",
  name: "Study Squad",
  description: "A group",
  memberCount: 3,
  userRole: "OWNER",
  creator: { username: "alice" },
  members: [],
  ...overrides,
});

//tests

describe("GroupDetailClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true); // Auto-confirm deletions
    window.alert = jest.fn(); // Mock alerts to prevent console noise
  });

  it("renders all core subcomponents", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    expect(screen.getByTestId("group-header")).toBeInTheDocument();
    expect(screen.getByTestId("group-members-list")).toBeInTheDocument();
    expect(screen.getByTestId("group-events")).toBeInTheDocument();
    expect(screen.getByTestId("group-tasks")).toBeInTheDocument();
  });

  // --- Modal Toggle Tests ---

  it("opens and closes the settings modal", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Header - Settings"));
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Settings"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("opens and closes the event modal from the header", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Header - Create Event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
  });

  it("opens the task modal for editing and passes task data", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    // Click edit from the task list
    fireEvent.click(screen.getByText("Task - Edit"));
    expect(screen.getByTestId("task-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Task Modal"));
    expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
  });

  // --- Action Tests ---

  it("calls deleteGroupEvent when event deletion is confirmed", async () => {
    (deleteGroupEvent as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this event for all members?");
    expect(deleteGroupEvent).toHaveBeenCalledWith("event-grp-1", "grp1");
    
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("calls deleteGroupTask when task deletion is confirmed", async () => {
    (deleteGroupTask as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this task for all members?");
    expect(deleteGroupTask).toHaveBeenCalledWith("task-grp-1", "grp1");
    
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("calls toggleGroupTaskComplete when a task is toggled", async () => {
    (toggleGroupTaskComplete as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Toggle"));
    
    // The mock passes currentUserCompleted: false, so it should toggle to true
    expect(toggleGroupTaskComplete).toHaveBeenCalledWith("t1", "grp1", true);
    
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("alerts if task name is empty on submit", async () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    expect(window.alert).toHaveBeenCalledWith("Task name is required");
    expect(createGroupTask).not.toHaveBeenCalled();
  });

  it("calls createGroupTask on valid submission and closes modal", async () => {
    (createGroupTask as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Header - Create Task"));
    
    // Simulate typing a name into the form
    fireEvent.click(screen.getByText("Simulate Typing Name"));
    
    // Submit
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(createGroupTask).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
    });
  });

  it("calls updateGroupTask when submitting an edited task", async () => {
    (updateGroupTask as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    // Open in edit mode
    fireEvent.click(screen.getByText("Task - Edit"));
    
    // Submit
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(updateGroupTask).toHaveBeenCalledWith("t1", "grp1", expect.any(Object));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
    });
  });
});