// src/__tests__/lib/recentUsers.test.ts

import {
  getRecentUsers,
  addRecentUser,
  removeRecentUser,
  clearRecentUsers,
} from 'lib/recent-users'; 

// Helpers 

const STORAGE_KEY = 'recent_users';

function seedStorage(users: object[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function readStorage(): object[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
}

const makeUser = (username: string) => ({
  username,
  fname: username,
  pfp: null,
});

// jsdom provides a working localStorage implementation, so no manual mock needed.
beforeEach(() => localStorage.clear());

// getRecentUsers 

describe('getRecentUsers', () => {
  it('returns an empty array when storage is empty', () => {
    expect(getRecentUsers()).toEqual([]);
  });

  it('returns the parsed array stored in localStorage', () => {
    const users = [makeUser('alice'), makeUser('bob')];
    seedStorage(users);

    expect(getRecentUsers()).toEqual(users);
  });

  it('preserves the order of stored users', () => {
    const users = [makeUser('charlie'), makeUser('alice'), makeUser('bob')];
    seedStorage(users);

    expect(getRecentUsers()).toEqual(users);
  });
});

// addRecentUser 

describe('addRecentUser', () => {
  it('adds a user to an empty list', () => {
    addRecentUser(makeUser('alice'));

    expect(readStorage()).toEqual([makeUser('alice')]);
  });

  it('prepends the new user to the front of the list', () => {
    seedStorage([makeUser('bob')]);

    addRecentUser(makeUser('alice'));

    expect(readStorage()[0]).toEqual(makeUser('alice'));
  });

  it('deduplicates: moves an existing user to the front instead of duplicating', () => {
    seedStorage([makeUser('alice'), makeUser('bob'), makeUser('carol')]);

    addRecentUser(makeUser('bob'));

    const result = readStorage() as { username: string }[];
    expect(result.map((u) => u.username)).toEqual(['bob', 'alice', 'carol']);
  });

  it('updates the stored data for a re-added user with new values', () => {
    const original = { username: 'alice', fname: 'Alice', pfp: null };
    const updated = { username: 'alice', fname: 'Alice Updated', pfp: 'new.jpg' };
    seedStorage([original]);

    addRecentUser(updated);

    expect(readStorage()[0]).toEqual(updated);
  });

  it('caps the list at 8 users', () => {
    const existing = Array.from({ length: 8 }, (_, i) => makeUser(`user${i}`));
    seedStorage(existing);

    addRecentUser(makeUser('newcomer'));

    expect(readStorage()).toHaveLength(8);
  });

  it('drops the oldest (9th) entry when the cap is exceeded', () => {
    const existing = Array.from({ length: 8 }, (_, i) => makeUser(`user${i}`));
    seedStorage(existing);

    addRecentUser(makeUser('newcomer'));

    const result = readStorage() as { username: string }[];
    expect(result[0].username).toBe('newcomer');
    expect(result.map((u) => u.username)).not.toContain('user7');
  });

  it('persists the updated list to localStorage', () => {
    addRecentUser(makeUser('alice'));
    addRecentUser(makeUser('bob'));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(2);
  });
});

// removeRecentUser

describe('removeRecentUser', () => {
  it('removes the user with the matching username', () => {
    seedStorage([makeUser('alice'), makeUser('bob'), makeUser('carol')]);

    removeRecentUser('bob');

    const result = readStorage() as { username: string }[];
    expect(result.map((u) => u.username)).toEqual(['alice', 'carol']);
  });

  it('does nothing when the username is not in the list', () => {
    seedStorage([makeUser('alice'), makeUser('bob')]);

    removeRecentUser('ghost');

    expect(readStorage()).toEqual([makeUser('alice'), makeUser('bob')]);
  });

  it('results in an empty array when removing the only user', () => {
    seedStorage([makeUser('alice')]);

    removeRecentUser('alice');

    expect(readStorage()).toEqual([]);
  });

  it('persists the updated list to localStorage after removal', () => {
    seedStorage([makeUser('alice'), makeUser('bob')]);

    removeRecentUser('alice');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].username).toBe('bob');
  });

  it('does not remove a user with a similar but different username', () => {
    seedStorage([makeUser('alice'), makeUser('alice2')]);

    removeRecentUser('alice');

    const result = readStorage() as { username: string }[];
    expect(result.map((u) => u.username)).toEqual(['alice2']);
  });
});

// clearRecentUsers 

describe('clearRecentUsers', () => {
  it('removes the storage key entirely', () => {
    seedStorage([makeUser('alice')]);

    clearRecentUsers();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('causes getRecentUsers to return an empty array afterwards', () => {
    seedStorage([makeUser('alice'), makeUser('bob')]);

    clearRecentUsers();

    expect(getRecentUsers()).toEqual([]);
  });

  it('does not throw when storage is already empty', () => {
    expect(() => clearRecentUsers()).not.toThrow();
  });
});

// integration: chained operations
describe('integration', () => {
  it('add → remove → get reflects all changes correctly', () => {
    addRecentUser(makeUser('alice'));
    addRecentUser(makeUser('bob'));
    removeRecentUser('alice');

    const result = getRecentUsers() as { username: string }[];
    expect(result.map((u) => u.username)).toEqual(['bob']);
  });

  it('add → clear → add starts fresh', () => {
    addRecentUser(makeUser('alice'));
    clearRecentUsers();
    addRecentUser(makeUser('bob'));

    const result = getRecentUsers() as { username: string }[];
    expect(result.map((u) => u.username)).toEqual(['bob']);
  });

  it('deduplication + cap work together correctly', () => {
    const users = Array.from({ length: 8 }, (_, i) => makeUser(`user${i}`));
    users.forEach((u) => addRecentUser(u));

    addRecentUser(makeUser('user0')); 
    const result = getRecentUsers() as { username: string }[];
    expect(result).toHaveLength(8);
    expect(result[0].username).toBe('user0');
  });
});
