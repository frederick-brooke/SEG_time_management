import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import { NavDocuments } from "../NavDocuments"; 
import { useSidebar } from "@/components/ui/Sidebar";

// Mock the icons
jest.mock("@tabler/icons-react", () => ({
  IconDots: () => <span data-testid="icon-dots" />,
  IconFolder: () => <span data-testid="icon-folder" />,
  IconShare3: () => <span data-testid="icon-share" />,
  IconTrash: () => <span data-testid="icon-trash" />,
}));

// Mock the DropdownMenu components
jest.mock("components/ui/DropdownMenu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => {
    if (asChild) return <>{children}</>;
    return <Button>{children}</Button>;
  },
  DropdownMenuContent: ({ children, side, align, className }: any) => (
    <div data-testid="dropdown-content" data-side={side} data-align={align} className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, variant }: any) => (
    <div data-testid="dropdown-item" data-variant={variant}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}));

// Mock the Sidebar components and hook
jest.mock("@/components/ui/sidebar", () => ({
  SidebarGroup: ({ children, className }: any) => (
    <div data-testid="sidebar-group" className={className}>{children}</div>
  ),
  SidebarGroupLabel: ({ children }: any) => <div data-testid="sidebar-group-label">{children}</div>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, asChild, className }: any) => {
    if (asChild) return <>{children}</>;
    return <Button className={className} data-testid="sidebar-menu-button">{children}</Button>;
  },
  SidebarMenuAction: ({ children, className }: any) => (
    <Button data-testid="sidebar-menu-action" className={className}>{children}</Button>
  ),
  useSidebar: jest.fn(),
}));

describe("NavDocuments Component", () => {
  const MockIcon = () => <span data-testid="mock-item-icon" />;

  const mockItems = [
    { name: "Project Alpha", url: "/docs/alpha", icon: MockIcon },
    { name: "Project Beta", url: "/docs/beta", icon: MockIcon },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: false });
  });

  it("renders the 'Documents' label", () => {
    render(<NavDocuments items={mockItems} />);
    expect(screen.getByTestId("sidebar-group-label")).toHaveTextContent("Documents");
  });

  it("renders the list of document items as links", () => {
    render(<NavDocuments items={mockItems} />);
    
    const alphaLink = screen.getByRole("link", { name: /project alpha/i });
    expect(alphaLink).toBeInTheDocument();
    expect(alphaLink).toHaveAttribute("href", "/docs/alpha");

    const betaLink = screen.getByRole("link", { name: /project beta/i });
    expect(betaLink).toBeInTheDocument();
    expect(betaLink).toHaveAttribute("href", "/docs/beta");

    // Verifies the custom icons passed in the items array are rendered
    expect(screen.getAllByTestId("mock-item-icon")).toHaveLength(2);
  });

  it("renders the static 'More' button at the bottom", () => {
    render(<NavDocuments items={mockItems} />);
    
    // The "More" item rendered outside the map
    const moreButton = screen.getByTestId("sidebar-menu-button");
    expect(moreButton).toHaveTextContent("More");
  });

  it("renders the dropdown action menus for each item", () => {
    render(<NavDocuments items={mockItems} />);
    
    // There should be one action button per item
    const actionButtons = screen.getAllByTestId("sidebar-menu-action");
    expect(actionButtons).toHaveLength(mockItems.length);

    // Dropdown content should render the Open, Share, and Delete options
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    expect(dropdownItems).toHaveLength(6); 
  });

  describe("Responsive Dropdown Positioning", () => {
    it("positions dropdown to the 'right' and 'start' on desktop", () => {
      // isMobile defaults to false in beforeEach
      render(<NavDocuments items={mockItems} />);
      
      const dropdownContents = screen.getAllByTestId("dropdown-content");
      expect(dropdownContents[0]).toHaveAttribute("data-side", "right");
      expect(dropdownContents[0]).toHaveAttribute("data-align", "start");
    });

    it("positions dropdown to the 'bottom' and 'end' on mobile", () => {
      // Override the mock to simulate a mobile viewport
      (useSidebar as jest.Mock).mockReturnValue({ isMobile: true });
      render(<NavDocuments items={mockItems} />);
      
      const dropdownContents = screen.getAllByTestId("dropdown-content");
      expect(dropdownContents[0]).toHaveAttribute("data-side", "bottom");
      expect(dropdownContents[0]).toHaveAttribute("data-align", "end");
    });
  });
});