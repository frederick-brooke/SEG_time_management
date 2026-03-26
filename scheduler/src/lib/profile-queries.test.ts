// src/__tests__/lib/userQueries.test.ts

import {
  fetchUserByEmail,
  fetchUserByUsername,
  fetchUsernameByEmail,
  fetchFriendCount,
  fetchFriends,
  fetchFriendStatus,
  computeTaskStats,
  FriendUser,
} from 'lib/profile-queries'; 

// Mocks 

jest.mock('lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    friendRequest: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@prisma/client', () => ({
  FriendStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  },
}));

import { prisma } from 'lib/prisma';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCount = prisma.friendRequest.count as jest.Mock;
const mockFindMany = prisma.friendRequest.findMany as jest.Mock;
const mockFindFirst = prisma.friendRequest.findFirst as jest.Mock;

// Fixtures 

const baseFriendUser: FriendUser = {
  id: 'user-1',
  username: 'alice',
  fname: 'Alice',
  lname: 'Smith',
  pfp: null,
};

const fullUser = {
  id: 'user-1',
  username: 'alice',
  fname: 'Alice',
  lname: 'Smith',
  email: 'alice@example.com',
  bio: 'Hello!',
  pfp: null,
  createdAt: new Date('2024-01-01'),
  progress: { points: 100, level: 2, experience: 50 },
  tasks: [
    { completed: true, completedAt: new Date() },
    { completed: false, completedAt: null },
  ],
  receivedRequests: [
    { id: 'req-1', sender: baseFriendUser },
  ],
  sentRequests: [
    { id: 'req-2', receiver: { ...baseFriendUser, id: 'user-2', username: 'bob' } },
  ],
};

// Tests 

beforeEach(() => jest.clearAllMocks());

// fetchUserByEmail 

describe('fetchUserByEmail', () => {
  it('returns the full user object when found', async () => {
    mockFindUnique.mockResolvedValueOnce(fullUser);

    const result = await fetchUserByEmail('alice@example.com');

    expect(result).toEqual(fullUser);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'alice@example.com' } })
    );
  });

  it('returns null when no user is found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await fetchUserByEmail('ghost@example.com');

    expect(result).toBeNull();
  });

  it('includes receivedRequests filtered to PENDING status', async () => {
    mockFindUnique.mockResolvedValueOnce(fullUser);

    await fetchUserByEmail('alice@example.com');

    const selectArg = mockFindUnique.mock.calls[0][0].select;
    expect(selectArg.receivedRequests.where).toEqual({ status: 'PENDING' });
  });

  it('includes sentRequests filtered to ACCEPTED status', async () => {
    mockFindUnique.mockResolvedValueOnce(fullUser);

    await fetchUserByEmail('alice@example.com');

    const selectArg = mockFindUnique.mock.calls[0][0].select;
    expect(selectArg.sentRequests.where).toEqual({ status: 'ACCEPTED' });
  });
});

// fetchUserByUsername 

describe('fetchUserByUsername', () => {
  const publicUser = {
    ...fullUser,
    receivedRequests: undefined,
    sentRequests: undefined,
  };

  it('returns the user object when found', async () => {
    mockFindUnique.mockResolvedValueOnce(publicUser);

    const result = await fetchUserByUsername('alice');

    expect(result).toEqual(publicUser);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: 'alice' } })
    );
  });

  it('returns null when no user is found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await fetchUserByUsername('unknown');

    expect(result).toBeNull();
  });

  it('does NOT include receivedRequests or sentRequests in the select', async () => {
    mockFindUnique.mockResolvedValueOnce(publicUser);

    await fetchUserByUsername('alice');

    const selectArg = mockFindUnique.mock.calls[0][0].select;
    expect(selectArg).not.toHaveProperty('receivedRequests');
    expect(selectArg).not.toHaveProperty('sentRequests');
  });
});

// fetchUsernameByEmail 

describe('fetchUsernameByEmail', () => {
  it('returns the username string when found', async () => {
    mockFindUnique.mockResolvedValueOnce({ username: 'alice' });

    const result = await fetchUsernameByEmail('alice@example.com');

    expect(result).toBe('alice');
  });

  it('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await fetchUsernameByEmail('nobody@example.com');

    expect(result).toBeNull();
  });

  it('queries only by email and selects only username', async () => {
    mockFindUnique.mockResolvedValueOnce({ username: 'alice' });

    await fetchUsernameByEmail('alice@example.com');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
      select: { username: true },
    });
  });
});

// fetchFriendCount 

describe('fetchFriendCount', () => {
  it('returns the count from prisma', async () => {
    mockCount.mockResolvedValueOnce(7);

    const result = await fetchFriendCount('user-1');

    expect(result).toBe(7);
  });

  it('queries with ACCEPTED status and OR clause for both directions', async () => {
    mockCount.mockResolvedValueOnce(0);

    await fetchFriendCount('user-1');

    expect(mockCount).toHaveBeenCalledWith({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: 'user-1' }, { receiverId: 'user-1' }],
      },
    });
  });

  it('returns 0 when user has no friends', async () => {
    mockCount.mockResolvedValueOnce(0);

    const result = await fetchFriendCount('user-lonely');

    expect(result).toBe(0);
  });
});

// fetchFriends 

describe('fetchFriends', () => {
  const bob: FriendUser = { id: 'user-2', username: 'bob', fname: 'Bob', lname: null, pfp: null };
  const carol: FriendUser = { id: 'user-3', username: 'carol', fname: 'Carol', lname: null, pfp: null };

  it('merges friends from both sent and received directions', async () => {
    mockFindMany
      .mockResolvedValueOnce([{ receiver: bob }])   
      .mockResolvedValueOnce([{ sender: carol }]);   

    const result = await fetchFriends('user-1');

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([bob, carol]));
  });

  it('returns an empty array when the user has no friends', async () => {
    mockFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await fetchFriends('user-lonely');

    expect(result).toEqual([]);
  });

  it('returns only sent-direction friends when no received requests exist', async () => {
    mockFindMany
      .mockResolvedValueOnce([{ receiver: bob }])
      .mockResolvedValueOnce([]);

    const result = await fetchFriends('user-1');

    expect(result).toEqual([bob]);
  });

  it('returns only received-direction friends when no sent requests exist', async () => {
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ sender: carol }]);

    const result = await fetchFriends('user-1');

    expect(result).toEqual([carol]);
  });

  it('runs both queries in parallel via Promise.all', async () => {
    mockFindMany.mockResolvedValue([]);

    await fetchFriends('user-1');

    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });
});

// fetchFriendStatus 

describe('fetchFriendStatus', () => {
  const accepted = { id: 'req-1', status: 'ACCEPTED' };
  const pendingSent = { id: 'req-2', status: 'PENDING' };
  const pendingReceived = { id: 'req-3', status: 'PENDING' };

  it('returns FRIENDS when sent request is ACCEPTED', async () => {
    mockFindFirst
      .mockResolvedValueOnce(accepted) 
      .mockResolvedValueOnce(null);   

    const result = await fetchFriendStatus('viewer', 'target');

    expect(result).toEqual({ status: 'FRIENDS' });
  });

  it('returns FRIENDS when received request is ACCEPTED', async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)   
      .mockResolvedValueOnce(accepted); 

    const result = await fetchFriendStatus('viewer', 'target');

    expect(result).toEqual({ status: 'FRIENDS' });
  });

  it('returns REQUEST_SENT when viewer has a PENDING sent request', async () => {
    mockFindFirst
      .mockResolvedValueOnce(pendingSent)
      .mockResolvedValueOnce(null);      

    const result = await fetchFriendStatus('viewer', 'target');

    expect(result).toEqual({ status: 'REQUEST_SENT' });
  });

  it('returns REQUEST_RECEIVED with requestId when target sent a PENDING request', async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)           
      .mockResolvedValueOnce(pendingReceived); 

    const result = await fetchFriendStatus('viewer', 'target');

    expect(result).toEqual({ status: 'REQUEST_RECEIVED', requestId: 'req-3' });
  });

  it('returns NONE when no requests exist in either direction', async () => {
    mockFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const result = await fetchFriendStatus('viewer', 'target');

    expect(result).toEqual({ status: 'NONE' });
  });

  it('runs both DB queries in parallel', async () => {
    mockFindFirst.mockResolvedValue(null);

    await fetchFriendStatus('viewer', 'target');

    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });
});

// computeTaskStats 

describe('computeTaskStats', () => {
  it('returns correct stats for a mixed task list', () => {
    const tasks = [
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: true },
    ];

    expect(computeTaskStats(tasks)).toEqual({
      completedTasks: 3,
      totalTasks: 4,
      completionRate: 75,
    });
  });

  it('returns 0% completion rate for an empty task list', () => {
    expect(computeTaskStats([])).toEqual({
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
    });
  });

  it('returns 100% when all tasks are completed', () => {
    const tasks = [{ completed: true }, { completed: true }];

    expect(computeTaskStats(tasks)).toEqual({
      completedTasks: 2,
      totalTasks: 2,
      completionRate: 100,
    });
  });

  it('returns 0% when no tasks are completed', () => {
    const tasks = [{ completed: false }, { completed: false }];

    expect(computeTaskStats(tasks)).toEqual({
      completedTasks: 0,
      totalTasks: 2,
      completionRate: 0,
    });
  });

  it('rounds fractional completion rates to the nearest integer', () => {
    const tasks = [{ completed: true }, { completed: false }, { completed: false }];

    expect(computeTaskStats(tasks).completionRate).toBe(33);
  });

  it('rounds 0.5 fractions correctly (2/3 = 66.66 → 67)', () => {
    const tasks = [{ completed: true }, { completed: true }, { completed: false }];

    expect(computeTaskStats(tasks).completionRate).toBe(67);
  });

  it('handles a single completed task', () => {
    expect(computeTaskStats([{ completed: true }])).toEqual({
      completedTasks: 1,
      totalTasks: 1,
      completionRate: 100,
    });
  });

  it('handles a single incomplete task', () => {
    expect(computeTaskStats([{ completed: false }])).toEqual({
      completedTasks: 0,
      totalTasks: 1,
      completionRate: 0,
    });
  });
});
