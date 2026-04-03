//tests for scheduler/src/components/modules/ModuleTasks.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleTasks, { ModuleTask, TaskWithProgress } from '../ModuleTasks';
import '@testing-library/jest-dom';

// Mocks
jest.mock('@/lib/format', () => ({
  formatDuration: jest.fn(() => '1h 30m'),
  formatTaskDate: jest.fn(() => 'Oct 16'),
}));

jest.mock('lucide-react', () => ({
  ListTodo: () => <svg data-testid="list-icon" />,
  CheckCircle: () => <svg data-testid="completed-icon" />,
  Circle: () => <svg data-testid="incomplete-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

// Tests
describe('ModuleTasks Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockMemberTasks: ModuleTask[] = [
    { id: 't1', moduleTaskGroupId: 'g1', title: 'Read Chapter 1', description: 'Pages 1-20', dueDate: null, priority: 'High', duration: 60, completed: false, status: 'todo' },
    { id: 't2', moduleTaskGroupId: 'g2', title: 'Write Essay', description: null, dueDate: null, priority: 'Medium', duration: 120, completed: true, status: 'done' },
  ];

  const mockTasksWithProgress: TaskWithProgress[] = [
    {
      moduleTaskGroupId: 'g1', title: 'Read Chapter 1', description: 'Pages 1-20', dueDate: null, priority: 'High', duration: 60, url: null, totalAssigned: 2,
      completedMembers: [{ id: 'u1', username: 'alice', fname: 'Alice', lname: null, pfp: null }],
      inProgressMembers: [{ id: 'u2', username: 'bob', fname: 'Bob', lname: null, pfp: null }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Member View Tests

  // Confirms the empty state renders correctly for standard members without tasks
  it('renders Member view empty state correctly', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={[]} isOwnerOrAdmin={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('My Tasks (0)')).toBeInTheDocument();
    expect(screen.getByText('No tasks assigned to you yet.')).toBeInTheDocument();
  });

  // Confirms a populated list of assigned tasks renders correctly with completion status icons
  it('renders Member view populated list correctly', () => {
    render(<ModuleTasks tasks={mockMemberTasks} tasksWithProgress={[]} isOwnerOrAdmin={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('My Tasks (2)')).toBeInTheDocument();
    expect(screen.getByText('Read Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Write Essay')).toBeInTheDocument();
    
    expect(screen.getByTestId('completed-icon')).toBeInTheDocument();
    expect(screen.getByTestId('incomplete-icon')).toBeInTheDocument();
  });

  // Owner/Admin View Tests

  // Confirms the empty state displays a specific creation prompt for owners and admins
  it('renders Owner/Admin view empty state correctly', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={[]} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Assigned Tasks (0)')).toBeInTheDocument();
    expect(screen.getByText('No tasks assigned yet. Create one using the button above!')).toBeInTheDocument();
  });

  // Confirms the populated list renders with aggregate progress badges for owners and admins
  it('renders Owner/Admin view populated list correctly with badges', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Assigned Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Read Chapter 1')).toBeInTheDocument();
    
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('1 in progress')).toBeInTheDocument();
  });

  // Confirms clicking the progress badges toggles the visibility of the member completion popovers
  it('toggles member lists on progress badges when clicked', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByText('1 completed'));
    expect(screen.getByText('Alice')).toBeInTheDocument(); 

    fireEvent.click(screen.getByText('1 in progress'));
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  // Confirms the edit and delete action buttons trigger the corresponding callbacks with the correct payload
  it('fires callbacks correctly for owner actions', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByTestId('edit-task-btn'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTasksWithProgress[0]);

    fireEvent.click(screen.getByTestId('delete-task-btn'));
    expect(mockOnDelete).toHaveBeenCalledWith('g1');
  });
});