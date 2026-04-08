/**
 * Testing for Group Detail Client.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
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

// Mocks
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

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
			<Button onClick={onOpenTaskModal}>Header - Create Task</Button>
			<Button onClick={onOpenEventModal}>Header - Create Event</Button>
			<Button onClick={onOpenSettings}>Header - Settings</Button>
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
			<Button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>
				Event - Edit
			</Button>
			<Button onClick={() => onDelete("event-grp-1")}>
				Event - Delete
			</Button>
		</div>
	),
}));

jest.mock("@/components/groups/GroupTasks", () => ({
	__esModule: true,
	default: ({ onEdit, onDelete, onToggleComplete }: any) => (
		<div data-testid="group-tasks">
			<Button
				onClick={() =>
					onEdit({
						groupTaskGroupId: "t1",
						title: "Test Task",
						description: "Task desc",
						dueDate: "2026-04-10T00:00:00.000Z",
						url: "https://example.com",
						subtasks: ["One", "Two"],
						duration: 90,
						priority: "High",
					})
				}
			>
				Task - Edit
			</Button>

			<Button
				onClick={() =>
					onEdit({
						groupTaskGroupId: "t2",
						title: "Sparse Task",
						description: null,
						dueDate: null,
						url: null,
						subtasks: null,
						duration: 45,
						priority: "Low",
					})
				}
			>
				Task - Edit Sparse
			</Button>

			<Button onClick={() => onDelete("task-grp-1")}>
				Task - Delete
			</Button>
			<Button
				onClick={() =>
					onToggleComplete({
						groupTaskGroupId: "t1",
						currentUserCompleted: false,
					})
				}
			>
				Task - Toggle
			</Button>
		</div>
	),
}));

jest.mock("@/components/groups/GroupSettingsModal", () => ({
	__esModule: true,
	default: ({ onClose, onSuccess }: any) => (
		<div data-testid="settings-modal">
			<Button onClick={onClose}>Close Settings</Button>
			<Button onClick={onSuccess}>Success Settings</Button>
		</div>
	),
}));

jest.mock("@/components/groups/GroupEventModal", () => ({
	__esModule: true,
	default: ({ onClose, onSuccess, editingEvent }: any) => (
		<div data-testid="event-modal">
			<div data-testid="editing-event-state">
				{editingEvent ? editingEvent.title : "no-editing-event"}
			</div>
			<Button onClick={onClose}>Close Event Modal</Button>
			<Button onClick={onSuccess}>Success Event Modal</Button>
		</div>
	),
}));

jest.mock("@/components/tasks/TaskForm", () => ({
	__esModule: true,
	TaskForm: ({
		onOpenChange,
		onSubmit,
		onFormChange,
		editingTaskId,
		formData,
	}: any) => (
		<div data-testid="task-modal">
			<div data-testid="editing-task-id">
				{editingTaskId ?? "no-editing-task"}
			</div>
			<div data-testid="task-name">{formData.name}</div>
			<div data-testid="task-description">{formData.description}</div>
			<div data-testid="task-dueDate">{formData.dueDate}</div>
			<div data-testid="task-url">{formData.url}</div>
			<div data-testid="task-subtasks">{formData.subtasks}</div>

			<Button onClick={() => onOpenChange(false)}>
				Close Task Modal
			</Button>
			<Button onClick={() => onOpenChange(true)}>
				Keep Task Modal Open
			</Button>
			<Button onClick={onSubmit}>Submit Task Modal</Button>
			<Button onClick={() => onFormChange({ name: "New Task Name" })}>
				Simulate Typing Name
			</Button>
			<Button
				onClick={() =>
					onFormChange({
						name: "Complex Task",
						subtasks: "Part 1, Part 2, ",
					})
				}
			>
				Simulate Subtasks
			</Button>
			<Button
				onClick={() =>
					onFormChange({
						name: "Zero Duration Task",
						durationHours: "",
						durationMinutes: "",
						url: "",
					})
				}
			>
				Simulate Empty Durations
			</Button>
		</div>
	),
}));

// Helpers
const makeGroup = (overrides = {}) => ({
	id: "grp1",
	userRole: "OWNER",
	members: [],
	...overrides,
});

// Tests
describe("GroupDetailClient", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		window.confirm = jest.fn(() => true);
		window.alert = jest.fn();
	});

	it("renders all core subcomponents", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);
		expect(screen.getByTestId("group-header")).toBeInTheDocument();
		expect(screen.getByTestId("group-members-list")).toBeInTheDocument();
		expect(screen.getByTestId("group-events")).toBeInTheDocument();
		expect(screen.getByTestId("group-tasks")).toBeInTheDocument();
		expect(screen.getByText("← Back to Groups")).toBeInTheDocument();
	});

	it("opens, closes, and succeeds the settings modal", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Settings"));
		expect(screen.getByTestId("settings-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Success Settings"));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByText("Close Settings"));
		expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
	});

	it("opens event modal from header create button and starts with null editing event", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Event"));

		expect(screen.getByTestId("event-modal")).toBeInTheDocument();
		expect(screen.getByTestId("editing-event-state")).toHaveTextContent(
			"no-editing-event",
		);
	});

	it("manages event modal state from edit button and triggers refresh on success", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Edit"));
		expect(screen.getByTestId("event-modal")).toBeInTheDocument();
		expect(screen.getByTestId("editing-event-state")).toHaveTextContent(
			"Test Event",
		);

		fireEvent.click(screen.getByText("Success Event Modal"));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByText("Close Event Modal"));
		expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
	});

	it("calls deleteGroupEvent when event deletion is confirmed", async () => {
		(deleteGroupEvent as jest.Mock).mockResolvedValue({ success: true });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this event for all members?",
		);
		expect(deleteGroupEvent).toHaveBeenCalledWith("event-grp-1", "grp1");

		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
	});

	it("calls deleteGroupTask when task deletion is confirmed", async () => {
		(deleteGroupTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this task for all members?",
		);
		expect(deleteGroupTask).toHaveBeenCalledWith("task-grp-1", "grp1");

		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
	});

	it("calls toggleGroupTaskComplete when completion toggle is clicked", async () => {
		(toggleGroupTaskComplete as jest.Mock).mockResolvedValue({
			success: true,
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Toggle"));

		expect(toggleGroupTaskComplete).toHaveBeenCalledWith(
			"t1",
			"grp1",
			true,
		);

		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
	});

	it("alerts if task name is empty on submit", async () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		expect(window.alert).toHaveBeenCalledWith("Task name is required");
		expect(createGroupTask).not.toHaveBeenCalled();
	});

	it("creates a task successfully and resets/closes the modal", async () => {
		(createGroupTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Simulate Typing Name"));
		expect(screen.getByTestId("task-name")).toHaveTextContent(
			"New Task Name",
		);

		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(createGroupTask).toHaveBeenCalledWith(
				"grp1",
				expect.objectContaining({
					title: "New Task Name",
					description: "",
					dueDate: null,
					priority: "Low",
					duration: 0,
					subtasks: [],
					url: null,
				}),
			);
			expect(mockRefresh).toHaveBeenCalledTimes(1);
		});

		expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
	});

	it("alerts with server error if creating a task fails", async () => {
		(createGroupTask as jest.Mock).mockResolvedValue({
			success: false,
			error: "Custom Server Error",
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Simulate Typing Name"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(window.alert).toHaveBeenCalledWith("Custom Server Error");
		});
	});

	it("falls back to default save-task error when create returns no explicit error", async () => {
		(createGroupTask as jest.Mock).mockResolvedValue({ success: false });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Simulate Typing Name"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(window.alert).toHaveBeenCalledWith("Failed to save task");
		});
	});

	it("parses subtasks and calls updateGroupTask when editing an existing task", async () => {
		(updateGroupTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit"));
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent("t1");
		expect(screen.getByTestId("task-name")).toHaveTextContent("Test Task");

		fireEvent.click(screen.getByText("Simulate Subtasks"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(updateGroupTask).toHaveBeenCalledTimes(1);
			expect(updateGroupTask).toHaveBeenCalledWith(
				"t1",
				"grp1",
				expect.objectContaining({
					title: "Complex Task",
					subtasks: ["Part 1", "Part 2"],
				}),
			);
			expect(mockRefresh).toHaveBeenCalledTimes(1);
		});
	});

	it("handles empty duration strings and empty url when submitting a new task", async () => {
		(createGroupTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Simulate Empty Durations"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(createGroupTask).toHaveBeenCalledWith(
				"grp1",
				expect.objectContaining({
					title: "Zero Duration Task",
					duration: 0,
					url: null,
					subtasks: [],
				}),
			);
		});
	});

	it("aborts deletion if confirmation is cancelled", () => {
		window.confirm = jest.fn(() => false);

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));
		expect(deleteGroupEvent).not.toHaveBeenCalled();

		fireEvent.click(screen.getByText("Task - Delete"));
		expect(deleteGroupTask).not.toHaveBeenCalled();
	});

	it("alerts when event deletion fails on the server", async () => {
		(deleteGroupEvent as jest.Mock).mockResolvedValue({
			success: false,
			error: "Failed to delete event",
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));

		await waitFor(() =>
			expect(window.alert).toHaveBeenCalledWith("Failed to delete event"),
		);
	});

	it("alerts when task deletion fails on the server", async () => {
		(deleteGroupTask as jest.Mock).mockResolvedValue({
			success: false,
			error: "Failed to delete task",
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Delete"));

		await waitFor(() =>
			expect(window.alert).toHaveBeenCalledWith("Failed to delete task"),
		);
	});

	it("alerts when toggling task completion fails with explicit error", async () => {
		(toggleGroupTaskComplete as jest.Mock).mockResolvedValue({
			success: false,
			error: "Failed to update task",
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Toggle"));

		await waitFor(() =>
			expect(window.alert).toHaveBeenCalledWith("Failed to update task"),
		);
	});

	it("alerts with fallback message when toggle failure has no error field", async () => {
		(toggleGroupTaskComplete as jest.Mock).mockResolvedValue({
			success: false,
		});

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Toggle"));

		await waitFor(() =>
			expect(window.alert).toHaveBeenCalledWith("Failed to update task"),
		);
	});

	it("handles task form onOpenChange when kept open", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Keep Task Modal Open"));

		expect(screen.getByTestId("task-modal")).toBeInTheDocument();
	});

	it("clears editingTask when task modal is closed after editing", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit"));
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent("t1");

		fireEvent.click(screen.getByText("Close Task Modal"));
		expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("Header - Create Task"));
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent(
			"no-editing-task",
		);
	});

	it("passes isOwner=false path without breaking rendering", () => {
		render(
			<GroupDetailClient
				group={makeGroup({ userRole: "MEMBER" })}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		expect(screen.getByTestId("group-header")).toBeInTheDocument();
		expect(screen.getByTestId("group-members-list")).toBeInTheDocument();
	});

	it("maps missing optional task fields to empty strings when opening edit task", () => {
		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit Sparse"));

		expect(screen.getByTestId("task-modal")).toBeInTheDocument();
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent("t2");
		expect(screen.getByTestId("task-name")).toHaveTextContent(
			"Sparse Task",
		);
		expect(screen.getByTestId("task-description")).toHaveTextContent("");
		expect(screen.getByTestId("task-dueDate")).toHaveTextContent("");
		expect(screen.getByTestId("task-url")).toHaveTextContent("");
		expect(screen.getByTestId("task-subtasks")).toHaveTextContent("");
	});

	it("alerts with fallback message when task deletion fails without an error message", async () => {
		(deleteGroupTask as jest.Mock).mockResolvedValue({ success: false });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Delete"));

		await waitFor(() => {
			expect(window.alert).toHaveBeenCalledWith("Failed to delete task");
		});
	});

	it("alerts with fallback message when event deletion fails without an error message", async () => {
		(deleteGroupEvent as jest.Mock).mockResolvedValue({ success: false });

		render(
			<GroupDetailClient
				group={makeGroup()}
				events={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));

		await waitFor(() => {
			expect(window.alert).toHaveBeenCalledWith("Failed to delete event");
		});
	});
});
