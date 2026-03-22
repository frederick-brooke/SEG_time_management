import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModulesPageClient from "@/app/(pages)/modules/ModulesPageClient";

//mocks
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
}));

jest.mock("@/components/modules/ModuleCard", () => ({
  ModuleCard: ({ module }: any) => (
    <div data-testid="module-card">{module.name}</div>
  ),
}));

jest.mock("@/components/modules/CreateModule", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close Create</button>
      <button onClick={onSuccess}>Trigger Create Success</button>
    </div>
  ),
}));

jest.mock("@/components/modules/JoinModule", () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="join-modal">
      <button onClick={onClose}>Close Join</button>
      <button onClick={onSuccess}>Trigger Join Success</button>
    </div>
  ),
}));

jest.mock("lucide-react", () => ({
  Plus: () => <svg data-testid="plus-icon" />,
  LogIn: () => <svg data-testid="login-icon" />,
  ArrowUpDown: () => <svg data-testid="sort-icon" />,
  ChevronLeft: () => <svg data-testid="chevron-left" />,
  ChevronRight: () => <svg data-testid="chevron-right" />,
}));

//helpers

/**
 * Creates a mock module object for testing.
 * @param {object} overrides - Properties to override the default module data.
 * @return {object} The mock module data.
 */
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  // --- Modal Tests ---

  it("opens and closes the create module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Create Module"));
    expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Create"));
    expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
  });

  it("refreshes page when create is successful", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Create Module"));
    fireEvent.click(screen.getByText("Trigger Create Success"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the join module modal", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Join Module"));
    expect(screen.getByTestId("join-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Join"));
    expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
  });

  it("refreshes page when join is successful", () => {
    render(<ModulesPageClient modules={[makeModule()]} />);
    fireEvent.click(screen.getByText("Join Module"));
    fireEvent.click(screen.getByText("Trigger Join Success"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  // --- Sorting Tests ---

  it("sorts A to Z correctly", () => {
    const modules = [makeModule({ id: "1", name: "Zebra" }), makeModule({ id: "2", name: "Apple" })];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Name A → Z"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Apple");
  });

  it("sorts by oldest first correctly", () => {
    const modules = [
      makeModule({ id: "1", name: "New", createdAt: new Date("2026-05-01") }),
      makeModule({ id: "2", name: "Old", createdAt: new Date("2025-01-01") }),
    ];
    render(<ModulesPageClient modules={modules} />);
    fireEvent.click(screen.getByText(/Newest first/));
    fireEvent.click(screen.getByText("Oldest first"));
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Old");
  });

  // --- Pagination Tests ---

  it("does not show pagination for 10 or fewer modules", () => {
    const modules = Array.from({ length: 5 }, (_, i) => makeModule({ id: `m${i}`, name: `Module ${i}` }));
    render(<ModulesPageClient modules={modules} />);
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows only 10 cards on first page", () => {
    const modules = Array.from({ length: 12 }, (_, i) => makeModule({ id: `m${i}`, name: `Module ${i}` }));
    render(<ModulesPageClient modules={modules} />);
    expect(screen.getAllByTestId("module-card")).toHaveLength(10);
  });

  it("navigates pages using Chevron buttons", () => {
    const modules = Array.from({ length: 12 }, (_, i) => makeModule({ id: `m${i}`, name: `Module ${i}` }));
    render(<ModulesPageClient modules={modules} />);
    
    const nextButton = screen.getByTestId("chevron-right").closest("button")!;
    const prevButton = screen.getByTestId("chevron-left").closest("button")!;

    expect(prevButton).toBeDisabled();
    
    fireEvent.click(nextButton);
    expect(screen.getAllByTestId("module-card")).toHaveLength(2);
    expect(nextButton).toBeDisabled();

    fireEvent.click(prevButton);
    expect(screen.getAllByTestId("module-card")).toHaveLength(10);
  });
});