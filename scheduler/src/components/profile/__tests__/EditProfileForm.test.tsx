import { render, screen, fireEvent } from '@testing-library/react';
import EditProfileForm from '../EditProfileForm';
import '@testing-library/jest-dom';

// 1. Mock the UI Icons
jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />
}));

// 2. Mock Server Actions & React DOM hooks
jest.mock('../../../app/actions/profile', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
}));

describe('EditProfileForm Component', () => {
  const mockOnClose = jest.fn();
  
  const populatedProfile = {
    fname: 'Jane',
    lname: 'Doe',
    bio: 'Software Engineering student.'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('populates inputs with existing profile data', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Software Engineering student.')).toBeInTheDocument();
  });

  it('handles missing profile data gracefully with empty defaults', () => {
    // Passing an empty object to simulate a new user with no data yet
    render(<EditProfileForm profile={{}} onClose={mockOnClose} />);
    
    // Grab inputs by their associated labels to check their values
    const fnameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
    const lnameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;
    const bioInput = screen.getByLabelText(/Bio/i) as HTMLTextAreaElement;

    expect(fnameInput.value).toBe('');
    expect(lnameInput.value).toBe('');
    expect(bioInput.value).toBe('');
  });

  it('fires onClose callback when the Cancel button is clicked', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose callback when the X icon is clicked', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    
    const closeIcon = screen.getByTestId('x-icon');
    fireEvent.click(closeIcon.closest('button')!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});