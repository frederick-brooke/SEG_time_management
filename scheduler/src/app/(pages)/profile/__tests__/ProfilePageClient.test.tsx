import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePageClient from '../ProfilePageClient';
import '@testing-library/jest-dom';

//mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "u123", email: "test@test.com" } },
    status: "authenticated",
  }),
}));

jest.mock("@/app/actions/profile/utils", () => ({ __esModule: true }));
jest.mock("@/app/actions/profile/xpUtils", () => ({
  calculateLevelProgress: () => ({ level: 5, xpBarWidth: 50, xpToNext: 50 }),
}));
jest.mock('@/app/actions/profile', () => ({
  sendFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  cancelFriendRequest: jest.fn(),
}));

jest.mock('@/components/layout/LunarThemeWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="lunar-wrapper">{children}</div>
  ),
}));
jest.mock('@/components/profile/EditProfileForm', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-form">EditForm Mock</div>,
}));
jest.mock('@/components/profile/FriendsList', () => ({
  __esModule: true,
  default: () => <div data-testid="friends-list">FriendsList Mock</div>,
}));
jest.mock('@/components/profile/PendingRequests', () => ({
  __esModule: true,
  default: () => <div data-testid="pending-requests">PendingRequests Mock</div>,
}));
jest.mock('@/components/admin/report-modal', () => ({
  __esModule: true,
  default: () => <div data-testid="report-modal">Report Modal Mock</div>,
}));
jest.mock('@/components/profile/FriendStatCard', () => ({
  __esModule: true,
  default: ({ onToggle }: any) => (
    <button data-testid="friend-stat-card" onClick={onToggle}>FriendStat Mock</button>
  ),
}));
jest.mock('@/components/profile/ProfileBio', () => ({
  __esModule: true,
  default: ({ bio }: { bio: string }) => <div data-testid="profile-bio">{bio}</div>,
}));
jest.mock('@/components/profile/TaskStatsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="task-stats-card">TaskStats Mock</div>,
}));

//ICON MOCKS
jest.mock('lucide-react', () => ({
  Users: () => <svg data-testid="icon-users" />,
  UserPlus: () => <svg data-testid="icon-userplus" />,
  UserCheck: () => <svg data-testid="icon-usercheck" />,
  Clock: () => <svg data-testid="icon-clock" />,
  UserMinus: () => <svg data-testid="icon-userminus" />,
  Flag: () => <svg data-testid="icon-flag" />,
  Star: () => <svg data-testid="icon-star" />,
  Pencil: () => <svg data-testid="icon-pencil" />,
  X: () => <svg data-testid="icon-x" />,
}));

//shared mock data
const mockProfile = {
  id: "u123",
  username: "lunar_dev",
  fname: "Lunar",
  lname: "Developer",
  bio: "Building the future of productivity.",
  createdAt: "2026-01-01T00:00:00.000Z",
  pfp: null,
  progress: { level: 5, experience: 550 },
  stats: { 
    streak: 12, 
    friendCount: 8, 
    completedTasks: 45, 
    totalTasks: 50, 
    completionRate: 90 
  },
  friends: [],
  receivedRequests: [{ id: 'req1' }],
  friendStatus: "NONE"
};

//tests
describe('ProfilePageClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silences window.confirm if it's called during tests
    window.confirm = jest.fn(() => true);
  });

  /**
   * Verifies that basic profile information like name, username, and level
   * are displayed correctly on initial load.
   */
  it('renders primary profile information and level badge', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    expect(screen.getByText(/Lunar Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/@lunar_dev/i)).toBeInTheDocument();
    // Checks level badge
    expect(screen.getByText("5", { selector: '.text-3xl' })).toBeInTheDocument();
    // Checks bio
    expect(screen.getByText(/Building the future/i)).toBeInTheDocument();
  });

  /**
   * Ensures that the "Edit" pencil icon and "Pending Requests" are only visible
   * when the user is viewing their own profile.
   */
  it('displays ownership controls only on own profile', () => {
    const { rerender } = render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    expect(screen.getByTestId('icon-pencil')).toBeInTheDocument();
    expect(screen.getByTestId('pending-requests')).toBeInTheDocument();

    // Rerender as if viewing someone else
    rerender(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    
    expect(screen.queryByTestId('icon-pencil')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-requests')).not.toBeInTheDocument();
  });

  /**
   * Tests the toggle functionality for the Edit Profile form.
   */
  it('toggles the EditProfileForm when the pencil icon is clicked', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
    
    const editBtn = screen.getByTitle('Edit Profile');
    fireEvent.click(editBtn);
    
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
  });

  /**
   * Verifies that clicking the Friends Stat card expands the detailed FriendsList.
   */
  it('expands the FriendsList when the friend stat card is toggled', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    expect(screen.queryByTestId('friends-list')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('friend-stat-card'));
    
    expect(screen.getByTestId('friends-list')).toBeInTheDocument();
  });

  /**
   * Tests the conditional rendering of the Report button (should only be 
   * visible on other users' profiles).
   */
  it('shows the Report Modal when the report button is clicked', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Report/i}));
    
    expect(screen.getByTestId('report-modal')).toBeInTheDocument();
  });

  /**
   * Comprehensive check of the FriendRequestAction sub-logic:
   * Verifies the button text/state for every possible 'friendStatus'.
   */
  describe('FriendRequestAction logic', () => {
    
    it('shows "Add Friend" when status is NONE', () => {
      render(<ProfilePageClient profile={{...mockProfile, friendStatus: 'NONE'}} isOwnProfile={false} />);
      expect(screen.getByText(/Add Friend/i)).toBeInTheDocument();
    });

    it('shows "Friends" badge and "Remove" button when status is FRIENDS', () => {
      render(<ProfilePageClient profile={{...mockProfile, friendStatus: 'FRIENDS'}} isOwnProfile={false} />);
      expect(screen.getByText("Friends")).toBeInTheDocument();
      expect(screen.getByText("Remove")).toBeInTheDocument();
    });

    it('shows "Request Pending" when status is REQUEST_SENT', () => {
      render(<ProfilePageClient profile={{...mockProfile, friendStatus: 'REQUEST_SENT'}} isOwnProfile={false} />);
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    it('shows "Wants to be Friends" when status is REQUEST_RECEIVED', () => {
      render(<ProfilePageClient profile={{...mockProfile, friendStatus: 'REQUEST_RECEIVED'}} isOwnProfile={false} />);
      expect(screen.getByText(/Wants to be Friends/i)).toBeInTheDocument();
    });
  });

  /**
   * Verifies the XP bar progress calculation logic correctly updates the style.
   */
  it('calculates and displays the correct XP progress width', () => {
    // 550 total points / 100 XP per level = 50 XP into level 5 (50% bar)
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    const levelInfo = screen.getByText(/50 XP away/i).closest('div');
    const xpBar = levelInfo?.querySelector('.bg-yellow-400');
    expect(xpBar).toHaveStyle('width: 50%');
    expect(screen.getByText(/50 XP away/i)).toBeInTheDocument();
  });
});