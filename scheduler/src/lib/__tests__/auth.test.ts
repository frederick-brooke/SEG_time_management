/**
 * Testing for lib/auth
 */

import { authOptions, authorizeUser } from '../auth';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

// Mocks

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn()
}));

jest.mock('../prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    account: { findUnique: jest.fn(), upsert: jest.fn(), findFirst: jest.fn() }
  }
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hash')
}));

jest.mock('../password', () => ({
  verifyPassword: jest.fn()
}));

import { verifyPassword } from '../password';

const getCallbacks = () => authOptions.callbacks as any;

// Tests

describe('Auth Logic Coverage (/lib/auth.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyPassword as jest.Mock).mockResolvedValue(true);
  });

  describe('authorizeUser', () => {
    it('returns null if missing credentials', async () => {
      expect(await authorizeUser(undefined)).toBeNull();
      expect(await authorizeUser({ identifier: '', password: 'p' })).toBeNull();
    });

    it('returns null if user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      expect(await authorizeUser({ identifier: 'x', password: 'p' })).toBeNull();
    });

    it('returns null if no passwordHash', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ passwordHash: null });
      expect(await authorizeUser({ identifier: 'x', password: 'p' })).toBeNull();
    });

    it('returns null if password invalid', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ passwordHash: 'h' });
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      expect(await authorizeUser({ identifier: 'x', password: 'wrong' })).toBeNull();
    });

    it('returns user with isBanned=true for permanent ban', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1', email: 'a@a.com', username: 'u', role: 'BASIC',
        passwordHash: 'h', isBanned: true, banExpires: null
      });
      const result: any = await authorizeUser({ identifier: 'u', password: 'p' });
      expect(result.isBanned).toBe(true);
    });

    it('returns user with isBanned=true for active temporary ban', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1', email: 'a@a.com', username: 'u', role: 'BASIC',
        passwordHash: 'h', isBanned: true, banExpires: future
      });
      const result: any = await authorizeUser({ identifier: 'u', password: 'p' });
      expect(result.isBanned).toBe(true);
    });

    it('lifts expired ban and returns user', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1', email: 'a@a.com', username: 'u', role: 'BASIC',
        passwordHash: 'h', isBanned: true, banExpires: past
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      const result: any = await authorizeUser({ identifier: 'u', password: 'p' });
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { isBanned: false, banExpires: null }
      }));
      expect(result.isBanned).toBe(false);
    });

    it('returns valid user when not banned', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1', email: 'a@a.com', username: 'u', role: 'BASIC',
        passwordHash: 'h', isBanned: false, isDeleted: false
      });
      const result: any = await authorizeUser({ identifier: 'u', password: 'p' });
      expect(result.id).toBe('1');
      expect(result.isBanned).toBe(false);
    });
  });

  describe('Callbacks', () => {

    describe('signIn', () => {
      it('assigns role from db for google provider', async () => {
        const { signIn } = getCallbacks();
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
        const userObj: any = { email: 'g@g.com' };
        await signIn({ user: userObj, account: { provider: 'google' } });
        expect(userObj.role).toBe('ADMIN');
      });

      it('assigns BASIC role if google user not in db', async () => {
        const { signIn } = getCallbacks();
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        const userObj: any = { email: 'new@g.com' };
        await signIn({ user: userObj, account: { provider: 'google' } });
        expect(userObj.role).toBe('BASIC');
      });

      it('returns true for credentials provider', async () => {
        const { signIn } = getCallbacks();
        const result = await signIn({ user: {}, account: { provider: 'credentials' } });
        expect(result).toBe(true);
      });
    });

    describe('jwt', () => {
      it('populates token from user on credentials login', async () => {
        const { jwt } = getCallbacks();
        const result = await jwt({
          token: {},
          user: { id: '1', email: 'a@a.com', username: 'u', role: 'BASIC', isBanned: false, isDeleted: false },
          account: null
        });
        expect(result.id).toBe('1');
        expect(result.role).toBe('BASIC');
      });

      it('fetches username from db if missing from token (line 165)', async () => {
        const { jwt } = getCallbacks();
        // token has sub but no username — triggers the db fetch
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ username: 'fetched_user', role: 'BASIC' });
        const result = await jwt({
          token: { sub: '1' },  // no username
          user: null,
          account: null
        });
        expect(result.username).toBe('fetched_user');
      });

      it('fetches role from db if missing from token (lines 199-204)', async () => {
        const { jwt } = getCallbacks();
        // token has sub but no role — triggers role fetch
        (prisma.user.findUnique as jest.Mock)
          .mockResolvedValueOnce({ username: 'u' })   // first call: username fetch
          .mockResolvedValueOnce({ role: 'ADMIN' });  // second call: role fetch
        const result = await jwt({
          token: { sub: '1' },  // no role, no username
          user: null,
          account: null
        });
        expect(result.role).toBe('ADMIN');
      });

      it('handles google login and upserts account', async () => {
        const { jwt } = getCallbacks();
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.account.upsert as jest.Mock).mockResolvedValue({});
        const result = await jwt({
          token: { sub: '1' },
          user: { id: '1' },
          account: { provider: 'google', access_token: 'at', providerAccountId: 'gid', type: 'oauth' }
        });
        expect(prisma.account.upsert).toHaveBeenCalled();
        expect(result.accessToken).toBe('at');
      });

      it('throws GoogleAccountTaken if google account belongs to different user', async () => {
        const { jwt } = getCallbacks();
        (prisma.account.findUnique as jest.Mock).mockResolvedValue({ userId: 'OTHER' });
        await expect(jwt({
          token: { sub: '1' },
          user: { id: '1' },
          account: { provider: 'google', providerAccountId: 'gid' }
        })).rejects.toThrow('GoogleAccountTaken');
      });
    });

    describe('session', () => {
      it('maps token data to session', async () => {
        const { session } = getCallbacks();
        (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 'acc1' });
        const result = await session({
          session: { user: {} },
          token: { sub: '1', role: 'ADMIN', isBanned: false, username: 'u', accessToken: 'at' }
        });
        expect(result.user.id).toBe('1');
        expect(result.user.role).toBe('ADMIN');
        expect(result.user.googleConnected).toBe(true);
        expect(result.accessToken).toBe('at');
      });

      it('sets googleConnected false when no google account', async () => {
        const { session } = getCallbacks();
        (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);
        const result = await session({
          session: { user: {} },
          token: { sub: '1', role: 'BASIC', isBanned: false, username: 'u' }
        });
        expect(result.user.googleConnected).toBe(false);
      });
    });
  });
});