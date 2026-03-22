// tests/ModuleDetailClient.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const pushMock    = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock("lucide-react", () =>
  new Proxy({}, { get: () => () => null })
);

const leaveModuleMock       = jest.fn();
const createModuleTaskMock  = jest.fn();
const updateModuleTaskMock  = jest.fn();
const deleteModuleTaskMock  = jest.fn();
const updateModuleEventMock = jest.fn();
const deleteModuleEventMock = jest.fn();

jest.mock("@/app/actions/module", () => ({
  leaveModule:       (...a: any[]) => leaveModuleMock(...a),
  createModuleTask:  (...a: any[]) => createModuleTaskMock(...a),
  updateModuleTask:  (...a: any[]) => updateModuleTaskMock(...a),
  deleteModuleTask:  (...a: any[]) => deleteModuleTaskMock(...a),
  updateModuleEvent: (...a: any[]) => updateModuleEventMock(...a),
  deleteModuleEvent: (...a: any[]) => deleteModuleEventMock(...a),
}));

jest.mock("components/tasks/TaskFormDialog", () => ({
  TaskFormDialog: ({ isOpen, onOpenChange, onSubmit, onFormChange }: any) =>
    isOpen ? (
      <div>
        <div data-testid="task-form">TaskFormDialog</div>
        <button onClick={onSubmit}>Submit Task</button>
        <button onClick={() => onOpenChange(false)}>Close Task Form</button>
        <button onClick={() => onFormChange({ name: "Updated Task" })}>Change Form</button>
      </div>
    ) : null,
}));

jest.mock("components/modules/ModuleEventModal", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div>
      <div data-testid="event-modal">ModuleEventModal</div>
      <button onClick={onClose}>Close Event Modal</button>
      <button onClick={onSuccess}>Success Event</button>
    </div>
  ),
}));

jest.mock("@/src/lib/format", () => ({
  formatDuration:  (d: number) => `${d}min`,
  formatTaskDate:  (d: any)    => "2025-01-01",
  formatEventDate: (d: any)    => "2025-06-01",
}));

import ModuleDetailClient from "../[moduleId]/ModuleDetailClient";
const baseMember = {
  id: "m1",
  role: "MEMBER",
  user: { id: "u1", username: "alice", fname: "Alice", lname: "Smith", pfp: null },
};

const ownerMember = {
  id: "m2",
  role: "OWNER",
  user: { id: "u2", username: "bob", fname: "Bob", lname: "Jones", pfp: null },
};

const adminMember = {
  id: "m3",
  role: "ADMIN",
  user: { id: "u3", username: "carol", fname: "Carol", lname: "White", pfp: null },
};

const baseModule = {
  id: "mod1",
  name: "Test Module",
  description: "A test module",
  joinPin: "1234",
  maxMembers: 10,
  memberCount: 3,
  userRole: "OWNER",
  creator: { username: "bob" },
  members: [ownerMember, adminMember, baseMember],
};

const baseEvent = {
  id: "ev1",
  moduleEventGroupId: "eg1",
  title: "Lecture 1",
  description: "First lecture",
  start: new Date("2025-06-01"),
  end: new Date("2025-06-01"),
  category: "Lecture",
};

const baseTask: any = {
  moduleTaskGroupId: "tg1",
  title: "Task One",
  description: "Do something",
  dueDate: new Date("2025-07-01"),
  priority: "High",
  duration: 90,
  url: null,
  completedMembers: [],
  inProgressMembers: [],
  totalAssigned: 2,
};

const memberTask: any = {
  id: "t1",
  moduleTaskGroupId: "tg1",
  title: "Member Task",
  description: "Member description",
  dueDate: new Date("2025-07-01"),
  priority: "Medium",
  duration: 60,
  completed: false,
  status: "in_progress",
};

const completedMemberTask: any = {
  ...memberTask,
  id: "t2",
  title: "Done Task",
  completed: true,
  duration: 0,
  dueDate: null,
};

function renderOwner(overrides: any = {}) {
  return render(
    <ModuleDetailClient
      module={{ ...baseModule, userRole: "OWNER", ...overrides.module }}
      events={overrides.events ?? [baseEvent]}
      tasks={overrides.tasks ?? []}
      tasksWithProgress={overrides.tasksWithProgress ?? [baseTask]}
    />
  );
}

function renderMember(overrides: any = {}) {
  return render(
    <ModuleDetailClient
      module={{ ...baseModule, userRole: "MEMBER", ...overrides.module }}
      events={overrides.events ?? []}
      tasks={overrides.tasks ?? [memberTask]}
      tasksWithProgress={overrides.tasksWithProgress ?? []}
    />
  );
}

function renderAdmin(overrides: any = {}) {
  return render(
    <ModuleDetailClient
      module={{ ...baseModule, userRole: "ADMIN", ...overrides.module }}
      events={overrides.events ?? []}
      tasks={overrides.tasks ?? []}
      tasksWithProgress={overrides.tasksWithProgress ?? [baseTask]}
    />
  );
}

describe("ModuleDetailClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.spyOn(window, "alert").mockImplementation(() => {});
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // basic render

  it("renders the module name and description", () => {
    renderOwner();
    expect(screen.getByText("Test Module")).toBeInTheDocument();
    expect(screen.getByText("A test module")).toBeInTheDocument();
  });

  it("renders the back to modules link", () => {
    renderOwner();
    expect(screen.getByText("← Back to Modules")).toBeInTheDocument();
  });

  it("renders member count and creator", () => {
    renderOwner();
    expect(screen.getByText(/3\/10 members/)).toBeInTheDocument();
    expect(screen.getByText(/Created by @bob/)).toBeInTheDocument();
  });

  it("renders module without description when description is null", () => {
    renderOwner({ module: { description: null } });
    expect(screen.queryByText("A test module")).not.toBeInTheDocument();
  });

  // role badge subcomponent

  it("renders Owner badge for OWNER role", () => {
    renderOwner();
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("renders Admin badge for ADMIN role", () => {
    renderOwner();
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("does not render a badge for MEMBER role", () => {
    renderMember();
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.queryByText("Member")).not.toBeInTheDocument();
  });

  // members toggle

  it("members list is hidden by default", () => {
    renderOwner();
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
  });

  it("shows members when the toggle is clicked", () => {
    renderOwner();
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("hides members when the toggle is clicked again", () => {
    renderOwner();
    fireEvent.click(screen.getByText(/Members \(/));
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
  });

  it("renders member pfp image when available", () => {
    const memberWithPfp = {
      ...baseMember,
      user: { ...baseMember.user, pfp: "https://example.com/pfp.jpg" },
    };
    render(
      <ModuleDetailClient
        module={{ ...baseModule, members: [memberWithPfp] }}
        events={[]}
        tasks={[]}
        tasksWithProgress={[]}
      />
    );
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/pfp.jpg");
  });

  it("renders first-letter avatar when pfp is null", () => {
    renderOwner();
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("falls back to username initial when fname is null", () => {
    const noFnameMember = {
      ...baseMember,
      user: { ...baseMember.user, fname: null },
    };
    render(
      <ModuleDetailClient
        module={{ ...baseModule, members: [noFnameMember] }}
        events={[]}
        tasks={[]}
        tasksWithProgress={[]}
      />
    );
    fireEvent.click(screen.getByText(/Members \(/));
    expect(screen.getByText("a")).toBeInTheDocument();
  });

  // owner-only buttons

  it("shows Create Task and Create Event buttons for OWNER", () => {
    renderOwner();
    expect(screen.getByText("Create Task")).toBeInTheDocument();
    expect(screen.getByText("Create Event")).toBeInTheDocument();
  });

  it("does not show Create Task or Create Event for MEMBER", () => {
    renderMember();
    expect(screen.queryByText("Create Task")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Event")).not.toBeInTheDocument();
  });

  it("shows Leave Module button for MEMBER", () => {
    renderMember();
    expect(screen.getByText("Leave Module")).toBeInTheDocument();
  });

  it("does not show Leave Module button for OWNER", () => {
    renderOwner();
    expect(screen.queryByText("Leave Module")).not.toBeInTheDocument();
  });

  it("does not show Leave Module button for ADMIN", () => {
    renderAdmin();
    expect(screen.queryByText("Leave Module")).not.toBeInTheDocument();
  });

  // copy PIN

  it("shows Copy PIN button when owner has a joinPin", () => {
    renderOwner();
    expect(screen.getByText("Copy PIN")).toBeInTheDocument();
  });

  it("does not show Copy PIN when joinPin is null", () => {
    renderOwner({ module: { joinPin: null } });
    expect(screen.queryByText("Copy PIN")).not.toBeInTheDocument();
  });

  it("copies PIN to clipboard and shows Copied! on click", async () => {
    renderOwner();
    fireEvent.click(screen.getByText("Copy PIN"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1234");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("displays the join PIN code", () => {
    renderOwner();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("does not display the PIN section when joinPin is null", () => {
    renderOwner({ module: { joinPin: null } });
    expect(screen.queryByText("Join PIN")).not.toBeInTheDocument();
  });

  // leave module

  it("calls leaveModule and redirects on confirmed leave", async () => {
    leaveModuleMock.mockResolvedValue({ success: true });
    renderMember();
    fireEvent.click(screen.getByText("Leave Module"));
    await waitFor(() => expect(leaveModuleMock).toHaveBeenCalledWith("mod1"));
    expect(pushMock).toHaveBeenCalledWith("/modules");
  });

  it("alerts on failed leave", async () => {
    leaveModuleMock.mockResolvedValue({ success: false, error: "Cannot leave" });
    renderMember();
    fireEvent.click(screen.getByText("Leave Module"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Cannot leave"));
  });

  it("alerts with fallback message on leave failure with no error", async () => {
    leaveModuleMock.mockResolvedValue({ success: false });
    renderMember();
    fireEvent.click(screen.getByText("Leave Module"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to leave module"));
  });

  it("does not call leaveModule when confirm is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderMember();
    fireEvent.click(screen.getByText("Leave Module"));
    await waitFor(() => expect(leaveModuleMock).not.toHaveBeenCalled());
  });

  // events

  it("renders events with title, category and date", () => {
    renderOwner();
    expect(screen.getByText("Lecture 1")).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toBeInTheDocument();
    expect(screen.getByText("First lecture")).toBeInTheDocument();
  });

  it("shows empty events message for non-owner", () => {
    renderMember({ events: [] });
    expect(screen.getByText("No events scheduled yet.")).toBeInTheDocument();
  });

  it("shows owner-specific empty events hint for owner", () => {
    renderOwner({ events: [] });
    expect(screen.getByText(/Create one using the button above!/)).toBeInTheDocument();
  });

  it("opens event modal when Create Event is clicked", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
  });

  it("opens event modal with existing event when edit is clicked", () => {
    renderOwner();
    fireEvent.click(screen.getByTitle("Edit event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
  });

  it("closes event modal via onClose", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Event"));
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
  });

  it("refreshes on event modal success", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Event"));
    fireEvent.click(screen.getByText("Success Event"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("deletes an event after confirmation", async () => {
    deleteModuleEventMock.mockResolvedValue({ success: true });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete event"));
    await waitFor(() => expect(deleteModuleEventMock).toHaveBeenCalledWith("eg1", "mod1"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("alerts on failed event deletion", async () => {
    deleteModuleEventMock.mockResolvedValue({ success: false, error: "Cannot delete" });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete event"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Cannot delete"));
  });

  it("alerts with fallback on event deletion failure with no error", async () => {
    deleteModuleEventMock.mockResolvedValue({ success: false });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete event"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to delete event"));
  });

  it("does not delete event when confirm is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete event"));
    await waitFor(() => expect(deleteModuleEventMock).not.toHaveBeenCalled());
  });

  it("does not call deleteModuleEvent when moduleEventGroupId is null", async () => {
    const eventNoGroup = { ...baseEvent, moduleEventGroupId: null };
    renderOwner({ events: [eventNoGroup] });
    fireEvent.click(screen.getByTitle("Delete event"));
    await waitFor(() => expect(deleteModuleEventMock).not.toHaveBeenCalled());
  });

  // tasks — owner view

  it("renders owner task view with task title", () => {
    renderOwner();
    expect(screen.getByText("Task One")).toBeInTheDocument();
  });

  it("shows Assigned Tasks heading for owner", () => {
    renderOwner();
    expect(screen.getByText(/Assigned Tasks/)).toBeInTheDocument();
  });

  it("shows empty tasks message for owner with no tasks", () => {
    renderOwner({ tasksWithProgress: [] });
    expect(screen.getByText(/No tasks assigned yet/)).toBeInTheDocument();
  });

  it("shows owner-specific empty tasks hint", () => {
    renderOwner({ tasksWithProgress: [] });
    expect(screen.getByText(/Create one using the button above!/)).toBeInTheDocument();
  });

  it("renders priority badge for task", () => {
    renderOwner();
    const badges = screen.getAllByText("High");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders duration via formatDuration", () => {
    renderOwner();
    expect(screen.getByText("90min")).toBeInTheDocument();
  });

  it("renders task due date via formatTaskDate", () => {
    renderOwner();
    expect(screen.getByText(/Due: 2025-01-01/)).toBeInTheDocument();
  });

  it("does not render duration when duration is 0", () => {
    const noTimedTask = { ...baseTask, duration: 0 };
    renderOwner({ tasksWithProgress: [noTimedTask] });
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it("does not render due date when dueDate is null", () => {
    const noDateTask = { ...baseTask, dueDate: null };
    renderOwner({ tasksWithProgress: [noDateTask] });
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it("opens task form when Create Task is clicked", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("opens task form pre-filled when edit task is clicked", () => {
    renderOwner();
    fireEvent.click(screen.getByTitle("Edit task"));
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("closes task form via onOpenChange", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Close Task Form"));
    expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
  });

  it("updates form data via onFormChange", () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Change Form"));
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("creates a task and refreshes on successful submit", async () => {
    createModuleTaskMock.mockResolvedValue({ success: true });
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Change Form"));
    fireEvent.click(screen.getByText("Submit Task"));
    await waitFor(() => expect(createModuleTaskMock).toHaveBeenCalled());
    expect(refreshMock).toHaveBeenCalled();
  });

  it("alerts when task name is empty on submit", async () => {
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Submit Task"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Task name is required"));
  });

  it("alerts on failed task creation", async () => {
    createModuleTaskMock.mockResolvedValue({ success: false, error: "Task failed" });
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Change Form"));
    fireEvent.click(screen.getByText("Submit Task"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Task failed"));
  });

  it("alerts with fallback on failed task creation with no error", async () => {
    createModuleTaskMock.mockResolvedValue({ success: false });
    renderOwner();
    fireEvent.click(screen.getByText("Create Task"));
    fireEvent.click(screen.getByText("Change Form"));
    fireEvent.click(screen.getByText("Submit Task"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to save task"));
  });

  it("calls updateModuleTask when editing an existing task", async () => {
    updateModuleTaskMock.mockResolvedValue({ success: true });
    renderOwner();
    fireEvent.click(screen.getByTitle("Edit task"));
    fireEvent.click(screen.getByText("Submit Task"));
    await waitFor(() => expect(updateModuleTaskMock).toHaveBeenCalledWith("tg1", "mod1", expect.any(Object)));
  });

  it("deletes a task after confirmation", async () => {
    deleteModuleTaskMock.mockResolvedValue({ success: true });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete task"));
    await waitFor(() => expect(deleteModuleTaskMock).toHaveBeenCalledWith("tg1", "mod1"));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("alerts on failed task deletion", async () => {
    deleteModuleTaskMock.mockResolvedValue({ success: false, error: "Delete failed" });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete task"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Delete failed"));
  });

  it("alerts with fallback on task deletion failure with no error", async () => {
    deleteModuleTaskMock.mockResolvedValue({ success: false });
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete task"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to delete task"));
  });

  it("does not delete task when confirm is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderOwner();
    fireEvent.click(screen.getByTitle("Delete task"));
    await waitFor(() => expect(deleteModuleTaskMock).not.toHaveBeenCalled());
  });

  // tasks — member view

  it("renders member task view with task title", () => {
    renderMember();
    expect(screen.getByText("Member Task")).toBeInTheDocument();
  });

  it("shows My Tasks heading for member", () => {
    renderMember();
    expect(screen.getByText(/My Tasks/)).toBeInTheDocument();
  });

  it("shows empty member tasks message", () => {
    renderMember({ tasks: [] });
    expect(screen.getByText("No tasks assigned to you yet.")).toBeInTheDocument();
  });

  it("renders incomplete member task without strikethrough", () => {
    renderMember();
    const title = screen.getByText("Member Task");
    expect(title.className).not.toMatch(/line-through/);
  });

  it("renders completed member task with strikethrough", () => {
    renderMember({ tasks: [completedMemberTask] });
    const title = screen.getByText("Done Task");
    expect(title.className).toMatch(/line-through/);
  });

  it("renders member task description", () => {
    renderMember();
    expect(screen.getByText("Member description")).toBeInTheDocument();
  });

  it("does not render duration when member task duration is 0", () => {
    renderMember({ tasks: [completedMemberTask] });
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it("does not render due date when member task dueDate is null", () => {
    renderMember({ tasks: [completedMemberTask] });
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  // admin view mirrors owner task view

  it("renders Assigned Tasks heading for admin", () => {
    renderAdmin();
    expect(screen.getByText(/Assigned Tasks/)).toBeInTheDocument();
  });

  it("does not show Create Task button for admin", () => {
    renderAdmin();
    expect(screen.queryByText("Create Task")).not.toBeInTheDocument();
  });

  // MemberProgressBadge

  it("renders completed and in-progress badges on owner task", () => {
    const taskWithMembers = {
      ...baseTask,
      completedMembers: [{ id: "u1", username: "alice", fname: "Alice", lname: "Smith", pfp: null }],
      inProgressMembers: [{ id: "u2", username: "bob", fname: "Bob", lname: "Jones", pfp: null }],
    };
    renderOwner({ tasksWithProgress: [taskWithMembers] });
    expect(screen.getByText(/1 completed/)).toBeInTheDocument();
    expect(screen.getByText(/1 in progress/)).toBeInTheDocument();
  });

  it("shows member names in completed badge popover on click", () => {
    const taskWithMembers = {
      ...baseTask,
      completedMembers: [{ id: "u1", username: "alice", fname: "Alice", lname: "Smith", pfp: null }],
      inProgressMembers: [],
    };
    renderOwner({ tasksWithProgress: [taskWithMembers] });
    fireEvent.click(screen.getByText(/1 completed/));
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("closes member popover when badge is clicked again", () => {
    const taskWithMembers = {
      ...baseTask,
      completedMembers: [{ id: "u1", username: "alice", fname: "Alice", lname: "Smith", pfp: null }],
      inProgressMembers: [],
    };
    renderOwner({ tasksWithProgress: [taskWithMembers] });
    fireEvent.click(screen.getByText(/1 completed/));
    fireEvent.click(screen.getByText(/1 completed/));
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("uses username when member fname is null in popover", () => {
    const taskWithMembers = {
      ...baseTask,
      completedMembers: [{ id: "u1", username: "alice", fname: null, lname: null, pfp: null }],
      inProgressMembers: [],
    };
    renderOwner({ tasksWithProgress: [taskWithMembers] });
    fireEvent.click(screen.getByText(/1 completed/));
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("does not show popover when members array is empty", () => {
    renderOwner({ tasksWithProgress: [baseTask] });
    fireEvent.click(screen.getByText(/0 completed/));
    expect(screen.queryByText(/completed/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});