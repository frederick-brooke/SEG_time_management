import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppealFilter from "../AppealFilterPanel";

const defaultFilters = {
  sortBy: "createdAt",
  order: "asc",
  startDate: "",
  endDate: "",
  status: "",
  page: 1,
};

/**
 * Renders AppealFilter with a setFilters mock that immediately invokes any
 * updater function it receives — while the synthetic event is still live and
 * e.target.value hasn't been reset by React's controlled-input reconciliation.
 *
 * capturedState always reflects the last state produced by setFilters so tests
 * can assert on it directly without having to re-invoke the stored updater.
 */
function setup(filterOverrides: Partial<typeof defaultFilters> = {}) {
  const initialFilters = { ...defaultFilters, ...filterOverrides };
  let capturedState = { ...initialFilters };

  const setFilters = jest.fn((updaterOrValue: any) => {
    capturedState =
      typeof updaterOrValue === "function"
        ? updaterOrValue(capturedState)
        : updaterOrValue;
  });

  const onClose = jest.fn();
  const applyFilters = jest.fn();
  const resetFilters = jest.fn();

  const utils = render(
    <AppealFilter
      filters={initialFilters}
      setFilters={setFilters}
      onClose={onClose}
      applyFilters={applyFilters}
      resetFilters={resetFilters}
    />
  );

  const getState = () => capturedState;

  return { ...utils, setFilters, onClose, applyFilters, resetFilters, getState };
}

// ─── Rendering ─────

describe("AppealFilter – rendering", () => {
  it("renders the filter panel heading", () => {
    setup();
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("renders the Reset button", () => {
    setup();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("renders the Apply Filters button", () => {
    setup();
    expect(screen.getByRole("button", { name: /apply filters/i })).toBeInTheDocument();
  });

  it("renders the Close button", () => {
    setup();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("renders sortBy select with default value", () => {
    setup();
    expect(screen.getByDisplayValue("Date Created")).toBeInTheDocument();
  });

  it("renders order select with default value", () => {
    setup();
    expect(screen.getByDisplayValue("Ascending")).toBeInTheDocument();
  });

  it("renders all three status buttons", () => {
    setup();
    ["PENDING", "APPROVED", "REJECTED"].forEach((s) =>
      expect(screen.getByRole("button", { name: s })).toBeInTheDocument()
    );
  });

  it("renders exactly two date inputs", () => {
    setup();
    expect(document.querySelectorAll('input[type="date"]')).toHaveLength(2);
  });

  it("reflects sortBy filter prop in select", () => {
    setup({ sortBy: "status" });
    expect(screen.getByDisplayValue("Status")).toBeInTheDocument();
  });

  it("reflects order filter prop in select", () => {
    setup({ order: "desc" });
    expect(screen.getByDisplayValue("Descending")).toBeInTheDocument();
  });

  it("reflects startDate filter prop in first date input", () => {
    setup({ startDate: "2024-01-01" });
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(inputs[0].value).toBe("2024-01-01");
  });

  it("reflects endDate filter prop in second date input", () => {
    setup({ endDate: "2024-12-31" });
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    expect(inputs[1].value).toBe("2024-12-31");
  });

  it("highlights the active status button", () => {
    setup({ status: "PENDING" });
    expect(screen.getByRole("button", { name: "PENDING" }).className).toMatch(
      /bg-blue-300/
    );
  });

  it("does not highlight inactive status buttons", () => {
    setup({ status: "PENDING" });
    expect(screen.getByRole("button", { name: "APPROVED" }).className).not.toMatch(
      /bg-blue-300/
    );
  });
});

// ─── Callbacks ─────

describe("AppealFilter – callbacks", () => {
  it("calls onClose when the backdrop is clicked", () => {
    const { onClose } = setup();
    fireEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when the inner panel is clicked", () => {
    const { onClose } = setup();
    fireEvent.click(document.querySelector(".h-full.w-96")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls resetFilters when Reset is clicked", () => {
    const { resetFilters } = setup();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(resetFilters).toHaveBeenCalledTimes(1);
  });

  it("calls applyFilters when Apply Filters is clicked", () => {
    const { applyFilters } = setup();
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(applyFilters).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close is clicked", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── setFilters interactions 
//
// KEY INSIGHT: the component's onChange handlers close over `e` (the synthetic
// event), NOT over `e.target.value`. By the time a test calls the stored updater
// function, React's controlled-input reconciliation may have already reset the
// DOM element's value back to the prop value — so e.target.value reads stale data.
//
// Fix: our setup() mock invokes the updater *immediately* (while the event is
// still live) and stores the produced state in `capturedState`. Tests assert on
// capturedState via getState() instead of re-invoking the stored updater.

describe("AppealFilter – setFilters interactions", () => {
  it("updates sortBy to 'id' when that option is selected", async () => {
    const { getState } = setup();
    await userEvent.selectOptions(screen.getByDisplayValue("Date Created"), "id");
    expect(getState()).toMatchObject({ sortBy: "id", page: 1 });
  });

  it("updates sortBy to 'status' when that option is selected", async () => {
    const { getState } = setup();
    await userEvent.selectOptions(screen.getByDisplayValue("Date Created"), "status");
    expect(getState()).toMatchObject({ sortBy: "status", page: 1 });
  });

  it("resets page to 1 when sortBy changes", async () => {
    const { getState } = setup({ page: 5 });
    await userEvent.selectOptions(screen.getByDisplayValue("Date Created"), "status");
    expect(getState().page).toBe(1);
  });

  it("updates order to 'desc' when that option is selected", async () => {
    const { getState } = setup();
    await userEvent.selectOptions(screen.getByDisplayValue("Ascending"), "desc");
    expect(getState()).toMatchObject({ order: "desc" });
  });

  it("updates order to 'asc' when that option is selected", async () => {
    const { getState } = setup({ order: "desc" });
    await userEvent.selectOptions(screen.getByDisplayValue("Descending"), "asc");
    expect(getState()).toMatchObject({ order: "asc" });
  });

  it("updates startDate when the first date input changes", () => {
    const { getState } = setup();
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: "2024-03-01" } });
    expect(getState()).toMatchObject({ startDate: "2024-03-01", page: 1 });
  });

  it("resets page to 1 when startDate changes", () => {
    const { getState } = setup({ page: 3 });
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: "2024-03-01" } });
    expect(getState().page).toBe(1);
  });

  it("updates endDate when the second date input changes", () => {
    const { getState } = setup();
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1], { target: { value: "2024-06-30" } });
    expect(getState()).toMatchObject({ endDate: "2024-06-30", page: 1 });
  });

  it("resets page to 1 when endDate changes", () => {
    const { getState } = setup({ page: 7 });
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1], { target: { value: "2024-06-30" } });
    expect(getState().page).toBe(1);
  });

  it("sets status to APPROVED when that button is clicked", () => {
    const { getState } = setup();
    fireEvent.click(screen.getByRole("button", { name: "APPROVED" }));
    expect(getState()).toMatchObject({ status: "APPROVED", page: 1 });
  });

  it("sets status to PENDING when that button is clicked", () => {
    const { getState } = setup();
    fireEvent.click(screen.getByRole("button", { name: "PENDING" }));
    expect(getState()).toMatchObject({ status: "PENDING", page: 1 });
  });

  it("sets status to REJECTED when that button is clicked", () => {
    const { getState } = setup();
    fireEvent.click(screen.getByRole("button", { name: "REJECTED" }));
    expect(getState()).toMatchObject({ status: "REJECTED", page: 1 });
  });

  it("clears status when the already-active status button is clicked (toggle off)", () => {
    const { getState } = setup({ status: "PENDING" });
    fireEvent.click(screen.getByRole("button", { name: "PENDING" }));
    expect(getState()).toMatchObject({ status: "", page: 1 });
  });

  it("resets page to 1 when status changes", () => {
    const { getState } = setup({ page: 4 });
    fireEvent.click(screen.getByRole("button", { name: "REJECTED" }));
    expect(getState().page).toBe(1);
  });
});

// ─── Preserved filter state ─

describe("AppealFilter – preserved filter state", () => {
  it("sortBy change preserves other filter fields", async () => {
    const { getState } = setup({ status: "PENDING", endDate: "2024-12-01" });
    await userEvent.selectOptions(screen.getByDisplayValue("Date Created"), "id");
    expect(getState().status).toBe("PENDING");
    expect(getState().endDate).toBe("2024-12-01");
  });

  it("order change preserves other filter fields", async () => {
    const { getState } = setup({ sortBy: "id", status: "APPROVED" });
    await userEvent.selectOptions(screen.getByDisplayValue("Ascending"), "desc");
    expect(getState().sortBy).toBe("id");
    expect(getState().status).toBe("APPROVED");
  });

  it("startDate change preserves other filter fields", () => {
    const { getState } = setup({ status: "REJECTED", sortBy: "id" });
    fireEvent.change(document.querySelectorAll('input[type="date"]')[0], {
      target: { value: "2024-01-15" },
    });
    expect(getState().status).toBe("REJECTED");
    expect(getState().sortBy).toBe("id");
  });

  it("endDate change preserves other filter fields", () => {
    const { getState } = setup({ status: "PENDING", order: "desc" });
    fireEvent.change(document.querySelectorAll('input[type="date"]')[1], {
      target: { value: "2024-09-01" },
    });
    expect(getState().status).toBe("PENDING");
    expect(getState().order).toBe("desc");
  });
});