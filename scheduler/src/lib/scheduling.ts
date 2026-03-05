import { prisma } from "@/src/lib/prisma";

const DEFAULT_SLEEP_START = 22;
const DEFAULT_SLEEP_END = 7;
const DEFAULT_BUFFER_MINS = 15;

interface Slot {
  start: Date;
  end: Date;
}

interface SchedulingPrefs {
  workStartTime: string;
  workEndTime: string;
  daysOff: number[];
  sessionLength: number;
  breakLength: number;
  breaksPerDay: number;
  maxTasksPerDay: number;
}

function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

function parseMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isDuringSleep(date: Date, sleepStart: number, sleepEnd: number): boolean {
  const h = date.getHours();
  if (sleepStart > sleepEnd) return h >= sleepStart || h < sleepEnd;
  return h >= sleepStart && h < sleepEnd;
}

function skipToWorkStart(d: Date, prefs: SchedulingPrefs | null, sleepEnd: number): Date {
  const workStartMins = prefs ? parseMins(prefs.workStartTime) : sleepEnd * 60;
  const workEndMins = prefs ? parseMins(prefs.workEndTime) : DEFAULT_SLEEP_START * 60;
  const currentMins = d.getHours() * 60 + d.getMinutes();

  if (currentMins < workStartMins) {
    const result = new Date(d);
    result.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
    return result;
  }

  if (currentMins >= workEndMins) {
    const result = new Date(d);
    result.setDate(result.getDate() + 1);
    result.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
    // Skip days off
    if (prefs) {
      while (prefs.daysOff.includes(result.getDay())) {
        result.setDate(result.getDate() + 1);
      }
    }
    return result;
  }

  return d;
}

function buildBlockedPeriods(from: Date, to: Date, prefs: SchedulingPrefs | null): Slot[] {
  const blocks: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  const sleepStart = DEFAULT_SLEEP_START;
  const sleepEnd = DEFAULT_SLEEP_END;
  const workStartMins = prefs ? parseMins(prefs.workStartTime) : sleepEnd * 60;
  const workEndMins = prefs ? parseMins(prefs.workEndTime) : sleepStart * 60;

  while (cursor <= to) {
    const dayOfWeek = cursor.getDay();

    // Block entire day if it's a day off
    if (prefs?.daysOff.includes(dayOfWeek)) {
      blocks.push({
        start: new Date(cursor),
        end: new Date(new Date(cursor).setHours(23, 59, 59, 999)),
      });
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const dayStart = new Date(cursor);
    const workStart = new Date(cursor);
    workStart.setHours(Math.floor(workStartMins / 60), workStartMins % 60, 0, 0);
    blocks.push({ start: dayStart, end: new Date(workStart) });

    const workEnd = new Date(cursor);
    workEnd.setHours(Math.floor(workEndMins / 60), workEndMins % 60, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    blocks.push({ start: new Date(workEnd), end: dayEnd });

    cursor.setDate(cursor.getDate() + 1);
  }

  return blocks;
}

function buildDailyTaskCounts(events: Slot[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = e.start.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function findFreeSlots(
  from: Date,
  to: Date,
  existingEvents: { start: Date; end: Date }[],
  durationMins: number,
  prefs: SchedulingPrefs | null = null
): Slot[] {
  const bufferMs = (prefs?.breakLength ?? DEFAULT_BUFFER_MINS) * 60_000;

  const effectiveDuration = prefs?.sessionLength
    ? Math.min(durationMins, prefs.sessionLength)
    : durationMins;
  const durationMs = effectiveDuration * 60_000;

  const blockedPeriods = buildBlockedPeriods(from, to, prefs);
  const allBlocked: Slot[] = [
    ...existingEvents.map((e) => ({ start: new Date(e.start), end: new Date(e.end) })),
    ...blockedPeriods,
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const taskEventsByDay = buildDailyTaskCounts(existingEvents);

  const freeSlots: Slot[] = [];
  let cursor = skipToWorkStart(new Date(from), prefs, DEFAULT_SLEEP_END);

  for (const block of allBlocked) {
    if (block.start > to) break;
    if (cursor < block.start) {
      const gapEnd = new Date(block.start.getTime() - bufferMs);
      if (gapEnd.getTime() - cursor.getTime() >= durationMs) {
        const dayKey = cursor.toISOString().slice(0, 10);
        const tasksToday = taskEventsByDay.get(dayKey) ?? 0;
        if (!prefs?.maxTasksPerDay || tasksToday < prefs.maxTasksPerDay) {
          freeSlots.push({ start: new Date(cursor), end: gapEnd });
          taskEventsByDay.set(dayKey, tasksToday + 1);
        }
      }
    }
    if (block.end > cursor) {
      cursor = skipToWorkStart(
        new Date(block.end.getTime() + bufferMs),
        prefs,
        DEFAULT_SLEEP_END
      );
    }
  }

  if (cursor < to && to.getTime() - cursor.getTime() >= durationMs) {
    const dayKey = cursor.toISOString().slice(0, 10);
    const tasksToday = taskEventsByDay.get(dayKey) ?? 0;
    if (!prefs?.maxTasksPerDay || tasksToday < prefs.maxTasksPerDay) {
      freeSlots.push({ start: new Date(cursor), end: new Date(to) });
    }
  }

  return freeSlots;
}

async function getUserPrefs(userId: string): Promise<SchedulingPrefs | null> {
  const p = await prisma.userPreferences.findUnique({ where: { userId } });
  if (!p) return null;
  return {
    workStartTime: p.workStartTime ?? "07:00",
    workEndTime: p.workEndTime ?? "22:00",
    daysOff: (p.daysOff as number[]) ?? [],
    sessionLength: p.sessionLength ?? 0,
    breakLength: p.breakLength ?? DEFAULT_BUFFER_MINS,
    breaksPerDay: p.breaksPerDay ?? 0,
    maxTasksPerDay: p.maxTasksPerDay ?? 0,
  };
}

export async function scheduleTask(
  taskId: string,
  userId: string,
  extraBlocked: { start: Date; end: Date }[] = []
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Task not found");
  if (!task.duration || task.duration === 0)
    throw new Error("Task has no duration set");

  const prefs = await getUserPrefs(userId);

  const now = new Date();
  const searchUntil = task.dueDate
    ? new Date(Math.min(task.dueDate.getTime(), now.getTime() + 14 * 86_400_000))
    : new Date(now.getTime() + 7 * 86_400_000);

  const existingEvents = await prisma.event.findMany({
    where: {
      userId,
      start: { lt: searchUntil },
      end: { gt: now },
    },
    select: { start: true, end: true },
  });

  const allEvents = [...existingEvents, ...extraBlocked];
  const slots = findFreeSlots(now, searchUntil, allEvents, task.duration, prefs);
  if (slots.length === 0) return null;

  const chosen = slots[0];
  const eventStart = chosen.start;

  const effectiveDuration =
    prefs?.sessionLength && prefs.sessionLength > 0
      ? Math.min(task.duration, prefs.sessionLength)
      : task.duration;
  const eventEnd = new Date(eventStart.getTime() + effectiveDuration * 60_000);

  const [event] = await prisma.$transaction([
    prisma.event.create({
      data: {
        userId,
        title: task.title,
        description: task.description ?? "",
        start: eventStart,
        end: eventEnd,
        allDay: false,
        category: "Task",
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { status: "scheduled" },
    }),
  ]);

  return event;
}

export async function scheduleAllTasks(userId: string) {
  const PRIORITY_ORDER: Record<string, number> = {
    Urgent: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };

  const prefs = await getUserPrefs(userId);

  let tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "scheduled" },
      duration: { gt: 0 },
      completed: false,
    },
  });

  tasks.sort((a, b) => {
    if (prefs?.taskOrder === "dueDate") {
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    }
    
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const results: { taskId: string; title: string; scheduled: boolean; event?: any }[] = [];
  const scheduledSlots: { start: Date; end: Date }[] = [];

  for (const task of tasks) {
    try {
      const event = await scheduleTask(task.id, userId, scheduledSlots);
      if (event) {
        scheduledSlots.push({ start: event.start, end: event.end });
        results.push({ taskId: task.id, title: task.title, scheduled: true, event });
      } else {
        results.push({ taskId: task.id, title: task.title, scheduled: false });
      }
    } catch {
      results.push({ taskId: task.id, title: task.title, scheduled: false });
    }
  }

  return results;
}