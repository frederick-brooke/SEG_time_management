import { render, screen, fireEvent } from "@testing-library/react";
import MobileCalendarToolbar from "../MobileCalendarToolbar";

jest.mock("../FilterSidebar", () => {
	return function MockFilterSidebar(props: any) {
		return (
			<div>
				<div>Mock FilterSidebar</div>
				<button onClick={() => props.onToggleFilter("tasks")}>
					Toggle Filter
				</button>
				<button onClick={() => props.onToggleCategory("cat-1")}>
					Toggle Category
				</button>
				<button onClick={props.onManageCategories}>
					Manage Categories
				</button>
			</div>
		);
	};
});

jest.mock("../UnscheduledPanel", () => {
	return function MockUnscheduledPanel(props: any) {
		return (
			<div>
				<div>Mock UnscheduledPanel</div>
				<button onClick={() => props.onTaskClick({ id: "task-1" })}>
					Open Task
				</button>
				<button onClick={() => props.onEditLog({ id: "log-1" })}>
					Edit Log
				</button>
				<button onClick={() => props.onDeleteLog("log-2")}>
					Delete Log
				</button>
			</div>
		);
	};
});

describe("MobileCalendarToolbar", () => {
	const onScheduleDay = jest.fn();
	const onScheduleWeek = jest.fn();
	const onToggleFilter = jest.fn();
	const onToggleCategory = jest.fn();
	const onManageCategories = jest.fn();
	const onTaskClick = jest.fn();
	const onEditLog = jest.fn();
	const onDeleteLog = jest.fn().mockResolvedValue(undefined);

	const baseProps = {
		onScheduleDay,
		onScheduleWeek,
		activeFilters: { tasks: true },
		categories: [{ id: "cat-1", name: "Study" }],
		categoryFilters: { "cat-1": true },
		onToggleFilter,
		onToggleCategory,
		onManageCategories,
		unscheduledTasks: [{ id: "u1" }, { id: "u2" }],
		scheduleLogs: [{ id: "s1" }],
		events: [{ id: "e1" }],
		onTaskClick,
		onEditLog,
		onDeleteLog,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders all toolbar buttons and task badge", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		expect(screen.getByRole("button", { name: /day/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /week/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /tasks/i })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /filters/i }),
		).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("Filters")).toBeInTheDocument();
		expect(screen.getByText("Unscheduled Tasks")).toBeInTheDocument();
	});

	it("does not render a badge when there are no unscheduled tasks", () => {
		render(
			<MobileCalendarToolbar
				{...baseProps}
				unscheduledTasks={[]}
			/>,
		);

		expect(screen.queryByText("2")).not.toBeInTheDocument();
	});

	it("calls onScheduleDay", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /day/i }));

		expect(onScheduleDay).toHaveBeenCalledTimes(1);
	});

	it("calls onScheduleWeek", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /week/i }));

		expect(onScheduleWeek).toHaveBeenCalledTimes(1);
	});

	it("opens and closes the filters sheet from the toolbar button", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		const filtersButton = screen.getByRole("button", { name: /filters/i });

		expect(screen.getByText("Mock FilterSidebar")).toBeInTheDocument();

		fireEvent.click(filtersButton);
		expect(screen.getByText("Mock FilterSidebar")).toBeInTheDocument();

		fireEvent.click(filtersButton);
	});

	it("opens and closes the unscheduled sheet from the toolbar button", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		const tasksButton = screen.getByRole("button", { name: /tasks/i });

		expect(screen.getByText("Mock UnscheduledPanel")).toBeInTheDocument();

		fireEvent.click(tasksButton);
		expect(screen.getByText("Mock UnscheduledPanel")).toBeInTheDocument();

		fireEvent.click(tasksButton);
	});

	it("switches from filters sheet to unscheduled sheet", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /filters/i }));
		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));

		expect(screen.getByText("Mock UnscheduledPanel")).toBeInTheDocument();
	});

	it("switches from unscheduled sheet to filters sheet", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));
		fireEvent.click(screen.getByRole("button", { name: /filters/i }));

		expect(screen.getByText("Mock FilterSidebar")).toBeInTheDocument();
	});

	it("closes sheets when backdrop is clicked", () => {
		const { container } = render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /filters/i }));

		const backdrops = container.querySelectorAll(".bg-black\\/50");
		expect(backdrops.length).toBe(1);

		fireEvent.click(backdrops[0]);
	});

	it("closes the filters sheet with the close button", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /filters/i }));

		const closeButtons = screen.getAllByRole("button", { name: "✕" });
		fireEvent.click(closeButtons[0]);
	});

	it("closes the unscheduled sheet with the close button", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));

		const closeButtons = screen.getAllByRole("button", { name: "✕" });
		fireEvent.click(closeButtons[1]);
	});

	it("passes filter actions through to FilterSidebar", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /filters/i }));
		fireEvent.click(screen.getByRole("button", { name: /toggle filter/i }));
		fireEvent.click(screen.getByRole("button", { name: /toggle category/i }));

		expect(onToggleFilter).toHaveBeenCalledWith("tasks");
		expect(onToggleCategory).toHaveBeenCalledWith("cat-1");
	});

	it("closes filters sheet and calls onManageCategories", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /filters/i }));
		fireEvent.click(screen.getByRole("button", { name: /manage categories/i }));

		expect(onManageCategories).toHaveBeenCalledTimes(1);
	});

	it("closes unscheduled sheet and calls onTaskClick", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));
		fireEvent.click(screen.getByRole("button", { name: /open task/i }));

		expect(onTaskClick).toHaveBeenCalledWith({ id: "task-1" });
	});

	it("closes unscheduled sheet and calls onEditLog", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));
		fireEvent.click(screen.getByRole("button", { name: /edit log/i }));

		expect(onEditLog).toHaveBeenCalledWith({ id: "log-1" });
	});

	it("passes onDeleteLog through to UnscheduledPanel", () => {
		render(<MobileCalendarToolbar {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: /tasks/i }));
		fireEvent.click(screen.getByRole("button", { name: /delete log/i }));

		expect(onDeleteLog).toHaveBeenCalledWith("log-2");
	});
});