/**
 * Testing for Groups Page Client.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import GroupsPageClient from "../GroupsPageClient";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/Button";
import React from "react";

// Mocks

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("@/components/groups/CreateGroup", () => ({
	__esModule: true,
	default: ({ onSuccess, onClose }: any) => (
		<div data-testid="create-modal">
			<Button onClick={onSuccess} data-testid="create-modal-trigger">
				Mock Create
			</Button>
			<Button onClick={onClose} data-testid="close-modal-trigger">
				Mock Close
			</Button>
		</div>
	),
}));

jest.mock("@/components/groups/GroupCard", () => ({
	GroupCard: ({ group }: any) => (
		<div data-testid="group-card">{group.name}</div>
	),
}));

jest.mock("lucide-react", () => ({
	Plus: () => <svg data-testid="plus-icon" />,
	ArrowUpDown: () => <svg data-testid="arrow-icon" />,
	ChevronLeft: () => <svg data-testid="prev-icon" />,
	ChevronRight: () => <svg data-testid="next-icon" />,
}));

// Tests

describe("GroupsPageClient", () => {
	const mockGroups = [
		{
			id: "1",
			name: "Zebra",
			memberCount: 1,
			createdAt: "2020-01-01",
			creator: { username: "a" },
		},
		{
			id: "2",
			name: "Alpha",
			memberCount: 10,
			createdAt: "2024-01-01",
			creator: { username: "b" },
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Confirms the range labels and pagination buttons appear even with empty data
	it("covers empty state and safeTotal pagination", () => {
		render(<GroupsPageClient groups={[]} />);
		expect(
			screen.getByText("No groups found. Try creating one!"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
	});

	// Confirms all sort branches and the sort menu toggle behavior execute reliably
	it("executes all sorting branches and explicitly toggles the menu", () => {
		render(<GroupsPageClient groups={mockGroups} />);

		// Finds the main sort toggle button regardless of what text is currently on it
		const getSortToggle = () =>
			screen.getByTestId("arrow-icon").closest("button")!;

		// Test Name A -> Z
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Name A → Z"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Alpha",
		);

		// Test Name Z -> A
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Name Z → A"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Zebra",
		);

		// Test Fewest members
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Fewest members"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Zebra",
		);

		// Test Most members
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Most members"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Alpha",
		);

		// Test Oldest first
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Oldest first"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Zebra",
		);

		// Test Newest first (re-select to explicitly trigger state update for this branch)
		fireEvent.click(getSortToggle());
		fireEvent.click(screen.getByText("Newest first"));
		expect(screen.getAllByTestId("group-card")[0]).toHaveTextContent(
			"Alpha",
		);

		// Toggle menu off manually
		fireEvent.click(getSortToggle());
		expect(screen.getByText("Name A → Z")).toBeInTheDocument();
		fireEvent.click(getSortToggle());
		expect(screen.queryByText("Name A → Z")).not.toBeInTheDocument();
	});

	// Confirms previous and next chevron buttons work correctly across multiple pages
	it("navigates through pagination using next and previous arrow buttons", () => {
		const manyGroups = Array.from({ length: 17 }, (_, i) => ({
			...mockGroups[0],
			id: `${i}`,
			name: `Grp ${i}`,
		}));

		render(<GroupsPageClient groups={manyGroups} />);

		expect(screen.getByText(/page 1\/3/i)).toBeInTheDocument();

		const nextBtn = screen.getByTestId("next-icon").closest("button")!;
		const prevBtn = screen.getByTestId("prev-icon").closest("button")!;

		// Page 1: Previous should be disabled, click Next
		expect(prevBtn).toBeDisabled();
		fireEvent.click(nextBtn);
		expect(screen.getByText(/page 2\/3/i)).toBeInTheDocument();

		// Page 2: Click Next again
		fireEvent.click(nextBtn);
		expect(screen.getByText(/page 3\/3/i)).toBeInTheDocument();

		// Page 3: Next should be disabled, click Previous
		expect(nextBtn).toBeDisabled();
		fireEvent.click(prevBtn);
		expect(screen.getByText(/page 2\/3/i)).toBeInTheDocument();
	});

	// Confirms the onSuccess and onClose logic triggers correctly for the modal
	it("triggers router refresh on successful create and handles modal close", () => {
		render(<GroupsPageClient groups={mockGroups} />);

		// Open Modal
		fireEvent.click(screen.getByTestId("plus-icon").closest("button")!);
		expect(screen.getByTestId("create-modal")).toBeInTheDocument();

		// Trigger Success
		fireEvent.click(screen.getByTestId("create-modal-trigger"));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		// Trigger Close
		fireEvent.click(screen.getByTestId("close-modal-trigger"));
		expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
	});
	// Confirms clicking a specific page number updates the pagination state
	it("navigates to a specific page when a number button is clicked", () => {
		// Generate 17 groups to force 3 pages
		const manyGroups = Array.from({ length: 17 }, (_, i) => ({
			id: `${i}`,
			name: `Grp ${i}`,
			memberCount: 1,
			createdAt: "2020-01-01",
			creator: { username: "a" },
		}));

		render(<GroupsPageClient groups={manyGroups} />);

		// Explicitly click the numbered button '2'
		const page2Btn = screen.getByRole("button", { name: "2" });
		fireEvent.click(page2Btn);

		expect(screen.getByText(/page 2\/3/i)).toBeInTheDocument();
	});

	it('falls back to "Sort" label when sortKey has no matching option', () => {
		const realUseState = React.useState;

		jest.spyOn(React, "useState")
			.mockImplementationOnce(() => realUseState(false)) // showCreate
			.mockImplementationOnce(() => realUseState("invalid-sort")) // sortKey
			.mockImplementationOnce(() => realUseState(1)) // page
			.mockImplementationOnce(() => realUseState(false)); // showSortMenu

		render(<GroupsPageClient groups={mockGroups} />);

		expect(screen.getByText("Sort")).toBeInTheDocument();

		(React.useState as jest.Mock).mockRestore();
	});
});
