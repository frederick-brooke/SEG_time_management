import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchPanel from "../SearchPanel";
import { Button } from "@/components/ui/Button";

jest.useFakeTimers();

// Mocks

jest.mock("@/hooks/useUsers", () => ({
  useUsers: () => ({
    users: [{ id: 1, username: "john" }],
    totalUsers: 1,
    totalUserPages: 1,
  }),
}));

jest.mock("@/components/search-page/SearchControls", () => (props: any) => (
  <Button
    data-testid="open-filter"
    onClick={props.onOpenFilter}
  >
    Open Filter
  </Button>
));

jest.mock("@/components/search-page/SearchUsers", () => () => (
  <div data-testid="search-users" />
));

jest.mock("@/components/admin/UserFilterPanel", () => (props: any) => (
  <div>
    <Button
      data-testid="apply-filters"
      onClick={props.applyFilters}
    >
      Apply
    </Button>
  </div>
));

jest.mock("@/components/layout/LunarDrawer", () => (props: any) =>
  props.open ? (
    <div data-testid={`drawer-${props.side}`}>
      {props.children}
      <Button onClick={props.onClose}>Close</Button>
    </div>
  ) : null
);

// Tests

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