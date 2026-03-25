export type Timeframe = 'day' | 'week' | 'month' | 'all';
export type SortKey = 'streak' | 'focusTime' | 'completionRate';

export interface LeaderboardUser {
  id: string; username: string; name: string; pfp: string | null;
  streak: number; completionRate: number; focusTime: string; focusTimeRaw: number; isCurrentUser: boolean;
}