import { render, screen } from "@testing-library/react";
import { NavUser } from "../NavUser";
import { useSidebar } from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/Button";

// Mock the Sidebar components and hook
jest.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-item">{children}</div>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <Button data-testid="sidebar-menu-button">{children}</Button>,
  useSidebar: jest.fn(),
}));

// Mock the DropdownMenu components to avoid Radix UI JSDOM errors
jest.mock("components/ui/DropdownMenu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  // DropdownMenuTrigger uses `asChild`, so we pass children through
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children, side }: any) => (
    <div data-testid="dropdown-content" data-side={side}>
      {children}
    </div>
  ),
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-item">{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}));

// Mock the Avatar components
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ alt }: { alt: string }) => <img data-testid="avatar-image" alt={alt} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the icons to keep the snapshot/DOM clean
jest.mock("@tabler/icons-react", () => ({
  IconCreditCard: () => <span data-testid="icon-credit-card" />,
  IconDotsVertical: () => <span data-testid="icon-dots-vertical" />,
  IconLogout: () => <span data-testid="icon-logout" />,
  IconNotification: () => <span data-testid="icon-notification" />,
  IconUserCircle: () => <span data-testid="icon-user-circle" />,
}));

describe("NavUser Component", () => {
  const mockUser = {
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "/avatars/jane.jpg",
  };

  beforeEach(() => {
    // Reset the mock implementation before each test
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the user's name and email in the trigger button", () => {
    render(<NavUser user={mockUser} />);
    
    const nameElements = screen.getAllByText("Jane Doe");
    const emailElements = screen.getAllByText("jane@example.com");

    expect(nameElements.length).toBeGreaterThan(0);
    expect(emailElements.length).toBeGreaterThan(0);
  });

  it("renders the avatars with correct alt text", () => {
    render(<NavUser user={mockUser} />);
    
    const avatarImages = screen.getAllByTestId("avatar-image");
    expect(avatarImages[0]).toHaveAttribute("alt", "Jane Doe");
  });

  it("renders all dropdown menu items", () => {
    render(<NavUser user={mockUser} />);
    
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  it("sets the dropdown side to 'right' on desktop", () => {
    render(<NavUser user={mockUser} />);
    
    const dropdownContent = screen.getByTestId("dropdown-content");
    expect(dropdownContent).toHaveAttribute("data-side", "right");
  });

  it("sets the dropdown side to 'bottom' on mobile", () => {
    // Override the mock to simulate mobile view
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: true });
    
    render(<NavUser user={mockUser} />);
    
    const dropdownContent = screen.getByTestId("dropdown-content");
    expect(dropdownContent).toHaveAttribute("data-side", "bottom");
  });
});