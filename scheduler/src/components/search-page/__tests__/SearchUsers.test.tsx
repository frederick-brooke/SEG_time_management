import { render, screen, fireEvent } from "@testing-library/react";
import SearchUsers from "../SearchUsers";

// Mock UserPanel
jest.mock("@/components/admin/AdminUserPanel", () => (props: any) => (
	<div data-testid="user-panel">
		{props.user ? "OPEN" : "CLOSED"}
		<button onClick={props.onClose}>close-panel</button>
	</div>
));

// Mock UserCard
jest.mock("../UserCards", () => (props: any) => (
	<div data-testid="user-card">
		<span>{props.user.username}</span>
		<button onClick={props.onClick}>open</button>
		{props.onRemove && <button onClick={props.onRemove}>remove</button>}
	</div>
));

// Mock GlassCard
jest.mock("@/components/ui/GlassCard", () => (props: any) => (
	<div>{props.children}</div>
));

// Mock recent-users utils
const addRecentUser = jest.fn();
const getRecentUsers = jest.fn();
const removeRecentUser = jest.fn();
const clearRecentUsers = jest.fn();

jest.mock("@/lib/recent-users", () => ({
	addRecentUser: (...args: any[]) => addRecentUser(...args),
	getRecentUsers: () => getRecentUsers(),
	removeRecentUser: (...args: any[]) => removeRecentUser(...args),
	clearRecentUsers: () => clearRecentUsers(),
}));

describe("SearchUsers", () => {
	let consoleErrorSpy: jest.SpyInstance;

	const baseProps = {
		users: [],
		totalUsers: 0,
		totalUserPages: 1,
		setIsUserFilterOpen: jest.fn(),
		selectedUser: null,
		setSelectedUser: jest.fn(),
		filters: { search: "", page: 1, limit: 10 },
		setFilters: jest.fn(),
		resetFilters: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	test("shows recent users when not searching", () => {
		getRecentUsers.mockReturnValue([
			{ username: "alice" },
			{ username: "bob" },
		]);

		render(<SearchUsers {...baseProps} />);

		expect(screen.getByText("Recent Searches")).toBeInTheDocument();
		expect(screen.getByText("alice")).toBeInTheDocument();
		expect(screen.getByText("bob")).toBeInTheDocument();
	});

	test("shows empty recent state", () => {
		getRecentUsers.mockReturnValue([]);

		render(<SearchUsers {...baseProps} />);

		expect(screen.getByText(/No recent searches/i)).toBeInTheDocument();
	});

	test("does not show Clear All when there are no recent users", () => {
		getRecentUsers.mockReturnValue([]);

		render(<SearchUsers {...baseProps} />);

		expect(
			screen.queryByRole("button", { name: "Clear All" }),
		).not.toBeInTheDocument();
	});

	test("clear recent users", () => {
		getRecentUsers.mockReturnValue([{ username: "alice" }]);

		render(<SearchUsers {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: "Clear All" }));

		expect(clearRecentUsers).toHaveBeenCalled();
	});

	test("remove single recent user", () => {
		getRecentUsers
			.mockReturnValueOnce([{ username: "alice" }])
			.mockReturnValueOnce([]);

		render(<SearchUsers {...baseProps} />);

		fireEvent.click(screen.getByText("remove"));

		expect(removeRecentUser).toHaveBeenCalledWith("alice");
	});

	test("clicking a recent user adds them to recent users", () => {
		getRecentUsers.mockReturnValue([{ username: "alice" }]);

		render(<SearchUsers {...baseProps} />);

		fireEvent.click(screen.getByRole("button", { name: "open" }));

		expect(addRecentUser).toHaveBeenCalledWith({ username: "alice" });
	});

	test("shows search results", () => {
		render(
			<SearchUsers
				{...baseProps}
				filters={{ ...baseProps.filters, search: "a" }}
				users={[{ id: 1, username: "alex" }]}
			/>,
		);

		expect(screen.getByText("Users")).toBeInTheDocument();
		expect(screen.getByText("alex")).toBeInTheDocument();
	});

	test("shows no users found", () => {
		render(
			<SearchUsers
				{...baseProps}
				filters={{ ...baseProps.filters, search: "a" }}
				users={[]}
			/>,
		);

		expect(screen.getByText(/No users found/i)).toBeInTheDocument();
	});

	test("clicking a search result adds them to recent users", () => {
		render(
			<SearchUsers
				{...baseProps}
				filters={{ ...baseProps.filters, search: "al" }}
				users={[{ id: 1, username: "alex" }]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "open" }));

		expect(addRecentUser).toHaveBeenCalledWith({ id: 1, username: "alex" });
	});

	test("renders pagination and executes previous/next page updater functions", () => {
		const setFilters = jest.fn((updater) => {
			if (typeof updater === "function") {
				return updater({ search: "a", page: 2, limit: 10 });
			}
			return updater;
		});

		render(
			<SearchUsers
				{...baseProps}
				filters={{ search: "a", page: 2, limit: 10 }}
				totalUsers={25}
				totalUserPages={3}
				users={[{ id: 1, username: "alex" }]}
				setFilters={setFilters}
			/>,
		);

		expect(screen.getByText("11-20 of 25")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		expect(setFilters).toHaveBeenCalledTimes(2);

		const prevUpdater = setFilters.mock.calls[0][0];
		const nextUpdater = setFilters.mock.calls[1][0];

		expect(prevUpdater({ search: "a", page: 2, limit: 10 })).toEqual({
			search: "a",
			page: 1,
			limit: 10,
		});

		expect(nextUpdater({ search: "a", page: 2, limit: 10 })).toEqual({
			search: "a",
			page: 3,
			limit: 10,
		});
	});

	test("pagination buttons disabled correctly", () => {
		render(
			<SearchUsers
				{...baseProps}
				filters={{ search: "a", page: 1, limit: 10 }}
				totalUsers={5}
				totalUserPages={1}
				users={[{ id: 1, username: "alex" }]}
			/>,
		);

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("user panel reflects selected user", () => {
		render(
			<SearchUsers {...baseProps} selectedUser={{ username: "alice" }} />,
		);

		expect(screen.getByTestId("user-panel")).toHaveTextContent("OPEN");
	});

	test("closes the user panel when onClose is triggered", () => {
		render(
			<SearchUsers {...baseProps} selectedUser={{ username: "alice" }} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "close-panel" }));

		expect(baseProps.setSelectedUser).toHaveBeenCalledWith(null);
	});
});
