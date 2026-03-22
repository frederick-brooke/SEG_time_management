import { render, screen, fireEvent } from '@testing-library/react';
import ModuleTasks, { ModuleTask, TaskWithProgress } from '../ModuleTasks';
import '@testing-library/jest-dom';

// Mock formatting functions
jest.mock('@/lib/format', () => ({
  formatDuration: jest.fn(() => '1h 30m'),
  formatTaskDate: jest.fn(() => 'Oct 16'),
}));

// Mock Icons
jest.mock('lucide-react', () => ({
  ListTodo: () => <svg data-testid="list-icon" />,
  CheckCircle: () => <svg data-testid="completed-icon" />,
  Circle: () => <svg data-testid="incomplete-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

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

  // --- MEMBER VIEW TESTS ---
  it('renders Member view empty state correctly', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={[]} isOwnerOrAdmin={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('My Tasks (0)')).toBeInTheDocument();
    expect(screen.getByText('No tasks assigned to you yet.')).toBeInTheDocument();
  });

  it('renders Member view populated list correctly', () => {
    render(<ModuleTasks tasks={mockMemberTasks} tasksWithProgress={[]} isOwnerOrAdmin={false} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('My Tasks (2)')).toBeInTheDocument();
    expect(screen.getByText('Read Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Write Essay')).toBeInTheDocument();
    
    // Check completion UI
    expect(screen.getByTestId('completed-icon')).toBeInTheDocument();
    expect(screen.getByTestId('incomplete-icon')).toBeInTheDocument();
  });

  // --- OWNER/ADMIN VIEW TESTS ---
  it('renders Owner/Admin view empty state correctly', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={[]} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Assigned Tasks (0)')).toBeInTheDocument();
    expect(screen.getByText('No tasks assigned yet. Create one using the button above!')).toBeInTheDocument();
  });

  it('renders Owner/Admin view populated list correctly with badges', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Assigned Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Read Chapter 1')).toBeInTheDocument();
    
    // Check if badges are rendered
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('1 in progress')).toBeInTheDocument();
  });

  it('toggles member lists on progress badges when clicked', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Click the "completed" badge
    fireEvent.click(screen.getByText('1 completed'));
    expect(screen.getByText('Alice')).toBeInTheDocument(); // Name appears from popover

    // Click the "in progress" badge
    fireEvent.click(screen.getByText('1 in progress'));
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('fires callbacks correctly for owner actions', () => {
    render(<ModuleTasks tasks={[]} tasksWithProgress={mockTasksWithProgress} isOwnerOrAdmin={true} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByTestId('edit-task-btn'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTasksWithProgress[0]);

    fireEvent.click(screen.getByTestId('delete-task-btn'));
    expect(mockOnDelete).toHaveBeenCalledWith('g1');
  });
});