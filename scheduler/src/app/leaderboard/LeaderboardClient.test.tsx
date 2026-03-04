import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaderboardClient from './LeaderboardClient';

// Fake data to feed the component
const mockData = [
  { id: '1', username: 'alice', name: 'Alice', pfp: null, streak: 5, completionRate: 80, focusTime: '5h', focusTimeRaw: 300, isCurrentUser: true },
  { id: '2', username: 'bob', name: 'Bob', pfp: null, streak: 10, completionRate: 50, focusTime: '2h', focusTimeRaw: 120, isCurrentUser: false }
];

describe('LeaderboardClient Component', () => {
  
  it('renders the leaderboard data correctly', () => {
    render(<LeaderboardClient initialData={mockData} />);
    
    // Check that our fake users are on the screen
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    
    // Check that the stats rendered
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('changes the sort value when the dropdown is used', async () => {
    // Set up a user interaction simulator
    const user = userEvent.setup();
    render(<LeaderboardClient initialData={mockData} />);
    
    // Find the select dropdown (combobox)
    const select = screen.getByRole('combobox');
    
    // Simulate a user clicking the dropdown and selecting "Completion Rate"
    await user.selectOptions(select, 'completionRate');
    
    // Verify the dropdown updated
    expect(select).toHaveValue('completionRate');
  });
});