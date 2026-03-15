import { hashPassword, verifyPassword } from './password';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('mock_hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('Password Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes a password with 12 salt rounds', async () => {
    const result = await hashPassword('my-secret-password');
    expect(bcrypt.hash).toHaveBeenCalledWith('my-secret-password', 12);
    expect(result).toBe('mock_hashed_password');
  });

  it('verifies a password against a hash', async () => {
    const result = await verifyPassword('my-secret-password', 'mock_hashed_password');
    expect(bcrypt.compare).toHaveBeenCalledWith('my-secret-password', 'mock_hashed_password');
    expect(result).toBe(true);
  });
});