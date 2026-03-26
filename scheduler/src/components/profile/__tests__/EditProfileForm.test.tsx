import { render, screen, fireEvent, act } from '@testing-library/react';
import EditProfileForm from '../EditProfileForm';
import { useFormStatus } from 'react-dom';
import '@testing-library/jest-dom';

// mocks
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}));

jest.mock('@/app/actions/profile', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
}));

describe('EditProfileForm Component', () => {
  const mockProfile = {
    fname: 'John',
    lname: 'Doe',
    bio: 'Software Engineer'
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useFormStatus as jest.Mock).mockReturnValue({ pending: false });
  });

  afterEach(() => {
    // Clears lingering setTimeouts to fix the "Open Handles" Jest warning
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  /**
   * Partitions: Checks standard initialization of form fields.
   */
  it('renders the form with prepopulated profile data', () => {
    render(<EditProfileForm profile={mockProfile} onClose={mockOnClose} />);
    
    expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Doe');
    expect(screen.getByLabelText(/Bio/i)).toHaveValue('Software Engineer');
  });

  /**
   * Partitions: Verifies close callback functionality.
   */
  it('calls onClose when the X button is clicked', () => {
    render(<EditProfileForm profile={mockProfile} onClose={mockOnClose} />);
    
    const closeBtn = screen.getByTestId('icon-x').closest('button');
    if (closeBtn) fireEvent.click(closeBtn);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Partitions: Ensures the form triggers the close callback after submission timeout.
   */
  it('triggers the onClose callback shortly after form submission', () => {
    render(<EditProfileForm profile={mockProfile} onClose={mockOnClose} />);
    
    const form = screen.getByLabelText(/First Name/i).closest('form');
    if (form) fireEvent.submit(form);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Wrapped in act() to ensure React processes the state/timer updates cleanly
    act(() => { jest.advanceTimersByTime(500); });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Ensures the submit button enters a disabled, visually distinct 
   * loading state while the server action is pending.
   */
  it('disables the submit button and shows loading text when pending', () => {
    (useFormStatus as jest.Mock).mockReturnValue({ pending: true });
    render(<EditProfileForm profile={mockProfile} onClose={mockOnClose} />);
    
    const submitBtn = screen.getByRole('button', { name: /Saving.../i });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveClass('opacity-50');
  });

  /**
   * Ensures fallback empty strings are used when profile fields are missing.
   * This covers the || "" conditional branches.
   */
  it('uses empty string fallbacks when profile fields are missing', () => {
    render(<EditProfileForm profile={{}} onClose={mockOnClose} />);
    
    expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Bio/i)).toHaveValue('');
  });
});