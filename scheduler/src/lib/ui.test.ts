// src/__tests__/lib/ui.test.ts

import {
  PRIORITY_BADGE,
  PRIORITY_TEXT,
  PRIORITY_SCORE,
  CATEGORY_COLORS,
  TASK_COLORS,
  daysUntil,
  isTaskOverdue,
  formatDuration,
  taskToFormData,
  normaliseSubtasks,
  relativeOffsetLabel,
} from 'lib/ui';

// Constants 

describe('PRIORITY_BADGE', () => {
  it.each(['High', 'Medium', 'Low'])('has a non-empty string for %s', (level) => {
    expect(typeof PRIORITY_BADGE[level]).toBe('string');
    expect(PRIORITY_BADGE[level].length).toBeGreaterThan(0);
  });

  it('uses red classes for High', () => {
    expect(PRIORITY_BADGE.High).toContain('red');
  });

  it('uses orange classes for Medium', () => {
    expect(PRIORITY_BADGE.Medium).toContain('orange');
  });

  it('uses green classes for Low', () => {
    expect(PRIORITY_BADGE.Low).toContain('green');
  });
});

describe('PRIORITY_TEXT', () => {
  it.each(['High', 'Medium', 'Low'])('has a text- class for %s', (level) => {
    expect(PRIORITY_TEXT[level]).toMatch(/^text-/);
  });
});

describe('PRIORITY_SCORE', () => {
  it('High scores higher than Medium', () => {
    expect(PRIORITY_SCORE.High).toBeGreaterThan(PRIORITY_SCORE.Medium);
  });

  it('Medium scores higher than Low', () => {
    expect(PRIORITY_SCORE.Medium).toBeGreaterThan(PRIORITY_SCORE.Low);
  });

  it('has exact values 3, 2, 1', () => {
    expect(PRIORITY_SCORE).toEqual({ High: 3, Medium: 2, Low: 1 });
  });
});

describe('CATEGORY_COLORS', () => {
  it.each(['Lecture', 'Individual Study', 'Exam', 'Personal', 'Lab', 'Google'])(
    'has a hex colour for "%s"',
    (cat) => {
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  );
});

describe('TASK_COLORS', () => {
  it.each(['High', 'Medium', 'Low'])('has a hex colour for %s', (level) => {
    expect(TASK_COLORS[level]).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// daysUntil

describe('daysUntil', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns 0 when the due date is right now', () => {
    const now = new Date('2025-06-01T12:00:00Z');
    jest.setSystemTime(now);
    expect(daysUntil(now)).toBe(0);
  });

  it('returns a positive number for a future date', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(daysUntil('2025-06-04T00:00:00Z')).toBe(3);
  });

  it('returns a negative number for a past date', () => {
    jest.setSystemTime(new Date('2025-06-05T00:00:00Z'));
    expect(daysUntil('2025-06-02T00:00:00Z')).toBe(-3);
  });

  it('accepts a Date object as input', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(daysUntil(new Date('2025-06-02T00:00:00Z'))).toBe(1);
  });

  it('accepts a date string as input', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(daysUntil('2025-06-02T00:00:00Z')).toBe(1);
  });

  it('uses Math.ceil (partial day counts as a full day)', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00.000Z'));
    expect(daysUntil('2025-06-01T00:00:00.001Z')).toBe(1);
  });
});

// isTaskOverdue 

describe('isTaskOverdue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const PAST = '2020-01-01T00:00:00Z';
  const FUTURE = '2099-01-01T00:00:00Z';

  it('returns true for a past due date on an incomplete task', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: PAST })).toBe(true);
  });

  it('returns false for a future due date', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: FUTURE })).toBe(false);
  });

  it('returns false when dueDate is null', () => {
    expect(isTaskOverdue({ dueDate: null })).toBe(false);
  });

  it('returns false when dueDate is undefined', () => {
    expect(isTaskOverdue({})).toBe(false);
  });

  it('returns false when status is "completed", even if past due', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: PAST, status: 'completed' })).toBe(false);
  });

  it('returns false when completed flag is true, even if past due', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: PAST, completed: true })).toBe(false);
  });

  it('returns true when status is not "completed" and task is past due', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: PAST, status: 'pending' })).toBe(true);
  });

  it('returns true when completed is false and task is past due', () => {
    jest.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    expect(isTaskOverdue({ dueDate: PAST, completed: false })).toBe(true);
  });
});

// formatDuration 
describe('formatDuration', () => {
  it('returns "0m" for 0 minutes', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('returns "0m" for negative values', () => {
    expect(formatDuration(-5)).toBe('0m');
  });

  it('returns minutes-only string for values under 60', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(59)).toBe('59m');
  });

  it('returns hours-only string for exact multiples of 60', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('returns combined hours and minutes string', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(150)).toBe('2h 30m');
  });

  it('returns "1m" for 1 minute', () => {
    expect(formatDuration(1)).toBe('1m');
  });

  it('returns correct string for 61 minutes', () => {
    expect(formatDuration(61)).toBe('1h 1m');
  });
});

// taskToFormData

describe('taskToFormData', () => {
  const baseTask = {
    title: 'Write essay',
    description: 'History essay',
    dueDate: '2025-07-01',
    url: 'https://example.com',
    subtasks: ['Intro', 'Body', 'Conclusion'],
    duration: 90,
    examId: 'exam-1',
    priority: 'High',
    bufferDays: 2,
    isRecurring: true,
    recurrence: 'weekly',
  };

  it('maps title to name', () => {
    expect(taskToFormData(baseTask).name).toBe('Write essay');
  });

  it('converts duration minutes to separate hours and minutes strings', () => {
    const result = taskToFormData(baseTask);
    expect(result.durationHours).toBe('1');
    expect(result.durationMinutes).toBe('30');
  });

  it('converts subtasks array to comma-separated string', () => {
    expect(taskToFormData(baseTask).subtasks).toBe('Intro, Body, Conclusion');
  });

  it('passes through subtasks that are already a string', () => {
    const result = taskToFormData({ ...baseTask, subtasks: 'A, B' });
    expect(result.subtasks).toBe('A, B');
  });

  it('defaults name to empty string when title is absent', () => {
    expect(taskToFormData({}).name).toBe('');
  });

  it('defaults description to empty string when absent', () => {
    expect(taskToFormData({}).description).toBe('');
  });

  it('defaults dueDate to null when absent', () => {
    expect(taskToFormData({}).dueDate).toBeNull();
  });

  it('defaults url to empty string when absent', () => {
    expect(taskToFormData({}).url).toBe('');
  });

  it('defaults priority to "Medium" when absent', () => {
    expect(taskToFormData({}).priority).toBe('Medium');
  });

  it('defaults examId to "none" when absent', () => {
    expect(taskToFormData({}).examId).toBe('none');
  });

  it('defaults bufferDays to 0 when absent', () => {
    expect(taskToFormData({}).bufferDays).toBe(0);
  });

  it('defaults isRecurring to false when absent', () => {
    expect(taskToFormData({}).isRecurring).toBe(false);
  });

  it('defaults recurrence to null when absent', () => {
    expect(taskToFormData({}).recurrence).toBeNull();
  });

  it('handles zero duration correctly', () => {
    const result = taskToFormData({ duration: 0 });
    expect(result.durationHours).toBe('0');
    expect(result.durationMinutes).toBe('0');
  });

  it('handles duration with no remainder minutes', () => {
    const result = taskToFormData({ duration: 120 });
    expect(result.durationHours).toBe('2');
    expect(result.durationMinutes).toBe('0');
  });
});

// normaliseSubtasks
describe('normaliseSubtasks', () => {
  it('returns empty array for null', () => {
    expect(normaliseSubtasks(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(normaliseSubtasks(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(normaliseSubtasks('')).toEqual([]);
  });

  it('returns the array as-is (stringified) when given a string array', () => {
    expect(normaliseSubtasks(['A', 'B', 'C'])).toEqual(['A', 'B', 'C']);
  });

  it('coerces non-string array elements to strings', () => {
    expect(normaliseSubtasks([1, 2, 3])).toEqual(['1', '2', '3']);
  });

  it('splits a comma-separated string into trimmed items', () => {
    expect(normaliseSubtasks('A, B, C')).toEqual(['A', 'B', 'C']);
  });

  it('trims whitespace from each split item', () => {
    expect(normaliseSubtasks('  A  ,  B  ')).toEqual(['A', 'B']);
  });

  it('filters out blank entries after splitting', () => {
    expect(normaliseSubtasks('A,,B, ,C')).toEqual(['A', 'B', 'C']);
  });

  it('returns a single-item array for a string with no commas', () => {
    expect(normaliseSubtasks('Only one')).toEqual(['Only one']);
  });

  it('handles a mixed array of strings and numbers', () => {
    expect(normaliseSubtasks(['task', 42])).toEqual(['task', '42']);
  });
});

// relativeOffsetLabel

describe('relativeOffsetLabel', () => {
  it('returns null for null input', () => {
    expect(relativeOffsetLabel(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(relativeOffsetLabel(undefined)).toBeNull();
  });

  it('returns "same day as event" for 0', () => {
    expect(relativeOffsetLabel(0)).toBe('same day as event');
  });

  it('returns singular "day before" label for -1', () => {
    expect(relativeOffsetLabel(-1)).toBe('1 day before event');
  });

  it('returns plural "days before" label for -2', () => {
    expect(relativeOffsetLabel(-2)).toBe('2 days before event');
  });

  it('returns correct label for larger negative values', () => {
    expect(relativeOffsetLabel(-7)).toBe('7 days before event');
  });

  it('returns singular "day after" label for 1', () => {
    expect(relativeOffsetLabel(1)).toBe('1 day after event');
  });

  it('returns plural "days after" label for 2', () => {
    expect(relativeOffsetLabel(2)).toBe('2 days after event');
  });

  it('returns correct label for larger positive values', () => {
    expect(relativeOffsetLabel(14)).toBe('14 days after event');
  });

  it('uses absolute value for the day count in "before" labels', () => {
    const label = relativeOffsetLabel(-10);
    expect(label).toContain('10');
    expect(label).not.toContain('-10');
  });
});
