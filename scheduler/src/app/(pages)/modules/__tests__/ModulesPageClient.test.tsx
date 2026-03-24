import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModulesPageClient from "../ModulesPageClient";

// mocks
jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="lunar-wrapper">{children}</div>,
}));

jest.mock("@/components/modules/ModuleCard", () => ({
  __esModule: true,
  ModuleCard: ({ module }: any) => <div data-testid="module-card">{module.name}</div>,
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

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
}));

jest.mock("lucide-react", () => ({
  Plus: () => <svg data-testid="plus-icon" />,
  LogIn: () => <svg data-testid="login-icon" />,
  ArrowUpDown: () => <svg data-testid="sort-icon" />,
  ChevronLeft: () => <svg data-testid="chevron-left" />,
  ChevronRight: () => <svg data-testid="chevron-right" />,
}));

//shared mock helpers
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
describe("ModulesPageClient Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifies the primary page header and sub-heading are rendered.
   */
  it("renders the page header and subtitle", () => {
    render(<ModulesPageClient modules={[]} />);
    expect(screen.getByText(/My Modules/i)).toBeInTheDocument();
    expect(screen.getByText(/Create or join modules/i)).toBeInTheDocument();
  });

  /**
   * Verifies the empty state UI is displayed when no modules are provided.
   */
  it("renders empty state when no modules are present", () => {
    render(<ModulesPageClient modules={[]} />);
    expect(screen.getByText(/No modules yet/i)).toBeInTheDocument();
  });

  /**
   * Ensures that the correct number of ModuleCard components are rendered.
   */
  it("renders the correct number of module cards", () => {
    const modules = [makeModule({ id: "1", name: "CS101" }), makeModule({ id: "2", name: "MATH101" })];
    render(<ModulesPageClient modules={modules} />);
    
    expect(screen.getByText("CS101")).toBeInTheDocument();
    expect(screen.getByText("MATH101")).toBeInTheDocument();
  });

  /**
   * Validates the modal toggle logic using Role-based selection to avoid 
   * collisions with subtitle text.
   */
  describe("Modal Interactions", () => {
    it("opens and closes the create module modal", () => {
      render(<ModulesPageClient modules={[]} />);
      
      // FIXED: Use getByRole to target the button specifically
      fireEvent.click(screen.getByRole("button", { name: /Create Module/i }));
      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
      
      fireEvent.click(screen.getByText("Close Create"));
      expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
    });

    it("opens and closes the join module modal", () => {
      render(<ModulesPageClient modules={[]} />);
      
      // FIXED: Use getByRole to target the button specifically
      fireEvent.click(screen.getByRole("button", { name: /Join Module/i }));
      expect(screen.getByTestId("join-modal")).toBeInTheDocument();
      
      fireEvent.click(screen.getByText("Close Join"));
      expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
    });

    it("triggers a router refresh upon successful creation or join", () => {
      render(<ModulesPageClient modules={[]} />);
      
      // Success on Create
      fireEvent.click(screen.getByRole("button", { name: /Create Module/i }));
      fireEvent.click(screen.getByText("Trigger Create Success"));
      
      // Success on Join
      fireEvent.click(screen.getByRole("button", { name: /Join Module/i }));
      fireEvent.click(screen.getByText("Trigger Join Success"));
      
      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Verifies sorting logic via dropdown menu.
   */
  it("sorts modules alphabetically (A to Z)", () => {
    const modules = [makeModule({ id: "1", name: "Zebra" }), makeModule({ id: "2", name: "Apple" })];
    render(<ModulesPageClient modules={modules} />);
    
    fireEvent.click(screen.getByRole("button", { name: /Newest first/i }));
    fireEvent.click(screen.getByText(/Name A → Z/i));
    
    const cards = screen.getAllByTestId("module-card");
    expect(cards[0]).toHaveTextContent("Apple");
    expect(cards[1]).toHaveTextContent("Zebra");
  });

  /**
   * Verifies pagination logic (10 items per page).
   */
  it("navigates to the second page using pagination buttons", () => {
    const twelveModules = Array.from({ length: 12 }, (_, i) => 
      makeModule({ id: `${i}`, name: `Module ${i}` })
    );
    render(<ModulesPageClient modules={twelveModules} />);
    
    const nextBtn = screen.getByTestId("chevron-right").closest("button")!;
    fireEvent.click(nextBtn);
    
    expect(screen.getAllByTestId("module-card")).toHaveLength(2);
  });
});