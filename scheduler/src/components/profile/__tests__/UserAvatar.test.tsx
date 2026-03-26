import { render, screen } from '@testing-library/react';
import UserAvatar from '../UserAvatar';
import '@testing-library/jest-dom';

// tests
describe('UserAvatar Component', () => {
  /**
   * Renders image when PFP is provided.
   */
  it('renders the profile picture if pfp is provided', () => {
    render(<UserAvatar pfp="https://example.com/avatar.jpg" username="testuser" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'testuser');
  });

  /**
   * Fallback to first name initial if no PFP.
   */
  it('renders the first name initial if no pfp is provided', () => {
    render(<UserAvatar username="testuser" fname="Alice" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  /**
   * Fallback to username initial if no PFP and no first name.
   */
  it('renders the username initial if neither pfp nor fname are provided', () => {
    render(<UserAvatar username="bob123" />);
    expect(screen.getByText('BO')).toBeInTheDocument();
  });

  /**
   * Custom classes are applied correctly.
   */
  it('applies custom className correctly', () => {
    const { container } = render(<UserAvatar username="test" className="w-32 h-32" />);
    expect(container.firstChild).toHaveClass('w-32 h-32');
  });
  //branch coverage for absolute fallback
  it('renders the "?" fallback if no valid initial can be found', () => {
    render(<UserAvatar username="" fname="" />);
    const { container } = render(<UserAvatar username="" fname="" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});