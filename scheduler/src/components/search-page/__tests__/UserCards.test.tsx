/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolveAvatarSrc } from "@/lib/avatar";
import UserCard from "@/components/search-page/UserCards";

jest.mock("@/lib/avatar", () => ({
	resolveAvatarSrc: jest.fn(),
}));

jest.mock("@/components/ui/GlassCard", () => (props: any) => (
	<div data-testid="glass-card" onClick={props.onClick}>
		{props.children}
	</div>
));

jest.mock("@tabler/icons-react", () => ({
	IconX: () => <svg data-testid="icon-x" />,
}));

const mockedResolveAvatarSrc = resolveAvatarSrc as jest.MockedFunction<typeof resolveAvatarSrc>;

describe("UserCard", () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
		jest.clearAllMocks();
	});

	it("renders with avatar image", () => {
		mockedResolveAvatarSrc.mockReturnValue("avatar.png");

		render(
			<UserCard
				user={{ username: "testuser", pfp: "img.png" }}
				onClick={jest.fn()}
			/>
		);

		expect(screen.getByRole("img")).toBeInTheDocument();
		expect(screen.getByText("testuser")).toBeInTheDocument();
	});

	it("renders fallback initials when no avatar", () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		render(
			<UserCard
				user={{ username: "testuser", fname: "John", lname: "Doe" }}
				onClick={jest.fn()}
			/>
		);

		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("renders username fallback initial when no names", () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		render(
			<UserCard
				user={{ username: "alpha" }}
				onClick={jest.fn()}
			/>
		);

		expect(screen.getByText("a")).toBeInTheDocument();
	});

	it("renders full name when available", () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		render(
			<UserCard
				user={{ username: "testuser", fname: "John", lname: "Doe" }}
				onClick={jest.fn()}
			/>
		);

		expect(screen.getByText("John Doe")).toBeInTheDocument();
	});

	it("calls onClick when card is clicked", async () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		const onClick = jest.fn();

		render(
			<UserCard
				user={{ username: "testuser" }}
				onClick={onClick}
			/>
		);

		await user.click(screen.getByTestId("glass-card"));

		expect(onClick).toHaveBeenCalled();
	});

	it("renders remove button when onRemove exists", () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		render(
			<UserCard
				user={{ username: "testuser" }}
				onClick={jest.fn()}
				onRemove={jest.fn()}
			/>
		);

		expect(screen.getByTestId("icon-x")).toBeInTheDocument();
	});

	it("calls onRemove and stops propagation", async () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		const onClick = jest.fn();
		const onRemove = jest.fn();

		render(
			<UserCard
				user={{ username: "testuser" }}
				onClick={onClick}
				onRemove={onRemove}
			/>
		);

		await user.click(screen.getByTestId("icon-x"));

		expect(onRemove).toHaveBeenCalled();
		expect(onClick).not.toHaveBeenCalled();
	});

	it("does not render remove button when onRemove is not provided", () => {
		mockedResolveAvatarSrc.mockReturnValue("");

		render(
			<UserCard
				user={{ username: "testuser" }}
				onClick={jest.fn()}
			/>
		);

		expect(screen.queryByTestId("icon-x")).not.toBeInTheDocument();
	});
});