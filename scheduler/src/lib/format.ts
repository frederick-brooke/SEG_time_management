// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Formats a date string as a short readable event timestamp
 * @param {string} dateString - ISO date string to format
 * @return {string} - Formatted date (e.g. "Mon 3 Mar, 09:00")
 */
export function formatEventDate(dateString: Date | string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Formats a date string as a short task due date
 * @param {string} dateString - ISO date string to format
 * @return {string} - Formatted date (e.g. "3 Mar 2026")
 */
export function formatTaskDate(dateString: Date | string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Formats a date string as a long human-readable date
 * @param {string} dateString - ISO date string to format
 * @return {string} - Formatted date (e.g. "3 March 2026")
 */
export function formatLongDate(dateString: Date | string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Duration formatting ──────────────────────────────────────────────────────

/**
 * Formats a duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @return {string} - Formatted duration (e.g. "1h 30m", "45m", or "No estimate set")
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "No estimate set";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}