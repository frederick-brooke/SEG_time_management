import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModuleCard } from "@/src/components/modules/ModuleCard";

// mocks
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

// constants
const baseModule = {
  id: "mod1",
  name: "CS101",
  description: "Intro to CS",
  memberCount: 10,
  maxMembers: 50,
  userRole: "MEMBER",
  creator: { username: "prof1", fname: "Prof", lname: "One" },
};

// tests
describe("ModuleCard Component", () => {
  /**
   * Verifies the primary heading of the card correctly displays the module name.
   */
  it("renders the module name", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
  });

  /**
   * Verifies the secondary text correctly displays the module description.
   */
  it("renders the module description", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.getByText("Intro to CS")).toBeInTheDocument();
  });

  /**
   * Verifies the member count and max capacity render correctly. Uses a regex
   * to bypass HTML whitespace formatting issues around the slash.
   */
  it("renders member count and max members", () => {
    render(<ModuleCard module={baseModule} />);
    // FIXED: Use regex to ignore whitespace formatting
    expect(screen.getByText(/10\s*\/\s*50/)).toBeInTheDocument();
  });

  /**
   * Verifies the creator's username is attributed correctly on the card.
   * Uses regex to bypass HTML whitespace formatting issues.
   */
  it("renders the creator username", () => {
    render(<ModuleCard module={baseModule} />);
    // FIXED: Use regex to ignore whitespace formatting
    expect(screen.getByText(/by @\s*prof1/)).toBeInTheDocument();
  });

  /**
   * Ensures the Next.js link wraps the card correctly and points to the
   * unique dynamic route for that specific module.
   */
  it("renders the View link pointing to the module page", () => {
    render(<ModuleCard module={baseModule} />);
    const link = screen.getByText("View");
    expect(link).toHaveAttribute("href", "/modules/mod1");
  });

  /**
   * Verifies that the special "OWNER" badge is conditionally rendered
   * when the current user's role matches.
   */
  it("shows OWNER badge when userRole is OWNER", () => {
    render(<ModuleCard module={{ ...baseModule, userRole: "OWNER" }} />);
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  /**
   * Verifies that standard members do not mistakenly see elevated permission badges.
   */
  it("does not show OWNER badge when userRole is MEMBER", () => {
    render(<ModuleCard module={baseModule} />);
    expect(screen.queryByText("OWNER")).not.toBeInTheDocument();
  });

  /**
   * Ensures the component degrades gracefully and doesn't throw errors
   * when rendering a module that lacks an optional description.
   */
  it("does not render description when none provided", () => {
    render(<ModuleCard module={{ ...baseModule, description: undefined }} />);
    expect(screen.queryByText("Intro to CS")).not.toBeInTheDocument();
  });
});