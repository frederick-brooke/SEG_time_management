import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupsPageClient from "@/app/(pages)/groups/GroupsPageClient";

// mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/components/groups/GroupCard", () => ({
  GroupCard: ({ group }: any) => <div data-testid="group-card">{group.name}</div>,
}));

jest.mock("@/components/groups/CreateGroup", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close Create</button>
    </div>
  ),
}));

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

// tests
describe("GroupsPageClient", () => {
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
    expect(cards[1]).toHaveTextContent("Zebra Group");
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

  it("does not show pagination for 10 or fewer groups", () => {
    const groups = Array.from({ length: 5 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows page buttons when more than 10 groups", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  });

  it("shows only 10 cards on first page", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    expect(screen.getAllByTestId("group-card")).toHaveLength(10);
  });

  it("navigates to page 2 and shows remaining cards", () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      makeGroup({ id: `g${i}`, name: `Group ${i}` })
    );
    render(<GroupsPageClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("group-card")).toHaveLength(2);
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
