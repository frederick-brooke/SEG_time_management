import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePageClient from '../ProfilePageClient';
import '@testing-library/jest-dom';

// 1. Mock Sub-components to isolate the test (V.2.2 Low Coupling)
jest.mock('components/profile/EditProfileForm', () => () => <div data-testid="edit-form">EditForm Mock</div>);
jest.mock('components/profile/FriendsList', () => () => <div data-testid="friends-list">FriendsList Mock</div>);
jest.mock('components/profile/PendingRequests', () => () => <div data-testid="pending-requests">PendingRequests Mock</div>);
jest.mock('components/profile/StreakCard', () => () => <div data-testid="streak-card">StreakCard Mock</div>);
jest.mock('components/profile/TaskStatsCard', () => () => <div data-testid="task-stats-card">TaskStatsCard Mock</div>);
jest.mock('components/admin/report-modal', () => () => <div data-testid="report-modal">Report Modal Mock</div>);

// 2. Mock Server Actions & Dependencies
jest.mock('../../actions/profile', () => ({
  sendFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  cancelFriendRequest: jest.fn(),
}));

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'), // Keep actual icons for simple ones
  Pencil: () => <svg data-testid="pencil-icon" />,
  Flag: () => <svg data-testid="flag-icon" />,
}));

// 3. Shared Mock Data (V.3.6 Minimal Repetition)
const mockProfile = {
  id: "123",
  username: "testuser",
  fname: "Test",
  lname: "User",
  bio: "This is a test bio.",
  createdAt: "2024-01-01T00:00:00.000Z",
  progress: { level: 2, points: 150 },
  stats: { streak: 5, friendCount: 2, completedTasks: 10, totalTasks: 10, completionRate: 100 },
  friends: [{ id: "f1", username: "friend1" }],
  receivedRequests: [{ id: "req1", sender: { username: "sender1" } }],
  friendStatus: "NONE"
};

describe('ProfilePageClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders core profile data and base sub-components', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    
    // Verifies the child components were called
    expect(screen.getByTestId('streak-card')).toBeInTheDocument();
    expect(screen.getByTestId('task-stats-card')).toBeInTheDocument();
  });

  it('renders own-profile specifics (Edit toggle, Pending Requests)', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    // Should show pencil icon, should NOT show report flag
    expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('flag-icon')).not.toBeInTheDocument();
    
    // Should show pending requests for own profile
    expect(screen.getByTestId('pending-requests')).toBeInTheDocument();
  });

  it('renders other-profile specifics (Report button, NO pending requests)', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    
    // Should show report flag, should NOT show pencil icon
    expect(screen.getByTestId('flag-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('pencil-icon')).not.toBeInTheDocument();
    
    // Pending requests are hidden on someone else's profile
    expect(screen.queryByTestId('pending-requests')).not.toBeInTheDocument();
  });

  it('toggles the EditProfileForm when the pencil icon is clicked', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    // Initially not in the document
    expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
    
    // Click the pencil
    const editButton = screen.getByTestId('pencil-icon').closest('button');
    fireEvent.click(editButton!);
    
    // Now it should be rendered
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
  });

  it('toggles the FriendsList sub-component when the friends card is clicked', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    // Initially hidden
    expect(screen.queryByTestId('friends-list')).not.toBeInTheDocument();
    
    // Find the button wrapping the text "Friends"
    const friendsToggle = screen.getByText(/Friends/i).closest('button');
    fireEvent.click(friendsToggle!);
    
    // The mocked FriendsList should now be on screen
    expect(screen.getByTestId('friends-list')).toBeInTheDocument();
  });
});