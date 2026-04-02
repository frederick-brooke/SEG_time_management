import { render, screen, act } from "@testing-library/react";
import { AppShell } from "../app-shell";
import { useSession } from "next-auth/react";
import { checkUpcomingEventNotifications } from "@/app/actions/calendar/calendarNotifications";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/app/actions/calendar/calendarNotifications", () => ({
  checkUpcomingEventNotifications: jest.fn(),
}));

jest.mock("@/components/layout/app-sidebar", () => ({
  AppSidebar: ({ onSearchClick }: any) => (
    <div data-testid="app-sidebar" onClick={onSearchClick}>
      AppSidebar
    </div>
  ),
}));

jest.mock("@/components/navigation/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header">SiteHeader</div>,
}));

jest.mock("@/components/animate-ui/components/radix/sidebar.index", () => ({
  SidebarProvider: ({ children, open, onOpenChange }: any) => (
    <div data-testid="sidebar-provider" data-open={open} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
  ),
  SidebarInset: ({ children }: any) => <div data-testid="sidebar-inset">{children}</div>,
}), { virtual: true });

describe("AppShell Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    (console.log as jest.Mock).mockRestore();
  });

  it("renders layout children and components correctly", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(
      <AppShell>
        <div data-testid="test-child">Child Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("does not start polling interval if user is not authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<AppShell>Content</AppShell>);

    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    expect(checkUpcomingEventNotifications).not.toHaveBeenCalled();
  });

  it("starts polling notifications and handles interval cleanup when authenticated", async () => {
    const mockUserId = "user-123";
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: mockUserId } },
    });

    (checkUpcomingEventNotifications as jest.Mock).mockResolvedValue("success");

    const { unmount } = render(<AppShell>Content</AppShell>);

    expect(checkUpcomingEventNotifications).toHaveBeenCalledWith(mockUserId);
    expect(checkUpcomingEventNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.runAllTicks();
    });

    await act(async () => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    expect(checkUpcomingEventNotifications).toHaveBeenCalledTimes(2);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    expect(checkUpcomingEventNotifications).toHaveBeenCalledTimes(2);
  });
});