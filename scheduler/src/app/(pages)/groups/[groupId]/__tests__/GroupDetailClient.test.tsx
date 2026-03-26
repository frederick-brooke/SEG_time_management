import React from "react";
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

// mocks
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock("@/app/actions/groups", () => ({
  createGroupTask: jest.fn(),
  updateGroupTask: jest.fn(),
  deleteGroupTask: jest.fn(),
  deleteGroupEvent: jest.fn(),
  toggleGroupTaskComplete: jest.fn(),
}));

jest.mock("@/components/groups/GroupHeader", () => ({
  __esModule: true,
  default: ({ onOpenTaskModal, onOpenEventModal, onOpenSettings }: any) => (
    <div data-testid="group-header">
      <button onClick={onOpenTaskModal}>Header - Create Task</button>
      <button onClick={onOpenEventModal}>Header - Create Event</button>
      <button onClick={onOpenSettings}>Header - Settings</button>
    </div>
  ),
}));

jest.mock("@/components/groups/GroupMembersList", () => ({
  __esModule: true,
  default: () => <div data-testid="group-members-list" />,
}));

jest.mock("@/components/groups/GroupEvents", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="group-events">
      <button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>Event - Edit</button>
      <button onClick={() => onDelete("event-grp-1")}>Event - Delete</button>
    </div>
  ),
}));

jest.mock("@/components/groups/GroupTasks", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onToggleComplete }: any) => (
    <div data-testid="group-tasks">
      <button onClick={() => onEdit({ groupTaskGroupId: "t1", title: "Test Task", duration: 90 })}>Task - Edit</button>
      <button onClick={() => onDelete("task-grp-1")}>Task - Delete</button>
      <button onClick={() => onToggleComplete({ groupTaskGroupId: "t1", currentUserCompleted: false })}>Task - Toggle</button>
    </div>
  ),
}));

jest.mock("@/components/groups/GroupSettingsModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="settings-modal">
      <button onClick={onClose}>Close Settings</button>
      <button onClick={onSuccess}>Success Settings</button>
    </div>
  ),
}));

jest.mock("@/components/groups/GroupEventModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="event-modal">
      <button onClick={onClose}>Close Event Modal</button>
      <button onClick={onSuccess}>Success Event Modal</button>
    </div>
  ),
}));

jest.mock("@/components/tasks/TaskForm", () => ({
  __esModule: true,
  TaskForm: ({ onOpenChange, onSubmit, onFormChange }: any) => (
    <div data-testid="task-modal">
      <button onClick={() => onOpenChange(false)}>Close Task Modal</button>
      <button onClick={() => onOpenChange(true)}>Keep Task Modal Open</button>
      <button onClick={onSubmit}>Submit Task Modal</button>
      <button onClick={() => onFormChange({ name: "New Task Name" })}>Simulate Typing Name</button>
      <button onClick={() => onFormChange({ name: "Complex Task", subtasks: "Part 1, Part 2, " })}>Simulate Subtasks</button>
    </div>
  ),
}));

// helpers

/**
 * Creates a mock group object for testing.
 * @param {object} overrides - Properties to override the default group data.
 * @returns {object} The assembled mock group data.
 */
const makeGroup = (overrides = {}) => ({
  id: "grp1",
  userRole: "OWNER",
  members: [],
  ...overrides,
});

// tests
describe("GroupDetailClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  // Confirms all main sections of the group detail page are rendered
  it("renders all core sub@/components", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    expect(screen.getByTestId("group-header")).toBeInTheDocument();
    expect(screen.getByTestId("group-members-list")).toBeInTheDocument();
    expect(screen.getByTestId("group-events")).toBeInTheDocument();
    expect(screen.getByTestId("group-tasks")).toBeInTheDocument();
  });

  // Confirms settings modal toggles and triggers refresh on success
  it("opens, closes, and succeeds the settings modal", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Settings"));
    
    fireEvent.click(screen.getByText("Success Settings"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText("Close Settings"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  // Confirms event modal toggles, opens for editing, and triggers refresh on success
  it("manages event modal state from both header and edit buttons", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Edit"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Success Event Modal"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
  });

  // Confirms event deletion calls the server and triggers a refresh
  it("calls deleteGroupEvent when event deletion is confirmed", async () => {
    (deleteGroupEvent as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this event for all members?");
    expect(deleteGroupEvent).toHaveBeenCalledWith("event-grp-1", "grp1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  // Confirms task deletion calls the server and triggers a refresh
  it("calls deleteGroupTask when task deletion is confirmed", async () => {
    (deleteGroupTask as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this task for all members?");
    expect(deleteGroupTask).toHaveBeenCalledWith("task-grp-1", "grp1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  // Confirms task completion toggling calls the server and triggers a refresh
  it("calls toggleGroupTaskComplete when completion toggle is clicked", async () => {
    (toggleGroupTaskComplete as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Toggle"));
    
    expect(toggleGroupTaskComplete).toHaveBeenCalledWith("t1", "grp1", true);
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  // Confirms validation prevents submission without a task name
  it("alerts if task name is empty on submit", async () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    expect(window.alert).toHaveBeenCalledWith("Task name is required");
    expect(createGroupTask).not.toHaveBeenCalled();
  });

  // Confirms server failure triggers an alert with the error message
  it("alerts with server error if creating a task fails", async () => {
    (createGroupTask as jest.Mock).mockResolvedValue({ success: false, error: "Custom Server Error" });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Simulate Typing Name"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Custom Server Error");
    });
  });

  // Confirms task parsing (subtasks/durations) and updating an existing task
  it("parses subtasks and calls updateGroupTask when editing an existing task", async () => {
    (updateGroupTask as jest.Mock).mockResolvedValue({ success: true });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Edit"));
    fireEvent.click(screen.getByText("Simulate Subtasks"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(updateGroupTask).toHaveBeenCalledTimes(1);
      expect(updateGroupTask).toHaveBeenCalledWith("t1", "grp1", expect.objectContaining({
        subtasks: ["Part 1", "Part 2"]
      }));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  // --- NEW NEGATIVE PATH COVERAGE TESTS ---

  // Confirms deletion is aborted when confirmation is cancelled
  it("aborts deletion if confirmation is cancelled", () => {
    window.confirm = jest.fn(() => false);
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    expect(deleteGroupEvent).not.toHaveBeenCalled();
    
    fireEvent.click(screen.getByText("Task - Delete"));
    expect(deleteGroupTask).not.toHaveBeenCalled();
  });

  // Confirms server error alerts are shown when event deletion fails
  it("alerts when event deletion fails on the server", async () => {
    (deleteGroupEvent as jest.Mock).mockResolvedValue({ success: false, error: "Failed to delete event" });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to delete event"));
  });

  // Confirms server error alerts are shown when task deletion fails
  it("alerts when task deletion fails on the server", async () => {
    (deleteGroupTask as jest.Mock).mockResolvedValue({ success: false, error: "Failed to delete task" });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Delete"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to delete task"));
  });

  // Confirms server error alerts are shown when toggling task completion fails
  it("alerts when toggling task completion fails on the server", async () => {
    (toggleGroupTaskComplete as jest.Mock).mockResolvedValue({ success: false, error: "Failed to update task" });
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Toggle"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to update task"));
  });

  // Confirms the task form handles being kept open without triggering null state
  it("handles task form onOpenChange when kept open", () => {
    render(<GroupDetailClient group={makeGroup()} events={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Keep Task Modal Open"));
    expect(screen.getByTestId("task-modal")).toBeInTheDocument();
  });
});