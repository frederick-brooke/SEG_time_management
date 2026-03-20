import { render, screen } from '@testing-library/react';
import TaskStatsCard from '../TaskStatsCard';
import '@testing-library/jest-dom';

// Mock the Lucide icon to keep the render tree clean
jest.mock('lucide-react', () => ({
  Trophy: () => <svg data-testid="trophy-icon" />
}));

describe('TaskStatsCard Component', () => {
  
  it('renders default values (0) when stats are null or missing', () => {
    render(<TaskStatsCard stats={null} />);
    
    // Using getAllByText because '0' appears for completed, total, and percentage
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    
    // Progress text should be gray (failing state) by default
    const progressText = screen.getByText('0%');
    expect(progressText).toHaveClass('text-gray-500');
  });

  it('renders failing stats correctly (under 50%)', () => {
    const failingStats = { completedTasks: 2, totalTasks: 10, completionRate: 20 };
    render(<TaskStatsCard stats={failingStats} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 10 total')).toBeInTheDocument();
    
    // 20% should render with the failing gray class
    const progressText = screen.getByText('20%');
    expect(progressText).toHaveClass('text-gray-500');
  });

  it('renders passing stats correctly (50% or above)', () => {
    const passingStats = { completedTasks: 8, totalTasks: 10, completionRate: 80 };
    render(<TaskStatsCard stats={passingStats} />);
    
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('/ 10 total')).toBeInTheDocument();
    
    // 80% should render with the passing green class
    const progressText = screen.getByText('80%');
    expect(progressText).toHaveClass('text-green-600');
  });
});