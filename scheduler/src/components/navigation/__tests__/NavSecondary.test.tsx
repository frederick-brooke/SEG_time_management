import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavSecondary } from "../NavSecondary";
import { Button } from "@/components/ui/Button";

// 1. Mock the Sidebar components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarGroup: ({ children, ...props }: any) => (
    <div data-testid="sidebar-group" {...props}>
      {children}
    </div>
  ),
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, asChild, ...props }: any) => {
    if (asChild) return <>{children}</>;
    return (
      <Button data-testid="sidebar-menu-button" {...props}>
        {children}
      </Button>
    );
  },
}));

describe("NavSecondary Component", () => {
  const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

  const mockItems = [
    { title: "Dashboard", url: "/dashboard", icon: MockIcon },
    { title: "Settings", url: "/settings", icon: MockIcon },
    { title: "Search", url: "#", icon: MockIcon },
  ];

  const mockOnSearchClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all items in the list", () => {
    render(
      <NavSecondary items={mockItems} onSearchClick={mockOnSearchClick} />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    
    // Check that exactly 3 icons rendered
    expect(screen.getAllByTestId("mock-icon")).toHaveLength(3);
  });

  it("renders standard items as links with correct hrefs", () => {
    render(
      <NavSecondary items={mockItems} onSearchClick={mockOnSearchClick} />
    );

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const settingsLink = screen.getByRole("link", { name: /settings/i });

    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("renders the Search item as a button and fires the onSearchClick callback", async () => {
    const user = userEvent.setup();
    
    render(
      <NavSecondary items={mockItems} onSearchClick={mockOnSearchClick} />
    );

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).not.toHaveAttribute("href");

    // Simulate a user click
    await user.click(searchButton);

    expect(mockOnSearchClick).toHaveBeenCalledTimes(1);
  });

  it("passes additional props to the root SidebarGroup component", () => {
    render(
      <NavSecondary 
        items={mockItems} 
        onSearchClick={mockOnSearchClick} 
        className="custom-class" 
        data-custom="test-data" 
      />
    );

    const sidebarGroup = screen.getByTestId("sidebar-group");
    expect(sidebarGroup).toHaveClass("custom-class");
    expect(sidebarGroup).toHaveAttribute("data-custom", "test-data");
  });
});