import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupsPageClient from "@/app/(pages)/groups/GroupsPageClient";

//mocks

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
}));

jest.mock("@/components/groups/GroupCard", () => ({
  GroupCard: ({ group }: any) => <div data-testid="group-card">{group.name}</div>,
}));

// We updated the mock to expose the onSuccess callback so we can test it!
jest.mock("@/components/groups/CreateGroup", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close Create</button>
      <button onClick={onSuccess}>Trigger Success</button>
    </div>
  ),
}));

// Mock Lucide icons to easily click the pagination chevrons
jest.mock("lucide-react", () => ({
  Plus: () => <svg data-testid="plus-icon" />,
  ArrowUpDown: () => <svg data-testid="sort-icon" />,
  ChevronLeft: () => <svg data-testid="chevron-left" />,
  ChevronRight: () => <svg data-testid="chevron-right" />,
}));

//helpers

/**
 * Helper to generate a standardized mock group object for testing.
 * @param {object} overrides - Specific properties to override in the default mock group.
 * @return {object} A complete mock group object.
 */
const makeGroup = (overrides = {}) => ({
  id: "grp1",
  name: "Study Squad",
  description: "A group",
  memberCount: 3,
  userRole: "MEMBER",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  creator: { username: "alice", fname: "Alice", lname: "Smith" },
  ...overrides,
});

//tests

describe("GroupsPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page header", () => {
    render(<GroupsPageClient groups={[]} />);
    expect(screen.getByText("My Groups")).toBeInTheDocument();
  });

  it("renders empty state when no groups", () => {
    render(<GroupsPageClient groups={[]} />);
    expect(screen.getByText("No groups yet")).toBeInTheDocument();
  });

  it("renders group cards when groups exist", () => {
    render(<GroupsPageClient groups={[makeGroup(), makeGroup({ id: "grp2", name: "Project Team" })]} />);
    expect(screen.getByText("Study Squad")).toBeInTheDocument();
    expect(screen.getByText("Project Team")).toBeInTheDocument();
  });

  it("shows group count", () => {
    render(<GroupsPageClient groups={[makeGroup(), makeGroup({ id: "grp2", name: "Project Team" })]} />);
    expect(screen.getByText(/2 groups/)).toBeInTheDocument();
  });

  // --- Modal Tests ---

  it("opens the create group modal", () => {
    render(<GroupsPageClient groups={[makeGroup()]} />);
    fireEvent.click(screen.getByText("Create Group"));
    expect(screen.getByTestId("create-modal")).toBeInTheDocument();
  });

  it("closes the create group modal", () => {
    render(<GroupsPageClient groups={[makeGroup()]} />);
    fireEvent.click(screen.getByText("Create Group"));
    fireEvent.click(screen.getByText("Close Create"));
    expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
  });

  it("refreshes the page when a group is successfully created", () => {
    render(<GroupsPageClient groups={[makeGroup()]} />);
    fireEvent.click(screen.getByText("Create Group"));
    fireEvent.click(screen.getByText("Trigger Success"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  // --- Sorting Tests ---

  it("sorts A to Z correctly", () => {
    const groups = [
      makeGroup({ id: "1", name: "Zebra Group" }),
      makeGroup({ id: "2", name: "Alpha Group" }),
    ];
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name A → Z"));
    const cards = screen.getAllByTestId("group-card");
    expect(cards[0]).toHaveTextContent("Alpha Group");
  });

  it("sorts Z to A correctly", () => {
    const groups = [
      makeGroup({ id: "1", name: "Alpha Group" }),
      makeGroup({ id: "2", name: "Zebra Group" }),
    ];
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name Z → A"));
    const cards = screen.getAllByTestId("group-card");
    expect(cards[0]).toHaveTextContent("Zebra Group");
  });

  it("sorts by most members correctly", () => {
    const groups = [
      makeGroup({ id: "1", name: "Small", memberCount: 2 }),
      makeGroup({ id: "2", name: "Large", memberCount: 20 }),
    ];
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Most members"));
    const cards = screen.getAllByTestId("group-card");
    expect(cards[0]).toHaveTextContent("Large");
  });

  it("sorts by fewest members correctly", () => {
    const groups = [
      makeGroup({ id: "1", name: "Large", memberCount: 20 }),
      makeGroup({ id: "2", name: "Small", memberCount: 2 }),
    ];
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Fewest members"));
    const cards = screen.getAllByTestId("group-card");
    expect(cards[0]).toHaveTextContent("Small");
  });

  it("sorts by oldest first correctly", () => {
    const groups = [
      makeGroup({ id: "1", name: "New", createdAt: new Date("2026-05-01") }),
      makeGroup({ id: "2", name: "Old", createdAt: new Date("2025-01-01") }),
    ];
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Oldest first"));
    const cards = screen.getAllByTestId("group-card");
    expect(cards[0]).toHaveTextContent("Old");
  });

  // --- Pagination Tests ---

  it("does not show pagination for 10 or fewer groups", () => {
    const groups = Array.from({ length: 5 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows only 10 cards on first page", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    expect(screen.getAllByTestId("group-card")).toHaveLength(10);
  });

  it("navigates to page 2 and shows remaining cards using numbered buttons", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("group-card")).toHaveLength(2);
  });

  it("navigates pages using Chevron Prev/Next buttons and disables them appropriately", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    
    // Find the chevron buttons by getting their parent buttons
    const prevButton = screen.getByTestId("chevron-left").closest("button")!;
    const nextButton = screen.getByTestId("chevron-right").closest("button")!;

    // On page 1, Prev should be disabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Click Next to go to Page 2
    fireEvent.click(nextButton);
    expect(screen.getAllByTestId("group-card")).toHaveLength(2);

    // On Page 2 (last page), Next should be disabled
    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();

    // Click Prev to go back to Page 1
    fireEvent.click(prevButton);
    expect(screen.getAllByTestId("group-card")).toHaveLength(10);
  });

  it("resets to page 1 when sort changes", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("group-card")).toHaveLength(2);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name A → Z"));
    expect(screen.getAllByTestId("group-card")).toHaveLength(10);
  });
});