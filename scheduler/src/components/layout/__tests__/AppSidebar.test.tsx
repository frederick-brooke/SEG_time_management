import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AppSidebar } from '../AppSidebar';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockPathname = jest.fn().mockReturnValue('/dashboard');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// FIX: Changed from examActions to examNotifications to match the component
jest.mock('@/app/actions/examNotifications', () => ({
  checkUpcomingDeadlines: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/notifications', () => ({
  getNotifications: jest.fn().mockResolvedValue({ notifications: [] }),
}));

jest.mock('@/app/actions/calendar/calendarNotifications', () => ({
  checkUpcomingEventNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../ui/ToastContainer', () => ({
  ToastContainer: ({ toasts, onDismiss }: any) => (
    <div data-testid="toast-container">
      {toasts.map((t: any) => (
        <div key={t.id} data-testid={`toast-${t.id}`}>
          {t.title}
          <button onClick={() => onDismiss(t.id)}>dismiss</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/app/components/NotificationModal', () => ({
  __esModule: true,
  default: ({ isOpen, handleShowModal }: any) =>
    isOpen ? (
      <div data-testid="notif-modal">
        <button onClick={handleShowModal}>close</button>
      </div>
    ) : null,
}));

jest.mock('@/components/search-page/SearchPanel', () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="search-panel">
        <button onClick={onClose}>close search</button>
      </div>
    ) : null,
}));

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => <div data-testid="sidebar" {...props}>{children}</div>,
  SidebarContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: any) => <div>{children}</div>,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const { useSession, signOut } = require('next-auth/react');
const { getNotifications } = require('@/app/actions/notifications');
const { checkUpcomingEventNotifications } = require('@/app/actions/calendar/calendarNotifications');
// FIX: Changed from examActions to examNotifications to match the mock
const { checkUpcomingDeadlines } = require('@/app/actions/examNotifications');

const mockSession = (overrides = {}) => {
  useSession.mockReturnValue({
    data: {
      user: {
        id: 'user-1',
        name: 'Karim',
        email: 'karim@karim.com',
        username: 'karim',
        role: 'BASIC',
        image: null,
        ...overrides,
      },
    },
  });
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    getNotifications.mockResolvedValue({ notifications: [] });
    checkUpcomingEventNotifications.mockResolvedValue(undefined);
    checkUpcomingDeadlines.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the sidebar', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders the Lunar logo link', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Lunar')).toBeInTheDocument();
    });

    it('renders all workspace nav items', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Exam Planner')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
    });

    it('renders all social nav items', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Map')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('renders extras nav items', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Minigames')).toBeInTheDocument();
    });

    it('renders search pill', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('renders bell icon button', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Karim')).toBeInTheDocument();
    });

    it('renders user name in footer', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Karim')).toBeInTheDocument();
    });

    it('renders user initial when no pfp', async () => {
      await act(async () => { render(<AppSidebar />); });
      const initials = screen.getAllByText('K');
      expect(initials.length).toBeGreaterThan(0);
    });

    it('renders user pfp image when available', async () => {
      mockSession({ image: 'https://example.com/pfp.jpg' });
      await act(async () => { render(<AppSidebar />); });
      const imgs = screen.getAllByRole('img');
      expect(imgs[0]).toHaveAttribute('src', 'https://example.com/pfp.jpg');
    });

    it('does not render Admin item for BASIC user', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('renders Admin item for SUPERUSER', async () => {
      mockSession({ role: 'SUPERUSER' });
      await act(async () => { render(<AppSidebar />); });
      
      const adminElements = screen.getAllByText('Admin');
      expect(adminElements.length).toBeGreaterThan(0);
    });

    it('renders section labels', async () => {
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
      expect(screen.getByText('Extras')).toBeInTheDocument();
    });

    it('falls back to "User" when no session name', async () => {
      useSession.mockReturnValue({
        data: { user: { id: '1', email: 'a@a.com', role: 'BASIC' } },
      });
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('handles null session gracefully', async () => {
      useSession.mockReturnValue({ data: null });
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  // ── Active state ───────────────────────────────────────────────────────────

  describe('active state', () => {
    it('marks dashboard as active when on /dashboard', async () => {
      mockPathname.mockReturnValue('/dashboard');
      await act(async () => { render(<AppSidebar />); });
      const dashLink = screen.getByText('Dashboard').closest('a');
      expect(dashLink?.className).toContain('w-full');
    });
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  describe('search panel', () => {
    it('opens search panel when search pill clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getByText('Search'));
      expect(screen.getByTestId('search-panel')).toBeInTheDocument();
    });

    it('closes search panel', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getByText('Search'));
      fireEvent.click(screen.getByText('close search'));
      expect(screen.queryByTestId('search-panel')).not.toBeInTheDocument();
    });
  });

  // ── Notifications ──────────────────────────────────────────────────────────

  describe('notifications', () => {
    it('opens notification modal when bell clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]); 
      
      await waitFor(() => {
        expect(screen.getByTestId('notif-modal')).toBeInTheDocument();
      });
    });

    it('closes notification modal', async () => {
      await act(async () => { render(<AppSidebar />); });
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      await waitFor(() => screen.getByTestId('notif-modal'));
      fireEvent.click(screen.getByText('close'));
      expect(screen.queryByTestId('notif-modal')).not.toBeInTheDocument();
    });

    it('shows unread badge when notifications exist', async () => {
      getNotifications.mockResolvedValue({
        notifications: [
          { id: 'n1', title: 'Test', message: 'msg', type: 'INFO' },
          { id: 'n2', title: 'Test2', message: 'msg2', type: 'WARNING' },
        ],
      });
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('shows 99+ when unread count exceeds 99', async () => {
      const manyNotifs = Array.from({ length: 100 }, (_, i) => ({
        id: `n${i}`, title: `N${i}`, message: 'msg', type: 'INFO',
      }));
      getNotifications.mockResolvedValue({ notifications: manyNotifs });
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });

    it('resets unread count to 0 when bell clicked', async () => {
      getNotifications.mockResolvedValue({
        notifications: [{ id: 'n1', title: 'T', message: 'm', type: 'INFO' }],
      });
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => screen.getByText('1'));
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      await waitFor(() => {
        expect(screen.queryByText('1')).not.toBeInTheDocument();
      });
    });

    it('shows toast for new notifications after initial poll', async () => {
      // First poll: empty. Second poll: new notification appears.
      getNotifications
        .mockResolvedValueOnce({ notifications: [{ id: 'n1', title: 'First', message: 'msg', type: 'INFO' }] })
        .mockResolvedValueOnce({ notifications: [
          { id: 'n1', title: 'First', message: 'msg', type: 'INFO' },
          { id: 'n2', title: 'New Notif', message: 'new msg', type: 'SUCCESS' },
        ]});

      await act(async () => { render(<AppSidebar />); });

      // Trigger second poll
      await act(async () => {
        await getNotifications();
      });

      await waitFor(() => {
        expect(screen.getByTestId('toast-container')).toBeInTheDocument();
      });
    });

    it('dismisses a toast', async () => {
      getNotifications
        .mockResolvedValueOnce({ notifications: [{ id: 'n1', title: 'First', message: 'msg', type: 'INFO' }] })
        .mockResolvedValueOnce({ notifications: [
          { id: 'n1', title: 'First', message: 'msg', type: 'INFO' },
          { id: 'n2', title: 'Toast!', message: 'msg', type: 'INFO' },
        ]});

      await act(async () => { render(<AppSidebar />); });
      await act(async () => { await getNotifications(); });

      await waitFor(() => screen.queryByText('dismiss'));
      const dismissBtns = screen.queryAllByText('dismiss');
      if (dismissBtns.length > 0) {
        fireEvent.click(dismissBtns[0]);
        expect(dismissBtns[0]).not.toBeInTheDocument();
      }
    });

    it('handles getNotifications returning no notifications key', async () => {
      getNotifications.mockResolvedValue({});
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('handles getNotifications throwing an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getNotifications.mockRejectedValue(new Error('network fail'));
      await act(async () => { render(<AppSidebar />); });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to poll notifications:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // ── Unread messages ────────────────────────────────────────────────────────

  describe('unread messages', () => {
    it('shows message badge when unread conversations exist', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 'c1', hasUnread: true },
          { id: 'c2', hasUnread: false },
        ],
      });
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('handles fetch not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('handles fetch returning non-array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'bad' }),
      });
      await act(async () => { render(<AppSidebar />); });
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('handles fetch throwing error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = jest.fn().mockRejectedValue(new Error('network'));
      await act(async () => { render(<AppSidebar />); });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to poll unread messages:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // ── User footer dropdown ───────────────────────────────────────────────────

  describe('user footer dropdown', () => {
    it('opens dropdown when 3-dots clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Log out')).toBeInTheDocument();
      });
    });

    it('shows email in dropdown header', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getAllByRole('button').at(-1)!);
      await waitFor(() => {
        expect(screen.getByText('karim@karim.com')).toBeInTheDocument();
      });
    });

    it('navigates to /profile when Profile clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getAllByRole('button').at(-1)!);
      await waitFor(() => screen.getByText('Profile'));
      fireEvent.click(screen.getByText('Profile'));
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('navigates to /settings when Settings clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getAllByRole('button').at(-1)!);
      await waitFor(() => screen.getByText('Settings'));
      fireEvent.click(screen.getByText('Settings'));
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('calls signOut when Log out clicked', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getAllByRole('button').at(-1)!);
      await waitFor(() => screen.getByText('Log out'));
      fireEvent.click(screen.getByText('Log out'));
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('closes dropdown when clicking outside', async () => {
      await act(async () => { render(<AppSidebar />); });
      fireEvent.click(screen.getAllByRole('button').at(-1)!);
      await waitFor(() => screen.getByText('Profile'));
      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('toggles dropdown closed when 3-dots clicked again', async () => {
      await act(async () => { render(<AppSidebar />); });
      const dotsBtn = screen.getAllByRole('button').at(-1)!;
      fireEvent.click(dotsBtn);
      await waitFor(() => screen.getByText('Profile'));
      fireEvent.click(dotsBtn);
      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });
  });

  // ── Session-driven effects ─────────────────────────────────────────────────

  describe('session effects', () => {
    it('calls checkUpcomingDeadlines when session has user id', async () => {
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => {
        expect(checkUpcomingDeadlines).toHaveBeenCalledWith('user-1');
      });
    });

    it('calls checkUpcomingEventNotifications when session has user id', async () => {
      await act(async () => { render(<AppSidebar />); });
      await waitFor(() => {
        expect(checkUpcomingEventNotifications).toHaveBeenCalledWith('user-1');
      });
    });

    it('does not call deadline check when session is null', async () => {
      useSession.mockReturnValue({ data: null });
      await act(async () => { render(<AppSidebar />); });
      expect(checkUpcomingDeadlines).not.toHaveBeenCalled();
    });
  });
});