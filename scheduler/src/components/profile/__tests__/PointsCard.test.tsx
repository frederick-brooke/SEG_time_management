import { render, screen } from '@testing-library/react';
import PointsCard from '../PointsCard';
import '@testing-library/jest-dom';

// mocks
// Replaces icons with testable SVG elements
jest.mock('lucide-react', () => ({
  Zap: () => <svg data-testid="zap-icon" />,
  Star: () => <svg data-testid="star-icon" />,
}));

describe('PointsCard', () => {

  // Confirms the total points value is displayed with locale formatting (commas for thousands)
  it('renders the total points with locale formatting', () => {
    render(<PointsCard totalPoints={1250} level={3} xpToNext={50} xpBarWidth={50} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  // Confirms the current level number is rendered in the level section
  it('renders the current level', () => {
    render(<PointsCard totalPoints={500} level={5} xpToNext={25} xpBarWidth={75} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // Confirms the XP remaining until the next level is displayed correctly
  it('renders xpToNext value correctly', () => {
    render(<PointsCard totalPoints={500} level={5} xpToNext={30} xpBarWidth={70} />);
    expect(screen.getByText('30 XP away')).toBeInTheDocument();
  });

  // Confirms the main label identifying the card's purpose is always present
  it('renders Total Points Earned label', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} />);
    expect(screen.getByText('Total Points Earned')).toBeInTheDocument();
  });

  // Confirms the Zap icon renders as the visual centrepiece of the card
  it('renders the Zap icon', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} />);
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  // Confirms the card handles zero points gracefully without crashing
  it('renders zero points correctly', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // Confirms the XP progress bar reflects the correct fill width via inline style
  it('renders the XP progress bar with correct width', () => {
    const { container } = render(<PointsCard totalPoints={750} level={8} xpToNext={25} xpBarWidth={75} />);
    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  // Confirms both section labels (Level and Next Level) are present in the right-side panel
  it('renders Level and Next Level section labels', () => {
    render(<PointsCard totalPoints={100} level={2} xpToNext={50} xpBarWidth={50} />);
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Next Level')).toBeInTheDocument();
  });
});