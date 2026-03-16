// src/lib/scheduler.ts
import { getNextOccurrenceDeadline } from "./taskSchedulingUtils";
import { PRIORITY_SCORE } from "./ui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  duration: number;
  dueDate: Date | null;
  bufferDays: number | null;
  priority: string;
  eventId?: string | null;
  relativeOffsetDays?: number | null;
  isRecurring?: boolean;
}
interface CalEvent {
  id: string;
  start: Date;
  end: Date;
  recurrence?: any;
}
interface UserPreferences {
  workStartTime: string;
  workEndTime: string;
  daysOff: string[];
  sessionLength: number;
  breakLength: number;
  taskOrder: string;
}
interface ScheduledTask {
  taskId: string;
  scheduledDate: Date;
  scheduledTime: Date;
}
export interface ScheduleResult {
  scheduled: ScheduledTask[];
  overCapacity: { taskId: string; title: string }[];
  missedDeadline: { taskId: string; title: string }[];
}
interface DayCursor {
  cursor: Date;
  workedMs: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dk = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function parseTime(
  str: string | null | undefined,
  date: Date,
  fallback = 9,
): Date {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    fallback,
    0,
    0,
    0,
  );
  if (!str) return d;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return d;
  d.setHours(h, m, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function normalisePrefs(p: UserPreferences): UserPreferences {
  return {
    workStartTime: p.workStartTime || "09:00",
    workEndTime: p.workEndTime || "17:00",
    daysOff: Array.isArray(p.daysOff) ? p.daysOff : [],
    sessionLength: p.sessionLength || 90,
    breakLength: p.breakLength || 15,
    taskOrder: p.taskOrder || "priority",
  };
}

function sortTasks(tasks: Task[], order: string): Task[] {
  return [...tasks].sort((a, b) => {
    switch (order) {
      case "easy-first":
        if (PRIORITY_SCORE[a.priority] !== PRIORITY_SCORE[b.priority])
          return PRIORITY_SCORE[a.priority] - PRIORITY_SCORE[b.priority];
        return a.duration - b.duration;
      case "duration_asc":
        return a.duration - b.duration;
      case "duration_desc":
        return b.duration - a.duration;
      case "deadline":
      case "hard-first":
        if (!a.dueDate && !b.dueDate)
          return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
    }
  });
}

/** Inject dynamic deadlines for event-linked tasks that have no explicit dueDate. */
function injectDynamicDeadlines(
  tasks: Task[],
  eventLookup: Map<string, CalEvent>,
): Task[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return tasks.map((task) => {
    if (task.dueDate || !task.eventId || task.relativeOffsetDays == null)
      return task;
    const ev = eventLookup.get(task.eventId);
    const deadline = ev
      ? getNextOccurrenceDeadline(ev, task.relativeOffsetDays, now)
      : null;
    return deadline ? { ...task, dueDate: deadline } : task;
  });
}

/** Compute hard and effective (buffer-adjusted) deadlines for a task. */
function computeDeadlines(task: Task): {
  hard: Date | null;
  effective: Date | null;
} {
  if (!task.dueDate) return { hard: null, effective: null };
  const hd = new Date(task.dueDate);
  const hard = new Date(
    hd.getFullYear(),
    hd.getMonth(),
    hd.getDate(),
    23,
    59,
    59,
    999,
  );
  const effective = new Date(hard);
  if (task.bufferDays) effective.setDate(effective.getDate() - task.bufferDays);
  return { hard, effective };
}

/** Find the first available time slot for `durationMins` on `day`. */
function findSlotOnDay(
  day: Date,
  durationMins: number,
  events: CalEvent[],
  cursors: Map<string, DayCursor>,
  prefs: UserPreferences,
): Date | null {
  const key = dk(day);
  const workStart = parseTime(prefs.workStartTime, day, 9);
  const workEnd = parseTime(prefs.workEndTime, day, 17);
  if (workEnd <= workStart) return null;

  const taskMs = Math.max(durationMins, 1) * 60_000;
  const sessionMs = Math.max(prefs.sessionLength, 15) * 60_000;
  const breakMs = Math.max(prefs.breakLength, 5) * 60_000;

  if (!cursors.has(key))
    cursors.set(key, { cursor: new Date(workStart), workedMs: 0 });
  const state = cursors.get(key)!;
  let cursor =
    state.cursor.getTime() < workStart.getTime()
      ? new Date(workStart)
      : new Date(state.cursor);
  let workedMs =
    state.cursor.getTime() < workStart.getTime() ? 0 : state.workedMs;

  const blocks = events
    .filter((e) => isSameDay(new Date(e.start), day))
    .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const skipBlocks = () => {
    let moved = true;
    while (moved) {
      moved = false;
      for (const b of blocks) {
        if (cursor >= b.start && cursor < b.end) {
          cursor = new Date(b.end);
          workedMs = 0;
          moved = true;
        }
      }
    }
  };

  skipBlocks();

  for (let guard = 0; cursor < workEnd && guard < 200; guard++) {
    if (workedMs >= sessionMs) {
      cursor = new Date(cursor.getTime() + breakMs);
      workedMs = 0;
      skipBlocks();
      if (cursor >= workEnd) break;
    }
    const next = blocks.find((b) => b.start > cursor);
    const slotEnd = next && next.start < workEnd ? next.start : workEnd;
    const available = slotEnd.getTime() - cursor.getTime();
    const remaining = sessionMs - workedMs;

    if (available <= 0) {
      if (next && next.start < workEnd) {
        cursor = new Date(next.end);
        workedMs = 0;
        skipBlocks();
      } else break;
      continue;
    }
    if (taskMs <= remaining && available >= taskMs) {
      const slot = new Date(cursor);
      state.cursor = new Date(cursor.getTime() + taskMs);
      state.workedMs = workedMs + taskMs;
      cursors.set(key, state);
      return slot;
    }
    if (taskMs > remaining) {
      const after = new Date(cursor.getTime() + remaining + breakMs);
      if (after < workEnd && slotEnd.getTime() - after.getTime() >= taskMs) {
        const slot = new Date(after);
        state.cursor = new Date(after.getTime() + taskMs);
        state.workedMs = taskMs;
        cursors.set(key, state);
        return slot;
      }
    }
    if (next && next.start < workEnd) {
      cursor = new Date(next.end);
      workedMs = 0;
      skipBlocks();
    } else break;
  }
  return null;
}

/** Try to place a single task on the first eligible day. Returns true if placed. */
function placeTask(
  task: Task,
  duration: number,
  days: Date[],
  events: CalEvent[],
  prefs: UserPreferences,
  cursors: Map<string, DayCursor>,
  dayMinutes: Map<string, number>,
  targetMins: number,
  isWeekMode: boolean,
  deadline: Date | null,
  scheduled: ScheduledTask[],
): boolean {
  for (const day of days) {
    if (prefs.daysOff.includes(DAY_NAMES[day.getDay()])) continue;
    if (deadline && day > deadline) continue;
    if (isWeekMode) {
      const assigned = dayMinutes.get(dk(day)) ?? 0;
      const remainingDays = days
        .slice(days.indexOf(day) + 1)
        .filter(
          (d) =>
            !prefs.daysOff.includes(DAY_NAMES[d.getDay()]) &&
            (!deadline || d <= deadline),
        );
      if (remainingDays.length > 0 && assigned >= targetMins) continue;
    }
    const slot = findSlotOnDay(day, duration, events, cursors, prefs);
    if (!slot) continue;
    scheduled.push({
      taskId: task.id,
      scheduledDate: new Date(day),
      scheduledTime: slot,
    });
    dayMinutes.set(dk(day), (dayMinutes.get(dk(day)) ?? 0) + duration);
    return true;
  }
  return false;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function scheduleTasks(
  tasks: Task[],
  events: CalEvent[],
  preferences: UserPreferences,
  days: Date[],
  allEvents?: CalEvent[],
): ScheduleResult {
  const scheduled: ScheduledTask[] = [];
  const overCapacity: { taskId: string; title: string }[] = [];
  const missedDeadline: { taskId: string; title: string }[] = [];

  const prefs = normalisePrefs(preferences);
  const eventMap = new Map<string, CalEvent>();
  (allEvents ?? events).forEach((e) => eventMap.set(e.id, e));
  const withDL = injectDynamicDeadlines(tasks, eventMap);
  const sorted = sortTasks(withDL, prefs.taskOrder);
  const normDays = days.map((d) => {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
  });
  const workDays = normDays.filter(
    (d) => !prefs.daysOff.includes(DAY_NAMES[d.getDay()]),
  );

  if (workDays.length === 0) {
    return {
      scheduled: [],
      overCapacity: tasks.map((t) => ({ taskId: t.id, title: t.title })),
      missedDeadline: [],
    };
  }

  const targetMins = Math.ceil(
    sorted.reduce((s, t) => s + (t.duration || 60), 0) / workDays.length,
  );
  const isWeekMode = normDays.length > 1;
  const cursors = new Map<string, DayCursor>();
  const dayMins = new Map<string, number>();

  for (const task of sorted) {
    const duration = task.duration || 60;
    const { hard, effective } = computeDeadlines(task);
    let placed = false;

    // Pass 1: respect buffer + spreading
    placed = placeTask(
      task,
      duration,
      normDays,
      events,
      prefs,
      cursors,
      dayMins,
      targetMins,
      isWeekMode,
      effective,
      scheduled,
    );
    // Pass 2: ignore buffer, try up to hard deadline
    if (!placed && hard)
      placed = placeTask(
        task,
        duration,
        normDays,
        events,
        prefs,
        cursors,
        dayMins,
        targetMins,
        false,
        hard,
        scheduled,
      );
    // Pass 3: no deadline — any remaining day
    if (!placed && !task.dueDate)
      placed = placeTask(
        task,
        duration,
        normDays,
        events,
        prefs,
        cursors,
        dayMins,
        targetMins,
        false,
        null,
        scheduled,
      );

    if (!placed) {
      if (task.dueDate)
        missedDeadline.push({ taskId: task.id, title: task.title });
      else overCapacity.push({ taskId: task.id, title: task.title });
    }
  }

  return { scheduled, overCapacity, missedDeadline };
}
