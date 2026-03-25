import { render, screen } from '@testing-library/react';
import PointsCard from '../PointsCard';
import '@testing-library/jest-dom';

// mocks
// Replaces icons and custom UI components with testable SVG elements
jest.mock('lucide-react', () => ({
  Star: () => <svg data-testid="star-icon" />,
}));

jest.mock('@/components/ui/gold-coin', () => ({
  GoldCoin: () => <svg data-testid="gold-coin-icon" />
}));

describe('PointsCard', () => {

  // Confirms the total points and coins values are displayed with locale formatting
  it('renders the total points and coins with locale formatting', () => {
    render(<PointsCard totalPoints={1250} level={3} xpToNext={50} xpBarWidth={50} coins={5000} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  // Confirms the current level number is rendered in the level section
  it('renders the current level', () => {
    render(<PointsCard totalPoints={500} level={5} xpToNext={25} xpBarWidth={75} coins={100} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // Confirms the XP remaining until the next level is displayed correctly
  it('renders xpToNext value correctly', () => {
    render(<PointsCard totalPoints={500} level={5} xpToNext={30} xpBarWidth={70} coins={100} />);
    expect(screen.getByText('30 XP away')).toBeInTheDocument();
  });

  // Confirms the main labels identifying the card's purposes are present
  it('renders Total XP and Coins labels', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} coins={0} />);
    expect(screen.getByText('Total XP')).toBeInTheDocument();
    expect(screen.getByText('Coins')).toBeInTheDocument();
  });

  // Confirms the Star and GoldCoin icons render as the visual centrepieces
  it('renders the Star and Gold Coin icons', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} coins={0} />);
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    expect(screen.getByTestId('gold-coin-icon')).toBeInTheDocument();
  });

  // Confirms the card handles zero points gracefully without crashing
  it('renders zero points and zero coins correctly', () => {
    render(<PointsCard totalPoints={0} level={1} xpToNext={100} xpBarWidth={0} coins={0} />);
    // Since both totalPoints and coins are 0, we expect two '0' elements
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  // Confirms the XP progress bar reflects the correct fill width via inline style
  it('renders the XP progress bar with correct width', () => {
    const { container } = render(<PointsCard totalPoints={750} level={8} xpToNext={25} xpBarWidth={75} coins={100} />);
    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  // Confirms both section labels (Level and Next Level) are present in the right-side panel
  it('renders Level and Next Level section labels', () => {
    render(<PointsCard totalPoints={100} level={2} xpToNext={50} xpBarWidth={50} coins={100} />);
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Next Level')).toBeInTheDocument();
  });
});