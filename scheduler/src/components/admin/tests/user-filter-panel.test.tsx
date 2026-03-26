import { render, screen, fireEvent } from "@testing-library/react";
import UserFilter from "../user-filter-panel";

const baseFilters = {
  sortBy: "username",
  order: "asc",
  startDate: "",
  endDate: "",
  categories: [],
  page: 2,
};

describe("UserFilter", () => {
  const setFilters = jest.fn();
  const onClose = jest.fn();
  const applyFilters = jest.fn();
  const resetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (type = "admin") =>
    render(
      <UserFilter
        filters={baseFilters}
        setFilters={setFilters}
        onClose={onClose}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        type={type}
      />
    );


  test("clicking inside panel does not close", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Filters"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("reset button calls resetFilters", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Reset"));
    expect(resetFilters).toHaveBeenCalled();
  });

  test("sorting select updates sortBy and resets page", () => {
    renderComponent();
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "email" },
    });

    expect(setFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  test("order select updates order and resets page", () => {
    renderComponent();
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "desc" },
    });

    expect(setFilters).toHaveBeenCalledWith(expect.any(Function));
  });

  test("date inputs update filters (admin only)", () => {
    renderComponent("admin");

    const inputs = screen.getAllByDisplayValue("");
    fireEvent.change(inputs[0], { target: { value: "2024-01-01" } });
    fireEvent.change(inputs[1], { target: { value: "2024-01-10" } });

    expect(setFilters).toHaveBeenCalledTimes(2);
  });

  test("role toggle adds and removes category", () => {
    renderComponent("admin");

    const adminBtn = screen.getByText("Admin");
    fireEvent.click(adminBtn);

    expect(setFilters).toHaveBeenCalled();
  });

  test("apply button calls applyFilters", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Apply Filters"));
    expect(applyFilters).toHaveBeenCalled();
  });

  test("close button calls onClose", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  test("admin sections do NOT render for non-admin type", () => {
    renderComponent("user");

    expect(screen.queryByText("Creation Date")).not.toBeInTheDocument();
    expect(screen.queryByText("Roles")).not.toBeInTheDocument();
  });
});