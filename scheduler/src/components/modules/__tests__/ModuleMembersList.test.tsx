import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuleMembersList from '../ModuleMembersList';
import '@testing-library/jest-dom';
import { updateMemberRole, removeMember } from '@/app/actions/module';

// Mock Next.js Link
jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

// Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

// Mock the Server Actions
jest.mock('@/app/actions/module', () => ({
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(), // <-- Mocked the new action
}));

// Mock Icons
jest.mock('lucide-react', () => ({
  Users: () => <svg data-testid="users-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down" />,
  ChevronUp: () => <svg data-testid="chevron-up" />,
  Crown: () => <svg data-testid="crown-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  UserMinus: () => <svg data-testid="user-minus-icon" />, // <-- Mocked the new icon
}));

describe('ModuleMembersList Component', () => {
  const mockMembers = [
    {
      id: 'm1',
      role: 'OWNER',
      userId: 'u1',
      user: { id: 'u1', username: 'alice', fname: 'Alice', lname: 'Smith', pfp: 'alice.jpg' },
    },
    {
      id: 'm2',
      role: 'ADMIN',
      userId: 'u2',
      user: { id: 'u2', username: 'bob', fname: 'Bob', lname: 'Jones', pfp: null },
    },
    {
      id: 'm3',
      role: 'MEMBER',
      userId: 'u3',
      user: { id: 'u3', username: 'charlie', fname: null, lname: null, pfp: null },
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Auto-confirm the window prompt for deletions
    window.confirm = jest.fn(() => true);
  });

  it('renders collapsed state by default with correct member count', () => {
    render(<ModuleMembersList members={mockMembers} isOwner={false} moduleId="mod1" currentUserRole="MEMBER" />);
    
    expect(screen.getByText('Members (3)')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('toggles member list open and closed on click', () => {
    render(<ModuleMembersList members={mockMembers} isOwner={false} moduleId="mod1" currentUserRole="MEMBER" />);
    
    const toggleButton = screen.getByText('Members (3)').closest('button')!;
    
    fireEvent.click(toggleButton);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('renders the correct role badges', () => {
    render(<ModuleMembersList members={mockMembers} isOwner={false} moduleId="mod1" currentUserRole="MEMBER" />);
    fireEvent.click(screen.getByText('Members (3)').closest('button')!);
    
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    const badges = screen.getAllByText(/Owner|Admin/i);
    expect(badges.length).toBe(2); 
  });

  // --- HIERARCHY & PERMISSION TESTS ---

  it('hides all management buttons for standard members', () => {
    render(<ModuleMembersList members={mockMembers} isOwner={false} moduleId="mod1" currentUserRole="MEMBER" />);
    fireEvent.click(screen.getByText('Members (3)').closest('button')!);

    expect(screen.queryByText('Make Admin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-minus-icon')).not.toBeInTheDocument();
  });

  it('allows owners to promote, demote, and remove anyone except themselves', async () => {
    (updateMemberRole as jest.Mock).mockResolvedValue({ success: true });
    (removeMember as jest.Mock).mockResolvedValue({ success: true });

    render(<ModuleMembersList members={mockMembers} isOwner={true} moduleId="mod1" currentUserRole="OWNER" />);
    fireEvent.click(screen.getByText('Members (3)').closest('button')!);

    // Owner should see 2 role buttons and 2 remove buttons (for Bob and Charlie)
    expect(screen.getByText('Make Admin')).toBeInTheDocument(); // For Charlie
    expect(screen.getByText('Remove Admin')).toBeInTheDocument(); // For Bob
    
    const removeButtons = screen.getAllByTestId('user-minus-icon');
    expect(removeButtons).toHaveLength(2);

    // Test Promoting Charlie
    fireEvent.click(screen.getByText('Make Admin'));
    await waitFor(() => {
      expect(updateMemberRole).toHaveBeenCalledWith('mod1', 'u3', 'ADMIN');
    });

    // Test Removing Bob (First remove button in the list)
    fireEvent.click(removeButtons[0].closest('button')!);
    expect(window.confirm).toHaveBeenCalledWith("Remove this member? This will delete all their module tasks and events.");
    await waitFor(() => {
      expect(removeMember).toHaveBeenCalledWith('mod1', 'u2');
    });
  });

  it('allows admins to remove standard members, but not other admins', async () => {
    (removeMember as jest.Mock).mockResolvedValue({ success: true });

    // Render as Bob (ADMIN)
    render(<ModuleMembersList members={mockMembers} isOwner={false} moduleId="mod1" currentUserRole="ADMIN" />);
    fireEvent.click(screen.getByText('Members (3)').closest('button')!);

    // Admins cannot change roles
    expect(screen.queryByText('Make Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove Admin')).not.toBeInTheDocument();

    // Admins should only see 1 remove button (for Charlie, the MEMBER)
    const removeButtons = screen.getAllByTestId('user-minus-icon');
    expect(removeButtons).toHaveLength(1);

    // Test Removing Charlie
    fireEvent.click(removeButtons[0].closest('button')!);
    await waitFor(() => {
      expect(removeMember).toHaveBeenCalledWith('mod1', 'u3'); // u3 is Charlie
    });
  });
});