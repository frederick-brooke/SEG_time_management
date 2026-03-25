/**
 * Tests for the CalendarPage server component.
 */

import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CalendarPage from "../page";
import "@testing-library/jest-dom";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/components/calendar/CalendarView", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="calendar-view" data-props={JSON.stringify(props)} />
  ),
}));

jest.mock("@/components/googleLinkButton", () => ({
  __esModule: true,
  default: ({ isConnected }: { isConnected: boolean }) => (
    <div data-testid="google-link-button" data-connected={String(isConnected)} />
  ),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lunar-theme-wrapper">{children}</div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as unknown as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

/**
 * Creates a mock session object for testing.
 * @param googleConnected - Whether the user has Google connected
 * @returns Mock session object
 */
function createMockSession(googleConnected = false) {
  return {
    user: {
      id: "user-123",
      email: "test@example.com",
      googleConnected,
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CalendarPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-apply the throwing implementation after clearAllMocks resets it
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  // ── Authentication ──────────────────────────────────────────────────────────

  it("should redirect to /login when the user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(CalendarPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it("should not redirect when the user is authenticated", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("should call getServerSession with authOptions", async () => {
    const { authOptions } = require("@/lib/auth");
    mockGetServerSession.mockResolvedValue(createMockSession());

    await CalendarPage();

    expect(mockGetServerSession).toHaveBeenCalledWith(authOptions);
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  it("should render the page heading as an h1", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "My Schedule" })
    ).toBeInTheDocument();
  });

  it("should render the LunarThemeWrapper", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());
    render(await CalendarPage());
    expect(screen.getByTestId("lunar-theme-wrapper")).toBeInTheDocument();
  });

  it("should render the CalendarView component", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
  });

  it("should render the GoogleLinkButton component", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    expect(screen.getByTestId("google-link-button")).toBeInTheDocument();
  });

  // ── Props ───────────────────────────────────────────────────────────────────

  it("should pass the correct userId to CalendarView", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    const props = JSON.parse(
      screen.getByTestId("calendar-view").getAttribute("data-props") ?? "{}"
    );
    expect(props.userId).toBe("user-123");
  });

  it("should pass empty arrays as initial props to CalendarView", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession());

    render(await CalendarPage());

    const props = JSON.parse(
      screen.getByTestId("calendar-view").getAttribute("data-props") ?? "{}"
    );
    expect(props.events).toEqual([]);
    expect(props.tasks).toEqual([]);
    expect(props.allTasks).toEqual([]);
    expect(props.unscheduledTasks).toEqual([]);
  });

  it("should pass googleConnected=false to CalendarView when Google is not connected", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession(false));

    render(await CalendarPage());

    const props = JSON.parse(
      screen.getByTestId("calendar-view").getAttribute("data-props") ?? "{}"
    );
    expect(props.googleConnected).toBe(false);
  });

  it("should pass googleConnected=true to CalendarView when Google is connected", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession(true));

    render(await CalendarPage());

    const props = JSON.parse(
      screen.getByTestId("calendar-view").getAttribute("data-props") ?? "{}"
    );
    expect(props.googleConnected).toBe(true);
  });

  it("should pass isConnected=false to GoogleLinkButton when Google is not connected", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession(false));

    render(await CalendarPage());

    expect(
      screen.getByTestId("google-link-button").getAttribute("data-connected")
    ).toBe("false");
  });

  it("should pass isConnected=true to GoogleLinkButton when Google is connected", async () => {
    mockGetServerSession.mockResolvedValue(createMockSession(true));

    render(await CalendarPage());

    expect(
      screen.getByTestId("google-link-button").getAttribute("data-connected")
    ).toBe("true");
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────────

  it("should handle googleConnected being undefined on the session user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });

    render(await CalendarPage());

    expect(
      screen.getByTestId("google-link-button").getAttribute("data-connected")
    ).toBe("false");
  });
});