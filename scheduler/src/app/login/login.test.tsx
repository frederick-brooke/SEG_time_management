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

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/components/admin/ban-message-page', () => () => <div>Banned Page</div>);

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
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.includes('/api/auth/session')) {
        return Promise.resolve({ json: () => Promise.resolve({ user: { id: '123' } }) });
      }
      if (typeof url === 'string' && url.includes('/api/preferences/check')) {
        return Promise.resolve({ json: () => Promise.resolve({ hasPreferences: true }) });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }) as jest.Mock;
  });

  it('renders the login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('shows a loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({ status: 'loading' });
    render(<LoginPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls signIn and redirects on success', async () => {
    const user = userEvent.setup();
    (signIn as jest.Mock).mockImplementationOnce(() => Promise.resolve({ error: null }));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /initiate launch/i }));
    
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
    await user.click(screen.getByRole('button', { name: /initiate launch/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email/username or password.')).toBeInTheDocument();
    });
  });

  it('shows the banned page if the user is banned', async () => {
    const user = userEvent.setup();
    (signIn as jest.Mock).mockResolvedValueOnce({ error: 'Banned' });
    
    render(<LoginPage />);
    
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    await user.type(emailInput, 'banned@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /initiate launch/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Your account has been banned.')).toBeInTheDocument();
      expect(screen.getByText('Banned Page')).toBeInTheDocument();
    });
  });
});