import { hashPassword, verifyPassword } from './password';
import bcrypt from 'bcryptjs';
import { validatePassword } from "./password";

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

describe("Password Validation Coverage", () => {
  it("fails if password is too short", () => {
    expect(validatePassword("abc1!")).toBe("Password must be at least 6 characters long.");
  });

  it("fails if no lowercase letter", () => {
    expect(validatePassword("ABC1234!")).toBe("Password must contain at least one lowercase letter.");
  });

  it("fails if no uppercase letter", () => {
    expect(validatePassword("abc1234!")).toBe("Password must contain at least one uppercase letter.");
  });

  it("fails if no number or symbol", () => {
    expect(validatePassword("Abcdefgh")).toBe("Password must contain at least one number or symbol.");
  });

  it("returns null for a valid password", () => {
    expect(validatePassword("Valid123!")).toBeNull();
  });
});