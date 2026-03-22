import { render, screen, fireEvent } from '@testing-library/react';
import EditProfileForm from '../EditProfileForm';
import '@testing-library/jest-dom';

// mocks
// Replaces the X icon with a testable SVG element
jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
}));

// Prevents server action from executing in the test environment
jest.mock('../../../app/actions/profile', () => ({
  updateProfile: jest.fn(),
}));

// Bypasses the form status hook so the submit button always renders in its default state
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
}));

describe('EditProfileForm', () => {
  const mockOnClose = jest.fn();

  const populatedProfile = {
    fname: 'Jane',
    lname: 'Doe',
    bio: 'Software Engineering student.',
  };

  beforeEach(() => jest.clearAllMocks());

  // Confirms the form pre-fills all three inputs when the user already has profile data
  it('populates inputs with existing profile data', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Software Engineering student.')).toBeInTheDocument();
  });

  // Confirms the form renders with empty strings rather than undefined/null for new users
  it('handles missing profile data with empty defaults', () => {
    render(<EditProfileForm profile={{}} onClose={mockOnClose} />);
    const fnameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
    const lnameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;
    const bioInput = screen.getByLabelText(/Bio/i) as HTMLTextAreaElement;
    expect(fnameInput.value).toBe('');
    expect(lnameInput.value).toBe('');
    expect(bioInput.value).toBe('');
  });

  // Confirms clicking the X icon button triggers the onClose callback
  it('calls onClose when the X icon button is clicked', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    const closeIcon = screen.getByTestId('x-icon');
    fireEvent.click(closeIcon.closest('button')!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Confirms the submit button renders with the correct label
  it('renders the Save Changes submit button', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  // Confirms all three labelled form fields are present and accessible
  it('renders all three form fields', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument();
  });

  // Confirms the form section heading is rendered for context
  it('renders the Edit Details heading', () => {
    render(<EditProfileForm profile={populatedProfile} onClose={mockOnClose} />);
    expect(screen.getByText('Edit Details')).toBeInTheDocument();
  });
});