import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ModuleHeader from '../ModuleHeader';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { leaveModule } from '@/app/actions/module';

// mocks
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

  const defaultProps = {
    module: mockModule,
    isOwner: false,
    isOwnerOrAdmin: false,
    onOpenTaskModal: mockTaskModal,
    onOpenEventModal: mockEventModal,
    onOpenSettings: mockSettingsModal,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
    
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  // Confirms the main title, description, and metadata are rendered.
  it('renders core module information correctly', () => {
    render(<ModuleHeader {...defaultProps} />);
    
    expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
    expect(screen.getByText('A very hard module.')).toBeInTheDocument();
    expect(screen.getByText(/42\/100 members/i)).toBeInTheDocument();
    expect(screen.getByText('by @dr_smith')).toBeInTheDocument();
  });

  // Confirms module owners see settings, PINs, and creation tools but no leave button.
  it('renders owner actions and PIN display when isOwner is true', () => {
    render(<ModuleHeader {...defaultProps} isOwner={true} isOwnerOrAdmin={true} />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument(); 
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Copy PIN')).toBeInTheDocument();
    expect(screen.getByText('ALGO-123')).toBeInTheDocument();
    expect(screen.queryByText('Leave Module')).not.toBeInTheDocument();
  });

  // Confirms admins see creation tools and the leave button, but not owner-level settings.
  it('renders Admin actions when user is Admin', () => {
    render(<ModuleHeader {...defaultProps} isOwnerOrAdmin={true} />);
    
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Leave Module')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument(); 
    expect(screen.queryByText('ALGO-123')).not.toBeInTheDocument();
  });

  // Confirms regular members only see the option to leave the module.
  it('renders ONLY leave module button when user is a regular member', () => {
    render(<ModuleHeader {...defaultProps} />);
    
    expect(screen.getByText('Leave Module')).toBeInTheDocument();
    expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument(); 
  });

  // Confirms clicking the respective action buttons triggers the modal state callbacks.
  it('fires modal callbacks when owner buttons are clicked', () => {
    render(<ModuleHeader {...defaultProps} isOwner={true} isOwnerOrAdmin={true} />);
    
    fireEvent.click(screen.getByText('Settings'));
    expect(mockSettingsModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Create Task'));
    expect(mockTaskModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Create Event'));
    expect(mockEventModal).toHaveBeenCalledTimes(1);
  });

  // Confirms the copy PIN function writes to the clipboard and temporarily updates the UI text.
  it('copies PIN to clipboard and temporarily changes button text', () => {
    jest.useFakeTimers();
    render(<ModuleHeader {...defaultProps} isOwner={true} isOwnerOrAdmin={true} />);
    
    const copyBtn = screen.getByText('Copy PIN');
    fireEvent.click(copyBtn);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ALGO-123');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    
    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByText('Copy PIN')).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  // Confirms leaving the module is aborted if the user cancels the confirmation dialogue.
  it('aborts leaving module when confirmation is cancelled', async () => {
    window.confirm = jest.fn(() => false);
    render(<ModuleHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Leave Module'));
    expect(leaveModule).not.toHaveBeenCalled();
  });

  // Confirms leaving the module successfully redirects the user to the modules list.
  it('redirects to modules list on successful leave', async () => {
    (leaveModule as jest.Mock).mockResolvedValue({ success: true });
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ModuleHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Leave Module'));
    
    await waitFor(() => {
      expect(leaveModule).toHaveBeenCalledWith('mod1');
      expect(mockPush).toHaveBeenCalledWith('/modules');
    });
  });

  // Confirms an alert is shown if the leave module action fails on the server.
  it('shows an alert when leaving the module fails with a specific error', async () => {
    (leaveModule as jest.Mock).mockResolvedValue({ success: false, error: 'Cannot leave' });

    render(<ModuleHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Leave Module'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Cannot leave');
    });
  });

  // Confirms a fallback alert is shown if the server fails without providing an error string.
  it('shows a fallback alert when leaving fails without an error message', async () => {
    (leaveModule as jest.Mock).mockResolvedValue({ success: false });

    render(<ModuleHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Leave Module'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to leave module');
    });
  });
});