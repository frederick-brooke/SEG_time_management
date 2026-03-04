import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next/link', () => ({ children, href }: any) => <a href={href}>{children}</a>);

describe('LoginPage Component', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockGetSearchParam = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetSearchParam,
    });
    
    (useSession as jest.Mock).mockReturnValue({
      status: 'unauthenticated',
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows a loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({ status: 'loading' });
    render(<LoginPage />);
    
    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign In' })).not.toBeInTheDocument();
  });

  it('displays access denied error from URL if present', () => {
    mockGetSearchParam.mockImplementation((key) => key === 'error' ? 'AccessDenied' : null);
    render(<LoginPage />);
    
    expect(screen.getByText('Access denied. Please check your credentials.')).toBeInTheDocument();
  });

  it('calls signIn with credentials when the form is submitted', async () => {
    const user = userEvent.setup();
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null });
    
    render(<LoginPage />);
    
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    expect(signIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: 'test@example.com',
      password: 'password123',
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows an error message if signIn returns an error', async () => {
    const user = userEvent.setup();
    (signIn as jest.Mock).mockResolvedValueOnce({ error: 'CredentialsSignin' });
    
    render(<LoginPage />);
    
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});