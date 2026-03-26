import { render, screen } from "@testing-library/react";
import UserProfilePage from "./page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { fetchUsernameByEmail } from "lib/profile-queries";

// ── 1. Mock External Dependencies ───────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/actions/profile", () => ({
  getProfile: jest.fn(),
}));

jest.mock("lib/profile-queries", () => ({
  fetchUsernameByEmail: jest.fn(),
}));

// ── 2. Mock Child Components ────────────────────────────────────────────────

jest.mock("../ProfilePageClient", () => ({
  __esModule: true,
  default: ({ profile, isOwnProfile }: any) => (
    <div data-testid="profile-client">
      {profile.username} - {isOwnProfile ? "own" : "other"}
    </div>
  ),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="theme-wrapper">{children}</div>,
}));

// ── 3. Test Suite ───────────────────────────────────────────────────────────

describe("UserProfilePage (Server Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = (username: string) => Promise.resolve({ username });

  it("redirects to /login if no session is found (Line 18)", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    await UserProfilePage({ params: mockParams("bob") });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /profile if viewing own username (Line 24)", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "alice@test.com" },
    });
    (fetchUsernameByEmail as jest.Mock).mockResolvedValueOnce("alice");

    await UserProfilePage({ params: mockParams("alice") });

    expect(fetchUsernameByEmail).toHaveBeenCalledWith("alice@test.com");
    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("renders 'User not found' if the profile does not exist (Line 30)", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "alice@test.com" },
    });
    (fetchUsernameByEmail as jest.Mock).mockResolvedValueOnce("alice");
    
    (getProfile as jest.Mock).mockResolvedValueOnce(null);

    const ui = await UserProfilePage({ params: mockParams("bob") });
    render(ui);

    expect(screen.getByText("User not found")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByTestId("theme-wrapper")).toBeInTheDocument();
  });

  it("renders ProfilePageClient when viewing another valid user (Line 44)", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "alice@test.com" },
    });
    (fetchUsernameByEmail as jest.Mock).mockResolvedValueOnce("alice");
    
    const mockProfileData = { username: "bob", id: "123" };
    (getProfile as jest.Mock).mockResolvedValueOnce(mockProfileData);

    const ui = await UserProfilePage({ params: mockParams("bob") });
    render(ui);

    expect(screen.getByTestId("profile-client")).toBeInTheDocument();
    expect(screen.getByText("bob - other")).toBeInTheDocument();
  });
});