import { render, screen, fireEvent } from "@testing-library/react";
import SearchControls from "../search-controls";

jest.mock("@/components/ui/glassCard", () => (props: any) => (
  <div>{props.children}</div>
));

describe("SearchControls", () => {
  const setFilters = jest.fn();
  const resetFilters = jest.fn();
  const onOpenFilter = jest.fn();

  const renderComponent = (filters = { search: "" }) =>
    render(
      <SearchControls
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        onOpenFilter={onOpenFilter}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("typing updates filters and input value", () => {
    renderComponent();

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "alice" } });

    expect(input.value).toBe("alice");
    expect(setFilters).toHaveBeenCalled();
  });

  test("submit sets search and resets page", () => {
    renderComponent();

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "bob" } });

    fireEvent.submit(input.closest("form")!);

    const updater = setFilters.mock.calls.at(-1)[0];
    const result = updater({ search: "", page: 3 });

    expect(result.search).toBe("bob");
    expect(result.page).toBe(1);
  });

  test("filter button opens filter panel", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Filter"));
    expect(onOpenFilter).toHaveBeenCalled();
  });

  test("reset clears input and calls resetFilters", () => {
    renderComponent({ search: "initial" });

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "text" } });
    fireEvent.click(screen.getByText("Reset"));

    expect(input.value).toBe("");
    expect(resetFilters).toHaveBeenCalled();
  });
});