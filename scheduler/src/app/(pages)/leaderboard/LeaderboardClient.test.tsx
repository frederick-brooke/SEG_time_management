import { render, screen, fireEvent } from '@testing-library/react';
import LeaderboardClient from './LeaderboardClient';
import '@testing-library/jest-dom';

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

describe('LeaderboardClient Component', () => {
  it('renders the empty state correctly', () => {
    render(<LeaderboardClient initialData={[]} />);
    expect(screen.getByText(/No friends to compete with yet/i)).toBeInTheDocument();
  });

  it('renders users and executes all sorting tie-breakers', () => {
    const mockData = [
      { id: '1', username: 'alice', name: 'Alice', pfp: 'https://img.com/a.jpg', streak: 10, completionRate: 85, focusTime: '5h', focusTimeRaw: 300, isCurrentUser: true },
      { id: '2', username: 'bob', name: 'Bob', pfp: null, streak: 10, completionRate: 40, focusTime: '2h', focusTimeRaw: 120, isCurrentUser: false },
      { id: '3', username: 'charlie', name: '', pfp: null, streak: 5, completionRate: 60, focusTime: '2h', focusTimeRaw: 120, isCurrentUser: false },
      { id: '4', username: 'dave', name: 'Dave', pfp: null, streak: 0, completionRate: 60, focusTime: '1h', focusTimeRaw: 60, isCurrentUser: false },
      { id: '5', username: 'eve', name: 'Eve', pfp: null, streak: 0, completionRate: 60, focusTime: '1h', focusTimeRaw: 60, isCurrentUser: false },
    ];

    render(<LeaderboardClient initialData={mockData} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByAltText('alice')).toBeInTheDocument(); 
    
    expect(screen.getByText('Alice').closest('a')).toHaveAttribute('href', '/profile/alice');
    
    const select = screen.getByRole('combobox');
    
    fireEvent.change(select, { target: { value: 'focusTime' } });
    expect(select).toHaveValue('focusTime');
    
    fireEvent.change(select, { target: { value: 'completionRate' } });
    expect(select).toHaveValue('completionRate');
    
    fireEvent.change(select, { target: { value: 'streak' } });
    expect(select).toHaveValue('streak');
  });
});