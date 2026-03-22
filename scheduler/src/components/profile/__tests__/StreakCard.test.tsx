import { render, screen } from '@testing-library/react';
import StreakCard from '../StreakCard';
import '@testing-library/jest-dom';

// mocks
// Prevents Next.js router context errors by rendering a plain anchor tag
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('StreakCard', () => {

  // Confirms the streak number and label render correctly in the base case
  it('renders the streak number and Day Streak label', () => {
    render(<StreakCard streak={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  // Confirms no leaderboard link appears when the rank prop is omitted
  it('does not render leaderboard link when no rank is provided', () => {
    render(<StreakCard streak={15} />);
    expect(screen.queryByText(/on leaderboard/i)).not.toBeInTheDocument();
  });

  // Confirms rank 0 is treated as no rank — the link should remain hidden
  it('does not render leaderboard link when rank is 0', () => {
    render(<StreakCard streak={5} rank={0} />);
    expect(screen.queryByText(/on leaderboard/i)).not.toBeInTheDocument();
  });

  // Confirms a valid rank shows the rank number, the label, and links to /leaderboard
  it('renders leaderboard link when a valid rank is provided', () => {
    render(<StreakCard streak={42} rank={3} />);
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('on leaderboard')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/leaderboard');
  });

  // Confirms the card handles a streak of zero without crashing
  it('renders a streak of 0 without errors', () => {
    render(<StreakCard streak={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});