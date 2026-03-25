import { render, screen, fireEvent } from '@testing-library/react';
import PendingRequests from '../PendingRequests';
import { useFormStatus } from 'react-dom';
import '@testing-library/jest-dom';

// mocks
jest.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

jest.mock('@/src/app/actions/profile', () => ({
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}));

const sampleRequests = [
  {
    id: 'req1',
    sender: { id: 's1', username: 'johndoe', fname: 'John', lname: 'Doe', pfp: null },
  },
];

describe('PendingRequests Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormStatus as jest.Mock).mockReturnValue({ pending: false });
  });

  /**
   * Confirms the component renders nothing when the requests array is empty.
   */
  it('renders nothing when requests array is empty', () => {
    const { container } = render(<PendingRequests requests={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Confirms the component handles undefined gracefully without crashing.
   */
  it('renders nothing when requests are undefined', () => {
    const { container } = render(<PendingRequests requests={undefined as any} />);
    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Confirms the section heading is displayed when there are pending requests.
   */
  it('renders the pending requests heading', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('Pending Friend Requests')).toBeInTheDocument();
  });

  /**
   * Confirms the count badge shows the correct number of pending requests.
   */
  it('renders the count badge with the correct number', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  /**
   * Confirms the sender's full name and username are rendered for each request.
   */
  it('renders sender name and username', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  /**
   * Confirms the Accept button is present and labelled correctly.
   */
  it('renders the Accept button', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  /**
   * Confirms the reject button renders as an X icon and is enabled by default.
   */
  it('renders the reject X icon button in an enabled state', () => {
    render(<PendingRequests requests={sampleRequests} />);
    const rejectIcon = screen.getByTestId('x-icon');
    expect(rejectIcon).toBeInTheDocument();
    expect(rejectIcon.closest('button')).not.toBeDisabled();
  });

  /**
   * Confirms all senders render and the badge count updates when multiple requests exist.
   */
  it('renders multiple requests with correct count badge', () => {
    const multipleRequests = [
      { id: 'req1', sender: { id: 's1', username: 'alice', fname: 'Alice', lname: 'A', pfp: null } },
      { id: 'req2', sender: { id: 's2', username: 'bob', fname: 'Bob', lname: 'B', pfp: null } },
    ];
    render(<PendingRequests requests={multipleRequests} />);
    expect(screen.getByText('Alice A')).toBeInTheDocument();
    expect(screen.getByText('Bob B')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  /**
   * Partitions: Ensures the accept and reject buttons correctly enter a disabled, 
   * visually distinct loading state while the server action is pending.
   */
  it('disables accept and reject buttons when pending', () => {
    (useFormStatus as jest.Mock).mockReturnValue({ pending: true });
    render(<PendingRequests requests={sampleRequests} />);
    
    const acceptBtn = screen.getByRole('button', { name: /Accepting.../i });
    expect(acceptBtn).toBeDisabled();
    expect(acceptBtn).toHaveClass('opacity-50');

    const buttons = screen.getAllByRole('button');
    const rejectBtn = buttons.find(btn => !btn.textContent?.includes('Accepting'));
    expect(rejectBtn).toBeDisabled();
    expect(rejectBtn).toHaveClass('opacity-50');
  });

  /**
   * Ensures the sender name fallbacks (username only) are covered.
   */
  it('uses username fallback when sender fname is missing', () => {
    const fallbackRequest = [{
      id: 'req2',
      sender: { id: 's2', username: 'nofname', pfp: null }
    }];
    render(<PendingRequests requests={fallbackRequest} />);
    
    // Looks for the fallback username rendering in the bold text area
    expect(screen.getAllByText('nofname').length).toBeGreaterThan(0);
  });

  /**
   * Simulates submitting the Accept and Reject forms to cover 
   * the inline action .bind() branches.
   */
  it('submits the accept and reject forms to trigger action bindings', () => {
    render(<PendingRequests requests={sampleRequests} />);

    const acceptBtn = screen.getByText('Accept');
    const rejectIcon = screen.getByTestId('x-icon');

    // Fire form submissions to cover lines 72-81
    fireEvent.submit(acceptBtn.closest('form')!);
    fireEvent.submit(rejectIcon.closest('form')!);
  });
});