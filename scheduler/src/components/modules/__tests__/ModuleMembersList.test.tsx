import { render, screen, fireEvent } from '@testing-library/react';
import ModuleMembersList from '../ModuleMembersList';
import '@testing-library/jest-dom';

// Mock Next.js Link
jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

// Mock Icons
jest.mock('lucide-react', () => ({
  Users: () => <svg data-testid="users-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down" />,
  ChevronUp: () => <svg data-testid="chevron-up" />,
  Crown: () => <svg data-testid="crown-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
}));

describe('ModuleMembersList Component', () => {
  const mockMembers = [
    {
      id: 'm1',
      role: 'OWNER',
      user: { id: 'u1', username: 'alice', fname: 'Alice', lname: 'Smith', pfp: 'alice.jpg' },
    },
    {
      id: 'm2',
      role: 'ADMIN',
      user: { id: 'u2', username: 'bob', fname: 'Bob', lname: 'Jones', pfp: null },
    },
    {
      id: 'm3',
      role: 'MEMBER',
      user: { id: 'u3', username: 'charlie', fname: null, lname: null, pfp: null },
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders collapsed state by default with correct member count', () => {
    render(<ModuleMembersList members={mockMembers} />);
    
    // Header should show "Members (3)"
    expect(screen.getByText('Members (3)')).toBeInTheDocument();
    
    // Dropdown list should not be visible yet
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('toggles member list open and closed on click', () => {
    render(<ModuleMembersList members={mockMembers} />);
    
    const toggleButton = screen.getByRole('button');
    
    // Open it
    fireEvent.click(toggleButton);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    
    // Close it
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('renders avatars correctly based on provided profile pictures', () => {
    render(<ModuleMembersList members={mockMembers} />);
    fireEvent.click(screen.getByRole('button'));
    
    // Alice has a picture
    const img = screen.getByAltText('alice');
    expect(img).toHaveAttribute('src', 'alice.jpg');
    
    // Bob has no picture, should render his first initial "B"
    expect(screen.getByText('B')).toBeInTheDocument();
    
    // Charlie has no picture and no fname, should render username initial "c"
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('renders the correct role badges', () => {
    render(<ModuleMembersList members={mockMembers} />);
    fireEvent.click(screen.getByRole('button'));
    
    // Owner badge for Alice
    expect(screen.getByText('Owner')).toBeInTheDocument();
    
    // Admin badge for Bob
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Charlie is a MEMBER, so he should not have a badge
    const badges = screen.getAllByText(/Owner|Admin/i);
    expect(badges.length).toBe(2); 
  });
});