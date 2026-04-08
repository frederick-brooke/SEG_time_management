/**
 * Testing for modules/[moduleId]/ModuleDetailClient.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleDetailClient from "../ModuleDetailClient";
import {
	createModuleTask,
	updateModuleTask,
	deleteModuleTask,
	deleteModuleEvent,
} from "@/app/actions/module";

// Mocks
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@/app/actions/module", () => ({
	createModuleTask: jest.fn(),
	updateModuleTask: jest.fn(),
	deleteModuleTask: jest.fn(),
	deleteModuleEvent: jest.fn(),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
	__esModule: true,
	default: ({ children }: any) => (
		<div data-testid="lunar-wrapper">{children}</div>
	),
}));

jest.mock("components/modules/ModuleHeader", () => ({
	__esModule: true,
	default: ({ onOpenTaskModal, onOpenEventModal, onOpenSettings }: any) => (
		<div data-testid="module-header">
			<Button onClick={onOpenTaskModal}>Header - Create Task</Button>
			<Button onClick={onOpenEventModal}>Header - Create Event</Button>
			<Button onClick={onOpenSettings}>Header - Settings</Button>
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
			<Button onClick={() => onEdit({ id: "e1", title: "Test Event" })}>
				Event - Edit
			</Button>
			<Button onClick={() => onDelete("event-grp-1")}>
				Event - Delete
			</Button>
		</div>
	),
}));

jest.mock("components/modules/ModuleTasks", () => ({
	__esModule: true,
	default: ({ onEdit, onDelete }: any) => (
		<div data-testid="module-tasks">
			<Button
				onClick={() =>
					onEdit({
						moduleTaskGroupId: "t1",
						title: "Test Task",
						description: "Task description",
						dueDate: "2026-04-20T00:00:00.000Z",
						url: "https://example.com",
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
						moduleTaskGroupId: "t2",
						title: "Sparse Task",
						description: null,
						dueDate: null,
						url: null,
						duration: 0,
						priority: "Low",
					})
				}
			>
				Task - Edit Sparse
			</Button>

			<Button onClick={() => onDelete("task-grp-1")}>
				Task - Delete
			</Button>
		</div>
	),
}));

jest.mock("components/modules/ModuleSettingsModal", () => ({
	__esModule: true,
	default: ({ onClose, onSuccess }: any) => (
		<div data-testid="settings-modal">
			<Button onClick={onClose}>Close Settings</Button>
			<Button onClick={onSuccess}>Success Settings</Button>
		</div>
	),
}));

jest.mock("components/modules/ModuleEventModal", () => ({
	__esModule: true,
	default: ({ onClose, onSuccess }: any) => (
		<div data-testid="event-modal">
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
			<div data-testid="editing-task-id">{editingTaskId ?? "null"}</div>
			<div data-testid="task-name">{formData?.name ?? ""}</div>
			<div data-testid="task-description">
				{formData?.description ?? ""}
			</div>
			<div data-testid="task-dueDate">{formData?.dueDate ?? ""}</div>
			<div data-testid="task-url">{formData?.url ?? ""}</div>
			<div data-testid="task-durationHours">
				{formData?.durationHours ?? ""}
			</div>
			<div data-testid="task-durationMinutes">
				{formData?.durationMinutes ?? ""}
			</div>
			<div data-testid="task-priority">{formData?.priority ?? ""}</div>

			<Button onClick={() => onOpenChange(false)}>
				Close Task Modal
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
		</div>
	),
}));

// Helpers
const makeModule = (overrides = {}) => ({
	id: "mod1",
	userRole: "OWNER",
	members: [],
	...overrides,
});

describe("ModuleDetailClient", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		window.confirm = jest.fn(() => true);
		window.alert = jest.fn();
	});

	it("renders all core subcomponents", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		expect(screen.getByTestId("module-header")).toBeInTheDocument();
		expect(screen.getByTestId("module-members-list")).toBeInTheDocument();
		expect(screen.getByTestId("module-events")).toBeInTheDocument();
		expect(screen.getByTestId("module-tasks")).toBeInTheDocument();
	});

	it("opens, closes, and succeeds the settings modal", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
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

	it("opens event modal from the header create button", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Event"));
		expect(screen.getByTestId("event-modal")).toBeInTheDocument();
	});

	it("manages event modal state from both header and edit buttons", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Edit"));
		expect(screen.getByTestId("event-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Success Event Modal"));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByText("Close Event Modal"));
		expect(screen.queryByTestId("event-modal")).not.toBeInTheDocument();
	});

	it("calls deleteModuleEvent when event deletion is confirmed", async () => {
		(deleteModuleEvent as jest.Mock).mockResolvedValue({ success: true });

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this event for all members?",
		);
		expect(deleteModuleEvent).toHaveBeenCalledWith("event-grp-1", "mod1");

		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
	});

	it("calls deleteModuleTask when task deletion is confirmed", async () => {
		(deleteModuleTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this task for all members?",
		);
		expect(deleteModuleTask).toHaveBeenCalledWith("task-grp-1", "mod1");

		await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
	});

	it("alerts if task name is empty on submit", async () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		expect(window.alert).toHaveBeenCalledWith("Task name is required");
		expect(createModuleTask).not.toHaveBeenCalled();
	});

	it("alerts with server error if creating a task fails", async () => {
		(createModuleTask as jest.Mock).mockResolvedValue({
			success: false,
			error: "Custom Server Error",
		});

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
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

	it("parses subtasks and calls updateModuleTask when editing an existing task", async () => {
		(updateModuleTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit"));
		fireEvent.click(screen.getByText("Simulate Subtasks"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(updateModuleTask).toHaveBeenCalledTimes(1);
			expect(updateModuleTask).toHaveBeenCalledWith(
				"t1",
				"mod1",
				expect.objectContaining({
					subtasks: ["Part 1", "Part 2"],
				}),
			);
			expect(mockRefresh).toHaveBeenCalledTimes(1);
		});
	});

	it("closes the task modal through onOpenChange(false)", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		expect(screen.getByTestId("task-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Close Task Modal"));
		expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
	});

	it("clears editingTask when closing the task modal after editing", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit"));
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent("t1");

		fireEvent.click(screen.getByText("Close Task Modal"));
		expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("Header - Create Task"));
		expect(screen.getByTestId("editing-task-id")).toHaveTextContent("null");
	});

	it("creates a new task successfully when not editing", async () => {
		(createModuleTask as jest.Mock).mockResolvedValue({ success: true });

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Header - Create Task"));
		fireEvent.click(screen.getByText("Simulate Typing Name"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(createModuleTask).toHaveBeenCalledTimes(1);
			expect(createModuleTask).toHaveBeenCalledWith(
				"mod1",
				expect.objectContaining({
					title: "New Task Name",
				}),
			);
			expect(mockRefresh).toHaveBeenCalled();
		});

		expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
	});

	it("openEditTask fills fallback values for sparse tasks", () => {
		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
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
		expect(screen.getByTestId("task-durationHours")).toHaveTextContent("0");
		expect(screen.getByTestId("task-durationMinutes")).toHaveTextContent(
			"0",
		);
		expect(screen.getByTestId("task-priority")).toHaveTextContent("Low");
	});

	it("does not delete task when confirmation is cancelled", async () => {
		(window.confirm as jest.Mock).mockReturnValueOnce(false);

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this task for all members?",
		);
		expect(deleteModuleTask).not.toHaveBeenCalled();
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("does not delete event when confirmation is cancelled", async () => {
		(window.confirm as jest.Mock).mockReturnValueOnce(false);

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Event - Delete"));

		expect(window.confirm).toHaveBeenCalledWith(
			"Delete this event for all members?",
		);
		expect(deleteModuleEvent).not.toHaveBeenCalled();
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("alerts with server error if updating a task fails", async () => {
		(updateModuleTask as jest.Mock).mockResolvedValue({
			success: false,
			error: "Update failed",
		});

		render(
			<ModuleDetailClient
				module={makeModule()}
				events={[]}
				tasks={[]}
				tasksWithProgress={[]}
			/>,
		);

		fireEvent.click(screen.getByText("Task - Edit"));
		fireEvent.click(screen.getByText("Submit Task Modal"));

		await waitFor(() => {
			expect(updateModuleTask).toHaveBeenCalledTimes(1);
			expect(window.alert).toHaveBeenCalledWith("Update failed");
		});

		expect(mockRefresh).not.toHaveBeenCalled();
	});
});
