// src/app/(pages)/dashboard/tests/page.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

let mockErrorParam: string | null = null;
let mockWellbeingOpen = false;

const pushMock       = jest.fn();
const replaceMock    = jest.fn();
const setWellbeingOpenMock = jest.fn();

//mocks
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

jest.mock("@/src/app/actions/leaderboard", () => ({
  getFriendsLeaderboard: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../leaderboard/LeaderboardClient", () => ({
  __esModule: true,
  default: () => <div>LeaderboardClient</div>,
}));

jest.mock("@/src/components/calendar/CalendarEvents", () => ({
  CalendarEvents: () => <div>CalendarEvents</div>,
}));

const getMyExamsMock   = jest.fn();
const getMyProfileMock = jest.fn();
const useTasksMock     = jest.fn();

jest.mock("@/src/app/actions/examActions", () => ({ getMyExams:   (...a: any[]) => getMyExamsMock(...a) }));
jest.mock("@/src/app/actions/profile",     () => ({ getMyProfile: (...a: any[]) => getMyProfileMock(...a) }));
jest.mock("@/src/hooks/useTasks",          () => ({ useTasks:     (...a: any[]) => useTasksMock(...a) }));

// Wildcard proxy — any IconXxx from tabler returns a silent stub.
// Without this, any component in the tree that uses an icon we haven't
// explicitly listed will get undefined, crashing the render.
jest.mock("@tabler/icons-react", () =>
  new Proxy({}, { get: (_: any, name: string) => function MockIcon() { return null; } })
);

jest.mock("components/upcoming-exams", () => ({
  UpcomingExams: () => <div>UpcomingExams</div>,
}));

jest.mock("@/src/components/coming-up-soon", () => ({
  ComingUpSoon: () => <div>ComingUpSoon</div>,
}));

jest.mock("@/src/components/profile/StatModules", () => ({
  ProfileStats: () => <div>ProfileStats</div>,
}));

// virtual: true — file doesn't need to exist on disk
jest.mock("../wellbeing/page", () => () => <div>WellbeingPage</div>, { virtual: true });

jest.mock("@/src/components/wellbeing/wellbeing_panel", () => ({
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

jest.mock("@/src/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

// Page import — must come after all jest.mock calls
import Page from "../page";
import { getFriendsLeaderboard } from "@/src/app/actions/leaderboard";

const { useSession, signOut } = require("next-auth/react");

function setAuth(status = "authenticated", name: string | null = "Test User", id = "u1") {
  useSession.mockReturnValue({
    data: status === "authenticated" ? { user: { id, name } } : null,
    status,
  });
}



describe("Dashboard Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorParam    = null;
    mockWellbeingOpen = false;
    getMyExamsMock.mockResolvedValue([]);
    getMyProfileMock.mockResolvedValue({ fname: "Test", accounts: [] });
    useTasksMock.mockReturnValue({ tasks: [] });
    setAuth();
  });

  //  Greeting 

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

  // ── Rocket progress ────────────────────────

  it("shows 0% when there are no tasks", async () => {
    useTasksMock.mockReturnValue({ tasks: [] });
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 0%");
  });

  it("calculates percentage correctly for partial completion", async () => {
    useTasksMock.mockReturnValue({
      tasks: [
        { id: "1", status: "completed" },
        { id: "2", status: "pending" },
      ],
    });
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 50%");
  });

  it("shows 100% when all tasks are completed", async () => {
    useTasksMock.mockReturnValue({
      tasks: [
        { id: "1", status: "completed" },
        { id: "2", status: "completed" },
      ],
    });
    render(<Page />);
    expect(await screen.findByTestId("rocket")).toHaveTextContent("Rocket 100%");
  });

  // ── Core components ────────────────────────

  it("renders UpcomingExams and ComingUpSoon", async () => {
    render(<Page />);
    expect(await screen.findByText("UpcomingExams")).toBeInTheDocument();
    expect(screen.getByText("ComingUpSoon")).toBeInTheDocument();
  });

  it("renders ProfileStats once profile data arrives", async () => {
    render(<Page />);
    expect(await screen.findByText("ProfileStats")).toBeInTheDocument();
  });

  // ── Google calendar ────────────────────────

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

  // ── Sign out ───────────────────────────────

  it("calls signOut with /login callback", async () => {
    render(<Page />);
    fireEvent.click(await screen.findByText("Sign Out"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  //  Auth redirects 

  it("redirects to /login when unauthenticated", async () => {
    setAuth("unauthenticated");
    render(<Page />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  //  Error query param 

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

  // ── Wellbeing panel ────────────────────────

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
    // panel-open marker is rendered by the WellbeingPanel mock when open=true
    expect(await screen.findByTestId("panel-open")).toBeInTheDocument();
  });

  //  Data fetching guards 

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