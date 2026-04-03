import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportFilter from "../ReportFilterPanel";

// ─── Types 

interface Filters {
  sortBy: string;
  order: string;
  startDate: string;
  endDate: string;
  status: string;
  page: number;
}

// ─── Shared helpers ─

const defaultFilters: Filters = {
  sortBy: "createdAt",
  order: "asc",
  startDate: "",
  endDate: "",
  status: "",
  page: 1,
};

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    filters: defaultFilters,
    setFilters: jest.fn(),
    onClose: jest.fn(),
    applyFilters: jest.fn(),
    resetFilters: jest.fn(),
    ...overrides,
  };
}

function renderFilter(overrides: Record<string, unknown> = {}) {
  const props = buildProps(overrides);
  const utils = render(<ReportFilter {...props} />);
  return { ...utils, props };
}

/** Pull the updater fn from the first setFilters call and run it against state. */
function runUpdater(
  setFilters: jest.Mock,
  state: Filters = defaultFilters
): Filters {
  const updater = setFilters.mock.calls[0][0] as (prev: Filters) => Filters;
  return updater(state);
}

/** Return all <input type="date"> elements currently in the document. */
function getDateInputs(): HTMLInputElement[] {
  return screen
    .getAllByDisplayValue(/.?/)
    .filter(
      (el): el is HTMLInputElement =>
        (el as HTMLInputElement).type === "date"
    );
}

// ─── Rendering ──────

describe("ReportFilter – rendering", () => {
  it("renders the Filters heading", () => {
    renderFilter();
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("renders Reset, Apply Filters, and Close buttons", () => {
    renderFilter();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^close$/i })
    ).toBeInTheDocument();
  });

  it("renders Sort By and Order selects", () => {
    renderFilter();
    expect(screen.getByDisplayValue("Date Created")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ascending")).toBeInTheDocument();
  });

  it("renders exactly two date inputs", () => {
    renderFilter();
    expect(getDateInputs()).toHaveLength(2);
  });

  it("renders all three status toggle buttons", () => {
    renderFilter();
    ["PENDING", "RESOLVED", "REJECTED"].forEach((stat) => {
      expect(screen.getByRole("button", { name: stat })).toBeInTheDocument();
    });
  });

  it("reflects pre-populated filter values", () => {
    renderFilter({
      filters: {
        ...defaultFilters,
        sortBy: "status",
        order: "desc",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    });
    expect(screen.getByDisplayValue("Status")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descending")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-12-31")).toBeInTheDocument();
  });
});

// ─── Sort By select ──

describe("ReportFilter – Sort By select", () => {
  it("supports all three sortBy options", () => {
    renderFilter();
    const select = screen.getByDisplayValue(
      "Date Created"
    ) as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["createdAt", "status", "id"]);
  });
});

// ─── Order select ────

describe("ReportFilter – Order select", () => {
  it("supports both asc and desc options", () => {
    renderFilter();
    const select = screen.getByDisplayValue("Ascending") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["asc", "desc"]);
  });
});

// ─── Status toggles ──
describe("ReportFilter – Status toggles", () => {
  it.each(["PENDING", "RESOLVED", "REJECTED"])(
    "selecting %s sets status to %s and resets page",
    (stat) => {
      const { props } = renderFilter();
      fireEvent.click(screen.getByRole("button", { name: stat }));

      const result = runUpdater(props.setFilters as jest.Mock, {
        ...defaultFilters,
        page: 3,
      });
      expect(result).toMatchObject({ status: stat, page: 1 });
    }
  );

  it("deselects an already-active status (toggles it off)", () => {
    const { props } = renderFilter({
      filters: { ...defaultFilters, status: "PENDING" },
    });
    fireEvent.click(screen.getByRole("button", { name: "PENDING" }));

    const result = runUpdater(props.setFilters as jest.Mock, {
      ...defaultFilters,
      status: "PENDING",
    });
    expect(result).toMatchObject({ status: "", page: 1 });
  });

  it("applies active styling to the currently selected status", () => {
    renderFilter({ filters: { ...defaultFilters, status: "RESOLVED" } });
    const btn = screen.getByRole("button", { name: "RESOLVED" });
    expect(btn.className).toMatch(/bg-blue-300/);
    expect(btn.className).toMatch(/text-gray-900/);
  });

  it("applies inactive styling to non-selected statuses", () => {
    renderFilter({ filters: { ...defaultFilters, status: "RESOLVED" } });
    const btn = screen.getByRole("button", { name: "PENDING" });
    expect(btn.className).toMatch(/bg-white\/5/);
  });
});

// ─── Action buttons ──

describe("ReportFilter – Action buttons", () => {
  it("calls applyFilters when Apply Filters is clicked", () => {
    const { props } = renderFilter();
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(props.applyFilters).toHaveBeenCalledTimes(1);
  });

  it("calls resetFilters when Reset is clicked", () => {
    const { props } = renderFilter();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(props.resetFilters).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close button is clicked", () => {
    const { props } = renderFilter();
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Backdrop / panel click behaviour ──

describe("ReportFilter – Backdrop interaction", () => {
  it("calls onClose when the backdrop overlay is clicked", () => {
    const { props } = renderFilter();
    const backdrop = screen
      .getByText("Filters")
      .closest(".fixed.inset-0") as HTMLElement;
    fireEvent.click(backdrop);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the panel", () => {
    const { props } = renderFilter();
    const panel = screen
      .getByText("Filters")
      .closest(".h-full.w-96") as HTMLElement;
    fireEvent.click(panel);
    expect(props.onClose).not.toHaveBeenCalled();
  });
});