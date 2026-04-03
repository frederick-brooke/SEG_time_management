//tests for scheduler/src/components/profile/TaskStatsCard.tsx
import { render, screen } from '@testing-library/react';
import TaskStatsCard from '../TaskStatsCard';
import '@testing-library/jest-dom';

// mocks
// Replaces the Trophy icon with a testable SVG element
jest.mock('lucide-react', () => ({
  Trophy: () => <svg data-testid="trophy-icon" />,
}));

describe('TaskStatsCard', () => {

  // Confirms the card renders zeros gracefully when no stats are available
  it('renders default values when stats are null', () => {
    render(<TaskStatsCard stats={null} />);
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
  });

  // Confirms the trophy icon is present as part of the card header
  it('renders the trophy icon', () => {
    render(<TaskStatsCard stats={null} />);
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  // Confirms completed tasks and total tasks render correctly for a failing completion rate
  it('renders failing stats correctly — under 50%', () => {
    const failingStats = { completedTasks: 2, totalTasks: 10, completionRate: 20 };
    render(<TaskStatsCard stats={failingStats} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 10 total')).toBeInTheDocument();
    // Lunar theme uses text-white/40 for failing progress percentage
    const progressText = screen.getByText('20%');
    expect(progressText).toHaveClass('text-white/40');
  });

  // Confirms completed tasks and total tasks render correctly for a passing completion rate
  it('renders passing stats correctly — 50% or above', () => {
    const passingStats = { completedTasks: 8, totalTasks: 10, completionRate: 80 };
    render(<TaskStatsCard stats={passingStats} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('/ 10 total')).toBeInTheDocument();
    // Lunar theme uses text-emerald-400 for passing progress percentage
    const progressText = screen.getByText('80%');
    expect(progressText).toHaveClass('text-emerald-400');
  });

  // Confirms exactly 50% is treated as passing, not failing
  it('renders exactly at the 50% boundary as passing', () => {
    const boundaryStats = { completedTasks: 5, totalTasks: 10, completionRate: 50 };
    render(<TaskStatsCard stats={boundaryStats} />);
    const progressText = screen.getByText('50%');
    expect(progressText).toHaveClass('text-emerald-400');
  });

  // Confirms the section heading is present
  it('renders Task Performance heading', () => {
    render(<TaskStatsCard stats={null} />);
    expect(screen.getByText('Task Performance')).toBeInTheDocument();
  });

  // Confirms both stat sub-headings are rendered for orientation
  it('renders Completed and Success Rate labels', () => {
    render(<TaskStatsCard stats={{ completedTasks: 3, totalTasks: 5, completionRate: 60 }} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });
});