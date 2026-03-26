import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePageClient from "../ProfilePageClient";
import { removeFriend } from "@/app/actions/profile";
import { calculateLevelProgress } from "@/app/actions/profile/xpUtils";

// ── 1. Mock Actions ────────────────────────────────────────────────────────
jest.mock("@/app/actions/profile", () => ({
  removeFriend: jest.fn(),
}));

jest.mock("@/app/actions/profile/xpUtils", () => ({
  calculateLevelProgress: jest.fn().mockReturnValue({
    level: 5,
    xpBarWidth: 50,
    xpToNext: 100,
  }),
}));

// ── 2. Mock Child Components ───────────────────────────────────────────────
jest.mock("@/components/profile/ProfileHeader", () => ({ onEditToggle }: any) => (
  <div data-testid="profile-header">
    <button onClick={onEditToggle}>Toggle Edit</button>
  </div>
));
jest.mock("@/components/profile/EditProfileForm", () => ({ onClose }: any) => (
  <div data-testid="edit-profile-form">
    <button onClick={onClose}>Close Edit</button>
  </div>
));
jest.mock("@/components/profile/ProfileBio", () => () => <div data-testid="profile-bio" />);
jest.mock("@/components/profile/StreakCard", () => () => <div data-testid="streak-card" />);
jest.mock("@/components/profile/FriendStatCard", () => ({ onToggle }: any) => (
  <div data-testid="friend-stat-card">
    <button onClick={onToggle}>Toggle Friends</button>
  </div>
));
jest.mock("@/components/profile/TaskStatsCard", () => () => <div data-testid="task-stats-card" />);
jest.mock("@/components/profile/FriendsList", () => ({ onClose, onRemoveFriend }: any) => (
  <div data-testid="friends-list">
    <button onClick={onClose}>Close Friends</button>
    <button onClick={(e) => onRemoveFriend("friend-123", e)}>Remove Friend</button>
  </div>
));
jest.mock("@/components/profile/PendingRequests", () => () => <div data-testid="pending-requests" />);
jest.mock("@/components/profile/PointsCard", () => () => <div data-testid="points-card" />);
jest.mock("@/components/layout/LunarThemeWrapper", () => ({ children }: any) => <div data-testid="lunar-wrapper">{children}</div>);

// ── 3. Test Suite ──────────────────────────────────────────────────────────
describe("ProfilePageClient", () => {
  const defaultProfile = {
    progress: { experience: 500, coins: 50 },
    stats: { streak: 5, friendCount: 10 },
    bio: "Test Bio",
    friends: [{ id: "friend-123" }],
    receivedRequests: [{ id: "req-1" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn();
  });

  it("renders with full profile data and toggles edit mode", () => {
    render(<ProfilePageClient profile={defaultProfile} isOwnProfile={true} rank={1} />);
    
    fireEvent.click(screen.getByText("Toggle Edit"));
    expect(screen.getByTestId("edit-profile-form")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Edit"));
    expect(screen.queryByTestId("edit-profile-form")).not.toBeInTheDocument();
  });

  it("renders with missing/null profile data to cover fallback branches (?? 0)", () => {
    render(<ProfilePageClient profile={{}} isOwnProfile={true} rank={1} />);
    expect(screen.getByTestId("profile-header")).toBeInTheDocument();
  });

  it("toggles friends list visibility", () => {
    render(<ProfilePageClient profile={defaultProfile} isOwnProfile={true} />);
    
    fireEvent.click(screen.getByText("Toggle Friends"));
    expect(screen.getByTestId("friends-list")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Friends"));
    expect(screen.queryByTestId("friends-list")).not.toBeInTheDocument();
  });

  it("calls removeFriend when confirmation is accepted", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    render(<ProfilePageClient profile={defaultProfile} isOwnProfile={true} />);
    
    fireEvent.click(screen.getByText("Toggle Friends"));
    fireEvent.click(screen.getByText("Remove Friend"));
    
    expect(window.confirm).toHaveBeenCalledWith("Remove this friend?");
    
    await waitFor(() => {
      expect(removeFriend).toHaveBeenCalledWith("friend-123");
    });
  });

  it("does not call removeFriend when confirmation is cancelled", async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    render(<ProfilePageClient profile={defaultProfile} isOwnProfile={true} />);
    
    fireEvent.click(screen.getByText("Toggle Friends"));
    fireEvent.click(screen.getByText("Remove Friend"));
    
    expect(window.confirm).toHaveBeenCalledWith("Remove this friend?");
    expect(removeFriend).not.toHaveBeenCalled();
  });
  
  it("hides pending requests if isOwnProfile is false", () => {
    render(<ProfilePageClient profile={defaultProfile} isOwnProfile={false} />);
    expect(screen.queryByTestId("pending-requests")).not.toBeInTheDocument();
  });
});