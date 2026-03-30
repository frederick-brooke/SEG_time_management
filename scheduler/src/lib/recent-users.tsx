/**
 * Utility for managing recently viewed users in localStorage.
 * Stores, retrieves, and updates a capped list of recent users.
 */

const STORAGE_KEY = "recent_users";

export function getRecentUsers() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addRecentUser(user) {
  const existing = getRecentUsers();

  const filtered = existing.filter(u => u.username !== user.username);

  const updated = [user, ...filtered].slice(0, 8); // keep last 8

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeRecentUser(username) {
  const updated = getRecentUsers().filter(u => u.username !== username);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentUsers() {
  localStorage.removeItem(STORAGE_KEY);
}