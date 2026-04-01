/**
 * Testing for dashboard page.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";

let mockErrorParam: string | null = null;
let mockWellbeingOpen = false;

const pushMock             = jest.fn();
const replaceMock          = jest.fn();
const setWellbeingOpenMock = jest.fn();
const refreshProgressMock = jest.fn().mockResolvedValue(undefined);

// Mocks

jest.mock("next/navigation", () => ({
  useRouter:       () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => ({ get: (key: string) => key === "error" ? mockErrorParam : null }),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut:    jest.fn(),
}));

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({ wellbeingOpen: mockWellbeingOpen, setWellbeingOpen: setWellbeingOpenMock }),
}));

jest.mock("@/context/TaskProgressContext", () => ({
  useTaskProgress: jest.fn().mockReturnValue({
    progressPercentage: 0,
    tasks: [],
    isLoading: false,
    lastUpdatedAt: null,
    refreshProgress: jest.fn().mockResolvedValue(undefined),
    triggerProgressUpdate: jest.fn(),
  }),
}));

jest.mock("@/app/actions/leaderboard", () => ({
  getFriendsLeaderboard: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../leaderboard/LeaderboardClient", () => ({
  __esModule: true,
  default: () => <div>LeaderboardClient</div>,
}));

jest.mock("@/components/calendar/CalendarEvents", () => ({
  CalendarEvents: () => <div>CalendarEvents</div>,
}));

const getMyExamsMock   = jest.fn();
const getMyProfileMock = jest.fn();
const useTasksMock     = jest.fn();

jest.mock("@/app/actions/examActions", () => ({ getMyExams:   (...a: any[]) => getMyExamsMock(...a) }));
jest.mock("@/app/actions/profile",     () => ({ getMyProfile: (...a: any[]) => getMyProfileMock(...a) }));
jest.mock("@/hooks/useTasks",          () => ({ useTasks:     (...a: any[]) => useTasksMock(...a) }));

jest.mock("@tabler/icons-react", () =>
  new Proxy({}, { get: (_: any, name: string) => function MockIcon() { return null; } })
);

jest.mock("components/dashboard/UpcomingExams", () => ({
  UpcomingExams: () => <div>UpcomingExams</div>,
}));

jest.mock("@/components/dashboard/ComingUpSoon", () => ({
  ComingUpSoon: () => <div>ComingUpSoon</div>,
}));

jest.mock("@/components/profile/StatModules", () => ({
  ProfileStats: () => <div>ProfileStats</div>,
}));

jest.mock("../wellbeing/page", () => () => <div>WellbeingPage</div>, { virtual: true });

jest.mock("@/components/wellbeing/wellbeing_panel", () => ({
  __esModule: true,
  default: ({ children, open, onClose }: any) => (
    <div>
      {open && <div data-testid="panel-open" />}
      <button onClick={onClose}>ClosePanel</button>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/rocket-progress", () => ({
  RocketProgress: ({ progress }: any) => <div data-testid="rocket">Rocket {progress}%</div>,
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));


// Helpers

import Page from "../page";
import { getFriendsLeaderboard } from "@/app/actions/leaderboard";
import { useTaskProgress } from "@/context/TaskProgressContext";

const { useSession, signOut } = require("next-auth/react");

function setAuth(status = "authenticated", name: string | null = "Test User", id = "u1") {
  useSession.mockReturnValue({
    data: status === "authenticated" ? { user: { id, name } } : null,
    status,
  });
}

function makeProgressContext(overrides: Record<string, unknown> = {}) {
  return {
    progressPercentage: 0,
    tasks: [],
    isLoading: false,
    lastUpdatedAt: null,
    refreshProgress: refreshProgressMock, // safe here — called at runtime, not hoist time
    triggerProgressUpdate: jest.fn(),
    ...overrides,
  };
}

// Tests

describe("Dashboard Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorParam    = null;
    mockWellbeingOpen = false;
    getMyExamsMock.mockResolvedValue([]);
    getMyProfileMock.mockResolvedValue({ fname: "Test", accounts: [] });
    useTasksMock.mockReturnValue({ tasks: [] });

    (useTaskProgress as jest.Mock).mockReturnValue(makeProgressContext());

    setAuth();
  });

  // Greeting
  it("shows fname from profile when available", async () => {
    getMyProfileMock.mockResolvedValue({ fname: "Ada", accounts: [] });
    render(<Page />);
    expect(await screen.findByText(/Welcome, Ada/)).toBeInTheDocument();
  });

  it("falls back to session name when profile fname is null", async () => {
    getMyProfileMock.mockResolvedValue({ fname: null, accounts: [] });
    render(<Page />);
    expect(await screen.findByText(/Welcome, Test User/)).toBeInTheDocument();
  });

  it("falls back to User when both fname and session name are absent", async () => {
    setAuth("authenticated", null);
    getMyProfileMock.mockResolvedValue({ fname: null, accounts: [] });
    render(<Page />);
    expect(await screen.findByText(/Welcome, User/)).toBeInTheDocument();
  });

  // Rocket progress (from context)
  it("shows 0% when progress context returns 0", async () => {
    (useTaskProgress as jest.Mock).mockReturnValue(makeProgressContext({ progressPercentage: 0 }));
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 0%");
  });

  it("displays progress percentage from context", async () => {
    (useTaskProgress as jest.Mock).mockReturnValue(
      makeProgressContext({
        progressPercentage: 50,
        tasks: [{ id: "1", status: "completed" }, { id: "2", status: "todo" }],
        lastUpdatedAt: Date.now(),
      })
    );
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 50%");
  });

  it("shows 100% when progress context returns 100", async () => {
    (useTaskProgress as jest.Mock).mockReturnValue(
      makeProgressContext({
        progressPercentage: 100,
        tasks: [{ id: "1", status: "completed" }, { id: "2", status: "completed" }],
        lastUpdatedAt: Date.now(),
      })
    );
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 100%");
  });

  it("calls refreshProgress with userId on mount when authenticated", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(refreshProgressMock).toHaveBeenCalledWith("u1");
    });
  });

  // Core components
  it("renders UpcomingExams and ComingUpSoon", async () => {
    render(<Page />);
    expect(await screen.findByText("UpcomingExams")).toBeInTheDocument();
    expect(screen.getByText("ComingUpSoon")).toBeInTheDocument();
  });

  it("renders ProfileStats once profile data arrives", async () => {
    render(<Page />);
    expect(await screen.findByText("ProfileStats")).toBeInTheDocument();
  });

  // Google Calendar
  it("shows Connect Google Calendar when google is not linked", async () => {
    render(<Page />);
    expect(await screen.findByText("Connect Google Calendar")).toBeInTheDocument();
  });

  it("hides Connect Google Calendar when google account is linked", async () => {
    getMyProfileMock.mockResolvedValue({ fname: "Test", accounts: [{ provider: "google" }] });
    render(<Page />);
    await screen.findByText("ProfileStats");
    expect(screen.queryByText("Connect Google Calendar")).not.toBeInTheDocument();
  });

  it("pushes to google sign-in route on connect click", async () => {
    render(<Page />);
    fireEvent.click(await screen.findByText("Connect Google Calendar"));
    expect(pushMock).toHaveBeenCalledWith("/api/auth/signin/google");
  });

  // Sign out
  it("calls signOut with /login callback", async () => {
    render(<Page />);
    fireEvent.click(await screen.findByText("Sign Out"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  // Auth redirects
  it("redirects to /login when unauthenticated", async () => {
    setAuth("unauthenticated");
    render(<Page />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  // Error query param
  it("replaces URL for GoogleAccountTaken error", async () => {
    mockErrorParam = "GoogleAccountTaken";
    render(<Page />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("replaces URL for OAuthAccountNotLinked error", async () => {
    mockErrorParam = "OAuthAccountNotLinked";
    render(<Page />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("does not replace URL when there is no error param", async () => {
    render(<Page />);
    await screen.findByText(/Welcome/);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  // Wellbeing panel
  it("renders the wellbeing button", async () => {
    render(<Page />);
    expect(await screen.findByLabelText("Open wellbeing panel")).toBeInTheDocument();
  });

  it("calls setWellbeingOpen(true) and hides button on click", async () => {
    render(<Page />);
    const btn = await screen.findByLabelText("Open wellbeing panel");
    fireEvent.click(btn);
    expect(setWellbeingOpenMock).toHaveBeenCalledWith(true);
    expect(screen.queryByLabelText("Open wellbeing panel")).not.toBeInTheDocument();
  });

  it("calls setWellbeingOpen(false) when panel onClose fires", async () => {
    render(<Page />);
    fireEvent.click(await screen.findByLabelText("Open wellbeing panel"));
    fireEvent.click(screen.getByText("ClosePanel"));
    expect(setWellbeingOpenMock).toHaveBeenCalledWith(false);
  });

  it("shows panel-open marker when wellbeingOpen is true", async () => {
    mockWellbeingOpen = true;
    render(<Page />);
    expect(await screen.findByTestId("panel-open")).toBeInTheDocument();
  });

  // Data fetching guards
  it("fetches exams and profile when authenticated", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(getMyProfileMock).toHaveBeenCalled();
      expect(getMyExamsMock).toHaveBeenCalled();
    });
  });

  it("does not fetch profile when unauthenticated", async () => {
    setAuth("unauthenticated");
    render(<Page />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(getMyProfileMock).not.toHaveBeenCalled();
  });
});