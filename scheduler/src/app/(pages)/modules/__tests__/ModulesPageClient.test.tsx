/**
 * Testing for Modules Page Client.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModulesPageClient from "../ModulesPageClient";
import { Button } from "@/components/ui/Button";
import React from "react";

// Mocks

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
	__esModule: true,
	default: ({ children }: any) => (
		<div data-testid="lunar-theme-wrapper">{children}</div>
	),
}));

jest.mock("@/components/modules/CreateModule", () => ({
	__esModule: true,
	default: ({ onSuccess, onClose }: any) => (
		<div data-testid="create-modal">
			<Button onClick={onSuccess} data-testid="create-modal-trigger">
				Mock Create
			</Button>
			<Button onClick={onClose} data-testid="create-modal-close">
				Close Create
			</Button>
		</div>
	),
}));

jest.mock("@/components/modules/JoinModule", () => ({
	__esModule: true,
	default: ({ onSuccess, onClose }: any) => (
		<div data-testid="join-modal">
			<Button onClick={onSuccess} data-testid="join-modal-trigger">
				Mock Join
			</Button>
			<Button onClick={onClose} data-testid="join-modal-close">
				Close Join
			</Button>
		</div>
	),
}));

jest.mock("@/components/modules/ModuleCard", () => ({
	ModuleCard: ({ module }: any) => (
		<div data-testid="module-card">{module.name}</div>
	),
}));

jest.mock("lucide-react", () => ({
	Plus: () => <svg data-testid="plus-icon" />,
	LogIn: () => <svg data-testid="login-icon" />,
	ArrowUpDown: () => <svg data-testid="sort-icon" />,
	ChevronLeft: () => <svg data-testid="prev-icon" />,
	ChevronRight: () => <svg data-testid="next-icon" />,
}));

// Fixtures

const mockModules = [
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
	{
		id: "3",
		name: "Beta",
		memberCount: 5,
		createdAt: "2022-06-15",
		creator: { username: "c" },
	},
];

describe("ModulesPageClient", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the page title, subtitle, and wrapper", () => {
		render(<ModulesPageClient modules={mockModules} />);

		expect(screen.getByTestId("lunar-theme-wrapper")).toBeInTheDocument();
		expect(screen.getByText("My Modules")).toBeInTheDocument();
		expect(
			screen.getByText("Collaborate with peers on shared goals"),
		).toBeInTheDocument();
	});

	it("renders default newest sorting order", () => {
		render(<ModulesPageClient modules={mockModules} />);

		const cards = screen.getAllByTestId("module-card");
		expect(cards[0]).toHaveTextContent("Alpha"); // newest 2024
		expect(cards[1]).toHaveTextContent("Beta"); // 2022
		expect(cards[2]).toHaveTextContent("Zebra"); // 2020
	});

	it("covers empty state and safeTotal pagination", () => {
		render(<ModulesPageClient modules={[]} />);

		expect(screen.getByText(/no modules found/i)).toBeInTheDocument();
		expect(
			screen.getByText(/no modules enrolled yet/i),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
		expect(screen.getByText(/page 1\/1/i)).toBeInTheDocument();
	});

	it("opens and closes the sort menu", () => {
		render(<ModulesPageClient modules={mockModules} />);

		const sortBtn = screen.getByText(/sort/i);

		fireEvent.click(sortBtn);
		expect(screen.getByText("Newest first")).toBeInTheDocument();
		expect(screen.getByText("Oldest first")).toBeInTheDocument();

		fireEvent.click(sortBtn);
		expect(screen.queryByText("Newest first")).not.toBeInTheDocument();
	});

	it("executes all sorting branches", () => {
		render(<ModulesPageClient modules={mockModules} />);

		const sortBtn = screen.getByText(/sort/i);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Name A → Z"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Alpha",
		);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Name Z → A"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Zebra",
		);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Most members"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Alpha",
		);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Fewest members"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Zebra",
		);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Newest first"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Alpha",
		);

		fireEvent.click(sortBtn);
		fireEvent.click(screen.getByText("Oldest first"));
		expect(screen.getAllByTestId("module-card")[0]).toHaveTextContent(
			"Zebra",
		);
	});

	it("resets pagination to page 1 after changing sort", () => {
		const manyModules = Array.from({ length: 10 }, (_, i) => ({
			id: `${i}`,
			name: `Mod ${i}`,
			memberCount: i,
			createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
			creator: { username: `u${i}` },
		}));

		render(<ModulesPageClient modules={manyModules} />);

		const nextBtn = screen.getByTestId("next-icon").parentElement!;
		fireEvent.click(nextBtn);
		expect(screen.getByText(/page 2\/2/i)).toBeInTheDocument();

		fireEvent.click(screen.getByText(/sort/i));
		fireEvent.click(screen.getByText("Name A → Z"));

		expect(screen.getByText(/page 1\/2/i)).toBeInTheDocument();
	});

	it("shows the correct range label for paginated data", () => {
		const manyModules = Array.from({ length: 10 }, (_, i) => ({
			id: `${i}`,
			name: `Mod ${i}`,
			memberCount: i,
			createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
			creator: { username: `u${i}` },
		}));

		render(<ModulesPageClient modules={manyModules} />);

		expect(screen.getByText(/showing 1-8 of 10/i)).toBeInTheDocument();

		const nextBtn = screen.getByTestId("next-icon").parentElement!;
		fireEvent.click(nextBtn);

		expect(screen.getByText(/showing 9-10 of 10/i)).toBeInTheDocument();
	});

	it("navigates through pagination using next and previous buttons", () => {
		const manyModules = Array.from({ length: 10 }, (_, i) => ({
			id: `${i}`,
			name: `Mod ${i}`,
			memberCount: i,
			createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
			creator: { username: `u${i}` },
		}));

		render(<ModulesPageClient modules={manyModules} />);

		expect(screen.getByText(/page 1\/2/i)).toBeInTheDocument();

		const nextBtn = screen.getByTestId("next-icon").parentElement!;
		fireEvent.click(nextBtn);
		expect(screen.getByText(/page 2\/2/i)).toBeInTheDocument();

		const prevBtn = screen.getByTestId("prev-icon").parentElement!;
		fireEvent.click(prevBtn);
		expect(screen.getByText(/page 1\/2/i)).toBeInTheDocument();
	});

	it("disables previous button on first page and next button on last page", () => {
		const manyModules = Array.from({ length: 10 }, (_, i) => ({
			id: `${i}`,
			name: `Mod ${i}`,
			memberCount: i,
			createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
			creator: { username: `u${i}` },
		}));

		render(<ModulesPageClient modules={manyModules} />);

		const prevBtn = screen.getByTestId("prev-icon")
			.parentElement as HTMLButtonElement;
		const nextBtn = screen.getByTestId("next-icon")
			.parentElement as HTMLButtonElement;

		expect(prevBtn).toBeDisabled();
		expect(nextBtn).not.toBeDisabled();

		fireEvent.click(nextBtn);

		expect(screen.getByText(/page 2\/2/i)).toBeInTheDocument();
		expect(nextBtn).toBeDisabled();
		expect(prevBtn).not.toBeDisabled();
	});

	it("opens and closes the create modal", () => {
		render(<ModulesPageClient modules={mockModules} />);

		fireEvent.click(screen.getByText(/create/i));
		expect(screen.getByTestId("create-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("create-modal-close"));
		expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
	});

	it("opens and closes the join modal", () => {
		render(<ModulesPageClient modules={mockModules} />);

		fireEvent.click(screen.getByText(/join/i));
		expect(screen.getByTestId("join-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("join-modal-close"));
		expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
	});

	it("triggers router refresh on successful create or join", () => {
		render(<ModulesPageClient modules={mockModules} />);

		fireEvent.click(screen.getByText(/create/i));
		fireEvent.click(screen.getByTestId("create-modal-trigger"));
		expect(mockRefresh).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByText(/join/i));
		fireEvent.click(screen.getByTestId("join-modal-trigger"));
		expect(mockRefresh).toHaveBeenCalledTimes(2);
	});

	it("renders the single page pagination state correctly when module count is under page size", () => {
		render(<ModulesPageClient modules={mockModules} />);

		expect(screen.getByText(/showing 1-3 of 3/i)).toBeInTheDocument();
		expect(screen.getByText(/page 1\/1/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
	});

	it("hits the default sort branch by forcing an unknown sort key", () => {
		const useStateSpy = jest.spyOn(React, "useState");

		useStateSpy
			.mockImplementationOnce(() => [false, jest.fn()]) // showCreate
			.mockImplementationOnce(() => [false, jest.fn()]) // showJoin
			.mockImplementationOnce(() => ["invalid-sort" as any, jest.fn()]) // sortKey
			.mockImplementationOnce(() => [1, jest.fn()]) // page
			.mockImplementationOnce(() => [false, jest.fn()]); // showSortMenu

		render(<ModulesPageClient modules={mockModules} />);

		const cards = screen.getAllByTestId("module-card");
		expect(cards[0]).toHaveTextContent("Zebra");
		expect(cards[1]).toHaveTextContent("Alpha");
		expect(cards[2]).toHaveTextContent("Beta");

		useStateSpy.mockRestore();
	});

	it("navigates by clicking a numbered pagination button", () => {
		const manyModules = Array.from({ length: 10 }, (_, i) => ({
			id: `${i}`,
			name: `Mod ${i}`,
			memberCount: i,
			createdAt: `2024-01-${String(i + 1).padStart(2, "0")}`,
			creator: { username: `u${i}` },
		}));

		render(<ModulesPageClient modules={manyModules} />);

		fireEvent.click(screen.getByRole("button", { name: "2" }));
		expect(screen.getByText(/page 2\/2/i)).toBeInTheDocument();
	});
});
