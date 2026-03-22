import { render, screen } from '@testing-library/react';
import PendingRequests from '../PendingRequests';
import '@testing-library/jest-dom';

// mocks
// Replaces icons with testable SVG elements
jest.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

// Prevents server actions from executing in the test environment
jest.mock('../../../app/actions/profile', () => ({
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
}));

// Bypasses the form status hook so both buttons always render in their default state
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
}));

const sampleRequests = [
  {
    id: 'req1',
    sender: { id: 's1', username: 'johndoe', fname: 'John', lname: 'Doe', pfp: null },
  },
];

describe('PendingRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  // Confirms the component renders nothing at all when there are no pending requests
  it('renders nothing when requests array is empty', () => {
    const { container } = render(<PendingRequests requests={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  // Confirms the component handles undefined gracefully without crashing
  it('renders nothing when requests are undefined', () => {
    const { container } = render(<PendingRequests requests={undefined as any} />);
    expect(container).toBeEmptyDOMElement();
  });

  // Confirms the section heading is displayed when there are pending requests
  it('renders the pending requests heading', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('Pending Friend Requests')).toBeInTheDocument();
  });

  // Confirms the count badge shows the correct number of pending requests
  it('renders the count badge with the correct number', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // Confirms the sender's full name and username are rendered for each request
  it('renders sender name and username', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  // Confirms the Accept button is present and labelled correctly
  it('renders the Accept button', () => {
    render(<PendingRequests requests={sampleRequests} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  // Confirms the reject button renders as an X icon and is not disabled by default
  it('renders the reject X icon button in an enabled state', () => {
    render(<PendingRequests requests={sampleRequests} />);
    const rejectIcon = screen.getByTestId('x-icon');
    expect(rejectIcon).toBeInTheDocument();
    expect(rejectIcon.closest('button')).not.toBeDisabled();
  });

  // Confirms all senders render and the badge count updates when multiple requests exist
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
});