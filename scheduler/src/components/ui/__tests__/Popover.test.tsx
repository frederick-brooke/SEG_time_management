import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverAnchor,
	PopoverHeader,
	PopoverTitle,
	PopoverDescription,
} from "../Popover";

describe("Popover", () => {
	it("renders trigger and opens content on click", async () => {
		const user = userEvent.setup();

		render(
			<Popover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>Popover body</PopoverContent>
			</Popover>,
		);

		expect(screen.queryByText("Popover body")).not.toBeInTheDocument();

		await user.click(screen.getByText("Open"));

		expect(screen.getByText("Popover body")).toBeInTheDocument();
	});

	it("renders anchor", () => {
		render(
			<Popover>
				<PopoverAnchor data-testid="anchor" />
			</Popover>,
		);

		expect(screen.getByTestId("anchor")).toBeInTheDocument();
		expect(screen.getByTestId("anchor")).toHaveAttribute(
			"data-slot",
			"popover-anchor",
		);
	});

	it("renders content with default align and sideOffset", async () => {
		const user = userEvent.setup();

		render(
			<Popover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>Default content</PopoverContent>
			</Popover>,
		);

		await user.click(screen.getByText("Open"));

		const content = screen
			.getByText("Default content")
			.closest("[data-slot='popover-content']");
		expect(content).toBeInTheDocument();
	});

	it("applies custom className to content", async () => {
		const user = userEvent.setup();

		render(
			<Popover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent className="custom-popover-class">
					Styled content
				</PopoverContent>
			</Popover>,
		);

		await user.click(screen.getByText("Open"));

		const content = screen
			.getByText("Styled content")
			.closest("[data-slot='popover-content']");
		expect(content).toHaveClass("custom-popover-class");
	});

	it("renders header, title, and description", () => {
		render(
			<PopoverHeader className="header-class" data-testid="header">
				<PopoverTitle className="title-class">My Title</PopoverTitle>
				<PopoverDescription className="desc-class">
					My description
				</PopoverDescription>
			</PopoverHeader>,
		);

		const header = screen.getByTestId("header");
		const title = screen.getByText("My Title");
		const description = screen.getByText("My description");

		expect(header).toHaveAttribute("data-slot", "popover-header");
		expect(header).toHaveClass("header-class");

		expect(title).toHaveAttribute("data-slot", "popover-title");
		expect(title).toHaveClass("title-class");

		expect(description).toHaveAttribute("data-slot", "popover-description");
		expect(description).toHaveClass("desc-class");
	});
});
