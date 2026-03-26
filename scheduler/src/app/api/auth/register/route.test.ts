import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/password';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('next/server', () => {
    class MockResponse {
      status: number;
      body: any;
  
      constructor(body: any, init?: any) {
        this.body = body;
        this.status = init?.status || 200;
      }
  
      async json() {
        return this.body;
      }
    }
  
    return {
      NextResponse: {
        json: (data: any, init?: any) => new MockResponse(data, init),
      },
    };
  });

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
}));

const mockFindFirst = prisma.user.findFirst as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe('POST /register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = {
    username: 'test_user',
    email: 'test@test.com',
    password: 'StrongPass123!',
    fname: 'John',
    lname: 'Doe',
  };

  it('returns 400 if missing required fields', async () => {
    const req = {
      json: async () => ({ email: '', password: '', username: '' }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 if username invalid', async () => {
    const req = {
      json: async () => ({ ...validBody, username: '!!' }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 if password validation fails', async () => {
    (validatePassword as jest.Mock).mockReturnValue('Weak password');

    const req = {
      json: async () => validBody,
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 409 if user already exists', async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);

    mockFindFirst.mockResolvedValue({
      email: 'test@test.com',
      username: 'test_user',
    });

    const req = {
      json: async () => validBody,
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(409);
  });

  it('creates user successfully', async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_pw');

    mockFindFirst.mockResolvedValue(null);

    mockTransaction.mockImplementation(async (cb: any) => {
        return cb({
          user: {
            create: jest.fn().mockResolvedValue({
              id: '1',
              email: 'test@test.com',
              username: 'test_user',
              fname: 'John',
              lname: 'Doe',
              passwordHash: 'hashed_pw',
            }),
          },
          category: {
            createMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
        });
      });

    const req = {
      json: async () => validBody,
    } as any;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.user).toBeDefined();
    expect(json.user.passwordHash).toBeUndefined();
  });

  it('handles server errors', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB crash'));

    const req = {
      json: async () => validBody,
    } as any;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to register account');
  });
});