import { prisma } from "@/lib/prisma";

const DEFAULT_SLEEP_START = 22;
const DEFAULT_SLEEP_END = 7;
const DEFAULT_BUFFER_MINS = 15;
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

interface Slot { start: Date; end: Date; }

interface SchedulingPrefs {
  workStartTime: string;
  workEndTime: string;
  daysOff: number[];
  sessionLength: number;
  breakLength: number;
  breaksPerDay: number;
  maxTasksPerDay: number;
  taskOrder: string;
}

/** 
 * Parses "HH:MM" into total minutes. 
 * @param time "HH:MM" string. 
 * @returns total minutes */
function parseMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 
 * Moves a date forward to the next :00/:15/:30/:45 boundary for consistency. 
 * @param date input date. 
 * @returns snapped Date 
 * */
function snapToNextQuarterHour(date: Date): Date {
  const quarterMs = 15 * 60_000;
  return new Date(Math.ceil(date.getTime() / quarterMs) * quarterMs);
}

/** 
 * Moves a date to the start of the next (non-day-off) work day. 
 * @param d cursor. 
 * @param workStartMins work start in total minutes. 
 * @param prefs user preferences
 * @returns next work day start Date 
 * */
function advanceToNextWorkDay(d: Date, workStartMins: number, prefs: SchedulingPrefs | null): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + 1);
  result.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
  if (prefs) {
    while (prefs.daysOff.includes(result.getDay())) result.setDate(result.getDate() + 1);
  }
  return result;
}

/** 
 * Moves a date to the next work period start, skipping past the work-end time and days off. 
 * @param d cursor date. 
 * @param prefs user prefs. 
 * @param sleepEnd default sleep-end hour. 
 * @returns adjusted Date 
 * */
function skipToWorkStart(d: Date, prefs: SchedulingPrefs | null, sleepEnd: number): Date {
  const workStartMins = prefs ? parseMins(prefs.workStartTime) : sleepEnd * 60;
  const workEndMins = prefs ? parseMins(prefs.workEndTime) : DEFAULT_SLEEP_START * 60;
  const currentMins = d.getHours() * 60 + d.getMinutes();
  if (currentMins < workStartMins) {
    const result = new Date(d);
    result.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
    return result;
  }
  if (currentMins >= workEndMins) return advanceToNextWorkDay(d, workStartMins, prefs);
  return d;
}

/** 
 * Builds the two non-working blocks (before and after work) for a day. 
 * @param cursor start of day. 
 * @param workStartMins work start in total minutes. 
 * @param workEndMins work end in total minutes. 
 * @returns array of two blocked Slots 
 * */
function buildDayBlocks(cursor: Date, workStartMins: number, workEndMins: number): Slot[] {
  const workStart = new Date(cursor);
  workStart.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
  const workEnd = new Date(cursor);
  workEnd.setHours(Math.floor(workEndMins / 60), workEndMins % 60, 0, 0);
  const dayEnd = new Date(cursor);
  dayEnd.setHours(23, 59, 59, 999);
  return [{ start: new Date(cursor), end: workStart }, { start: workEnd, end: dayEnd }];
}

/** 
 * Builds all non-working blocked periods (nights and days off) across a date range. 
 * @param from range start. 
 * @param to range end. 
 * @param prefs user prefs. 
 * @returns array of blocked Slots 
 * */
function buildBlockedPeriods(from: Date, to: Date, prefs: SchedulingPrefs | null): Slot[] {
  const blocks: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const workStartMins = prefs ? parseMins(prefs.workStartTime) : DEFAULT_SLEEP_END * 60;
  const workEndMins = prefs ? parseMins(prefs.workEndTime) : DEFAULT_SLEEP_START * 60;
  while (cursor <= to) {
    // Days off blocks the entire day and work days block before and after work hours
    if (prefs?.daysOff.includes(cursor.getDay())) {
      blocks.push({ start: new Date(cursor), end: new Date(new Date(cursor).setHours(23, 59, 59, 999)) });
    } else {
      blocks.push(...buildDayBlocks(cursor, workStartMins, workEndMins));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return blocks;
}

/** 
 * Counts existing events per calendar day. 
 * @param events list of slots. 
 * @returns Map of "YYYY-MM-DD" to event count 
 * */
function buildDailyTaskCounts(events: Slot[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = e.start.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** 
 * Returns true if the gap is long enough and the day's task cap hasn't been hit. 
 * @param cursor gap start. 
 * @param gapEnd gap end. 
 * @param durationMs required ms. 
 * @param dayKey "YYYY-MM-DD". 
 * @param counts daily count map. 
 * @param max max tasks per day (0 = unlimited). 
 * @returns boolean */
function isSlotUsable(cursor: Date, gapEnd: Date, durationMs: number, dayKey: string, counts: Map<string, number>, max: number): boolean {
  if (gapEnd.getTime() - cursor.getTime() < durationMs) return false;
  return !max || (counts.get(dayKey) ?? 0) < max;
}

/** 
 * Finds all available slots between two dates, taking blocked periods and preferences into account. 
 * @param from search start. 
 * @param to search end. 
 * @param existingEvents already-booked slots. 
 * @param durationMins required task length. 
 * @param prefs user preferences.
 * @returns array of free Slots */
export function findFreeSlots(from: Date, to: Date, existingEvents: { start: Date; end: Date }[], durationMins: number, prefs: SchedulingPrefs | null = null): Slot[] {
  const bufferMs = (prefs?.breakLength ?? DEFAULT_BUFFER_MINS) * 60_000;
  const durationMs = (prefs?.sessionLength ? Math.min(durationMins, prefs.sessionLength) : durationMins) * 60_000;
  const max = prefs?.maxTasksPerDay ?? 0;
  const allBlocked = [
    ...existingEvents.map((e) => ({ start: new Date(e.start), end: new Date(e.end) })),
    ...buildBlockedPeriods(from, to, prefs),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());
  const counts = buildDailyTaskCounts(existingEvents);
  const freeSlots: Slot[] = [];

  let cursor = snapToNextQuarterHour(skipToWorkStart(new Date(from), prefs, DEFAULT_SLEEP_END));

  for (const block of allBlocked) {
    if (block.start > to) break;
    if (cursor < block.start) {
      const gapEnd = new Date(block.start.getTime() - bufferMs);
      const dayKey = cursor.toISOString().slice(0, 10);
      if (isSlotUsable(cursor, gapEnd, durationMs, dayKey, counts, max)) {
        freeSlots.push({ start: new Date(cursor), end: gapEnd });
        counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
      }
    }
    if (block.end > cursor) {
      cursor = snapToNextQuarterHour(skipToWorkStart(new Date(block.end.getTime() + bufferMs), prefs, DEFAULT_SLEEP_END));
    }
  }
  const dayKey = cursor.toISOString().slice(0, 10);
  // Handle any remaining free time after the last blocked period
  if (cursor < to && isSlotUsable(cursor, to, durationMs, dayKey, counts, max)) {
    freeSlots.push({ start: new Date(cursor), end: new Date(to) });
  }
  return freeSlots;
}

/** 
 * Fetches and normalises scheduling preferences for a user from the database. 
 * @param userId user ID. 
 * @returns SchedulingPrefs or null 
 * */
async function getUserPrefs(userId: string): Promise<SchedulingPrefs | null> {
  const p = await prisma.userPreferences.findUnique({ where: { userId } });
  if (!p) return null;
  return {
    workStartTime: p.workStartTime ?? "07:00",
    workEndTime: p.workEndTime ?? "22:00",
    daysOff: Array.isArray(p.daysOff) ? (p.daysOff as unknown[]).map(Number) : [],
    sessionLength: p.sessionLength ?? 0,
    breakLength: p.breakLength ?? DEFAULT_BUFFER_MINS,
    breaksPerDay: p.breaksPerDay ?? 0,
    maxTasksPerDay: p.maxTasksPerDay ?? 0,
    taskOrder: p.taskOrder ?? "priority",
  };
}

/** 
 * Creates a calendar event for a task at the first available slot. 
 * @param taskId task to schedule. 
 * @param userId owning user. 
 * @param extraBlocked additional busy slots. 
 * @returns created Event or null 
 * */
export async function scheduleTask(taskId: string, userId: string, extraBlocked: { start: Date; end: Date }[] = []) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Task not found");
  if (!task.duration || task.duration === 0) throw new Error("Task has no duration set");
  const prefs = await getUserPrefs(userId);
  const now = new Date();

  // cap search at due date but don't look more than 14 days away
  const searchUntil = task.dueDate
    ? new Date(Math.min(task.dueDate.getTime(), now.getTime() + 14 * 86_400_000))
    : new Date(now.getTime() + 7 * 86_400_000);
  const existingEvents = await prisma.event.findMany({
    where: { userId, start: { lt: searchUntil }, end: { gt: now } },
    select: { start: true, end: true },
  });
  const slots = findFreeSlots(now, searchUntil, [...existingEvents, ...extraBlocked], task.duration, prefs);
  if (slots.length === 0) return null;
  const eventStart = slots[0].start;
  const effectiveDuration = prefs?.sessionLength && prefs.sessionLength > 0 ? Math.min(task.duration, prefs.sessionLength) : task.duration;
  const eventEnd = new Date(eventStart.getTime() + effectiveDuration * 60_000);
  const [event] = await prisma.$transaction([
    prisma.event.create({ data: { userId, title: task.title, description: task.description ?? "", start: eventStart, end: eventEnd, allDay: false, category: "Task" } }),
    prisma.task.update({ where: { id: taskId }, data: { status: "scheduled" } }),
  ]);
  return event;
}

/** 
 * Sorts tasks by the user's preferred order (dueDate or priority+dueDate). 
 * @param tasks array of tasks. 
 * @param prefs user prefs. 
 * @returns sorted task array */
function sortTasks(tasks: any[], prefs: SchedulingPrefs | null): any[] {
  return [...tasks].sort((a, b) => {
    if (prefs?.taskOrder === "dueDate") {
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    }
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    return a.dueDate ? -1 : b.dueDate ? 1 : 0;
  });
}

/** 
 * Schedules all unscheduled tasks for a user in priority/due-date order. 
 * @param userId owning user. 
 * @returns array of per-task schedule results 
 * */
export async function scheduleAllTasks(userId: string) {
  const prefs = await getUserPrefs(userId);
  const tasks = await prisma.task.findMany({
    where: { userId, status: { not: "scheduled" }, duration: { gt: 0 }, completed: false },
  });
  const results: { taskId: string; title: string; scheduled: boolean; event?: any }[] = [];
  const scheduledSlots: { start: Date; end: Date }[] = [];
  for (const task of sortTasks(tasks, prefs)) {
    try {
      const event = await scheduleTask(task.id, userId, scheduledSlots);
      if (event) scheduledSlots.push({ start: event.start, end: event.end });
      results.push({ taskId: task.id, title: task.title, scheduled: !!event, event: event ?? undefined });
    } catch {
      results.push({ taskId: task.id, title: task.title, scheduled: false });
    }
  }
  return results;
}