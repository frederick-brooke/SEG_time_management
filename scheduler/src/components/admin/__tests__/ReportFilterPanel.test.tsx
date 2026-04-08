/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportFilter from "@/components/admin/ReportFilterPanel";

jest.mock("@/components/admin/AdminFilterPanel", () => ({
	FilterPanel: ({ children, onClose, onReset }: any) => (
		<div data-testid="filter-panel">
			<button onClick={onClose}>panel-close</button>
			<button onClick={onReset}>panel-reset</button>
			{children}
		</div>
	),
	FilterSortGroup: ({ onSortChange, onOrderChange }: any) => (
		<div data-testid="sort-group">
			<button onClick={() => onSortChange("status")}>change-sort</button>
			<button onClick={() => onOrderChange("asc")}>change-order</button>
		</div>
	),
	FilterDateRange: ({ onStartChange, onEndChange }: any) => (
		<div data-testid="date-range">
			<button onClick={() => onStartChange("2024-01-01")}>start-date</button>
			<button onClick={() => onEndChange("2024-12-31")}>end-date</button>
		</div>
	),
	FilterToggleGroup: ({ onToggle, isActive }: any) => (
		<div data-testid="toggle-group">
			<button onClick={() => onToggle("PENDING")}>toggle-pending</button>
			<span>{isActive("PENDING") ? "active" : "inactive"}</span>
		</div>
	),
	FilterActions: ({ onApply, onClose }: any) => (
		<div data-testid="actions">
			<button onClick={onApply}>apply</button>
			<button onClick={onClose}>close</button>
		</div>
	),
}));

describe("ReportFilter", () => {
	let user: ReturnType<typeof userEvent.setup>;

	const baseFilters = {
		sortBy: "createdAt",
		order: "desc",
		startDate: "",
		endDate: "",
		status: "",
		page: 2,
	};

	beforeEach(() => {
		user = userEvent.setup();
	});

	it("renders all sections", () => {
		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={jest.fn()}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
		expect(screen.getByTestId("sort-group")).toBeInTheDocument();
		expect(screen.getByTestId("date-range")).toBeInTheDocument();
		expect(screen.getByTestId("toggle-group")).toBeInTheDocument();
		expect(screen.getByTestId("actions")).toBeInTheDocument();
	});

	it("updates sort and resets page", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("change-sort"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater(baseFilters)).toEqual({
			...baseFilters,
			sortBy: "status",
			page: 1,
		});
	});

	it("updates order and resets page", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("change-order"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater(baseFilters)).toEqual({
			...baseFilters,
			order: "asc",
			page: 1,
		});
	});

	it("updates start date", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("start-date"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater(baseFilters)).toEqual({
			...baseFilters,
			startDate: "2024-01-01",
			page: 1,
		});
	});

	it("updates end date", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("end-date"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater(baseFilters)).toEqual({
			...baseFilters,
			endDate: "2024-12-31",
			page: 1,
		});
	});

	it("toggles status on", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("toggle-pending"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater(baseFilters)).toEqual({
			...baseFilters,
			status: "PENDING",
			page: 1,
		});
	});

	it("toggles status off if already selected", async () => {
		const setFilters = jest.fn();

		render(
			<ReportFilter
				filters={{ ...baseFilters, status: "PENDING" }}
				setFilters={setFilters}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("toggle-pending"));

		const updater = setFilters.mock.calls[0][0];
		expect(updater({ ...baseFilters, status: "PENDING" })).toEqual({
			...baseFilters,
			status: "",
			page: 1,
		});
	});

	it("calls applyFilters", async () => {
		const applyFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={jest.fn()}
				onClose={jest.fn()}
				applyFilters={applyFilters}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("apply"));

		expect(applyFilters).toHaveBeenCalled();
	});

	it("calls onClose from actions and panel", async () => {
		const onClose = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={jest.fn()}
				onClose={onClose}
				applyFilters={jest.fn()}
				resetFilters={jest.fn()}
			/>
		);

		await user.click(screen.getByText("close"));
		await user.click(screen.getByText("panel-close"));

		expect(onClose).toHaveBeenCalledTimes(2);
	});

	it("calls resetFilters", async () => {
		const resetFilters = jest.fn();

		render(
			<ReportFilter
				filters={baseFilters}
				setFilters={jest.fn()}
				onClose={jest.fn()}
				applyFilters={jest.fn()}
				resetFilters={resetFilters}
			/>
		);

		await user.click(screen.getByText("panel-reset"));

		expect(resetFilters).toHaveBeenCalled();
	});
});