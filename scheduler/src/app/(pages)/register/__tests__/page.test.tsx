import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
    const MockLink = ({ children, href }: any) => <a href={href}>{children}</a>;
    MockLink.displayName = 'MockLink';
    return MockLink;
  });

// Mock password validator
jest.mock('@/lib/password', () => ({
  validatePassword: jest.fn(),
}));

describe('RegisterPage Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    global.fetch = jest.fn();
  });

  it('renders the register form correctly', () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole('heading', { name: /join the orbit/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/username/i)).toBeInTheDocument();
    expect(screen.getByText(/email address/i)).toBeInTheDocument();
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(inputs[0], 'testuser'); // username
    await user.type(inputs[1], 'test@example.com'); // email
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Different123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  it('shows password validation error', async () => {
    const user = userEvent.setup();
    const { validatePassword } = require('@/lib/password');

    validatePassword.mockReturnValue('Weak password');

    render(<RegisterPage />);

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'test@example.com');
    await user.type(passwordInputs[0], 'weak');
    await user.type(passwordInputs[1], 'weak');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Weak password')).toBeInTheDocument();
  });

  it('registers and logs in successfully', async () => {
    const user = userEvent.setup();
    const { validatePassword } = require('@/lib/password');

    validatePassword.mockReturnValue(null);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    (signIn as jest.Mock).mockResolvedValueOnce({ ok: true });

    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<RegisterPage />);

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'test@example.com');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalled();
      expect(signIn).toHaveBeenCalled();
    });
  });

  it('shows API error on failed registration', async () => {
    const user = userEvent.setup();
    const { validatePassword } = require('@/lib/password');

    validatePassword.mockReturnValue(null);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User already exists' }),
    });

    render(<RegisterPage />);

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'test@example.com');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
    });
  });

  it('shows error if auto-login fails', async () => {
    const user = userEvent.setup();
    const { validatePassword } = require('@/lib/password');

    validatePassword.mockReturnValue(null);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    (signIn as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<RegisterPage />);

    const inputs = screen.getAllByRole('textbox');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(inputs[0], 'testuser');
    await user.type(inputs[1], 'test@example.com');
    await user.type(passwordInputs[0], 'Password123');
    await user.type(passwordInputs[1], 'Password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/account created, but login failed/i)
      ).toBeInTheDocument();
    });
  });
});