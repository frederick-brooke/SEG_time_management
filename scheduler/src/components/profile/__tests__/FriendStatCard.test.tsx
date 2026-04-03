//tests for scheduler/src/components/profile/FriendStatCard.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FriendStatCard from '../FriendStatCard';
import '@testing-library/jest-dom';

// mocks
// Replaces icons with testable SVG elements
jest.mock('lucide-react', () => ({
  Users: () => <svg data-testid="users-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down" />,
  ChevronUp: () => <svg data-testid="chevron-up" />,
}));

describe('FriendStatCard', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  // Confirms the friend count number is displayed prominently on the card
  it('renders the friend count', () => {
    render(<FriendStatCard friendCount={7} showFriends={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  // Confirms the Friends label is always visible regardless of toggle state
  it('renders the Friends label', () => {
    render(<FriendStatCard friendCount={0} showFriends={false} onToggle={mockOnToggle} />);
    expect(screen.getByText(/Friends/)).toBeInTheDocument();
  });

  // Confirms the down chevron renders when the friends list is currently hidden
  it('shows ChevronDown when friends list is hidden', () => {
    render(<FriendStatCard friendCount={3} showFriends={false} onToggle={mockOnToggle} />);
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument();
  });

  // Confirms the up chevron renders when the friends list is currently visible
  it('shows ChevronUp when friends list is visible', () => {
    render(<FriendStatCard friendCount={3} showFriends={true} onToggle={mockOnToggle} />);
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
  });

  // Confirms clicking the card triggers the onToggle callback exactly once
  it('calls onToggle when the card is clicked', () => {
    render(<FriendStatCard friendCount={5} showFriends={false} onToggle={mockOnToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  // Confirms the active border styling is applied when the friends list is open
  it('applies active border styling when showFriends is true', () => {
    render(<FriendStatCard friendCount={5} showFriends={true} onToggle={mockOnToggle} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-blue-400/50');
  });

  // Confirms the card renders zero without crashing for users with no friends yet
  it('renders zero friends correctly', () => {
    render(<FriendStatCard friendCount={0} showFriends={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // Confirms the Users icon renders as the visual identifier of the card
  it('renders the users icon', () => {
    render(<FriendStatCard friendCount={2} showFriends={false} onToggle={mockOnToggle} />);
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });
});