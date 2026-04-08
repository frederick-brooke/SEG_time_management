/**
 * Testing for Leaderboard Client page.
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LeaderboardClient from "../LeaderboardClient";
import { useRouter } from "next/navigation";

// Mocks

jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

let mockIsPending = false;

jest.mock("react", () => {
	const original = jest.requireActual("react");
	return {
		...original,
		useTransition: () => [mockIsPending, (cb: any) => cb()],
	};
});

// Tests

describe("LeaderboardClient", () => {
	const mockPush = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
	});

	const baseUsers: any[] = [
		{
			id: "1",
			username: "alice",
			name: "Alice",
			pfp: null,
			streak: 10,
			focusTime: "10h",
			focusTimeRaw: 600,
			completionRate: 90,
			isCurrentUser: true,
		},
		{
			id: "2",
			username: "bob",
			name: "Bob",
			pfp: "bob.png",
			streak: 5,
			focusTime: "5h",
			focusTimeRaw: 300,
			completionRate: 50,
			isCurrentUser: false,
		},
		{
			id: "3",
			username: "charlie",
			name: "Charlie",
			pfp: null,
			streak: 2,
			focusTime: "2h",
			focusTimeRaw: 120,
			completionRate: 30,
			isCurrentUser: false,
		},
		{
			id: "4",
			username: "dave",
			name: "Dave",
			pfp: null,
			streak: 0,
			focusTime: "0h",
			focusTimeRaw: 0,
			completionRate: 10,
			isCurrentUser: false,
		},
	];

	it("renders empty state correctly", () => {
		render(<LeaderboardClient initialData={[]} currentTimeframe="all" />);
		expect(
			screen.getByText(/No friends to compete with yet/i),
		).toBeInTheDocument();
	});

	it("renders users in default streak order and applies medal icons", () => {
		render(
			<LeaderboardClient
				initialData={baseUsers}
				currentTimeframe="all"
			/>,
		);

		const rows = screen.getAllByRole("link");
		expect(rows).toHaveLength(4);

		expect(screen.getByText("You")).toBeInTheDocument();

		// Rank 4 should be plain text (no medal)
		expect(screen.getByText("4")).toBeInTheDocument();
	});

	it("handles timeframe changes via native select", () => {
		render(
			<LeaderboardClient
				initialData={baseUsers}
				currentTimeframe="all"
			/>,
		);

		const selects = screen.getAllByRole("combobox");
		const timeframeSelect = selects[0];

		fireEvent.change(timeframeSelect, { target: { value: "week" } });

		expect(mockPush).toHaveBeenCalledWith("?timeframe=week");
	});

	describe("Sorting & Tie-Breakers (Coverage Hits)", () => {
		const tieData: any[] = [
			{
				id: "a",
				username: "a",
				name: "A",
				streak: 5,
				focusTimeRaw: 100,
				completionRate: 80,
			},
			{
				id: "b",
				username: "b",
				name: "B",
				streak: 5,
				focusTimeRaw: 200,
				completionRate: 80,
			},
			{
				id: "c",
				username: "c",
				name: "C",
				streak: 5,
				focusTimeRaw: 100,
				completionRate: 80,
			},
		];

		it("sorts by Focus Time and handles ties", () => {
			render(
				<LeaderboardClient
					initialData={tieData}
					currentTimeframe="all"
				/>,
			);

			const sortSelect = screen.getAllByRole("combobox")[1];
			fireEvent.change(sortSelect, { target: { value: "focusTime" } });

			// B has highest focus time, should be first
			const firstLink = screen.getAllByRole("link")[0];
			expect(firstLink).toHaveTextContent("B");
		});

		it("sorts by Completion Rate and handles ties", () => {
			// Modify tie data so B has higher focus time but same completion rate
			const compTieData: any[] = [
				{
					id: "a",
					username: "a",
					name: "A",
					streak: 0,
					focusTimeRaw: 100,
					completionRate: 90,
				},
				{
					id: "b",
					username: "b",
					name: "B",
					streak: 0,
					focusTimeRaw: 200,
					completionRate: 90,
				}, // Wins completion tie due to focusTime
			];
			render(
				<LeaderboardClient
					initialData={compTieData}
					currentTimeframe="all"
				/>,
			);

			const sortSelect = screen.getAllByRole("combobox")[1];
			fireEvent.change(sortSelect, {
				target: { value: "completionRate" },
			});

			const firstLink = screen.getAllByRole("link")[0];
			expect(firstLink).toHaveTextContent("B");
		});

		it("sorts by Streak and handles ties", () => {
			render(
				<LeaderboardClient
					initialData={tieData}
					currentTimeframe="all"
				/>,
			);

			const sortSelect = screen.getAllByRole("combobox")[1];
			fireEvent.change(sortSelect, { target: { value: "streak" } });

			// B has same streak but higher focus time, so B should win the tie breaker
			const firstLink = screen.getAllByRole("link")[0];
			expect(firstLink).toHaveTextContent("B");
		});
	});

	it("falls back without reordering when sort key is invalid", () => {
		const realUseState = React.useState;

		(jest.spyOn(React, "useState") as any)
			.mockImplementationOnce((...args: any[]) => realUseState(args[0])) // localTimeframe
			.mockImplementationOnce((...args: any[]) =>
				realUseState("invalid-sort" as any),
			); // sortBy

		render(
			<LeaderboardClient
				initialData={baseUsers}
				currentTimeframe="all"
			/>,
		);

		const links = screen.getAllByRole("link");

		expect(links[0]).toHaveTextContent("Alice");
		expect(links[1]).toHaveTextContent("Bob");
		expect(links[2]).toHaveTextContent("Charlie");
		expect(links[3]).toHaveTextContent("Dave");

		(React.useState as jest.Mock).mockRestore();
	});

	it("keeps original order when sort key is invalid", () => {
		const realUseState = React.useState;

		(jest.spyOn(React, "useState") as any)
			.mockImplementationOnce((...args: any[]) => realUseState(args[0])) // localTimeframe
			.mockImplementationOnce((...args: any[]) =>
				realUseState("invalid-sort" as any),
			); // sortBy

		render(
			<LeaderboardClient
				initialData={baseUsers}
				currentTimeframe="all"
			/>,
		);

		const links = screen.getAllByRole("link");
		expect(links[0]).toHaveTextContent("Alice");
		expect(links[1]).toHaveTextContent("Bob");
		expect(links[2]).toHaveTextContent("Charlie");
		expect(links[3]).toHaveTextContent("Dave");

		(React.useState as jest.Mock).mockRestore();
	});

	it("falls back to username initial when name is missing and there is no avatar", () => {
		const users = [
			{
				id: "1",
				username: "zoe",
				name: "",
				pfp: null,
				streak: 1,
				focusTime: "1h",
				focusTimeRaw: 60,
				completionRate: 50,
				isCurrentUser: false,
			},
		];

		render(
			<LeaderboardClient initialData={users} currentTimeframe="all" />,
		);

		expect(screen.getByText("z")).toBeInTheDocument();
	});

	it("renders a user in the mid completion-rate tier", () => {
		const users = [
			{
				id: "1",
				username: "mila",
				name: "Mila",
				pfp: null,
				streak: 3,
				focusTime: "3h",
				focusTimeRaw: 180,
				completionRate: 65,
				isCurrentUser: false,
			},
		];

		render(
			<LeaderboardClient initialData={users} currentTimeframe="all" />,
		);

		expect(screen.getByText("Mila")).toBeInTheDocument();
		expect(screen.getByText("65%")).toBeInTheDocument();
	});

	it("sorts by completion rate when completion rates are different", () => {
		const users = [
			{
				id: "1",
				username: "low",
				name: "Low",
				pfp: null,
				streak: 1,
				focusTime: "1h",
				focusTimeRaw: 60,
				completionRate: 40,
				isCurrentUser: false,
			},
			{
				id: "2",
				username: "high",
				name: "High",
				pfp: null,
				streak: 1,
				focusTime: "1h",
				focusTimeRaw: 60,
				completionRate: 90,
				isCurrentUser: false,
			},
		];

		render(
			<LeaderboardClient initialData={users} currentTimeframe="all" />,
		);

		const sortSelect = screen.getAllByRole("combobox")[1];
		fireEvent.change(sortSelect, { target: { value: "completionRate" } });

		const firstLink = screen.getAllByRole("link")[0];
		expect(firstLink).toHaveTextContent("High");
	});

	it("renders pending state styles when transition is pending", () => {
		mockIsPending = true;

		const { container } = render(
			<LeaderboardClient
				initialData={baseUsers}
				currentTimeframe="all"
			/>,
		);

		expect(
			container.querySelector(".opacity-40.pointer-events-none"),
		).toBeTruthy();

		mockIsPending = false;
	});
});
