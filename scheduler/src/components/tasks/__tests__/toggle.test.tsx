import React from "react";
import { render, screen } from "@testing-library/react";

// Mock Radix Toggle primitive so we don't rely on Radix internals
jest.mock("@radix-ui/react-toggle", () => {
	const React = require("react");
	return {
		__esModule: true,
		Root: ({
			children,
			...props
		}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
			<button type="button" data-testid="radix-toggle" {...props}>
				{children}
			</button>
		),
	};
});

// Import AFTER mocks
import { Toggle, toggleVariants } from "../../ui/toggle";

describe("components/ui/toggle", () => {
	it("renders Toggle with data-slot and merges className (also covers Toggle function)", () => {
		render(
			<Toggle className="my-toggle" aria-pressed={false}>
				Hello
			</Toggle>,
		);
		const el = screen.getByTestId("radix-toggle");
		expect(el).toHaveAttribute("data-slot", "toggle");
		expect(el).toHaveTextContent("Hello");
		expect(el.className).toMatch(/my-toggle/);
		expect(el.className).toMatch(/inline-flex/);
	});

	it("applies variant/size classes when provided", () => {
		render(
			<Toggle className="" variant="outline" size="lg">
				Outline Large
			</Toggle>,
		);
		const el = screen.getByTestId("radix-toggle");
		expect(el.className).toMatch(/border/);
		expect(el.className).toMatch(/h-10/);
	});

	it("toggleVariants uses defaults when called with no args (covers exported helper)", () => {
		const classes = toggleVariants();
		expect(classes).toMatch(/bg-transparent/);
		expect(classes).toMatch(/h-9/);
		expect(classes).toMatch(/inline-flex/);
	});
});
