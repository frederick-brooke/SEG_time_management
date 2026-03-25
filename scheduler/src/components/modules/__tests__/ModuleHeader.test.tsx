import { render, screen, fireEvent } from '@testing-library/react';
import ModuleHeader from '../ModuleHeader';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

//mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/actions/module', () => ({
  leaveModule: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="book-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  ListTodo: () => <svg data-testid="list-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
  Settings: () => <svg data-testid="settings-icon" />, 
}));

//tests
describe('ModuleHeader Component', () => {
  const mockTaskModal = jest.fn();
  const mockEventModal = jest.fn();
  const mockSettingsModal = jest.fn(); 
  
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
    
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
    
    window.confirm = jest.fn(() => true);
  });

  it('renders core module information correctly', () => {
    render(
      <ModuleHeader 
        module={mockModule} 
        isOwner={false} 
        isOwnerOrAdmin={false} 
        onOpenTaskModal={mockTaskModal} 
        onOpenEventModal={mockEventModal} 
        onOpenSettings={mockSettingsModal} 
      />
    );
    
    expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
    expect(screen.getByText('A very hard module.')).toBeInTheDocument();
    expect(screen.getByText(/42\/100 members/i)).toBeInTheDocument();
    expect(screen.getByText('by @dr_smith')).toBeInTheDocument();
  });

  it('renders owner actions and PIN display when isOwner is true', () => {
    render(
      <ModuleHeader 
        module={mockModule} 
        isOwner={true} 
        isOwnerOrAdmin={true} 
        onOpenTaskModal={mockTaskModal} 
        onOpenEventModal={mockEventModal} 
        onOpenSettings={mockSettingsModal} 
      />
    );
    
    expect(screen.getByText('Settings')).toBeInTheDocument(); 
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Copy PIN')).toBeInTheDocument();
    
    expect(screen.getByText('ALGO-123')).toBeInTheDocument();
    expect(screen.queryByText('Leave Module')).not.toBeInTheDocument();
  });

  // Verifies Admins get the hybrid button state
  it('renders Admin actions (Create buttons AND Leave button) when user is Admin', () => {
    render(
      <ModuleHeader 
        module={mockModule} 
        isOwner={false} 
        isOwnerOrAdmin={true} 
        onOpenTaskModal={mockTaskModal} 
        onOpenEventModal={mockEventModal} 
        onOpenSettings={mockSettingsModal} 
      />
    );
    
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Leave Module')).toBeInTheDocument();
    
    // Admins should NOT see owner-only things
    expect(screen.queryByText('Settings')).not.toBeInTheDocument(); 
    expect(screen.queryByText('ALGO-123')).not.toBeInTheDocument();
  });

  it('renders ONLY leave module button when user is a regular member', () => {
    render(
      <ModuleHeader 
        module={mockModule} 
        isOwner={false} 
        isOwnerOrAdmin={false} 
        onOpenTaskModal={mockTaskModal} 
        onOpenEventModal={mockEventModal} 
        onOpenSettings={mockSettingsModal} 
      />
    );
    
    expect(screen.getByText('Leave Module')).toBeInTheDocument();
    expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument(); 
  });

  it('fires modal callbacks when owner buttons are clicked', () => {
    render(
      <ModuleHeader 
        module={mockModule} 
        isOwner={true} 
        isOwnerOrAdmin={true} 
        onOpenTaskModal={mockTaskModal} 
        onOpenEventModal={mockEventModal} 
        onOpenSettings={mockSettingsModal} 
      />
    );
    
    fireEvent.click(screen.getByText('Settings'));
    expect(mockSettingsModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Create Task'));
    expect(mockTaskModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Create Event'));
    expect(mockEventModal).toHaveBeenCalledTimes(1);
  });
});