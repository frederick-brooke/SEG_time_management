import { render, screen } from '@testing-library/react';
import StreakCard from '../StreakCard';
import '@testing-library/jest-dom';

// Mock Next.js Link to prevent router context errors
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('StreakCard Component', () => {
  
  it('renders the streak correctly when no rank is provided', () => {
    render(<StreakCard streak={15} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    // Ensure the leaderboard link does not exist
    expect(screen.queryByText(/on leaderboard/i)).not.toBeInTheDocument();
  });

  it('does not render the leaderboard link if rank is 0', () => {
    render(<StreakCard streak={5} rank={0} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText(/on leaderboard/i)).not.toBeInTheDocument();
  });

  it('renders the leaderboard link when a valid rank is provided', () => {
    render(<StreakCard streak={42} rank={3} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
    
    // Check that the rank text and link rendered properly
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('on leaderboard')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/leaderboard');
  });
});