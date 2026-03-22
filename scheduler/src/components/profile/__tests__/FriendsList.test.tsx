import { render, screen, fireEvent } from '@testing-library/react';
import FriendsList from '../FriendsList';
import '@testing-library/jest-dom';

// mocks
// Prevents Next.js router context errors by rendering a plain anchor tag
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Replaces icons with testable SVG elements
jest.mock('lucide-react', () => ({
  Users: () => <svg data-testid="users-icon" />,
  X: () => <svg data-testid="x-icon" />,
  UserMinus: () => <svg data-testid="userminus-icon" />,
}));

const mockOnClose = jest.fn();
const mockOnRemoveFriend = jest.fn();

const makeFriend = (overrides = {}) => ({
  id: 'f1',
  username: 'alice',
  fname: 'Alice',
  lname: 'Smith',
  pfp: null,
  ...overrides,
});

describe('FriendsList', () => {
  beforeEach(() => jest.clearAllMocks());

  // Confirms friend full name and username are rendered in the list
  it('renders friend names and usernames', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  // Confirms the heading shows the correct count of friends
  it('renders correct count in heading', () => {
    render(
      <FriendsList
        friends={[makeFriend(), makeFriend({ id: 'f2', username: 'bob', fname: 'Bob', lname: 'Jones' })]}
        isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false}
      />
    );
    expect(screen.getByText(/My Friends \(2\)/)).toBeInTheDocument();
  });

  // Confirms the heading says "My Friends" when viewing your own profile
  it('shows "My Friends" heading when own profile', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText(/My Friends/)).toBeInTheDocument();
  });

  // Confirms the heading says "Friends" when viewing someone else's profile
  it('shows "Friends" heading when viewing another profile', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText(/^Friends \(1\)/)).toBeInTheDocument();
  });

  // Confirms the remove button is visible when viewing your own friend list
  it('shows remove button on own profile', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  // Confirms the remove button is hidden when viewing someone else's profile
  it('does not show remove button on other profiles', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  // Confirms the onRemoveFriend callback fires with the correct friend ID when Remove is clicked
  it('calls onRemoveFriend when Remove is clicked', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    fireEvent.click(screen.getByText('Remove'));
    expect(mockOnRemoveFriend).toHaveBeenCalledWith('f1', expect.any(Object));
  });

  // Confirms the remove button is disabled while a transition is in progress to prevent double clicks
  it('disables remove button when isPending is true', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={true} />
    );
    expect(screen.getByText('Remove').closest('button')).toBeDisabled();
  });

  // Confirms the X button at the top of the list triggers the onClose callback
  it('calls onClose when X button is clicked', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    fireEvent.click(screen.getByTestId('x-icon').closest('button')!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Confirms the own-profile empty state message renders when the user has no friends
  it('shows empty state on own profile with no friends', () => {
    render(
      <FriendsList friends={[]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('No friends yet. Start adding friends!')).toBeInTheDocument();
  });

  // Confirms the other-profile empty state message renders when the viewed user has no friends
  it('shows empty state on other profile with no friends', () => {
    render(
      <FriendsList friends={[]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('No friends to show.')).toBeInTheDocument();
  });

  // Confirms each friend entry links to their profile page
  it('renders the friend profile link with correct href', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile/alice');
  });

  // Confirms the first letter of the first name renders as an avatar fallback when no pfp is set
  it('renders initials when no pfp is provided', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});