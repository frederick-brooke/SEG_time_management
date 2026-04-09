//tests for scheduler/src/components/groups/GroupCard.tsx

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GroupCard } from "@/components/groups/GroupCard";

// mocks
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock("lucide-react", () => ({
  Users: () => <svg data-testid="users-icon" />,
  Crown: () => <svg data-testid="crown-icon" />,
}));

const baseGroup = {
  id: "grp1",
  name: "Study Squad",
  description: "Group for studying",
  memberCount: 4,
  userRole: "MEMBER",
  creator: { username: "alice", fname: "Alice", lname: "Smith" },
};

describe("GroupCard", () => {
  /** Checks that the fundamental data binding for the title works. */
  it("renders the group name", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("Study Squad")).toBeInTheDocument();
  });

  /** Checks that the description string renders correctly. */
  it("renders the group description", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("Group for studying")).toBeInTheDocument();
  });

  /** Ensures the member count statistic is displayed. */
  it("renders the member count", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("4 members")).toBeInTheDocument();
  });

  /** Verifies the attribution text maps the creator's username properly. */
  it("renders the creator username", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("by @alice")).toBeInTheDocument();
  });

  /** Verifies that clicking the card routes to the correct dynamic URL. */
  it("renders the View link pointing to the group page", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("View")).toHaveAttribute("href", "/groups/grp1");
  });

  /** Tests conditional UI: Owners should see a special badge next to the name. */
  it("shows Owner badge when userRole is OWNER", () => {
    render(<GroupCard group={{ ...baseGroup, userRole: "OWNER" }} />);
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  /** Tests conditional UI: Regular members should NOT see the owner badge. */
  it("does not show Owner badge when userRole is MEMBER", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.queryByText("OWNER")).not.toBeInTheDocument();
  });

  /** Ensures the layout doesn't break or show empty elements if description is null. */
  it("does not render description when none provided", () => {
    render(<GroupCard group={{ ...baseGroup, description: null }} />);
    expect(screen.queryByText("Group for studying")).not.toBeInTheDocument();
  });

  /** Tests text pluralization logic (1 "member" vs 2 "members"). */
  it("renders singular member when count is 1", () => {
    render(<GroupCard group={{ ...baseGroup, memberCount: 1 }} />);
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });
});