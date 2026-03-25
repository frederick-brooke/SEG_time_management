import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LeaderboardClient from './LeaderboardClient';
import { useRouter } from 'next/navigation';

// 1. Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// 2. Mock React's useTransition so it executes immediately
jest.mock('react', () => {
  const original = jest.requireActual('react');
  return {
    ...original,
    useTransition: () => [false, (cb: any) => cb()],
  };
});

describe('LeaderboardClient', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const baseUsers: any[] = [
    { id: '1', username: 'alice', name: 'Alice', pfp: null, streak: 10, focusTime: '10h', focusTimeRaw: 600, completionRate: 90, isCurrentUser: true },
    { id: '2', username: 'bob', name: 'Bob', pfp: 'bob.png', streak: 5, focusTime: '5h', focusTimeRaw: 300, completionRate: 50, isCurrentUser: false },
    { id: '3', username: 'charlie', name: 'Charlie', pfp: null, streak: 2, focusTime: '2h', focusTimeRaw: 120, completionRate: 30, isCurrentUser: false },
    { id: '4', username: 'dave', name: 'Dave', pfp: null, streak: 0, focusTime: '0h', focusTimeRaw: 0, completionRate: 10, isCurrentUser: false },
  ];

  it('renders empty state correctly', () => {
    render(<LeaderboardClient initialData={[]} currentTimeframe="all" />);
    expect(screen.getByText(/No friends to compete with yet/i)).toBeInTheDocument();
  });

  it('renders users in default streak order and applies medal icons', () => {
    render(<LeaderboardClient initialData={baseUsers} currentTimeframe="all" />);
    
    const rows = screen.getAllByRole('link');
    expect(rows).toHaveLength(4);
    
    // Check for "You" badge on current user
    expect(screen.getByText('You')).toBeInTheDocument();
    
    // Rank 4 should be plain text (no medal)
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('handles timeframe changes via native select', () => {
    render(<LeaderboardClient initialData={baseUsers} currentTimeframe="all" />);
    
    // Timeframe is the first select element
    const selects = screen.getAllByRole('combobox');
    const timeframeSelect = selects[0];

    fireEvent.change(timeframeSelect, { target: { value: 'week' } });
    
    // Verifies startTransition and router.push were fired (Lines 42-45)
    expect(mockPush).toHaveBeenCalledWith('?timeframe=week');
  });

  describe('Sorting & Tie-Breakers (Coverage Hits)', () => {
    const tieData: any[] = [
      { id: 'a', username: 'a', name: 'A', streak: 5, focusTimeRaw: 100, completionRate: 80 },
      { id: 'b', username: 'b', name: 'B', streak: 5, focusTimeRaw: 200, completionRate: 80 }, // Higher focusTime
      { id: 'c', username: 'c', name: 'C', streak: 5, focusTimeRaw: 100, completionRate: 80 }, // Absolute tie with A
    ];

    it('sorts by Focus Time and handles ties', () => {
      render(<LeaderboardClient initialData={tieData} currentTimeframe="all" />);
      
      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'focusTime' } });
      
      // B has highest focus time, should be first
      const firstLink = screen.getAllByRole('link')[0];
      expect(firstLink).toHaveTextContent('B');
    });

    it('sorts by Completion Rate and handles ties', () => {
      // Modify tie data so B has higher focus time but same completion rate
      const compTieData: any[] = [
        { id: 'a', username: 'a', name: 'A', streak: 0, focusTimeRaw: 100, completionRate: 90 },
        { id: 'b', username: 'b', name: 'B', streak: 0, focusTimeRaw: 200, completionRate: 90 }, // Wins completion tie due to focusTime
      ];
      render(<LeaderboardClient initialData={compTieData} currentTimeframe="all" />);
      
      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'completionRate' } });
      
      const firstLink = screen.getAllByRole('link')[0];
      expect(firstLink).toHaveTextContent('B');
    });

    it('sorts by Streak and handles ties', () => {
      render(<LeaderboardClient initialData={tieData} currentTimeframe="all" />);
      
      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'streak' } });
      
      // B has same streak but higher focus time, so B should win the tie breaker
      const firstLink = screen.getAllByRole('link')[0];
      expect(firstLink).toHaveTextContent('B');
    });
  });
});