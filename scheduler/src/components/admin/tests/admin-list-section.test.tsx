import { render, screen, fireEvent } from "@testing-library/react";
import AdminListSection from "../admin-list-section";
// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("lucide-react", () => ({
  FunnelXIcon: () => <svg data-testid="funnel-icon" />,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseFilters = { search: "", page: 1, limit: 12 };

const baseProps = {
  title: "Test Section",
  items: [],
  totalItems: 0,
  totalPages: 0,
  filters: baseFilters,
  setFilters: jest.fn(),
  onFilterOpen: jest.fn(),
  resetFilters: jest.fn(),
  renderItem: jest.fn((item) => <li key={item.id}>{item.name}</li>),
  renderPanel: jest.fn(() => <div data-testid="panel" />),
  itemLabel: "users",
};

const withItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

// ── Header ────────────────────────────────────────────────────────────────────

describe("header", () => {
  test("renders the section title", () => {
    render(<AdminListSection {...baseProps} />);
    expect(screen.getByText("Test Section")).toBeInTheDocument();
  });

  test("shows the Filter button when not searchable", () => {
    render(<AdminListSection {...baseProps} searchable={false} />);
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
  });

  test("calls onFilterOpen when Filter button is clicked", () => {
    render(<AdminListSection {...baseProps} searchable={false} />);
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    expect(baseProps.onFilterOpen).toHaveBeenCalledTimes(1);
  });

  test("hides the standalone Filter button when searchable", () => {
    render(<AdminListSection {...baseProps} searchable />);
    // The Filter button is inside the search form — header button should not exist separately
    const filterButtons = screen.getAllByRole("button", { name: /filter/i });
    // Only the one inside the search form should exist
    expect(filterButtons).toHaveLength(1);
  });
});

// ── Search bar ────────────────────────────────────────────────────────────────

describe("search bar (searchable=true)", () => {
  test("renders the search input with correct placeholder", () => {
    render(<AdminListSection {...baseProps} searchable />);
    expect(screen.getByPlaceholderText("Search users...")).toBeInTheDocument();
  });

  test("pre-populates input from filters.search", () => {
    render(<AdminListSection {...baseProps} searchable filters={{ ...baseFilters, search: "alice" }} />);
    expect(screen.getByDisplayValue("alice")).toBeInTheDocument();
  });

  test("updates input value on change", () => {
    render(<AdminListSection {...baseProps} searchable />);
    const input = screen.getByPlaceholderText("Search users...");
    fireEvent.change(input, { target: { value: "bob" } });
    expect(input).toHaveValue("bob");
  });

  test("calls setFilters with search term and resets page on submit", () => {
    render(<AdminListSection {...baseProps} searchable />);
    fireEvent.change(screen.getByPlaceholderText("Search users..."), { target: { value: "charlie" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(baseProps.setFilters).toHaveBeenCalledTimes(1);
    const updater = baseProps.setFilters.mock.calls[0][0];
    expect(updater(baseFilters)).toEqual({ ...baseFilters, search: "charlie", page: 1 });
  });

  test("calls onFilterOpen from within the search form", () => {
    render(<AdminListSection {...baseProps} searchable />);
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    expect(baseProps.onFilterOpen).toHaveBeenCalledTimes(1);
  });

  test("clears input and calls resetFilters on reset button click", () => {
    render(<AdminListSection {...baseProps} searchable filters={{ ...baseFilters, search: "dave" }} />);
    fireEvent.click(screen.getByTestId("funnel-icon").closest("button")!);
    expect(screen.getByPlaceholderText("Search users...")).toHaveValue("");
    expect(baseProps.resetFilters).toHaveBeenCalledTimes(1);
  });

  test("does not render the search bar when searchable is false", () => {
    render(<AdminListSection {...baseProps} searchable={false} />);
    expect(screen.queryByPlaceholderText("Search users...")).not.toBeInTheDocument();
  });
});

// ── List ──────────────────────────────────────────────────────────────────────

describe("list", () => {
  test("calls renderItem for each item", () => {
    const items = withItems(3);
    render(<AdminListSection {...baseProps} items={items} />);
    expect(baseProps.renderItem).toHaveBeenCalledTimes(3);
  });

  test("renders all items in the list", () => {
    const items = withItems(3);
    render(<AdminListSection {...baseProps} items={items} />);
    items.forEach((item) => expect(screen.getByText(item.name)).toBeInTheDocument());
  });
});

// ── Count ─────────────────────────────────────────────────────────────────────

describe("count line", () => {
  test("shows 'No users found' when items is empty", () => {
    render(<AdminListSection {...baseProps} />);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  test("shows correct range when items are present", () => {
    render(<AdminListSection {...baseProps} items={withItems(5)} totalItems={20} filters={{ ...baseFilters, page: 2, limit: 5 }} />);
    expect(screen.getByText("6–10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  test("shows range starting at 1 on first page", () => {
    render(<AdminListSection {...baseProps} items={withItems(3)} totalItems={3} />);
    expect(screen.getByText("1–3")).toBeInTheDocument();
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────

describe("pagination", () => {
  test("does not render pagination when totalPages is 0", () => {
    render(<AdminListSection {...baseProps} totalPages={0} />);
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
  });

  test("renders pagination when totalPages >= 1", () => {
    render(<AdminListSection {...baseProps} totalPages={3} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  test("disables Previous on the first page", () => {
    render(<AdminListSection {...baseProps} totalPages={3} filters={{ ...baseFilters, page: 1 }} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  test("disables Next on the last page", () => {
    render(<AdminListSection {...baseProps} totalPages={3} filters={{ ...baseFilters, page: 3 }} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  test("calls setFilters with page - 1 when Previous is clicked", () => {
    render(<AdminListSection {...baseProps} totalPages={3} filters={{ ...baseFilters, page: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    const updater = baseProps.setFilters.mock.calls[0][0];
    expect(updater({ page: 2 })).toMatchObject({ page: 1 });
  });

  test("calls setFilters with page + 1 when Next is clicked", () => {
    render(<AdminListSection {...baseProps} totalPages={3} filters={{ ...baseFilters, page: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const updater = baseProps.setFilters.mock.calls[0][0];
    expect(updater({ page: 2 })).toMatchObject({ page: 3 });
  });

  test("shows correct page indicator", () => {
    render(<AdminListSection {...baseProps} totalPages={5} filters={{ ...baseFilters, page: 3 }} />);
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });
});

// ── Panel ─────────────────────────────────────────────────────────────────────

describe("detail panel", () => {
  test("always renders the panel returned by renderPanel", () => {
    render(<AdminListSection {...baseProps} />);
    expect(screen.getByTestId("panel")).toBeInTheDocument();
    expect(baseProps.renderPanel).toHaveBeenCalledTimes(1);
  });
});