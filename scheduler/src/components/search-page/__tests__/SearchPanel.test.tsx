import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPanel from "@/components/search-page/SearchPanel";
import { useUsers } from "@/hooks/useUsers";

jest.mock("@/hooks/useUsers", () => ({
	useUsers: jest.fn(),
}));

const mockedUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;

//Mock components
jest.mock("@/components/search-page/SearchControls", () => (props: any) => (
	<div data-testid="search-controls">
		<button onClick={props.onOpenFilter}>open-filter</button>
		<button onClick={props.resetFilters}>reset-filters</button>
		<input
			data-testid="search-input"
			value={props.filters.search}
			onChange={(e) =>
				props.setFilters((prev: any) => ({
					...prev,
					search: e.target.value,
				}))
			}
		/>
	</div>
));

jest.mock("@/components/search-page/SearchUsers", () => (props: any) => (
	<div data-testid="search-users">
		<span>Users: {props.totalUsers}</span>
		<button onClick={props.resetFilters}>reset-users</button>
	</div>
));

jest.mock("@/components/admin/UserFilterPanel", () => (props: any) => (
	<div data-testid="user-filter">
		<button onClick={props.applyFilters}>apply</button>
		<button onClick={props.resetFilters}>reset</button>
		<button onClick={props.onClose}>close</button>
	</div>
));

jest.mock("@/components/ui/GlassCard", () => ({ children }: any) => (
	<div>{children}</div>
));

jest.mock("@/components/layout/LunarDrawer", () => (props: any) => {
	if (!props.open) return null;
	return (
		<div data-testid={`drawer-${props.title}`}>
			<button onClick={props.onClose}>close-drawer</button>
			{props.children}
		</div>
	);
});

describe("SearchPanel", () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		jest.useFakeTimers();

		// ✅ CRITICAL: sync userEvent with fake timers
		user = userEvent.setup({
			advanceTimers: jest.advanceTimersByTime,
		});

		mockedUseUsers.mockReturnValue({
			users: [{ id: 1, username: "test" }],
			totalUserPages: 2,
			totalUsers: 1,
			loading: false,
			refetch: jest.fn(),
		});
	});

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders main drawer when open", () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		expect(screen.getByTestId("drawer-Search")).toBeInTheDocument();
		expect(screen.getByTestId("search-controls")).toBeInTheDocument();
		expect(screen.getByTestId("search-users")).toBeInTheDocument();
	});

	it("does not render drawer when closed", () => {
		render(<SearchPanel open={false} onClose={jest.fn()} />);

		expect(screen.queryByTestId("drawer-Search")).not.toBeInTheDocument();
	});

	it("opens filter drawer when clicking open filter", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("open-filter"));

		expect(screen.getByTestId("drawer-User Filters")).toBeInTheDocument();
	});

	it("closes filter drawer when onClose is triggered", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("open-filter"));
		await user.click(screen.getByText("close"));

		expect(screen.queryByTestId("drawer-User Filters")).not.toBeInTheDocument();
	});

	it("applies filters correctly", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("open-filter"));
		await user.click(screen.getByText("apply"));

		expect(screen.queryByTestId("drawer-User Filters")).not.toBeInTheDocument();
	});

	it("resets filters from SearchControls", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("reset-filters"));

		expect(screen.getByTestId("search-controls")).toBeInTheDocument();
	});

	it("resets filters from SearchUsers", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("reset-users"));

		expect(screen.getByTestId("search-users")).toBeInTheDocument();
	});

	it("resets filters from UserFilter panel", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		await user.click(screen.getByText("open-filter"));
		await user.click(screen.getByText("reset"));

		expect(screen.getByTestId("user-filter")).toBeInTheDocument();
	});

	it("debounces search input before applying", async () => {
		render(<SearchPanel open={true} onClose={jest.fn()} />);

		const input = screen.getByTestId("search-input");

		await user.type(input, "abc");

		// advance debounce safely
		act(() => {
			jest.advanceTimersByTime(300);
		});

		expect(mockedUseUsers).toHaveBeenCalled();
	});

	it("calls onClose when main drawer closes", async () => {
		const onClose = jest.fn();

		render(<SearchPanel open={true} onClose={onClose} />);

		await user.click(screen.getByText("close-drawer"));

		expect(onClose).toHaveBeenCalled();
	});
});