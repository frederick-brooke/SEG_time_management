/**
 * Task scheduler — assigns tasks to time slots across one or more working days.
 * Respects working hours, days off, session/break lengths, calendar events,
 * priorities, deadlines, and buffer days.
 */

import { getNextOccurrenceDeadline } from "./taskSchedulingUtils";
import { PRIORITY_SCORE } from "../ui";

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

/** Parses "HH:MM" into a Date on the same calendar day, falling back to `fallback` hour. */
function parseTime(str: string | null | undefined, date: Date, fallback = 9): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), fallback, 0, 0, 0);
  if (!str) return d;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return d;
  d.setHours(h, m, 0, 0);
  return d;
}

/** Returns true if two Dates fall on the same calendar day. */
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Fills missing preference fields with sensible defaults. */
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

/** Sorts tasks by the user's preferred ordering strategy. */
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
        if (!a.dueDate && !b.dueDate) return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
    }
  });
}

/** Injects dynamic deadlines for event-linked tasks that have no explicit dueDate. */
function injectDynamicDeadlines(tasks: Task[], eventLookup: Map<string, CalEvent>): Task[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return tasks.map((task) => {
    if (task.dueDate || !task.eventId || task.relativeOffsetDays == null) return task;
    const ev = eventLookup.get(task.eventId);
    const deadline = ev ? getNextOccurrenceDeadline(ev, task.relativeOffsetDays, now) : null;
    return deadline ? { ...task, dueDate: deadline } : task;
  });
}

/** Returns hard (end of due date) and effective (hard minus buffer) deadlines for a task. */
function computeDeadlines(task: Task): { hard: Date | null; effective: Date | null } {
  if (!task.dueDate) return { hard: null, effective: null };
  const hd = new Date(task.dueDate);
  const hard = new Date(hd.getFullYear(), hd.getMonth(), hd.getDate(), 23, 59, 59, 999);
  const effective = new Date(hard);
  if (task.bufferDays) effective.setDate(effective.getDate() - task.bufferDays);
  return { hard, effective };
}

/** Returns calendar event blocks for a given day, sorted by start time. */
function getDayBlocks(events: CalEvent[], day: Date): { start: Date; end: Date }[] {
  return events
    .filter((e) => isSameDay(new Date(e.start), day))
    .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Advances cursor past any overlapping calendar blocks, resetting workedMs on each jump. */
function skipBlocks(
  blocks: { start: Date; end: Date }[],
  cursor: Date,
  workedMs: number,
): { cursor: Date; workedMs: number } {
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
  return { cursor, workedMs };
}

/** Retrieves the day's cursor state, initialising it and clamping to workStart if needed. */
function getDayCursor(
  key: string,
  workStart: Date,
  cursors: Map<string, DayCursor>,
): { cursor: Date; workedMs: number } {
  if (!cursors.has(key)) cursors.set(key, { cursor: new Date(workStart), workedMs: 0 });
  const state = cursors.get(key)!;
  const behindStart = state.cursor.getTime() < workStart.getTime();
  return {
    cursor: behindStart ? new Date(workStart) : new Date(state.cursor),
    workedMs: behindStart ? 0 : state.workedMs,
  };
}

/** Advances cursor by a break, skips blocks, and returns updated state. */
function applyBreak(
  cursor: Date, breakMs: number, blocks: { start: Date; end: Date }[], workEnd: Date,
): { cursor: Date; workedMs: number; exhausted: boolean } {
  cursor = new Date(cursor.getTime() + breakMs);
  let workedMs = 0;
  ({ cursor, workedMs } = skipBlocks(blocks, cursor, workedMs));
  return { cursor, workedMs, exhausted: cursor >= workEnd };
}

/** Claims a slot at `cursor` and saves cursor state. */
function claimSlot(
  slot: Date, nextCursor: Date, nextWorkedMs: number,
  state: DayCursor, key: string, cursors: Map<string, DayCursor>,
): Date {
  state.cursor = nextCursor;
  state.workedMs = nextWorkedMs;
  cursors.set(key, state);
  return slot;
}

/** Advances cursor to the end of the next block, skipping any further overlaps. */
function jumpToNextBlock(
  next: { start: Date; end: Date } | undefined,
  workEnd: Date,
  blocks: { start: Date; end: Date }[],
): { cursor: Date; workedMs: number; done: boolean } {
  if (next && next.start < workEnd) {
    const result = skipBlocks(blocks, new Date(next.end), 0);
    return { cursor: result.cursor, workedMs: result.workedMs, done: false };
  }
  return { cursor: new Date(workEnd), workedMs: 0, done: true };
}

/** Attempts one iteration of the slot-finding loop. Returns the slot if found, or the advanced cursor state. */
function advanceSlotCursor(
  cursor: Date, workedMs: number, taskMs: number, sessionMs: number, breakMs: number,
  blocks: { start: Date; end: Date }[], workEnd: Date, state: DayCursor, key: string, cursors: Map<string, DayCursor>,
): { slot: Date | null; cursor: Date; workedMs: number; done: boolean } {
  const next = blocks.find((b) => b.start > cursor);
  const slotEnd = next && next.start < workEnd ? next.start : workEnd;
  const available = slotEnd.getTime() - cursor.getTime();
  const remaining = sessionMs - workedMs;

  if (available <= 0) return { slot: null, ...jumpToNextBlock(next, workEnd, blocks) };

  if (taskMs <= remaining && available >= taskMs)
    return { slot: claimSlot(new Date(cursor), new Date(cursor.getTime() + taskMs), workedMs + taskMs, state, key, cursors), cursor, workedMs, done: true };

  if (taskMs > remaining) {
    const after = new Date(cursor.getTime() + remaining + breakMs);
    if (after < workEnd && slotEnd.getTime() - after.getTime() >= taskMs)
      return { slot: claimSlot(new Date(after), new Date(after.getTime() + taskMs), taskMs, state, key, cursors), cursor, workedMs, done: true };
  }

  return { slot: null, ...jumpToNextBlock(next, workEnd, blocks) };
}

/** Finds the first available slot for `durationMins` on `day`, respecting working hours, events, and session/break rules. */
function findSlotOnDay(
  day: Date, durationMins: number, events: CalEvent[],
  cursors: Map<string, DayCursor>, prefs: UserPreferences,
): Date | null {
  const key = dk(day);
  const workStart = parseTime(prefs.workStartTime, day, 9);
  const workEnd = parseTime(prefs.workEndTime, day, 17);
  if (workEnd <= workStart) return null;

  const taskMs = Math.max(durationMins, 1) * 60_000;
  const sessionMs = Math.max(prefs.sessionLength, 15) * 60_000;
  const breakMs = Math.max(prefs.breakLength, 5) * 60_000;
  const blocks = getDayBlocks(events, day);
  const state = cursors.get(key) ?? { cursor: new Date(workStart), workedMs: 0 };

  let { cursor, workedMs } = getDayCursor(key, workStart, cursors);
  ({ cursor, workedMs } = skipBlocks(blocks, cursor, workedMs));

  for (let guard = 0; cursor < workEnd && guard < 200; guard++) {
    if (workedMs >= sessionMs) {
      const b = applyBreak(cursor, breakMs, blocks, workEnd);
      if (b.exhausted) break;
      cursor = b.cursor; workedMs = b.workedMs;
    }
    const result = advanceSlotCursor(cursor, workedMs, taskMs, sessionMs, breakMs, blocks, workEnd, state, key, cursors);
    if (result.slot) return result.slot;
    if (result.done) break;
    cursor = result.cursor; workedMs = result.workedMs;
  }
  return null;
}

/** Attempts to place a task on the first eligible day, respecting days off, deadlines, and load spreading. */
function placeTask(
  task: Task, duration: number, days: Date[], events: CalEvent[], prefs: UserPreferences,
  cursors: Map<string, DayCursor>, dayMinutes: Map<string, number>, targetMins: number,
  isWeekMode: boolean, deadline: Date | null, scheduled: ScheduledTask[],
): boolean {
  for (const day of days) {
    if (prefs.daysOff.includes(DAY_NAMES[day.getDay()])) continue;
    if (deadline && day > deadline) continue;
    if (isWeekMode) {
      const assigned = dayMinutes.get(dk(day)) ?? 0;
      const remainingDays = days
        .slice(days.indexOf(day) + 1)
        .filter((d) => !prefs.daysOff.includes(DAY_NAMES[d.getDay()]) && (!deadline || d <= deadline));
      if (remainingDays.length > 0 && assigned >= targetMins) continue;
    }
    const slot = findSlotOnDay(day, duration, events, cursors, prefs);
    if (!slot) continue;
    scheduled.push({ taskId: task.id, scheduledDate: new Date(day), scheduledTime: slot });
    dayMinutes.set(dk(day), (dayMinutes.get(dk(day)) ?? 0) + duration);
    return true;
  }
  return false;
}

/** Builds the sorted task list, normalised days, working days, target minutes, and week mode flag. */
function prepareScheduleInputs(
  tasks: Task[], events: CalEvent[], prefs: UserPreferences, days: Date[], allEvents?: CalEvent[],
): { sorted: Task[]; normDays: Date[]; workDays: Date[]; targetMins: number; isWeekMode: boolean } {
  const eventMap = new Map<string, CalEvent>();
  (allEvents ?? events).forEach((e) => eventMap.set(e.id, e));
  const withDL = injectDynamicDeadlines(tasks, eventMap);
  const sorted = sortTasks(withDL, prefs.taskOrder);
  const normDays = days.map((d) => { const n = new Date(d); n.setHours(0, 0, 0, 0); return n; });
  const workDays = normDays.filter((d) => !prefs.daysOff.includes(DAY_NAMES[d.getDay()]));
  const targetMins = Math.ceil(sorted.reduce((s, t) => s + (t.duration || 60), 0) / workDays.length);
  const isWeekMode = normDays.length > 1;
  return { sorted, normDays, workDays, targetMins, isWeekMode };
}

/**
 * Schedules tasks across the provided days using a three-pass strategy:
 * buffer-aware placement, hard-deadline fallback, then unconstrained fill.
 * Returns placed tasks, over-capacity tasks, and missed-deadline tasks.
 */
export function scheduleTasks(
  tasks: Task[], events: CalEvent[], preferences: UserPreferences,
  days: Date[], allEvents?: CalEvent[],
): ScheduleResult {
  const scheduled: ScheduledTask[] = [];
  const overCapacity: { taskId: string; title: string }[] = [];
  const missedDeadline: { taskId: string; title: string }[] = [];
  const prefs = normalisePrefs(preferences);
  const { sorted, workDays, normDays, targetMins, isWeekMode } = prepareScheduleInputs(tasks, events, prefs, days, allEvents);

  if (workDays.length === 0) {
    return { scheduled: [], overCapacity: tasks.map((t) => ({ taskId: t.id, title: t.title })), missedDeadline: [] };
  }

  const cursors = new Map<string, DayCursor>();
  const dayMins = new Map<string, number>();

  for (const task of sorted) {
    const duration = task.duration || 60;
    const { hard, effective } = computeDeadlines(task);
    let placed = false;

    placed = placeTask(task, duration, normDays, events, prefs, cursors, dayMins, targetMins, isWeekMode, effective, scheduled);
    if (!placed && hard)
      placed = placeTask(task, duration, normDays, events, prefs, cursors, dayMins, targetMins, false, hard, scheduled);
    if (!placed && !task.dueDate)
      placed = placeTask(task, duration, normDays, events, prefs, cursors, dayMins, targetMins, false, null, scheduled);

    if (!placed) {
      if (task.dueDate) missedDeadline.push({ taskId: task.id, title: task.title });
      else overCapacity.push({ taskId: task.id, title: task.title });
    }
  }
  return { scheduled, overCapacity, missedDeadline };
}