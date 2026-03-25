import { authOptions, authorizeUser } from './auth';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';


jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn()
}));

jest.mock('./prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    account: { findUnique: jest.fn(), upsert: jest.fn(), findFirst: jest.fn() }
  }
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hash')
}));

const getCallbacks = () => authOptions.callbacks as any;

describe('NextAuth Configuration (lib/auth.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockImplementation((pw) => Promise.resolve(pw !== 'wrong'));
  });

  describe('Credentials Provider (authorize)', () => {
    it('returns null if missing credentials', async () => {
      expect(await authorizeUser(undefined)).toBeNull();
    });

    it('returns null if user not found or password invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      expect(await authorizeUser({ identifier: 'test@test.com', password: 'pass' })).toBeNull();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: 'hash' });
      expect(await authorizeUser({ identifier: 'test@test.com', password: 'wrong' })).toBeNull();
    });

    it('handles permanent bans', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'banned@test.com', username: 'banned', role: 'BASIC',
        passwordHash: 'hash', isBanned: true, banExpires: null
      });

      const result = await authorizeUser({ identifier: 'banned@test.com', password: 'pass' });
      expect(result.isBanned).toBe(true);
    });

    it('handles active temporary bans', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'temp@test.com', username: 'temp', role: 'BASIC',
        passwordHash: 'hash', isBanned: true, banExpires: futureDate
      });

      const result = await authorizeUser({ identifier: 'temp@test.com', password: 'pass' });
      expect(result.isBanned).toBe(true);
    });

    it('lifts ban if temporary ban has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'expired@test.com', username: 'expired', role: 'BASIC',
        passwordHash: 'hash', isBanned: true, banExpires: pastDate
      });

      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authorizeUser({ identifier: 'expired@test.com', password: 'pass' });

      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { isBanned: false, banExpires: null }
      }));
      expect(result.isBanned).toBe(false);
    });

    it('returns valid user if not banned', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1', email: 'good@test.com', username: 'good', role: 'BASIC',
        passwordHash: 'hash', isBanned: false
      });

      const result = await authorizeUser({ identifier: 'good@test.com', password: 'pass' });
      expect(result.isBanned).toBe(false);
      expect(result.id).toBe('1');
    });
  });

  describe('Callbacks', () => {
    it('signIn: handles google role assignment', async () => {
      const { signIn } = getCallbacks();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
      const userObj: any = { email: 'google@test.com' };

      await signIn({ user: userObj, account: { provider: 'google' } });
      expect(userObj.role).toBe('ADMIN');

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await signIn({ user: userObj, account: { provider: 'google' } });
      expect(userObj.role).toBe('BASIC');

      expect(await signIn({ user: userObj, account: { provider: 'credentials' } })).toBe(true);
    });

    it('jwt: populates credentials login token', async () => {
      const { jwt } = getCallbacks();
      const result = await jwt({ token: {}, user: { id: '1', email: 'test@test.com', role: 'BASIC', isBanned: false } });
      expect(result.id).toBe('1');
    });

    it('jwt: handles google login mapping and upserting', async () => {
      const { jwt } = getCallbacks();
      const token: any = { sub: '123' };
      const account: any = { provider: 'google', access_token: 'acc_123', providerAccountId: 'google_123' };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await jwt({ token, user: { id: '123' }, account });
      expect(prisma.account.upsert).toHaveBeenCalled();
      expect(result.accessToken).toBe('acc_123');
    });

    it('jwt: throws error if google account taken', async () => {
      const { jwt } = getCallbacks();
      const token: any = { sub: '123' };
      const account: any = { provider: 'google', providerAccountId: 'google_123' };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ userId: 'DIFFERENT_ID' });

      await expect(jwt({ token, user: { id: '123' }, account })).rejects.toThrow('GoogleAccountTaken');
    });

    it('jwt: fetches role from db if missing', async () => {
      const { jwt } = getCallbacks();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
      const result = await jwt({ token: { sub: '123' }, user: null, account: null });
      expect(result.role).toBe('ADMIN');
    });

    it('session: transfers token data to session correctly', async () => {
      const { session } = getCallbacks();
      const sessionObj: any = { user: {} };
      const token: any = { sub: '123', role: 'ADMIN', isBanned: true, accessToken: 'access_123' };

      (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 'acc_123' });

      const result = await session({ session: sessionObj, token });

      expect(result.user.id).toBe('123');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.isBanned).toBe(true);
      expect(result.user.googleConnected).toBe(true);
      expect(result.accessToken).toBe('access_123');
    });
  });
});