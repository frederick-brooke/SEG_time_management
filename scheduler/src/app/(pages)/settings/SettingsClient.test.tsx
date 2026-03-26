import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsClient } from './SettingsClient';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/app/actions/settings', () => ({
  updateAccountDetails: jest.fn().mockResolvedValue({}),
  changePassword: jest.fn().mockResolvedValue({}),
  disconnectGoogle: jest.fn().mockResolvedValue({}),
  updatePreferences: jest.fn().mockResolvedValue({}),
  deleteAccount: jest.fn().mockResolvedValue({}),
}));

// ✅ NEW: Mock the location action to prevent deep server-side imports
jest.mock('@/app/actions/update-user-location', () => ({
  updateLocationHidden: jest.fn().mockResolvedValue({ success: true }),
}));

// ✅ NEW: Mock the modal to prevent Leaflet/Map libraries from crashing JSDOM
jest.mock('@/components/map/SetLocationModal', () => {
  return function MockSetLocationModal() {
    return <div data-testid="mock-set-location-modal" />;
  };
});

jest.mock('@/components/layout/LunarThemeWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const defaultUser = {
  username: 'testuser',
  email: 'test@test.com',
  hasPassword: true,
  hasGoogleConnected: false,
  location: { lat: 0, lng: 0 },
  city: '',
  country: '',
  locationHidden: false,
  preferences: {
    workStartTime: '09:00',
    workEndTime: '17:00',
    sessionLength: 60,
    breakLength: 15,
    breaksPerDay: 3,
    maxTasksPerDay: 10,
    defaultTaskDuration: 30,
    reminderDays: 1,
    taskOrder: 'priority',
    daysOff: ['Saturday', 'Sunday'],
  },
};

describe('SettingsClient', () => {

  describe('Account tab', () => {
    it('renders account tab by default', () => {
      render(<SettingsClient user={defaultUser} />);
      expect(screen.getByText('Account Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    });

    it('submits account details form', async () => {
      const { updateAccountDetails } = require('@/app/actions/settings');
      render(<SettingsClient user={defaultUser} />);
      fireEvent.submit(screen.getByText('Save Changes').closest('form')!);
      await waitFor(() => expect(updateAccountDetails).toHaveBeenCalled());
    });
  });

  describe('Preferences tab', () => {
    it('renders preferences when tab clicked', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Preferences'));
      expect(screen.getByText('Workflow Configuration')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('shows days off checkboxes with correct defaults', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Preferences'));
      const saturdayCheckbox = screen.getByDisplayValue('Saturday') as HTMLInputElement;
      expect(saturdayCheckbox.checked).toBe(true);
      const mondayCheckbox = screen.getByDisplayValue('Monday') as HTMLInputElement;
      expect(mondayCheckbox.checked).toBe(false);
    });

    it('submits preferences form', async () => {
      const { updatePreferences } = require('@/app/actions/settings');
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Preferences'));
      fireEvent.submit(screen.getByText('Update Preferences').closest('form')!);
      await waitFor(() => expect(updatePreferences).toHaveBeenCalled());
    });

    it('renders preferences with no daysOff defined', () => {
      const userNoPref = { ...defaultUser, preferences: { ...defaultUser.preferences, daysOff: undefined } };
      render(<SettingsClient user={userNoPref} />);
      fireEvent.click(screen.getByText('Preferences'));
      expect(screen.getByText('Workflow Configuration')).toBeInTheDocument();
      const satCheckbox = screen.getByDisplayValue('Saturday') as HTMLInputElement;
      expect(satCheckbox.checked).toBe(false);
    });

    it('renders with no preferences object at all', () => {
      const userNoPref = { ...defaultUser, preferences: null };
      render(<SettingsClient user={userNoPref} />);
      fireEvent.click(screen.getByText('Preferences'));
      expect(screen.getByText('Workflow Configuration')).toBeInTheDocument();
    });
  });

  describe('Security tab', () => {
    it('renders security tab', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      expect(screen.getByText('Update Password')).toBeInTheDocument();
      expect(screen.getAllByText('Delete Account').length).toBeGreaterThan(0);
    });

    it('submits password form', async () => {
      const { changePassword } = require('@/app/actions/settings');
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.submit(screen.getByText('Update Password').closest('form')!);
      await waitFor(() => expect(changePassword).toHaveBeenCalled());
    });

    it('opens delete modal on button click', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      expect(screen.getByText('Initiate Self-Destruct?')).toBeInTheDocument();
    });

    it('advances to password stage in delete modal', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Yes, Continue'));
      expect(screen.getByText('Authorization Required')).toBeInTheDocument();
    });

    it('closes delete modal on cancel', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Abort'));
      expect(screen.queryByText('Initiate Self-Destruct?')).not.toBeInTheDocument();
    });

    it('closes delete modal from password stage', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Yes, Continue'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Authorization Required')).not.toBeInTheDocument();
    });
  });

  describe('Integrations tab', () => {
    it('renders connect google button when not connected', () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Integrations'));
      expect(screen.getByText('Connect Google')).toBeInTheDocument();
    });

    it('renders disconnect button when google is connected', () => {
      render(<SettingsClient user={{ ...defaultUser, hasGoogleConnected: true }} />);
      fireEvent.click(screen.getByText('Integrations'));
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('calls signIn when connect google clicked', () => {
      const { signIn } = require('next-auth/react');
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Integrations'));
      fireEvent.click(screen.getByText('Connect Google'));
      expect(signIn).toHaveBeenCalledWith('google');
    });

    it('calls disconnectGoogle when disconnect clicked', async () => {
      const { disconnectGoogle } = require('@/app/actions/settings');
      render(<SettingsClient user={{ ...defaultUser, hasGoogleConnected: true }} />);
      fireEvent.click(screen.getByText('Integrations'));
      fireEvent.click(screen.getByText('Disconnect'));
      await waitFor(() => expect(disconnectGoogle).toHaveBeenCalled());
    });
  });

  describe('Error and success states', () => {
    it('shows success message after saving account', async () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.submit(screen.getByText('Save Changes').closest('form')!);
      await waitFor(() => expect(screen.getByText('Account details updated.')).toBeInTheDocument());
    });

    it('shows no status message on initial render', () => {
      render(<SettingsClient user={defaultUser} />);
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
      expect(screen.queryByText(/updated|error/i)).not.toBeInTheDocument();
    });

    it('shows error message when action throws', async () => {
      const { updateAccountDetails } = require('@/app/actions/settings');
      updateAccountDetails.mockRejectedValueOnce(new Error('Email already taken'));
      render(<SettingsClient user={defaultUser} />);
      fireEvent.submit(screen.getByText('Save Changes').closest('form')!);
      await waitFor(() => expect(screen.getByText('Email already taken')).toBeInTheDocument());
    });

    it('clears error and success when switching tabs', async () => {
      render(<SettingsClient user={defaultUser} />);
      fireEvent.submit(screen.getByText('Save Changes').closest('form')!);
      await waitFor(() => expect(screen.getByText('Account details updated.')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Security'));
      expect(screen.queryByText('Account details updated.')).not.toBeInTheDocument();
    });

    it('shows error when disconnect google fails', async () => {
      const { disconnectGoogle } = require('@/app/actions/settings');
      disconnectGoogle.mockRejectedValueOnce(new Error('Disconnect failed'));
      render(<SettingsClient user={{ ...defaultUser, hasGoogleConnected: true }} />);
      fireEvent.click(screen.getByText('Integrations'));
      fireEvent.click(screen.getByText('Disconnect'));
      await waitFor(() => expect(screen.getByText('Disconnect failed')).toBeInTheDocument());
    });

    it('submits delete account form', async () => {
      const { deleteAccount } = require('@/app/actions/settings');
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Yes, Continue'));
      fireEvent.submit(screen.getByText('Permanently Delete').closest('form')!);
      await waitFor(() => expect(deleteAccount).toHaveBeenCalled());
    });

    it('shows error when delete account fails', async () => {
      const { deleteAccount } = require('@/app/actions/settings');
      deleteAccount.mockRejectedValueOnce(new Error('Wrong password'));
      render(<SettingsClient user={defaultUser} />);
      fireEvent.click(screen.getByText('Security'));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Yes, Continue'));
      fireEvent.submit(screen.getByText('Permanently Delete').closest('form')!);
      await waitFor(() => expect(screen.getByText('Wrong password')).toBeInTheDocument());
    });
  });
});