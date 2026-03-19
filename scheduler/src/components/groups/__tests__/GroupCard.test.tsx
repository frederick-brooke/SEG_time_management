import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GroupCard } from "@/components/groups/GroupCard";

// mocks
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

const baseGroup = {
  id: "grp1",
  name: "Study Squad",
  description: "Group for studying",
  memberCount: 4,
  userRole: "MEMBER",
  creator: { username: "alice", fname: "Alice", lname: "Smith" },
};

// tests
describe("GroupCard", () => {
  it("renders the group name", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("Study Squad")).toBeInTheDocument();
  });

  it("renders the group description", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("Group for studying")).toBeInTheDocument();
  });

  it("renders the member count", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("4 members")).toBeInTheDocument();
  });

  it("renders the creator username", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("by @alice")).toBeInTheDocument();
  });

  it("renders the View link pointing to the group page", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.getByText("View")).toHaveAttribute("href", "/groups/grp1");
  });

  it("shows Owner badge when userRole is OWNER", () => {
    render(<GroupCard group={{ ...baseGroup, userRole: "OWNER" }} />);
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("does not show Owner badge when userRole is MEMBER", () => {
    render(<GroupCard group={baseGroup} />);
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
  });

  it("does not render description when none provided", () => {
    render(<GroupCard group={{ ...baseGroup, description: null }} />);
    expect(screen.queryByText("Group for studying")).not.toBeInTheDocument();
  });

  it("renders singular member when count is 1", () => {
    render(<GroupCard group={{ ...baseGroup, memberCount: 1 }} />);
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });
});
