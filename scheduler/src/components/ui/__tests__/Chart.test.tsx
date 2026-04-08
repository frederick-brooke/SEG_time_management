import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
	ChartContainer,
	ChartTooltipContent,
	ChartLegendContent,
	ChartStyle,
	type ChartConfig,
} from "@/components/ui/Chart";
import * as ChartModule from "@/components/ui/Chart";

// Mocks

jest.mock("recharts", () => {
	const actual = jest.requireActual("recharts");
	return {
		...actual,
		ResponsiveContainer: ({
			children,
		}: {
			children: React.ReactElement;
		}) => <div data-testid="responsive-container">{children}</div>,
		Tooltip: () => <div data-testid="recharts-tooltip" />,
		Legend: () => <div data-testid="recharts-legend" />,
	};
});

jest.mock("lib/utils", () => ({
	cn: (
		...classes: (
			| string
			| undefined
			| null
			| false
			| Record<string, boolean>
		)[]
	) =>
		classes
			.flatMap((item) => {
				if (!item) return [];
				if (typeof item === "string") return [item];
				return Object.entries(item)
					.filter(([, value]) => value)
					.map(([key]) => key);
			})
			.join(" "),
}));

// Shared fixtures

const MockIcon = () => <svg data-testid="mock-icon" />;

const baseConfig: ChartConfig = {
	revenue: { label: "Revenue", color: "#4f46e5" },
	expenses: { label: "Expenses", color: "#e11d48" },
};

const iconConfig: ChartConfig = {
	revenue: { label: "Revenue", color: "#4f46e5", icon: MockIcon },
	expenses: { label: "Expenses", color: "#e11d48" },
};

const MinimalChart = () => <div data-testid="inner-chart" />;

// Helpers

function renderTooltip(
	props: React.ComponentProps<typeof ChartTooltipContent>,
	config: ChartConfig = baseConfig,
) {
	return render(
		<ChartContainer config={config}>
			<React.Fragment>
				<ChartTooltipContent {...props} />
			</React.Fragment>
		</ChartContainer>,
	);
}

function renderLegend(
	props: React.ComponentProps<typeof ChartLegendContent>,
	config: ChartConfig = baseConfig,
) {
	return render(
		<ChartContainer config={config}>
			<React.Fragment>
				<ChartLegendContent {...props} />
			</React.Fragment>
		</ChartContainer>,
	);
}

const samplePayload = [
	{
		name: "revenue",
		dataKey: "revenue",
		value: 4200,
		color: "#4f46e5",
		payload: { fill: "#4f46e5" },
	},
];

const legendPayload = [
	{ value: "revenue", dataKey: "revenue", color: "#4f46e5" },
	{ value: "expenses", dataKey: "expenses", color: "#e11d48" },
];

// ChartContainer

describe("ChartContainer", () => {
	it("renders children inside a ResponsiveContainer", () => {
		render(
			<ChartContainer config={baseConfig}>
				<MinimalChart />
			</ChartContainer>,
		);

		expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
		expect(screen.getByTestId("inner-chart")).toBeInTheDocument();
	});

	it("renders the wrapping div with data-slot='chart'", () => {
		const { container } = render(
			<ChartContainer config={baseConfig}>
				<MinimalChart />
			</ChartContainer>,
		);

		expect(
			container.querySelector("[data-slot='chart']"),
		).toBeInTheDocument();
	});

	it("applies a custom className to the wrapper div", () => {
		const { container } = render(
			<ChartContainer config={baseConfig} className="my-custom-class">
				<MinimalChart />
			</ChartContainer>,
		);

		expect(container.querySelector("[data-slot='chart']")).toHaveClass(
			"my-custom-class",
		);
	});

	it("sets a deterministic data-chart id when an explicit id prop is supplied", () => {
		const { container } = render(
			<ChartContainer config={baseConfig} id="test-id">
				<MinimalChart />
			</ChartContainer>,
		);

		expect(
			container.querySelector("[data-chart='chart-test-id']"),
		).toBeInTheDocument();
	});

	it("throws when useChart is used outside ChartContainer", () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});

		const BadComponent = () => <ChartTooltipContent active payload={[]} />;

		expect(() => render(<BadComponent />)).toThrow(
			"useChart must be used within a <ChartContainer />",
		);

		spy.mockRestore();
	});
});

// ChartStyle

describe("ChartStyle", () => {
	it("renders a <style> tag containing CSS custom properties", () => {
		const { container } = render(
			<ChartStyle id="chart-abc" config={baseConfig} />,
		);
		const styleEl = container.querySelector("style");

		expect(styleEl).toBeInTheDocument();
		expect(styleEl!.innerHTML).toContain("--color-revenue: #4f46e5");
		expect(styleEl!.innerHTML).toContain("--color-expenses: #e11d48");
	});

	it("returns null when config has no color or theme entries", () => {
		const emptyConfig: ChartConfig = {
			revenue: { label: "Revenue" },
		};

		const { container } = render(
			<ChartStyle id="chart-abc" config={emptyConfig} />,
		);

		expect(container.querySelector("style")).not.toBeInTheDocument();
	});

	it("scopes generated CSS to the supplied chart id", () => {
		const { container } = render(
			<ChartStyle id="chart-xyz" config={baseConfig} />,
		);
		const styleEl = container.querySelector("style");

		expect(styleEl!.innerHTML).toContain("[data-chart=chart-xyz]");
	});

	it("generates both light and dark theme blocks", () => {
		const themedConfig: ChartConfig = {
			revenue: {
				label: "Revenue",
				theme: { light: "#4f46e5", dark: "#818cf8" },
			},
		};

		const { container } = render(
			<ChartStyle id="chart-themed" config={themedConfig} />,
		);
		const styleEl = container.querySelector("style");

		expect(styleEl!.innerHTML).toContain("#4f46e5");
		expect(styleEl!.innerHTML).toContain("#818cf8");
		expect(styleEl!.innerHTML).toContain(".dark");
	});

	it("falls back to color when a theme value is missing for a mode", () => {
		const mixedConfig: ChartConfig = {
			revenue: {
				label: "Revenue",
				color: "#111111",
				theme: { dark: "#222222" },
			},
		};

		const { container } = render(
			<ChartStyle id="chart-mixed" config={mixedConfig} />,
		);
		const styleEl = container.querySelector("style");

		expect(styleEl).toBeInTheDocument();
		expect(styleEl!.innerHTML).toContain("--color-revenue: #111111");
		expect(styleEl!.innerHTML).toContain("--color-revenue: #222222");
	});
});

// ChartTooltipContent

describe("ChartTooltipContent", () => {
	it("renders nothing when active is false", () => {
		const { container } = renderTooltip({
			active: false,
			payload: samplePayload,
		});
		expect(container.querySelector(".grid")).not.toBeInTheDocument();
	});

	it("renders nothing when payload is empty", () => {
		const { container } = renderTooltip({ active: true, payload: [] });
		expect(container.querySelector(".grid")).not.toBeInTheDocument();
	});

	it("renders a value when active with a valid payload", () => {
		renderTooltip({ active: true, payload: samplePayload });
		expect(screen.getByText("4,200")).toBeInTheDocument();
	});

	it("renders the config label for a known key", () => {
		renderTooltip({ active: true, payload: samplePayload });
		expect(screen.getAllByText("Revenue").length).toBeGreaterThanOrEqual(1);
	});

	it("hides the label when hideLabel is true", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			label: "revenue",
			hideLabel: true,
		});

		expect(
			container.querySelector("div.font-medium"),
		).not.toBeInTheDocument();
	});

	it("uses a custom formatter when provided", () => {
		const formatter = jest.fn(() => (
			<span data-testid="custom">£4,200</span>
		));

		renderTooltip({
			active: true,
			payload: samplePayload,
			formatter,
		});

		expect(screen.getByTestId("custom")).toBeInTheDocument();
		expect(formatter).toHaveBeenCalled();
	});

	it("applies the indicator dot by default", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
		});

		expect(
			container.querySelector(".shrink-0[style*='--color-bg']"),
		).toBeInTheDocument();
	});

	it("renders a line indicator", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			indicator: "line",
		});

		expect(container.querySelector(".w-1")).toBeInTheDocument();
	});

	it("renders a dashed indicator", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			indicator: "dashed",
		});

		expect(container.querySelector(".border-dashed")).toBeInTheDocument();
	});

	it("does not render the indicator when hideIndicator is true", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			hideIndicator: true,
		});

		expect(
			container.querySelector(".shrink-0[style*='--color-bg']"),
		).not.toBeInTheDocument();
	});

	it("renders the custom icon instead of the indicator when config provides one", () => {
		renderTooltip(
			{
				active: true,
				payload: samplePayload,
			},
			iconConfig,
		);

		expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
	});

	it("uses labelFormatter when provided", () => {
		const labelFormatter = jest.fn((value) => `Label: ${value}`);

		renderTooltip({
			active: true,
			payload: samplePayload,
			label: "revenue",
			labelFormatter,
		});

		expect(screen.getByText("Label: Revenue")).toBeInTheDocument();
		expect(labelFormatter).toHaveBeenCalled();
	});

	it("uses labelKey to resolve label from nested payload data", () => {
		const nestedPayload = [
			{
				name: "anything",
				dataKey: "anything",
				value: 500,
				color: "#4f46e5",
				payload: {
					fill: "#4f46e5",
					customLabel: "expenses",
				},
			},
		];

		renderTooltip({
			active: true,
			payload: nestedPayload,
			labelKey: "customLabel",
		});

		expect(screen.getByText("Expenses")).toBeInTheDocument();
	});

	it("renders nested label layout when there is one payload item and indicator is not dot", () => {
		renderTooltip({
			active: true,
			payload: samplePayload,
			indicator: "line",
			label: "revenue",
		});

		expect(screen.getAllByText("Revenue").length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("4,200")).toBeInTheDocument();
	});

	it("uses explicit color prop over payload colors", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			color: "#123456",
		});

		const indicator = container.querySelector(
			".shrink-0[style*='--color-bg']",
		) as HTMLElement;
		expect(indicator.getAttribute("style")).toContain(
			"--color-bg: #123456",
		);
	});

	it("uses nameKey to resolve config lookup", () => {
		const payloadWithAlias = [
			{
				name: "ignored",
				dataKey: "ignored",
				value: 100,
				color: "#4f46e5",
				payload: { fill: "#4f46e5", metric: "expenses" },
				metric: "expenses",
			},
		];

		renderTooltip({
			active: true,
			payload: payloadWithAlias,
			nameKey: "metric",
		});

		expect(screen.getByText("Expenses")).toBeInTheDocument();
	});
});

// ChartLegendContent

describe("ChartLegendContent", () => {
	it("renders nothing when payload is empty", () => {
		const { container } = renderLegend({ payload: [] });
		const responsiveContainer = container.querySelector(
			"[data-testid='responsive-container']",
		);
		expect(responsiveContainer).toBeEmptyDOMElement();
	});

	it("renders a legend item for each payload entry", () => {
		renderLegend({ payload: legendPayload });

		expect(screen.getByText("Revenue")).toBeInTheDocument();
		expect(screen.getByText("Expenses")).toBeInTheDocument();
	});

	it("renders colour swatches with the correct background colour", () => {
		const { container } = renderLegend({ payload: legendPayload });
		const swatches = container.querySelectorAll(".h-2.w-2");

		expect(swatches.length).toBe(2);
		expect((swatches[0] as HTMLElement).style.backgroundColor).toBe(
			"rgb(79, 70, 229)",
		);
	});

	it("adds pt-3 class when verticalAlign is bottom (default)", () => {
		const { container } = renderLegend({ payload: legendPayload });
		const legendWrapper = container.querySelector(
			"[data-testid='responsive-container'] > div",
		) as HTMLElement;

		expect(legendWrapper.className).toContain("pt-3");
	});

	it("adds pb-3 class when verticalAlign is top", () => {
		const { container } = renderLegend({
			payload: legendPayload,
			verticalAlign: "top",
		});

		const legendWrapper = container.querySelector(
			"[data-testid='responsive-container'] > div",
		) as HTMLElement;

		expect(legendWrapper.className).toContain("pb-3");
	});

	it("renders icon instead of colour swatch when config provides one", () => {
		renderLegend({ payload: legendPayload }, iconConfig);
		expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
	});

	it("hides icon when hideIcon is true and falls back to colour swatch", () => {
		const { container } = renderLegend(
			{
				payload: legendPayload,
				hideIcon: true,
			},
			iconConfig,
		);

		expect(screen.queryByTestId("mock-icon")).not.toBeInTheDocument();
		expect(container.querySelector(".h-2.w-2")).toBeInTheDocument();
	});

	it("uses nameKey to resolve legend config", () => {
		const aliasLegendPayload = [
			{
				value: "something",
				dataKey: "something",
				color: "#4f46e5",
				metric: "expenses",
			},
		];

		renderLegend(
			{
				payload: aliasLegendPayload as any,
				nameKey: "metric",
			},
			baseConfig,
		);

		expect(screen.getByText("Expenses")).toBeInTheDocument();
	});

	it("does not render the numeric value span when item.value is 0", () => {
		const zeroPayload = [
			{
				name: "revenue",
				dataKey: "revenue",
				value: 0,
				color: "#4f46e5",
				payload: { fill: "#4f46e5" },
			},
		];

		const { container } = renderTooltip({
			active: true,
			payload: zeroPayload,
		});

		expect(
			container.querySelector(
				".text-foreground.font-mono.font-medium.tabular-nums",
			),
		).not.toBeInTheDocument();
	});

	it("renders a colour swatch when there is no matching config entry", () => {
		const unknownLegendPayload = [
			{ value: "other", dataKey: "other", color: "#123456" },
		];

		const { container } = renderLegend({ payload: unknownLegendPayload });

		const swatch = container.querySelector(".h-2.w-2") as HTMLElement;
		expect(swatch).toBeInTheDocument();
		expect(swatch.style.backgroundColor).toBe("rgb(18, 52, 86)");
	});

	it("renders a colour swatch when config exists but has no icon", () => {
		const { container } = renderLegend({
			payload: [
				{ value: "expenses", dataKey: "expenses", color: "#e11d48" },
			],
		});

		const swatch = container.querySelector(".h-2.w-2") as HTMLElement;
		expect(swatch).toBeInTheDocument();
		expect(swatch.style.backgroundColor).toBe("rgb(225, 29, 72)");
	});

	it("renders the configured legend icon for the matching item", () => {
		renderLegend(
			{
				payload: [
					{ value: "revenue", dataKey: "revenue", color: "#4f46e5" },
				],
			},
			iconConfig,
		);

		expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
	});

	it("renders the fallback swatch for an item without an icon config", () => {
		const { container } = renderLegend(
			{
				payload: [
					{
						value: "expenses",
						dataKey: "expenses",
						color: "#e11d48",
					},
				],
			},
			iconConfig,
		);

		expect(screen.queryByTestId("mock-icon")).not.toBeInTheDocument();

		const swatch = container.querySelector(".h-2.w-2") as HTMLElement;
		expect(swatch).toBeInTheDocument();
		expect(swatch.style.backgroundColor).toBe("rgb(225, 29, 72)");
	});

	describe("module exports", () => {
		it("exports all chart helpers", () => {
			expect(ChartModule.ChartContainer).toBeDefined();
			expect(ChartModule.ChartTooltip).toBeDefined();
			expect(ChartModule.ChartTooltipContent).toBeDefined();
			expect(ChartModule.ChartLegend).toBeDefined();
			expect(ChartModule.ChartLegendContent).toBeDefined();
			expect(ChartModule.ChartStyle).toBeDefined();
		});
	});

	it("falls back to default rendering when formatter is provided but item.name is missing", () => {
		const formatter = jest.fn(() => (
			<span data-testid="custom">formatted</span>
		));

		const payloadWithoutName = [
			{
				dataKey: "revenue",
				value: 4200,
				color: "#4f46e5",
				payload: { fill: "#4f46e5" },
			},
		];

		renderTooltip({
			active: true,
			payload: payloadWithoutName as any,
			formatter,
		});

		expect(formatter).not.toHaveBeenCalled();
		expect(screen.getByText("4,200")).toBeInTheDocument();
	});

	it("renders nested tooltip label with dashed indicator", () => {
		const { container } = renderTooltip({
			active: true,
			payload: samplePayload,
			indicator: "dashed",
			label: "revenue",
		});

		expect(screen.getAllByText("Revenue").length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("4,200")).toBeInTheDocument();
		expect(
			container.querySelector(".my-0\\.5") ||
				container.querySelector(".my-0.5"),
		).toBeTruthy();
	});

	it("falls back to item name when no matching config entry exists", () => {
		const unknownPayload = [
			{
				name: "Other Metric",
				dataKey: "otherMetric",
				value: 250,
				color: "#123456",
				payload: { fill: "#123456" },
			},
		];

		renderTooltip({
			active: true,
			payload: unknownPayload as any,
		});

		expect(screen.getByText("Other Metric")).toBeInTheDocument();
		expect(screen.getByText("250")).toBeInTheDocument();
	});

	it("uses the raw string label when the label is not found in config", () => {
		renderTooltip({
			active: true,
			payload: samplePayload,
			label: "Unknown Label",
		});

		expect(screen.getByText("Unknown Label")).toBeInTheDocument();
	});

	it("uses labelKey to resolve label from the top-level payload item", () => {
		const topLevelLabelPayload = [
			{
				name: "anything",
				dataKey: "anything",
				value: 500,
				color: "#4f46e5",
				customLabel: "expenses",
				payload: { fill: "#4f46e5" },
			},
		];

		renderTooltip({
			active: true,
			payload: topLevelLabelPayload as any,
			labelKey: "customLabel",
		});

		expect(screen.getByText("Expenses")).toBeInTheDocument();
	});

	it("skips CSS variable generation when a theme entry has no color for a mode", () => {
		const partialThemeConfig: ChartConfig = {
			revenue: {
				label: "Revenue",
				theme: { light: "#4f46e5" }, // no dark, no fallback color
			},
		};

		const { container } = render(
			<ChartStyle id="chart-partial" config={partialThemeConfig} />,
		);

		const styleEl = container.querySelector("style");
		expect(styleEl).toBeInTheDocument();
		expect(styleEl!.innerHTML).toContain("--color-revenue: #4f46e5");
		expect(styleEl!.innerHTML).toContain(".dark");
		expect(styleEl!.innerHTML).not.toContain("--color-revenue: undefined");
	});

	it("does not use string-label lookup when label is not a string and falls back to value key", () => {
		const valuePayload = [
			{
				value: 700,
				color: "#4f46e5",
				payload: { fill: "#4f46e5" },
			},
		];

		renderTooltip({
			active: true,
			payload: valuePayload as any,
			label: <span data-testid="jsx-label">JSX Label</span>,
		});

		expect(screen.getByText("700")).toBeInTheDocument();
	});

	it("renders tooltip item using dataKey, item.color, and index fallback paths", () => {
		const fallbackPayload = [
			{
				dataKey: "",
				name: "",
				value: 321,
				color: "#123456",
				payload: {},
			},
		];

		renderTooltip({
			active: true,
			payload: fallbackPayload as any,
		});

		expect(screen.getByText("321")).toBeInTheDocument();
	});

	it("uses the value fallback key in legend when dataKey is missing", () => {
		const valueOnlyLegendPayload = [
			{
				value: "revenue",
				color: "#4f46e5",
			},
		];

		renderLegend({ payload: valueOnlyLegendPayload as any }, baseConfig);

		expect(screen.getByText("Revenue")).toBeInTheDocument();
	});

	it("handles a non-object legend payload item by returning undefined config", () => {
		const { container } = renderLegend({
			payload: ["plain-string"] as any,
		});

		const wrapper = container.querySelector(
			"[data-testid='responsive-container'] > div",
		);
		expect(wrapper).toBeInTheDocument();
	});
});
