import { render, screen, fireEvent } from '@testing-library/react';
import ModuleHeader from '../ModuleHeader';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock Next router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Server Actions
jest.mock('@/app/actions/module', () => ({
  leaveModule: jest.fn(),
}));

// Mock Icons to keep render tree clean
jest.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="book-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  ListTodo: () => <svg data-testid="list-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
}));

describe('ModuleHeader Component', () => {
  const mockTaskModal = jest.fn();
  const mockEventModal = jest.fn();
  
  const mockModule = {
    id: 'mod1',
    name: 'Advanced Algorithms',
    description: 'A very hard module.',
    joinPin: 'ALGO-123',
    maxMembers: 100,
    memberCount: 42,
    creator: { username: 'dr_smith' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
    
    // Mock window.confirm to automatically return true
    window.confirm = jest.fn(() => true);
  });

  it('renders core module information correctly', () => {
    render(<ModuleHeader module={mockModule} isOwner={false} isOwnerOrAdmin={false} onOpenTaskModal={mockTaskModal} onOpenEventModal={mockEventModal} />);
    
    expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
    expect(screen.getByText('A very hard module.')).toBeInTheDocument();
    expect(screen.getByText(/42\/100 members/i)).toBeInTheDocument();
    expect(screen.getByText('Created by @dr_smith')).toBeInTheDocument();
  });

  it('renders owner actions and PIN display when isOwner is true', () => {
    render(<ModuleHeader module={mockModule} isOwner={true} isOwnerOrAdmin={true} onOpenTaskModal={mockTaskModal} onOpenEventModal={mockEventModal} />);
    
    // Buttons
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Copy PIN')).toBeInTheDocument();
    
    // PIN Display
    expect(screen.getByText('ALGO-123')).toBeInTheDocument();
    expect(screen.queryByText('Leave Module')).not.toBeInTheDocument();
  });

  it('renders leave module button when user is a regular member', () => {
    render(<ModuleHeader module={mockModule} isOwner={false} isOwnerOrAdmin={false} onOpenTaskModal={mockTaskModal} onOpenEventModal={mockEventModal} />);
    
    expect(screen.getByText('Leave Module')).toBeInTheDocument();
    expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    expect(screen.queryByText('ALGO-123')).not.toBeInTheDocument();
  });

  it('fires modal callbacks when owner buttons are clicked', () => {
    render(<ModuleHeader module={mockModule} isOwner={true} isOwnerOrAdmin={true} onOpenTaskModal={mockTaskModal} onOpenEventModal={mockEventModal} />);
    
    fireEvent.click(screen.getByText('Create Task'));
    expect(mockTaskModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Create Event'));
    expect(mockEventModal).toHaveBeenCalledTimes(1);
  });

  it('copies PIN to clipboard when Copy PIN button is clicked', () => {
    render(<ModuleHeader module={mockModule} isOwner={true} isOwnerOrAdmin={true} onOpenTaskModal={mockTaskModal} onOpenEventModal={mockEventModal} />);
    
    fireEvent.click(screen.getByText('Copy PIN'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ALGO-123');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});