import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleDetailClient from "../ModuleDetailClient";
import {
  createModuleTask,
  updateModuleTask,
  deleteModuleTask,
  deleteModuleEvent,
} from "@/app/actions/module";

//mocks
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock("@/app/actions/module", () => ({
  createModuleTask: jest.fn(),
  updateModuleTask: jest.fn(),
  deleteModuleTask: jest.fn(),
  deleteModuleEvent: jest.fn(),
}));

jest.mock("@/components/modules/ModuleHeader", () => ({
jest.mock("@/components/modules/ModuleHeader", () => ({
  __esModule: true,
  default: ({ onOpenTaskModal, onOpenEventModal, onOpenSettings }: any) => (
    <div data-testid="module-header">
      <button onClick={onOpenTaskModal}>Header - Create Task</button>
      <button onClick={onOpenEventModal}>Header - Create Event</button>
      <button onClick={onOpenSettings}>Header - Settings</button>
    </div>
  ),
}));

jest.mock("@/components/modules/ModuleMembersList", () => ({
jest.mock("@/components/modules/ModuleMembersList", () => ({
  __esModule: true,
  default: () => <div data-testid="module-members-list" />,
}));

jest.mock("@/components/modules/ModuleEvents", () => ({
jest.mock("@/components/modules/ModuleEvents", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="module-events">
      <button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>Event - Edit</button>
      <button onClick={() => onDelete("event-grp-1")}>Event - Delete</button>
    </div>
  ),
}));

jest.mock("@/components/modules/ModuleTasks", () => ({
jest.mock("@/components/modules/ModuleTasks", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="module-tasks">
      <button onClick={() => onEdit({ moduleTaskGroupId: "t1", title: "Test Task", duration: 90 })}>Task - Edit</button>
      <button onClick={() => onDelete("task-grp-1")}>Task - Delete</button>
    </div>
  ),
}));

jest.mock("@/components/modules/ModuleSettingsModal", () => ({
jest.mock("@/components/modules/ModuleSettingsModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="settings-modal">
      <button onClick={onClose}>Close Settings</button>
      <button onClick={onSuccess}>Success Settings</button>
    </div>
  ),
}));

jest.mock("@/components/modules/ModuleEventModal", () => ({
jest.mock("@/components/modules/ModuleEventModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="event-modal">
      <button onClick={onClose}>Close Event Modal</button>
      <button onClick={onSuccess}>Success Event Modal</button>
    </div>
  ),
}));

<<<<<<< HEAD
jest.mock("@/components/tasks/TaskForm", () => ({
=======
jest.mock("components/tasks/TaskForm", () => ({
>>>>>>> 8494af71 (Update module and group client tests)
  __esModule: true,
  TaskForm: ({ onOpenChange, onSubmit, onFormChange }: any) => (
    <div data-testid="task-modal">
      <button onClick={() => onOpenChange(false)}>Close Task Modal</button>
      <button onClick={onSubmit}>Submit Task Modal</button>
      <button onClick={() => onFormChange({ name: "New Task Name" })}>Simulate Typing Name</button>
      <button onClick={() => onFormChange({ name: "Complex Task", subtasks: "Part 1, Part 2, " })}>Simulate Subtasks</button>
    </div>
  ),
}));

//helpers

/**
 * Creates a mock module object for testing with default properties.
 * @param {object} overrides - Properties to override the default module data.
 * @returns {object} The assembled mock module data.
 */
const makeModule = (overrides = {}) => ({
  id: "mod1",
  userRole: "OWNER",
  members: [],
  ...overrides,
});

//tests
describe("ModuleDetailClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  // Confirms all main sections of the module detail page are rendered
  it("renders all core sub@/components", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    expect(screen.getByTestId("module-header")).toBeInTheDocument();
    expect(screen.getByTestId("module-members-list")).toBeInTheDocument();
    expect(screen.getByTestId("module-events")).toBeInTheDocument();
    expect(screen.getByTestId("module-tasks")).toBeInTheDocument();
  });

  // Confirms settings modal toggles and triggers refresh on success
  it("opens, closes, and succeeds the settings modal", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Settings"));
    
    fireEvent.click(screen.getByText("Success Settings"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText("Close Settings"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  // Confirms event modal toggles, opens for editing, and triggers refresh on success
  it("manages event modal state from both header and edit buttons", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Edit"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Success Event Modal"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
  });

  // Confirms event deletion calls the server and triggers a refresh
  it("calls deleteModuleEvent when event deletion is confirmed", async () => {
    (deleteModuleEvent as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this event for all members?");
    expect(deleteModuleEvent).toHaveBeenCalledWith("event-grp-1", "mod1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  // Confirms task deletion calls the server and triggers a refresh
  it("calls deleteModuleTask when task deletion is confirmed", async () => {
    (deleteModuleTask as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this task for all members?");
    expect(deleteModuleTask).toHaveBeenCalledWith("task-grp-1", "mod1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  // Confirms validation prevents submission without a task name
  it("alerts if task name is empty on submit", async () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    expect(window.alert).toHaveBeenCalledWith("Task name is required");
    expect(createModuleTask).not.toHaveBeenCalled();
  });

  // Confirms server failure triggers an alert with the error message
  it("alerts with server error if creating a task fails", async () => {
    (createModuleTask as jest.Mock).mockResolvedValue({ success: false, error: "Custom Server Error" });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Simulate Typing Name"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Custom Server Error");
    });
  });

  // Confirms task parsing (subtasks/durations) and updating an existing task
  it("parses subtasks and calls updateModuleTask when editing an existing task", async () => {
    (updateModuleTask as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Edit"));
    fireEvent.click(screen.getByText("Simulate Subtasks"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(updateModuleTask).toHaveBeenCalledTimes(1);
      expect(updateModuleTask).toHaveBeenCalledWith("t1", "mod1", expect.objectContaining({
        subtasks: ["Part 1", "Part 2"]
      }));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});