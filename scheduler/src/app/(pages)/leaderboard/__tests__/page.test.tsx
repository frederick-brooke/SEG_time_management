/**
 * Testing for Leaderboard page.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';


// Mocks 

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/app/actions/leaderboard', () => ({
  getFriendsLeaderboard: jest.fn(),
}));

jest.mock('@/components/layout/LunarThemeWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../LeaderboardClient', () => ({
  __esModule: true,
  default: ({ initialData, currentTimeframe }: { initialData: any[]; currentTimeframe: string }) => (
    <div data-testid="leaderboard-client" data-timeframe={currentTimeframe} data-count={initialData.length} />
  ),
}));

jest.mock('@/components/ui/PageHeader', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}));

// Helpers 

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getFriendsLeaderboard } from '@/app/actions/leaderboard';
import LeaderboardPage from '../page';


const mockGetServerSession = getServerSession as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;
const mockGetFriendsLeaderboard = getFriendsLeaderboard as jest.Mock;

const mockSession = { user: { email: 'test@test.com' } };

const mockLeaderboard = [
  { id: '1', username: 'alice', name: 'Alice', streak: 10, focusTimeRaw: 300, focusTime: '5h', completionRate: 90, isCurrentUser: true, pfp: null },
  { id: '2', username: 'bob', name: 'Bob', streak: 8, focusTimeRaw: 240, focusTime: '4h', completionRate: 80, isCurrentUser: false, pfp: null },
];

// Tests 

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect.mockImplementation(() => { throw new Error('REDIRECT'); });
  });

  it('redirects to /login when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(
      LeaderboardPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow('REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login when session has no email', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    await expect(
      LeaderboardPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow('REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('renders page with leaderboard data', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetFriendsLeaderboard.mockResolvedValue(mockLeaderboard);

    const ui = await LeaderboardPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText('Friends Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('See how you stack up against your network.')).toBeInTheDocument();
    const client = screen.getByTestId('leaderboard-client');
    expect(client).toHaveAttribute('data-timeframe', 'all');
    expect(client).toHaveAttribute('data-count', '2');
  });

  it('defaults timeframe to "all" when not provided', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetFriendsLeaderboard.mockResolvedValue(mockLeaderboard);

    const ui = await LeaderboardPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByTestId('leaderboard-client')).toHaveAttribute('data-timeframe', 'all');
    expect(mockGetFriendsLeaderboard).toHaveBeenCalledWith('all');
  });

  it('passes timeframe from searchParams to getFriendsLeaderboard', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetFriendsLeaderboard.mockResolvedValue(mockLeaderboard);

    const ui = await LeaderboardPage({ searchParams: Promise.resolve({ timeframe: 'week' }) });
    render(ui);

    expect(mockGetFriendsLeaderboard).toHaveBeenCalledWith('week');
    expect(screen.getByTestId('leaderboard-client')).toHaveAttribute('data-timeframe', 'week');
  });

  it('falls back to empty array when getFriendsLeaderboard throws', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetFriendsLeaderboard.mockRejectedValue(new Error('DB error'));

    const ui = await LeaderboardPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByTestId('leaderboard-client')).toHaveAttribute('data-count', '0');
  });

  it('passes empty array when getFriendsLeaderboard returns null', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetFriendsLeaderboard.mockResolvedValue(null);

    const ui = await LeaderboardPage({ searchParams: Promise.resolve({}) });
    render(ui);

    // leaderboard ?? [] means null becomes []
    expect(screen.getByTestId('leaderboard-client')).toHaveAttribute('data-count', '0');
  });
});