import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GlassCard from "../GlassCard";

describe("GlassCard", () => {
	it("renders its children", () => {
		render(
			<GlassCard>
				<span>hello glass</span>
			</GlassCard>,
		);

		expect(screen.getByText("hello glass")).toBeInTheDocument();
	});

	it("applies the default glass styling classes", () => {
		const { container } = render(
			<GlassCard>
				<span>content</span>
			</GlassCard>,
		);

		const outerDiv = container.firstChild as HTMLElement;

		expect(outerDiv).toHaveClass("relative");
		expect(outerDiv).toHaveClass("rounded-2xl");
		expect(outerDiv).toHaveClass("border");
		expect(outerDiv).toHaveClass("backdrop-blur-sm");
		expect(outerDiv).toHaveClass("transition-all");
		expect(outerDiv).toHaveClass("duration-500");
	});

	it("applies a custom className when provided", () => {
		const { container } = render(
			<GlassCard className="custom-card-class">
				<span>content</span>
			</GlassCard>,
		);

		const outerDiv = container.firstChild as HTMLElement;
		expect(outerDiv).toHaveClass("custom-card-class");
	});

	it("calls onClick when clicked", () => {
		const handleClick = jest.fn();

		const { container } = render(
			<GlassCard onClick={handleClick}>
				<span>click me</span>
			</GlassCard>,
		);

		const outerDiv = container.firstChild as HTMLElement;
		fireEvent.click(outerDiv);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("does not fail when onClick is not provided", () => {
		const { container } = render(
			<GlassCard>
				<span>no click handler</span>
			</GlassCard>,
		);

		const outerDiv = container.firstChild as HTMLElement;

		expect(() => fireEvent.click(outerDiv)).not.toThrow();
	});

	it("renders the glow layer and content wrapper", () => {
		const { container } = render(
			<GlassCard>
				<span>wrapped content</span>
			</GlassCard>,
		);

		const divs = container.querySelectorAll("div");

		expect(divs.length).toBe(3);

		expect(divs[1]).toHaveClass("absolute");
		expect(divs[1]).toHaveClass("inset-0");
		expect(divs[1]).toHaveClass("opacity-0");

		expect(divs[2]).toHaveClass("relative");
		expect(screen.getByText("wrapped content")).toBeInTheDocument();
	});
});
