//tests for scheduler/src/components/profile/FriendsList.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FriendsList from '../FriendsList';
import '@testing-library/jest-dom';

// mocks
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

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

describe('FriendsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Confirms friend full name and username are rendered.
   */
  it('renders friend names and usernames', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  /**
   * Confirms the heading shows the correct count of friends.
   */
  it('renders correct count in heading', () => {
    render(
      <FriendsList
        friends={[makeFriend(), makeFriend({ id: 'f2', username: 'bob', fname: 'Bob', lname: 'Jones' })]}
        isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false}
      />
    );
    expect(screen.getByText(/My Friends \(2\)/)).toBeInTheDocument();
  });

  /**
   * Confirms proper heading text based on profile ownership.
   */
  it('shows "My Friends" heading when own profile, and "Friends" for others', () => {
    const { rerender } = render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText(/My Friends/)).toBeInTheDocument();

    rerender(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText(/^Friends \(1\)/)).toBeInTheDocument();
  });

  /**
   * Verifies the "Remove" button visibility based on profile ownership.
   */
  it('shows remove button on own profile but hides it on other profiles', () => {
    const { rerender } = render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('Remove')).toBeInTheDocument();

    rerender(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  /**
   * Confirms the onRemoveFriend callback fires correctly.
   */
  it('calls onRemoveFriend when Remove is clicked', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    fireEvent.click(screen.getByText('Remove'));
    expect(mockOnRemoveFriend).toHaveBeenCalledWith('f1', expect.any(Object));
  });

  /**
   * Confirms the remove button is disabled during a pending transition.
   */
  it('disables remove button when isPending is true', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={true} />
    );
    const removeBtn = screen.getByText('Remove').closest('button');
    expect(removeBtn).toBeDisabled();
    expect(removeBtn).toHaveClass('opacity-50');
  });

  /**
   * Confirms the X button triggers the onClose callback.
   */
  it('calls onClose when X button is clicked', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    fireEvent.click(screen.getByTestId('x-icon').closest('button')!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Confirms empty state messages render correctly based on profile ownership.
   */
  it('shows appropriate empty states when the friend list is empty', () => {
    const { rerender } = render(
      <FriendsList friends={[]} isOwnProfile={true} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('No friends yet. Start adding friends!')).toBeInTheDocument();

    rerender(
      <FriendsList friends={[]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('No friends to show.')).toBeInTheDocument();
  });

  /**
   * Confirms each friend entry links to their correct profile page.
   */
  it('renders the friend profile link with correct href', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile/alice');
  });

  /**
   * Confirms the avatar fallback renders when no pfp is provided.
   */
  it('renders initials when no pfp is provided', () => {
    render(
      <FriendsList friends={[makeFriend()]} isOwnProfile={false} onClose={mockOnClose} onRemoveFriend={mockOnRemoveFriend} isPending={false} />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});