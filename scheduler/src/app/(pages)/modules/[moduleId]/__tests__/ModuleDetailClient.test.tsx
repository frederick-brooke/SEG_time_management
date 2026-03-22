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

// Mock subcomponents
jest.mock("components/modules/ModuleHeader", () => ({
  __esModule: true,
  default: ({ onOpenTaskModal, onOpenEventModal, onOpenSettings }: any) => (
    <div data-testid="module-header">
      <button onClick={onOpenTaskModal}>Header - Create Task</button>
      <button onClick={onOpenEventModal}>Header - Create Event</button>
      <button onClick={onOpenSettings}>Header - Settings</button>
    </div>
  ),
}));

jest.mock("components/modules/ModuleMembersList", () => ({
  __esModule: true,
  default: () => <div data-testid="module-members-list" />,
}));

jest.mock("components/modules/ModuleEvents", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="module-events">
      <button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>Event - Edit</button>
      <button onClick={() => onDelete("event-grp-1")}>Event - Delete</button>
    </div>
  ),
}));

jest.mock("components/modules/ModuleTasks", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="module-tasks">
      <button onClick={() => onEdit({ moduleTaskGroupId: "t1", title: "Test Task" })}>Task - Edit</button>
      <button onClick={() => onDelete("task-grp-1")}>Task - Delete</button>
    </div>
  ),
}));

jest.mock("components/modules/ModuleSettingsModal", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="settings-modal">
      <button onClick={onClose}>Close Settings</button>
    </div>
  ),
}));

jest.mock("components/modules/ModuleEventModal", () => ({
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
  TaskFormDialog: ({ onOpenChange, onSubmit, onFormChange }: any) => (
    <div data-testid="task-modal">
      <button onClick={() => onOpenChange(false)}>Close Task Modal</button>
      <button onClick={onSubmit}>Submit Task Modal</button>
      <button onClick={() => onFormChange({ name: "New Task Name" })}>Simulate Typing Name</button>
    </div>
  ),
}));

//helpers

/**
 * Creates a mock module object for testing.
 * @param {object} overrides - Properties to override the default module data.
 * @return {object} The mock module data.
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

  it("renders all core subcomponents", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    expect(screen.getByTestId("module-header")).toBeInTheDocument();
    expect(screen.getByTestId("module-members-list")).toBeInTheDocument();
    expect(screen.getByTestId("module-events")).toBeInTheDocument();
    expect(screen.getByTestId("module-tasks")).toBeInTheDocument();
  });

  // --- Modal Toggle Tests ---

  it("opens and closes the settings modal", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Settings"));
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Settings"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("opens and closes the event modal from the header", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Create Event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
  });

  it("opens the task modal for editing", () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Task - Edit"));
    expect(screen.getByTestId("task-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Task Modal"));
    expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
  });

  // --- Action Tests ---

  it("calls deleteModuleEvent when event deletion is confirmed", async () => {
    (deleteModuleEvent as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Event - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this event for all members?");
    expect(deleteModuleEvent).toHaveBeenCalledWith("event-grp-1", "mod1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("calls deleteModuleTask when task deletion is confirmed", async () => {
    (deleteModuleTask as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Task - Delete"));
    
    expect(window.confirm).toHaveBeenCalledWith("Delete this task for all members?");
    expect(deleteModuleTask).toHaveBeenCalledWith("task-grp-1", "mod1");
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("alerts if task name is empty on submit", async () => {
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    expect(window.alert).toHaveBeenCalledWith("Task name is required");
    expect(createModuleTask).not.toHaveBeenCalled();
  });

  it("calls createModuleTask on valid submission and closes modal", async () => {
    (createModuleTask as jest.Mock).mockResolvedValue({ success: true });
    render(<ModuleDetailClient module={makeModule()} events={[]} tasks={[]} tasksWithProgress={[]} />);
    
    fireEvent.click(screen.getByText("Header - Create Task"));
    fireEvent.click(screen.getByText("Simulate Typing Name"));
    fireEvent.click(screen.getByText("Submit Task Modal"));
    
    await waitFor(() => {
      expect(createModuleTask).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
    });
  });
});