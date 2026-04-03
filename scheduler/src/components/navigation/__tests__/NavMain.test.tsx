import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavMain } from "../NavMain"; 

jest.mock("next/link", () => {
  return ({ children, href, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className} data-testid="next-link">
      {children}
    </a>
  );
});

jest.mock("@/components/ui/Sidebar", () => ({
  SidebarGroup: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children, className }: any) => (
    <div data-testid="sidebar-group-label" className={className}>{children}</div>
  ),
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, asChild, onClick, className }: any) => {
    if (asChild) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
          onClick?.(e);
          (children as React.ReactElement<any>).props.onClick?.(e);
        },
      });
    }
    return (
      <Button onClick={onClick} className={className} data-testid="sidebar-menu-button">
        {children}
      </Button>
    );
  },
}));

describe("NavMain Component", () => {
  const MockIcon = () => <span data-testid="mock-icon" />;

  const mockItems = [
    { title: "Home", url: "/home", icon: MockIcon },
    { title: "Messages", url: "/messages", icon: MockIcon },
    { title: "Notifications", action: "notifications", icon: MockIcon },
    { title: "Search", action: "search", icon: MockIcon },
  ];

  const mockOnNotifClick = jest.fn();
  const mockOnSearchClick = jest.fn();

  const baseProps: any = {
    items: mockItems,
    label: "Main Navigation",
    onNotifClick: mockOnNotifClick,
    onSearchClick: mockOnSearchClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the group label when provided", () => {
    render(<NavMain {...baseProps} label="Custom Label" />);
    
    const label = screen.getByTestId("sidebar-group-label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent("Custom Label");
  });

  it("does not render the group label if not provided", () => {
    // Explicitly override label with undefined to test the falsy branch
    render(<NavMain {...baseProps} label={undefined} />);
    expect(screen.queryByTestId("sidebar-group-label")).not.toBeInTheDocument();
  });

  it("renders standard items as Next.js Links", () => {
    render(<NavMain {...baseProps} />);
    
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/home");
  });

  it("renders the Notifications item as a button (not a link) and fires onNotifClick", async () => {
    const user = userEvent.setup();
    render(<NavMain {...baseProps} />);
    
    const notifButton = screen.getByRole("button", { name: /notifications/i });
    expect(notifButton).toBeInTheDocument();

    await user.click(notifButton);
    expect(mockOnNotifClick).toHaveBeenCalledTimes(1);
  });

  it("fires onSearchClick when the search item is clicked", async () => {
    const user = userEvent.setup();
    render(<NavMain {...baseProps} />);
    
    const searchLink = screen.getByRole("link", { name: /search/i });
    await user.click(searchLink);

    expect(mockOnSearchClick).toHaveBeenCalledTimes(1);
  });

  describe("Badges and Counts", () => {
    it("displays the exact unreadCount for Notifications when between 1 and 9", () => {
      render(<NavMain {...baseProps} unreadCount={5} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays '9+' for unreadCount when greater than 9", () => {
      render(<NavMain {...baseProps} unreadCount={12} />);
      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("does not display a badge for Notifications when unreadCount is 0", () => {
      render(<NavMain {...baseProps} unreadCount={0} />);
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("displays the exact unreadMessageCount for Messages when between 1 and 9", () => {
      render(<NavMain {...baseProps} unreadMessageCount={3} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("displays '9+' for unreadMessageCount when greater than 9", () => {
      render(<NavMain {...baseProps} unreadMessageCount={42} />);
      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("does not display a badge for Messages when unreadMessageCount is 0", () => {
      render(<NavMain {...baseProps} unreadMessageCount={0} />);
      const badges = screen.queryAllByText("0");
      expect(badges.length).toBe(0);
    });
  });
});