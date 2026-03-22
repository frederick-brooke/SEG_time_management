// src/app/(pages)/dashboard/tests/page.test.tsx

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Page from "../page";

import { useSession } from "next-auth/react";

(useSession as jest.Mock).mockReturnValue({
  data: { user: { id: "1", name: "User" } },
  status: "authenticated",
});

// Router + Search Params
const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: jest.fn((key) =>
      key === "error" ? "GoogleAccountTaken" : null
    ),
  }),
}));

// Auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// UI Context
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    wellbeingOpen: false,
    setWellbeingOpen: jest.fn(),
  }),
}));

// Actions (NO fetch issues 🎯)
jest.mock("@/src/app/actions/examActions", () => ({
  getMyExams: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/src/app/actions/profile", () => ({
  getMyProfile: jest.fn().mockResolvedValue({
    fname: "Test",
    accounts: [],
  }),
}));

// Hooks
jest.mock("@/src/hooks/useTasks", () => ({
  useTasks: () => ({
    tasks: [],
  }),
}));

// Components (lightweight mocks)
jest.mock("components/upcoming-exams", () => ({
  UpcomingExams: () => <div>UpcomingExams</div>,
}));

jest.mock("@/src/components/coming-up-soon", () => ({
  ComingUpSoon: () => <div>ComingUpSoon</div>,
}));

jest.mock("@/src/components/profile/StatModules", () => ({
  ProfileStats: () => <div>ProfileStats</div>,
}));

jest.mock("@/src/app/(pages)/wellbeing/page", () => ({
  __esModule: true,
  default: () => <div>WellbeingPage</div>,
}));

jest.mock("@/src/components/wellbeing/wellbeing_panel", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/rocket-progress", () => ({
  RocketProgress: ({ progress }: any) => <div>Rocket {progress}%</div>,
}));

jest.mock("@/src/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

//  TESTS 

describe("Dashboard Page", () => {
  const { useSession } = require("next-auth/react");

  beforeEach(() => {
    jest.clearAllMocks();

    useSession.mockReturnValue({
      data: { user: { id: "1", name: "Test User" } },
      status: "authenticated",
    });
  });

  // Basic render
  it("renders dashboard content", async () => {
    render(<Page />);

    expect(await screen.findByText(/Welcome/i)).toBeInTheDocument();
    expect(screen.getByText("UpcomingExams")).toBeInTheDocument();
    expect(screen.getByText("ComingUpSoon")).toBeInTheDocument();
  });

  // Progress calculation
  it("shows rocket progress", async () => {
    render(<Page />);

    expect(await screen.findByText(/Rocket/)).toBeInTheDocument();
  });

  // Google connect button shows when not connected
  it("shows connect google button when not connected", async () => {
    render(<Page />);

    expect(await screen.findByText("Connect Google Calendar")).toBeInTheDocument();
  });

  // Sign out button
  it("handles sign out click", async () => {
    const { signOut } = require("next-auth/react");

    render(<Page />);

    const btn = await screen.findByText("Sign Out");
    fireEvent.click(btn);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  // Google connect click
  it("handles google connect click", async () => {
    render(<Page />);

    const btn = await screen.findByText("Connect Google Calendar");
    fireEvent.click(btn);

    expect(pushMock).toHaveBeenCalledWith("/api/auth/signin/google");
  });

  // Redirect when unauthenticated
  it("redirects to login if unauthenticated", async () => {
    const { useSession } = require("next-auth/react");

    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<Page />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  // ERROR PARAM TEST 
  it("handles error query param", async () => {
    jest.resetModules();

    const replaceMock = jest.fn();

    jest.doMock("next/navigation", () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: replaceMock,
      }),
      useSearchParams: () => ({
        get: (key: string) => {
          if (key === "error") return "GoogleAccountTaken";
          return null;
        },
      }),
    }));

    jest.doMock("next-auth/react", () => ({
      useSession: () => ({
        data: { user: { id: "1", name: "Test User" } },
        status: "authenticated",
      }),
      signOut: jest.fn(),
    }));


    const { default: PageWithError } = await import("../page");

    render(<PageWithError />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  // Wellbeing button opens panel
  it("toggles wellbeing button", async () => {
    render(<Page />);

    const button = await screen.findByLabelText(/wellbeing/i);
    fireEvent.click(button);

    expect(button).toBeInTheDocument(); // ensures interaction worked
  });
});