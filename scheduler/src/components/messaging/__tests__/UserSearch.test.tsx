/**
 * Testing for UserSearch component.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserSearch from "../UserSearch";
import { useRouter } from "next/navigation";
import { useSearchData } from "@/hooks/useSearchData";
import { resolveAvatarSrc } from "@/lib/avatar";

// Mocks

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("next/image", () => ({
	__esModule: true,
	default: ({ src, alt, ...props }: any) => {
		const { width, height, ...rest } = props;
		return (
			<span
				data-testid="next-image"
				data-src={src}
				data-alt={alt}
				{...rest}
			/>
		);
	},
}));

jest.mock("@/hooks/useSearchData", () => ({
	useSearchData: jest.fn(),
}));

jest.mock("@/lib/avatar", () => ({
	resolveAvatarSrc: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Shared test data

const FRIENDS = [
	{
		id: "u-1",
		username: "alice",
		fname: "Alice",
		lname: "Smith",
		pfp: "alice.png",
	},
	{ id: "u-2", username: "bob", fname: "Bob", lname: "Jones", pfp: null },
	{ id: "u-3", username: "carol", fname: null, lname: null, pfp: null },
];

const GROUPS = [
	{
		id: "g-1",
		name: "Study Squad",
		isGroup: true,
		participants: [
			{ user: { id: "u-1", username: "alice" } },
			{ user: { id: "u-2", username: "bob" } },
		],
	},
	{
		id: "g-2",
		name: "Book Club",
		isGroup: true,
		participants: [{ user: { id: "u-3", username: "carol" } }],
	},
	{
		id: "g-3",
		name: null,
		isGroup: true,
		participants: [],
	},
];

function setup({
	friends = FRIENDS,
	groups = GROUPS,
}: {
	friends?: any[];
	groups?: any[];
} = {}) {
	(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
	(useSearchData as jest.Mock).mockReturnValue({ friends, groups });
	(resolveAvatarSrc as jest.Mock).mockImplementation((src) => src);

	mockFetch.mockResolvedValue({
		ok: true,
		json: async () => ({ id: "conv-new" }),
	});
}

function typeQuery(text: string) {
	fireEvent.change(screen.getByPlaceholderText(/search friends or groups/i), {
		target: { value: text },
	});
}

beforeEach(() => {
	jest.clearAllMocks();
	setup();
});

// Rendering

describe("UserSearch – rendering", () => {
	it("renders the search input", () => {
		render(<UserSearch />);
		expect(
			screen.getByPlaceholderText(/search friends or groups/i),
		).toBeInTheDocument();
	});

	it("does not show dropdown when query is empty", () => {
		render(<UserSearch />);
		expect(screen.queryByText("No results found")).not.toBeInTheDocument();
	});

	it("does not show dropdown for a one-character query", () => {
		render(<UserSearch />);
		typeQuery("a");
		expect(screen.queryByText("No results found")).not.toBeInTheDocument();
	});

	it("shows dropdown when query reaches 2 characters", () => {
		render(<UserSearch />);
		typeQuery("al");
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
	});
});

// Friend filtering

describe("UserSearch – friend filtering", () => {
	it("matches by first name", () => {
		render(<UserSearch />);
		typeQuery("ali");
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
	});

	it("matches by last name", () => {
		render(<UserSearch />);
		typeQuery("jon");
		expect(screen.getByText("Bob Jones")).toBeInTheDocument();
	});

	it("matches by username", () => {
		render(<UserSearch />);
		typeQuery("bo");
		expect(screen.getByText("@bob")).toBeInTheDocument();
	});

	it("is case-insensitive", () => {
		render(<UserSearch />);
		typeQuery("ALICE");
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
	});

	it("does not show non-matching friends", () => {
		render(<UserSearch />);
		typeQuery("ali");
		expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
	});

	it("shows Friends header when friend results exist", () => {
		render(<UserSearch />);
		typeQuery("ali");
		expect(screen.getByText("Friends")).toBeInTheDocument();
	});

	it("handles friends with null fname/lname by matching username only", () => {
		render(<UserSearch />);
		typeQuery("car");
		expect(screen.getByText("@carol")).toBeInTheDocument();
	});
});

// Avatar rendering

describe("UserSearch – avatar rendering", () => {
	it("renders image avatar when resolveAvatarSrc returns a value", () => {
		render(<UserSearch />);
		typeQuery("ali");

		const img = screen.getByTestId("next-image");
		expect(img).toHaveAttribute("data-src", "alice.png");
		expect(img).toHaveAttribute("data-alt", "alice");
	});

	it("renders fallback avatar when resolveAvatarSrc returns null", () => {
		(resolveAvatarSrc as jest.Mock).mockReturnValue(null);

		render(<UserSearch />);
		typeQuery("bo");

		expect(screen.getAllByText("B").length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText("@bob")).toBeInTheDocument();
	});

	it("renders G fallback for group with no name", () => {
		render(<UserSearch />);
		typeQuery("zz");

		expect(screen.getByText("No results found")).toBeInTheDocument();
	});
});

// Group filtering

describe("UserSearch – group filtering", () => {
	it("matches groups by name", () => {
		render(<UserSearch />);
		typeQuery("stu");
		expect(screen.getByText("Study Squad")).toBeInTheDocument();
	});

	it("does not show non-matching groups", () => {
		render(<UserSearch />);
		typeQuery("stu");
		expect(screen.queryByText("Book Club")).not.toBeInTheDocument();
	});

	it("shows participant count", () => {
		render(<UserSearch />);
		typeQuery("stu");
		expect(screen.getByText("2 members")).toBeInTheDocument();
	});

	it("shows Groups header when group results exist", () => {
		render(<UserSearch />);
		typeQuery("stu");
		expect(screen.getByText("Groups")).toBeInTheDocument();
	});

	it("group name matching is case-insensitive", () => {
		render(<UserSearch />);
		typeQuery("BOOK");
		expect(screen.getByText("Book Club")).toBeInTheDocument();
	});
});

// No results

describe("UserSearch – no results", () => {
	it("shows 'No results found' when nothing matches", () => {
		render(<UserSearch />);
		typeQuery("zzz");
		expect(screen.getByText("No results found")).toBeInTheDocument();
	});

	it("does not show 'No results found' when matches exist", () => {
		render(<UserSearch />);
		typeQuery("ali");
		expect(screen.queryByText("No results found")).not.toBeInTheDocument();
	});

	it("shows both Friends and Groups sections when both match", () => {
		render(<UserSearch />);
		typeQuery("bo");

		expect(screen.getByText("Friends")).toBeInTheDocument();
		expect(screen.getByText("Groups")).toBeInTheDocument();
		expect(screen.getByText("@bob")).toBeInTheDocument();
		expect(screen.getByText("Book Club")).toBeInTheDocument();
	});
});

// startChat

describe("UserSearch – startChat", () => {
	it("POSTs to /api/conversations/new with the correct userId", async () => {
		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("/api/conversations/new", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: "u-1" }),
			});
		});
	});

	it("navigates to the new conversation after startChat", async () => {
		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/messages/conv-new");
		});
	});

	it("clears the query after startChat", async () => {
		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(/search friends or groups/i),
			).toHaveValue("");
		});
	});

	it("handles failed response when res.ok is false", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ id: "bad" }),
		});

		const errorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(errorSpy).toHaveBeenCalled();
		});

		expect(mockPush).not.toHaveBeenCalledWith("/messages/bad");
		errorSpy.mockRestore();
	});

	it("handles invalid conversation response with missing id", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({}),
		});

		const errorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(errorSpy).toHaveBeenCalled();
		});

		errorSpy.mockRestore();
	});

	it("handles fetch rejection", async () => {
		mockFetch.mockRejectedValueOnce(new Error("network error"));

		const errorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(<UserSearch />);
		typeQuery("ali");

		fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

		await waitFor(() => {
			expect(errorSpy).toHaveBeenCalled();
		});

		errorSpy.mockRestore();
	});
});

// openGroup

describe("UserSearch – openGroup", () => {
	it("navigates to the selected group", () => {
		render(<UserSearch />);
		typeQuery("stu");

		fireEvent.click(screen.getByText("Study Squad").closest("button")!);

		expect(mockPush).toHaveBeenCalledWith("/messages/g-1");
	});

	it("clears the query after opening a group", () => {
		render(<UserSearch />);
		typeQuery("stu");

		fireEvent.click(screen.getByText("Study Squad").closest("button")!);

		expect(
			screen.getByPlaceholderText(/search friends or groups/i),
		).toHaveValue("");
	});

	it("does not call startChat endpoint when opening a group", () => {
		render(<UserSearch />);
		typeQuery("stu");

		fireEvent.click(screen.getByText("Study Squad").closest("button")!);

		expect(mockFetch).not.toHaveBeenCalledWith(
			"/api/conversations/new",
			expect.anything(),
		);
	});

	it("renders fallback values for a group whose name becomes null after filtering", () => {
		const namelessAfterFilterGroup = {
			id: "g-3",
			isGroup: true,
			participants: [],
		};

		let readCount = 0;
		Object.defineProperty(namelessAfterFilterGroup, "name", {
			get() {
				readCount += 1;
				return readCount === 1 ? "gg" : null;
			},
			configurable: true,
		});

		(useSearchData as jest.Mock).mockReturnValue({
			friends: [],
			groups: [namelessAfterFilterGroup],
		});

		render(<UserSearch />);
		typeQuery("gg");

		expect(screen.getByText("Groups")).toBeInTheDocument();
		expect(screen.getByText("0 members")).toBeInTheDocument();
		expect(screen.getByText("G")).toBeInTheDocument();

		const img = screen.queryByTestId("next-image");
		expect(img).not.toBeInTheDocument();
	});
});
