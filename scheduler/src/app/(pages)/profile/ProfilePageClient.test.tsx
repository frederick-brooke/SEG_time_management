import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePageClient from './ProfilePageClient';
import '@testing-library/jest-dom';

// 1. Mock Server Actions
jest.mock('../../actions/profile', () => ({
  updateProfile: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
  sendFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  cancelFriendRequest: jest.fn(),
}));

// 2. Mock Next.js & React features
jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, jest.fn()],
}));

// 3. Mock UI Components to prevent deep rendering errors
jest.mock('components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  SidebarInset: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('components/app-sidebar', () => ({ AppSidebar: () => <nav>Sidebar</nav> }));
jest.mock('components/site-header', () => ({ SiteHeader: () => <header>Header</header> }));
jest.mock('components/admin/report-modal', () => () => <div>Report Modal</div>);

// 4. Expanded Fake Profile Data to hit all UI branches
const mockProfile = {
  id: "123",
  username: "testuser",
  fname: "Test",
  lname: "User",
  bio: "Hello world!",
  createdAt: "2023-01-01T00:00:00.000Z",
  pfp: "https://img.com/pfp.jpg",
  stats: { 
    streak: 12, 
    friendCount: 5, 
    completedTasks: 40, 
    totalTasks: 50, 
    completionRate: 80 
  },
  friends: [
    { id: "f1", username: "friend1", fname: "Friend", lname: "One", pfp: "img.jpg" },
    { id: "f2", username: "friend2", fname: "Friend", lname: "Two", pfp: null }
  ],
  receivedRequests: [
    { id: "req1", sender: { id: "s1", username: "sender1", fname: "Sender", pfp: null } }
  ],
  friendStatus: "NONE"
};

describe('ProfilePageClient Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true); // Mocks the browser 'confirm' popup for removing friends
  });

  it('renders the user information and stats correctly', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} rank={3} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); 
    expect(screen.getByText('80')).toBeInTheDocument(); 
  });

  it('toggles friends list and handles remove friend', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    
    // Click the friends button to expand the list
    const friendsButton = screen.getByText(/Friends/i).closest('button');
    fireEvent.click(friendsButton!);
    
    expect(screen.getByText('Friend One')).toBeInTheDocument();
    
    // Click the remove friend button
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    expect(window.confirm).toHaveBeenCalled();
  });

  it('renders the report modal when Report User is clicked', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    const reportBtn = screen.getByText(/Report User/i);
    fireEvent.click(reportBtn);
    expect(screen.getByText('Report Modal')).toBeInTheDocument();
  });

  it('handles Friend Status: NONE (Add Friend button)', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);
    const addBtn = screen.getByText('Add Friend');
    fireEvent.click(addBtn);
  });

  it('handles Friend Status: FRIENDS (Remove Friend button)', () => {
    render(<ProfilePageClient profile={{...mockProfile, friendStatus: "FRIENDS"}} isOwnProfile={false} />);
    
    const friendsText = screen.getAllByText('Friends');
    expect(friendsText.length).toBeGreaterThan(0);
    
    const removeBtn = screen.getByText('Remove');
    fireEvent.click(removeBtn);
  });

  it('handles Friend Status: REQUEST_SENT (Cancel button)', () => {
    render(<ProfilePageClient profile={{...mockProfile, friendStatus: "REQUEST_SENT"}} isOwnProfile={false} />);
    expect(screen.getByText('Request Pending')).toBeInTheDocument();
    
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
  });

  it('handles Friend Status: REQUEST_RECEIVED', () => {
    render(<ProfilePageClient profile={{...mockProfile, friendStatus: "REQUEST_RECEIVED"}} isOwnProfile={false} />);
    expect(screen.getByText('Wants to be Friends')).toBeInTheDocument();
  });

  it('renders pending requests section for own profile', () => {
    render(<ProfilePageClient profile={mockProfile} isOwnProfile={true} />);
    expect(screen.getByText('Pending Friend Requests')).toBeInTheDocument();
    expect(screen.getByText('Sender')).toBeInTheDocument();
  });
});