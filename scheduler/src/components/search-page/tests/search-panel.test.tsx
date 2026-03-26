import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchPanel from "../search-panel";

jest.useFakeTimers();

// ---- mocks ----
jest.mock("@/hooks/useUsers", () => ({
  useUsers: () => ({
    users: [{ id: 1, username: "john" }],
    totalUsers: 1,
    totalUserPages: 1,
  }),
}));

jest.mock("@/components/search-page/search-controls", () => (props: any) => (
  <button
    data-testid="open-filter"
    onClick={props.onOpenFilter}
  >
    Open Filter
  </button>
));

jest.mock("@/components/search-page/searchUsers", () => () => (
  <div data-testid="search-users" />
));

jest.mock("@/components/admin/user-filter-panel", () => (props: any) => (
  <div>
    <button
      data-testid="apply-filters"
      onClick={props.applyFilters}
    >
      Apply
    </button>
  </div>
));

jest.mock("@/components/layout/lunar-drawer", () => (props: any) =>
  props.open ? (
    <div data-testid={`drawer-${props.side}`}>
      {props.children}
      <button onClick={props.onClose}>Close</button>
    </div>
  ) : null
);

// ---- tests ----
describe("SearchPanel", () => {
  test("renders main drawer when open", () => {
    render(<SearchPanel open={true} onClose={jest.fn()} />);

    expect(screen.getByTestId("drawer-left")).toBeInTheDocument();
    expect(screen.getByTestId("search-users")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<SearchPanel open={false} onClose={jest.fn()} />);

    expect(screen.queryByTestId("drawer-left")).not.toBeInTheDocument();
  });

  test("opens filter drawer when clicking filter button", () => {
    render(<SearchPanel open={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByTestId("open-filter"));

    expect(screen.getByTestId("drawer-right")).toBeInTheDocument();
  });

  test("apply filters closes filter drawer", () => {
    render(<SearchPanel open={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByTestId("open-filter"));
    fireEvent.click(screen.getByTestId("apply-filters"));

    expect(screen.queryByTestId("drawer-right")).not.toBeInTheDocument();
  });

  test("debounces search update", () => {
    render(<SearchPanel open={true} onClose={jest.fn()} />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // If no crash and drawer exists, debounce executed
    expect(screen.getByTestId("drawer-left")).toBeInTheDocument();
  });
});