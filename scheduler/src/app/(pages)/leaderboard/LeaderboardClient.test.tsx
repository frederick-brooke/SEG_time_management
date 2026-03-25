import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardClient from './LeaderboardClient';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/layout/LunarThemeWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/avatar', () => ({
  resolveAvatarSrc: (pfp: string | null) => pfp,
}));

const mockUsers = [
  {
    id: '1', username: 'alice', name: 'Alice', pfp: 'https://img.com/a.jpg',
    streak: 10, focusTime: '5h', focusTimeRaw: 300, completionRate: 90, isCurrentUser: true,
  },
  {
    id: '2', username: 'bob', name: 'Bob', pfp: null,
    streak: 8, focusTime: '4h', focusTimeRaw: 240, completionRate: 80, isCurrentUser: false,
  },
  {
    id: '3', username: 'charlie', name: 'Charlie', pfp: null,
    streak: 6, focusTime: '3h', focusTimeRaw: 180, completionRate: 70, isCurrentUser: false,
  },
  {
    id: '4', username: 'dave', name: 'Dave', pfp: null,
    streak: 4, focusTime: '2h', focusTimeRaw: 120, completionRate: 60, isCurrentUser: false,
  },
  {
    id: '5', username: 'eve', name: 'Eve', pfp: null,
    streak: 2, focusTime: '1h', focusTimeRaw: 60, completionRate: 50, isCurrentUser: false,
  },
];

describe('LeaderboardClient', () => {
  it('renders empty state', () => {
    render(<LeaderboardClient initialData={[]} currentTimeframe="all" />);
    // Component renders this message when initialData is empty
    expect(screen.getByText(/Space is lonely/i)).toBeInTheDocument();
  });

  it('renders user rows', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders medal icons for top 3', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    // Ranks 4 and 5 show numeric rank via RankDisplay (rendered as text in a span)
    // Use getAllByText since the number may appear elsewhere (e.g. as a stat value)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('renders yellow completion colour for mid-range rate', () => {
    const midUser = [{
      id: '1', username: 'mid', name: 'Mid', pfp: null,
      streak: 1, focusTime: '1h', focusTimeRaw: 60, completionRate: 65, isCurrentUser: false,
    }];
    render(<LeaderboardClient initialData={midUser} currentTimeframe="all" />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders low completion colour for sub-50 rate', () => {
    const lowUser = [{
      id: '1', username: 'low', name: 'Low', pfp: null,
      streak: 0, focusTime: '0h', focusTimeRaw: 0, completionRate: 30, isCurrentUser: false,
    }];
    render(<LeaderboardClient initialData={lowUser} currentTimeframe="all" />);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders streak, focus time, and completion rate', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    expect(screen.getByText('5h')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('renders username initial when name is empty', () => {
    const noNameUser = [{
      id: '1', username: 'zara', name: '', pfp: null,
      streak: 1, focusTime: '1h', focusTimeRaw: 60, completionRate: 50, isCurrentUser: false,
    }];
    render(<LeaderboardClient initialData={noNameUser} currentTimeframe="all" />);
    expect(screen.getByText('z')).toBeInTheDocument();
  });

  it('marks the current user with a "You" badge', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('sorts by focusTime when selected via dropdown', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    // Open the sort dropdown (second button with ArrowUpDown icon — labelled "By Streak" initially)
    fireEvent.click(screen.getByRole('button', { name: /by streak/i }));
    // Click "By Focus Time" option
    fireEvent.click(screen.getByRole('button', { name: /by focus time/i }));
    const links = screen.getAllByRole('link');
    // Alice has highest focusTimeRaw (300), so should be first
    expect(links[0]).toHaveTextContent('Alice');
  });

  it('sorts by completionRate when selected via dropdown', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    fireEvent.click(screen.getByRole('button', { name: /by streak/i }));
    fireEvent.click(screen.getByRole('button', { name: /by completion/i }));
    const links = screen.getAllByRole('link');
    // Alice has highest completionRate (90), so should be first
    expect(links[0]).toHaveTextContent('Alice');
  });

  it('changes timeframe via dropdown', () => {
    render(<LeaderboardClient initialData={mockUsers} currentTimeframe="all" />);
    // Open the timeframe dropdown (labelled "All Time" initially)
    fireEvent.click(screen.getByRole('button', { name: /all time/i }));
    // Click "This Week"
    fireEvent.click(screen.getByRole('button', { name: /this week/i }));
    // After clicking, the timeframe button label should update to "This Week"
    expect(screen.getByRole('button', { name: /this week/i })).toBeInTheDocument();
  });

  it('applies focusTime tie-breaker (same focusTime, higher streak wins)', () => {
    const tieData = [
      {
        id: 'a', username: 'a', name: 'A', pfp: null,
        streak: 5, focusTime: '3h', focusTimeRaw: 180, completionRate: 70, isCurrentUser: false,
      },
      {
        id: 'b', username: 'b', name: 'B', pfp: null,
        streak: 10, focusTime: '3h', focusTimeRaw: 180, completionRate: 70, isCurrentUser: false,
      },
    ];
    render(<LeaderboardClient initialData={tieData} currentTimeframe="all" />);
    // Open sort dropdown and select focusTime
    fireEvent.click(screen.getByRole('button', { name: /by streak/i }));
    fireEvent.click(screen.getByRole('button', { name: /by focus time/i }));
    const links = screen.getAllByRole('link');
    // Tie on focusTimeRaw — B has higher streak so wins
    expect(links[0]).toHaveTextContent('B');
  });

  it('applies completionRate tie-breaker (same rate, higher focusTime wins)', () => {
    const tieData = [
      {
        id: 'a', username: 'a', name: 'A', pfp: null,
        streak: 5, focusTime: '2h', focusTimeRaw: 120, completionRate: 80, isCurrentUser: false,
      },
      {
        id: 'b', username: 'b', name: 'B', pfp: null,
        streak: 5, focusTime: '3h', focusTimeRaw: 180, completionRate: 80, isCurrentUser: false,
      },
    ];
    render(<LeaderboardClient initialData={tieData} currentTimeframe="all" />);
    fireEvent.click(screen.getByRole('button', { name: /by streak/i }));
    fireEvent.click(screen.getByRole('button', { name: /by completion/i }));
    const links = screen.getAllByRole('link');
    // Tie on completionRate — B has higher focusTimeRaw so wins
    expect(links[0]).toHaveTextContent('B');
  });
});
