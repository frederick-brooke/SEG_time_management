/**
 * Testing for Command components.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
} from "../Command";

jest.mock("cmdk", () => {
	const Command = ({ children, ...props }: any) => (
		<div data-testid="command" {...props}>
			{children}
		</div>
	);

	Command.Input = (props: any) => <input data-testid="input" {...props} />;
	Command.List = ({ children, ...props }: any) => (
		<div data-testid="list" {...props}>
			{children}
		</div>
	);
	Command.Empty = (props: any) => <div data-testid="empty" {...props} />;
	Command.Group = ({ children, ...props }: any) => (
		<div data-testid="group" {...props}>
			{children}
		</div>
	);
	Command.Separator = (props: any) => (
		<div data-testid="separator" {...props} />
	);
	Command.Item = ({ children, ...props }: any) => (
		<div data-testid="item" {...props}>
			{children}
		</div>
	);

	return { Command };
});

jest.mock("lucide-react", () => ({
	SearchIcon: (props: any) => <svg data-testid="search-icon" {...props} />,
}));

jest.mock("../Dialog", () => ({
	Dialog: ({ children, ...props }: any) => (
		<div data-testid="dialog" {...props}>
			{children}
		</div>
	),
	DialogContent: ({ children, ...props }: any) => (
		<div data-testid="dialog-content" {...props}>
			{children}
		</div>
	),
	DialogHeader: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
	DialogTitle: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
	DialogDescription: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
}));

describe("Command Components", () => {
	it("renders Command root", () => {
		render(<Command>Content</Command>);
		expect(screen.getByTestId("command")).toBeInTheDocument();
	});

	it("renders CommandDialog with default title and description", () => {
		render(<CommandDialog>Child</CommandDialog>);

		expect(screen.getByTestId("dialog")).toBeInTheDocument();
		expect(screen.getByText("Command Palette")).toBeInTheDocument();
		expect(
			screen.getByText("Search for a command to run..."),
		).toBeInTheDocument();
	});

	it("renders CommandDialog with custom title and description", () => {
		render(
			<CommandDialog
				title="Custom Title"
				description="Custom Description"
			>
				Child
			</CommandDialog>,
		);

		expect(screen.getByText("Custom Title")).toBeInTheDocument();
		expect(screen.getByText("Custom Description")).toBeInTheDocument();
	});

	it("renders CommandInput with icon", () => {
		render(<CommandInput />);
		expect(screen.getByTestId("input")).toBeInTheDocument();
		expect(screen.getByTestId("search-icon")).toBeInTheDocument();
	});

	it("renders CommandList", () => {
		render(<CommandList />);
		expect(screen.getByTestId("list")).toBeInTheDocument();
	});

	it("renders CommandEmpty", () => {
		render(<CommandEmpty />);
		expect(screen.getByTestId("empty")).toBeInTheDocument();
	});

	it("renders CommandGroup", () => {
		render(<CommandGroup>Group</CommandGroup>);
		expect(screen.getByTestId("group")).toBeInTheDocument();
	});

	it("renders CommandItem", () => {
		render(<CommandItem>Item</CommandItem>);
		expect(screen.getByTestId("item")).toBeInTheDocument();
	});

	it("renders CommandShortcut", () => {
		render(<CommandShortcut>⌘K</CommandShortcut>);
		expect(screen.getByText("⌘K")).toBeInTheDocument();
	});

	it("renders CommandSeparator", () => {
		render(<CommandSeparator />);
		expect(screen.getByTestId("separator")).toBeInTheDocument();
	});
});
