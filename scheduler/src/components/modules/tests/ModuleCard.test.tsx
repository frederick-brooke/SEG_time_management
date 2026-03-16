import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModuleCard } from "@/src/components/modules/ModuleCard";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseModule = {
  id: "mod1",
  name: "CS101",
  description: "Intro to CS",
  memberCount: 10,
  maxMembers: 50,
  userRole: "MEMBER",
  creator: { username: "prof1", fname: "Prof", lname: "One" },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ModuleCard", () => {
  it("renders the module name", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
  });

  it("renders the module description", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("Intro to CS")).toBeInTheDocument();
  });

  it("renders member count and max members", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("10/50")).toBeInTheDocument();
  });

  it("renders the creator username", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("by @prof1")).toBeInTheDocument();
  });

  it("renders the View link pointing to the module page", () => {
    render(<ModuleCard module={baseModule} />);
    const link = screen.getByText("View");
    expect(link).toHaveAttribute("href", "/modules/mod1");
  });

  it("shows OWNER badge when userRole is OWNER", () => {
    render(<ModuleCard module={{ ...baseModule, userRole: "OWNER" }} />);
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  it("does not show OWNER badge when userRole is MEMBER", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.queryByText("OWNER")).not.toBeInTheDocument();
  });

  it("does not render description when none provided", () => {
    render(<ModuleCard module={{ ...baseModule, description: undefined }} />);
    expect(screen.queryByText("Intro to CS")).not.toBeInTheDocument();
  });
});
