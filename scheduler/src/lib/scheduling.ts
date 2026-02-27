import { prisma } from "@/src/lib/prisma";

const SLEEP_START = 22; // 10 PM
const SLEEP_END = 7; // 7 AM
const BUFFER_MINS = 15; // gap between events

interface Slot {
  start: Date;
  end: Date;
}

function isDuringSleep(date: Date): boolean {
  const h = date.getHours();
  if (SLEEP_START > SLEEP_END) return h >= SLEEP_START || h < SLEEP_END;
  return h >= SLEEP_START && h < SLEEP_END;
}

function skipSleep(d: Date): Date {
  if (!isDuringSleep(d)) return d;
  const wakeUp = new Date(d);
  if (d.getHours() < SLEEP_END) {
    wakeUp.setHours(SLEEP_END, 0, 0, 0);
  } else {
    wakeUp.setDate(wakeUp.getDate() + 1);
    wakeUp.setHours(SLEEP_END, 0, 0, 0);
  }
  return wakeUp;
}

function buildSleepBlocks(from: Date, to: Date): Slot[] {
  const blocks: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= to) {
    const sleepStart = new Date(cursor);
    sleepStart.setHours(SLEEP_START, 0, 0, 0);

    const sleepEnd = new Date(cursor);
    sleepEnd.setDate(sleepEnd.getDate() + 1);
    sleepEnd.setHours(SLEEP_END, 0, 0, 0);

    blocks.push({ start: sleepStart, end: sleepEnd });
    cursor.setDate(cursor.getDate() + 1);
  }
  return blocks;
}

export function findFreeSlots(
  from: Date,
  to: Date,
  existingEvents: { start: Date; end: Date }[],
  durationMins: number
): Slot[] {
  const bufferMs = BUFFER_MINS * 60_000;
  const durationMs = durationMins * 60_000;

  const sleepBlocks = buildSleepBlocks(from, to);
  const allBlocked: Slot[] = [
    ...existingEvents.map((e) => ({ start: new Date(e.start), end: new Date(e.end) })),
    ...sleepBlocks,
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const freeSlots: Slot[] = [];
  let cursor = skipSleep(new Date(from));

  for (const block of allBlocked) {
    if (block.start > to) break;
    if (cursor < block.start) {
      const gapEnd = new Date(block.start.getTime() - bufferMs);
      if (gapEnd.getTime() - cursor.getTime() >= durationMs) {
        freeSlots.push({ start: new Date(cursor), end: gapEnd });
      }
    }
    if (block.end > cursor) {
      cursor = skipSleep(new Date(block.end.getTime() + bufferMs));
    }
  }

  // Remaining time after all blocks
  if (cursor < to && to.getTime() - cursor.getTime() >= durationMs) {
    freeSlots.push({ start: new Date(cursor), end: new Date(to) });
  }

  return freeSlots;
}


/**
 * Schedule a single task: find its first free slot and create an Event row
 * with category "Task". Also marks task.status = "scheduled".
 */
export async function scheduleTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Task not found");
  if (!task.duration || task.duration === 0)
    throw new Error("Task has no duration set");

  const now = new Date();
  const searchUntil = task.dueDate
    ? new Date(Math.min(task.dueDate.getTime(), now.getTime() + 14 * 86_400_000))
    : new Date(now.getTime() + 7 * 86_400_000);

  const existingEvents = await prisma.event.findMany({
    where: {
      userId,
      start: { gte: now },
      end: { lte: searchUntil },
    },
    select: { start: true, end: true },
  });

  const slots = findFreeSlots(now, searchUntil, existingEvents, task.duration);
  if (slots.length === 0) return null;

  const chosen = slots[0];
  const eventStart = chosen.start;
  const eventEnd = new Date(eventStart.getTime() + task.duration * 60_000);

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

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "scheduled" },
      duration: { gt: 0 },
      completed: false,
    },
  });

  tasks.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const results: { taskId: string; title: string; scheduled: boolean; event?: any }[] = [];

  for (const task of tasks) {
    try {
      const event = await scheduleTask(task.id, userId);
      results.push({ taskId: task.id, title: task.title, scheduled: !!event, event });
    } catch {
      results.push({ taskId: task.id, title: task.title, scheduled: false });
    }
  }

  return results;
}