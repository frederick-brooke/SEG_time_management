import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModulesPageClient from "@/app/(pages)/modules/ModulesPageClient";

//mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/components/modules/ModuleCard", () => ({
  ModuleCard: ({ module }: any) => (
    <div data-testid="module-card">{module.name}</div>
  ),
}));

jest.mock("@/components/modules/CreateModule", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close Create</button>
    </div>
  ),
}));

jest.mock("@/components/modules/JoinModule", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="join-modal">
      <button onClick={onClose}>Close Join</button>
    </div>
  ),
}));

//constants
const makeModule = (overrides = {}) => ({
  id: "mod1",
  name: "CS101",
  description: "Intro to CS",
  memberCount: 5,
  maxMembers: 50,
  userRole: "MEMBER",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  creator: { username: "prof1", fname: "Prof", lname: "One" },
  ...overrides,
});

//tests
describe("ModulesPageClient", () => {
  it("renders the page header", () => {
    render(<ModulesPageClient modules={[]} />);
    expect(screen.getByText("My Modules")).toBeInTheDocument();
  });

  it("renders empty state when no modules", () => {
    render(<ModulesPageClient modules={[]} />);
    expect(screen.getByText("No modules yet")).toBeInTheDocument();
  });

  it("renders module cards when modules exist", () => {
    render(<ModulesPageClient modules={[makeModule(), makeModule({ id: "mod2", name: "MATH101" })]} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
    expect(screen.getByText("MATH101")).toBeInTheDocument();
  });

  it("shows module count", () => {
    render(<ModulesPageClient modules={[makeModule(), makeModule({ id: "mod2", name: "MATH101" })]} />);
    expect(screen.getByText(/2 modules/)).toBeInTheDocument();
  });

  it("opens the create module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Create Module"));
    expect(screen.getByTestId("create-modal")).toBeInTheDocument();
  });

  it("closes the create module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Create Module"));
    fireEvent.click(screen.getByText("Close Create"));
    expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
  });

  it("opens the join module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Join Module"));
    expect(screen.getByTestId("join-modal")).toBeInTheDocument();
  });

  it("closes the join module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Join Module"));
    fireEvent.click(screen.getByText("Close Join"));
    expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
  });

  it("sorts A to Z correctly", () => {
    const modules = [
      makeModule({ id: "1", name: "Zebra" }),
      makeModule({ id: "2", name: "Apple" }),
    ];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name A → Z"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Apple");
    expect(cards[1]).toHaveTextContent("Zebra");
  });

  it("sorts Z to A correctly", () => {
    const modules = [
      makeModule({ id: "1", name: "Apple" }),
      makeModule({ id: "2", name: "Zebra" }),
    ];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name Z → A"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Zebra");
  });

  it("sorts by most members correctly", () => {
    const modules = [
      makeModule({ id: "1", name: "Small", memberCount: 2 }),
      makeModule({ id: "2", name: "Large", memberCount: 40 }),
    ];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Most members"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Large");
  });

  it("sorts by fewest members correctly", () => {
    const modules = [
      makeModule({ id: "1", name: "Large", memberCount: 40 }),
      makeModule({ id: "2", name: "Small", memberCount: 2 }),
    ];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Fewest members"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Small");
  });

  it("does not show pagination for 10 or fewer modules", () => {
    const modules = Array.from({ length: 5 }, (_, i) =>
      makeModule({ id: `m${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={modules} />);
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows page buttons when more than 10 modules", () => {
    const modules = Array.from({ length: 12 }, (_, i) =>
      makeModule({ id: `m${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={modules} />);
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  });

  it("shows only 10 cards on first page", () => {
    const modules = Array.from({ length: 12 }, (_, i) =>
      makeModule({ id: `m${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={modules} />);
    expect(screen.getAllByTestId("module-card")).toHaveLength(10);
  });

  it("navigates to page 2 and shows remaining cards", () => {
    const modules = Array.from({ length: 12 }, (_, i) =>
      makeModule({ id: `m${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("module-card")).toHaveLength(2);
  });

  it("resets to page 1 when sort changes", () => {
    const modules = Array.from({ length: 12 }, (_, i) =>
      makeModule({ id: `m${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByTestId("module-card")).toHaveLength(2);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name A → Z"));
    expect(screen.getAllByTestId("module-card")).toHaveLength(10);
  });
});
