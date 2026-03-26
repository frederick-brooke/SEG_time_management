import { render, screen, fireEvent } from '@testing-library/react';
import ModulesPageClient from '../ModulesPageClient';
import '@testing-library/jest-dom';

// mocks
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock('@/components/modules/CreateModule', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => (
    <button onClick={onSuccess} data-testid="create-modal-trigger">Mock Create</button>
  ),
}));

jest.mock('@/components/modules/JoinModule', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => (
    <button onClick={onSuccess} data-testid="join-modal-trigger">Mock Join</button>
  ),
}));

jest.mock('@/components/modules/ModuleCard', () => ({
  ModuleCard: ({ module }: any) => <div data-testid="module-card">{module.name}</div>,
}));

// Mocks icons so we can easily click the previous/next buttons
jest.mock('lucide-react', () => ({
  Plus: () => <svg />,
  LogIn: () => <svg />,
  ArrowUpDown: () => <svg />,
  ChevronLeft: () => <svg data-testid="prev-icon" />,
  ChevronRight: () => <svg data-testid="next-icon" />,
}));

// tests
describe('ModulesPageClient', () => {
  const mockModules = [
    { id: '1', name: 'Zebra', memberCount: 1, createdAt: '2020-01-01', creator: { username: 'a' } },
    { id: '2', name: 'Alpha', memberCount: 10, createdAt: '2024-01-01', creator: { username: 'b' } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirms the range labels and pagination buttons appear even with empty data
  it('covers empty state and safeTotal pagination', () => {
    render(<ModulesPageClient modules={[]} />);
    expect(screen.getByText(/no modules found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  // Confirms all uncovered sort branches (Name Z-A, Fewest Members, Oldest) execute correctly
  it('executes all sorting branches to hit lines 38, 41, and 44', () => {
    render(<ModulesPageClient modules={mockModules} />);
    
    const sortBtn = screen.getByText(/sort/i);
    
    fireEvent.click(sortBtn);
    fireEvent.click(screen.getByText('Name Z → A'));
    expect(screen.getAllByTestId('module-card')[0]).toHaveTextContent('Zebra');

    fireEvent.click(sortBtn);
    fireEvent.click(screen.getByText('Fewest members'));
    expect(screen.getAllByTestId('module-card')[0]).toHaveTextContent('Zebra');

    fireEvent.click(sortBtn);
    fireEvent.click(screen.getByText('Oldest first'));
    expect(screen.getAllByTestId('module-card')[0]).toHaveTextContent('Zebra');
  });

  // Confirms previous and next chevron buttons work, hitting lines 62 and 84
  it('navigates through pagination using next and previous buttons', () => {
    // Generate 10 modules to force a second page (Page size is 8)
    const manyModules = Array.from({ length: 10 }, (_, i) => ({
      ...mockModules[0], id: `${i}`, name: `Mod ${i}`
    }));
    
    render(<ModulesPageClient modules={manyModules} />);
    
    // Initial state check
    expect(screen.getByText(/page 1\/2/i)).toBeInTheDocument();

    // Click "Next" button via its mocked icon
    const nextBtn = screen.getByTestId('next-icon').parentElement!;
    fireEvent.click(nextBtn);
    expect(screen.getByText(/page 2\/2/i)).toBeInTheDocument();

    // Click "Previous" button via its mocked icon
    const prevBtn = screen.getByTestId('prev-icon').parentElement!;
    fireEvent.click(prevBtn);
    expect(screen.getByText(/page 1\/2/i)).toBeInTheDocument();
  });

  // Confirms the onSuccess refresh logic triggers correctly for modals
  it('triggers router refresh on successful create or join', () => {
    render(<ModulesPageClient modules={mockModules} />);
    
    fireEvent.click(screen.getByText(/create/i));
    fireEvent.click(screen.getByTestId('create-modal-trigger'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/join/i));
    fireEvent.click(screen.getByTestId('join-modal-trigger'));
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });
});