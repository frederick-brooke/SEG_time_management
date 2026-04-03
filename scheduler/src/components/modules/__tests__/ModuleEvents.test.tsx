//tests for scheduler/src/components/modules/ModuleEvents.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleEvents, { ModuleEvent } from '../ModuleEvents';
import '@testing-library/jest-dom';

// mocks
jest.mock('@/lib/format', () => ({
  formatEventDate: jest.fn(() => 'Oct 15, 2026, 2:00 PM'),
}));

jest.mock('lucide-react', () => ({
  Calendar: () => <svg data-testid="calendar-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

// tests
describe('ModuleEvents Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockEvents: ModuleEvent[] = [
    {
      id: 'e1',
      moduleEventGroupId: 'group1',
      title: 'Midterm Exam',
      description: 'Covers chapters 1-5.',
      start: new Date('2026-10-15T14:00:00Z'),
      end: new Date('2026-10-15T16:00:00Z'),
      category: 'Exam',
    },
    {
      id: 'e2',
      moduleEventGroupId: 'group2',
      title: 'Study Session',
      description: null,
      start: new Date('2026-10-10T14:00:00Z'),
      end: new Date('2026-10-10T15:00:00Z'),
      category: 'Study',
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirms the empty state is displayed correctly for standard members
  it('renders empty state correctly for non-owners', () => {
    render(<ModuleEvents events={[]} isOwner={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Upcoming Events (0)')).toBeInTheDocument();
    expect(screen.getByText('No events scheduled yet.')).toBeInTheDocument();
  });

  // Confirms the empty state displays a specific creation prompt for module owners
  it('renders empty state with creation prompt for owners', () => {
    render(<ModuleEvents events={[]} isOwner={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('No events scheduled yet. Create one using the button above!')).toBeInTheDocument();
  });

  // Confirms the component accurately renders a list of events with their details
  it('renders a list of events correctly', () => {
    render(<ModuleEvents events={mockEvents} isOwner={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Upcoming Events (2)')).toBeInTheDocument();
    expect(screen.getByText('Midterm Exam')).toBeInTheDocument();
    expect(screen.getByText('Study Session')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    expect(screen.getByText('Covers chapters 1-5.')).toBeInTheDocument();
  });

  // Confirms action buttons are hidden from non-owners to prevent unauthorized edits
  it('hides edit and delete buttons for non-owners', () => {
    render(<ModuleEvents events={mockEvents} isOwner={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.queryByTestId('edit-event-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-event-btn')).not.toBeInTheDocument();
  });

  // Confirms owners can see action buttons and that clicking them triggers the appropriate callbacks
  it('shows action buttons for owners and fires callbacks', () => {
    render(<ModuleEvents events={mockEvents} isOwner={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButtons = screen.getAllByTestId('edit-event-btn');
    const deleteButtons = screen.getAllByTestId('delete-event-btn');
    
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);

    // Test Edit Callback
    fireEvent.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockEvents[0]);

    // Test Delete Callback (Should pass the moduleEventGroupId, not the local id)
    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('group1');
  });
});