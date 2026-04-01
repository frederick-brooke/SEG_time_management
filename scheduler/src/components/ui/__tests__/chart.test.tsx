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

// Mocks

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    Tooltip: () => <div data-testid="recharts-tooltip" />,
    Legend: () => <div data-testid="recharts-legend" />,
  };
});

jest.mock("lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

// Shared fixtures

const baseConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#4f46e5" },
  expenses: { label: "Expenses", color: "#e11d48" },
};

const MinimalChart = () => <div data-testid="inner-chart" />;

// ChartContainer

describe("ChartContainer", () => {
  it("renders children inside a ResponsiveContainer", () => {
    render(
      <ChartContainer config={baseConfig}>
        <MinimalChart />
      </ChartContainer>
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("inner-chart")).toBeInTheDocument();
  });

  it("renders the wrapping div with data-slot='chart'", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <MinimalChart />
      </ChartContainer>
    );
    const chartDiv = container.querySelector("[data-slot='chart']");
    expect(chartDiv).toBeInTheDocument();
  });

  it("applies a custom className to the wrapper div", () => {
    const { container } = render(
      <ChartContainer config={baseConfig} className="my-custom-class">
        <MinimalChart />
      </ChartContainer>
    );
    const chartDiv = container.querySelector("[data-slot='chart']");
    expect(chartDiv).toHaveClass("my-custom-class");
  });

  it("sets a deterministic data-chart id when an explicit id prop is supplied", () => {
    const { container } = render(
      <ChartContainer config={baseConfig} id="test-id">
        <MinimalChart />
      </ChartContainer>
    );
    const chartDiv = container.querySelector("[data-chart='chart-test-id']");
    expect(chartDiv).toBeInTheDocument();
  });

  it("throws when useChart is used outside ChartContainer", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const BadComponent = () => <ChartTooltipContent active payload={[]} />;

    expect(() => render(<BadComponent />)).toThrow(
      "useChart must be used within a <ChartContainer />"
    );

    spy.mockRestore();
  });
});

// ChartStyle

describe("ChartStyle", () => {
  it("renders a <style> tag containing CSS custom properties", () => {
    const { container } = render(
      <ChartStyle id="chart-abc" config={baseConfig} />
    );
    const styleEl = container.querySelector("style");
    expect(styleEl).toBeInTheDocument();
    expect(styleEl!.innerHTML).toContain("--color-revenue: #4f46e5");
    expect(styleEl!.innerHTML).toContain("--color-expenses: #e11d48");
  });

  it("returns null when config has no color or theme entries", () => {
    const emptyConfig: ChartConfig = {
      revenue: { label: "Revenue" }, // no color or theme
    };
    const { container } = render(
      <ChartStyle id="chart-abc" config={emptyConfig} />
    );
    expect(container.querySelector("style")).not.toBeInTheDocument();
  });

  it("scopes generated CSS to the supplied chart id", () => {
    const { container } = render(
      <ChartStyle id="chart-xyz" config={baseConfig} />
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
      <ChartStyle id="chart-themed" config={themedConfig} />
    );
    const styleEl = container.querySelector("style");
    expect(styleEl!.innerHTML).toContain("#4f46e5");
    expect(styleEl!.innerHTML).toContain("#818cf8");
    expect(styleEl!.innerHTML).toContain(".dark");
  });
});

// ChartTooltipContent

/**
 * Helper: render ChartTooltipContent inside a ChartContainer so that the
 * ChartContext is populated.
 */
function renderTooltip(props: React.ComponentProps<typeof ChartTooltipContent>) {
  return render(
    <ChartContainer config={baseConfig}>
      <React.Fragment>
        <ChartTooltipContent {...props} />
      </React.Fragment>
    </ChartContainer>
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

describe("ChartTooltipContent", () => {
  it("renders nothing when active is false", () => {
    const { container } = renderTooltip({ active: false, payload: samplePayload });
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
    const labels = screen.getAllByText("Revenue");
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels[0]).toBeInTheDocument();
  });

  it("hides the label when hideLabel is true", () => {
    const { container } = renderTooltip({
      active: true,
      payload: samplePayload,
      label: "revenue",
      hideLabel: true,
    });
    const labelDiv = container.querySelector("div.font-medium");
    expect(labelDiv).not.toBeInTheDocument();
  });

  it("uses a custom formatter when provided", () => {
    const formatter = jest.fn(() => <span data-testid="custom">£4,200</span>);
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

    const dot = container.querySelector(".shrink-0[style*='--color-bg']");
    expect(dot).toBeInTheDocument();
  });
});

// ChartLegendContent

const legendPayload = [
  { value: "revenue", dataKey: "revenue", color: "#4f46e5" },
  { value: "expenses", dataKey: "expenses", color: "#e11d48" },
];

function renderLegend(props: React.ComponentProps<typeof ChartLegendContent>) {
  return render(
    <ChartContainer config={baseConfig}>
      <React.Fragment>
        <ChartLegendContent {...props} />
      </React.Fragment>
    </ChartContainer>
  );
}

describe("ChartLegendContent", () => {
  it("renders nothing when payload is empty", () => {
    const { container } = renderLegend({ payload: [] });
    const responsiveContainer = container.querySelector(
      "[data-testid='responsive-container']"
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
      "rgb(79, 70, 229)"
    );
  });

  it("adds pt-3 class when verticalAlign is bottom (default)", () => {
    const { container } = renderLegend({ payload: legendPayload });
    const legendWrapper = container.querySelector(
      "[data-testid='responsive-container'] > div"
    ) as HTMLElement;
    expect(legendWrapper.className).toContain("pt-3");
  });

  it("adds pb-3 class when verticalAlign is top", () => {
    const { container } = renderLegend({
      payload: legendPayload,
      verticalAlign: "top",
    });
    const legendWrapper = container.querySelector(
      "[data-testid='responsive-container'] > div"
    ) as HTMLElement;
    expect(legendWrapper.className).toContain("pb-3");
  });
});
