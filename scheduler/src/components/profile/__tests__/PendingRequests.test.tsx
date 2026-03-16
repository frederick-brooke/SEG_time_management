import { render, screen } from '@testing-library/react';
import PendingRequests from '../PendingRequests';
import '@testing-library/jest-dom';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />
}));

// Mock Server Actions
jest.mock('@/src/app/actions/profile', () => ({
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
}));

// Mock react-dom to bypass the useFormStatus hook requirement in tests
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
}));

describe('PendingRequests Component', () => {
  const sampleRequests = [
    { 
      id: 'req1', 
      sender: { id: 's1', username: 'johndoe', fname: 'John', lname: 'Doe', pfp: null } 
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and renders nothing when requests array is empty', () => {
    const { container } = render(<PendingRequests requests={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null and renders nothing when requests are undefined', () => {
    const { container } = render(<PendingRequests requests={undefined as any} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pending requests list when data is provided', () => {
    render(<PendingRequests requests={sampleRequests} />);
    
    // Check header and badge count
    expect(screen.getByText('Pending Friend Requests')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // The badge

    // Check sender details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('renders the accept and reject buttons', () => {
    render(<PendingRequests requests={sampleRequests} />);
    
    // Accept button text
    expect(screen.getByText('Accept')).toBeInTheDocument();
    
    // Reject button uses the X icon, we can check for the button containing it
    const rejectIcon = screen.getByTestId('x-icon');
    expect(rejectIcon).toBeInTheDocument();
    expect(rejectIcon.closest('button')).not.toBeDisabled();
  });
});