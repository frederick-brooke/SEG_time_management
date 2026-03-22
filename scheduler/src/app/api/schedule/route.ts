/**
 * POST /api/schedule
 * Schedules tasks for a given set of days, persists the result, and logs the operation.
 * Supports day and week modes, capacity warnings, and break overrides.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleTasks } from "@/lib/scheduling/scheduler";

/**
 * Converts "YYYY-MM-DD" strings to local midnight Date objects.
 * @param days - Array of date strings in "YYYY-MM-DD" format.
 * @returns Array of Date objects set to local midnight.
 */
function buildScheduleDays(days: string[]): Date[] {
  return days.map((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day, 0, 0, 0, 0);
  });
}

/**
 * Fetches calendar events within the schedule range, padded by 1 day on each side for slot blocking.
 * @param userId - The authenticated user's ID.
 * @param scheduleDays - The days being scheduled, used to derive the query range.
 * @returns Events overlapping the padded date window.
 */
async function fetchWindowEvents(userId: string, scheduleDays: Date[]) {
  const start = new Date(scheduleDays[0]);
  start.setDate(start.getDate() - 1);
  const end = new Date(scheduleDays[scheduleDays.length - 1]);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() + 1);
  return prisma.event.findMany({ where: { userId, start: { gte: start, lte: end } } });
}

/**
 * Returns windowEvents plus any linked events not already in the window.
 * Needed so recurring event-linked tasks can compute their deadline for the current week.
 * @param tasks - The tasks being scheduled, some of which may reference a linked event.
 * @param windowEvents - Events already fetched for the schedule window.
 * @param userId - The authenticated user's ID, used to scope the fallback query.
 * @returns Combined array of window events and any additionally fetched linked events.
 */
async function fetchAllEvents(tasks: any[], windowEvents: any[], userId: string) {
  const linkedIds = [...new Set(tasks.map((t) => t.eventId).filter(Boolean))] as string[];
  if (!linkedIds.length) return [...windowEvents];
  const windowIds = new Set(windowEvents.map((e) => e.id));
  const missingIds = linkedIds.filter((id) => !windowIds.has(id));
  if (!missingIds.length) return [...windowEvents];
  const extra = await prisma.event.findMany({ where: { id: { in: missingIds }, userId } });
  return [...windowEvents, ...extra];
}

/**
 * Captures each task's current scheduledDate/scheduledTime before overwriting, for the audit log.
 * @param result - The scheduler result containing the list of newly scheduled tasks.
 * @param tasks - The original task records, used to read their pre-schedule times.
 * @returns A map of taskId to its previous scheduledDate and scheduledTime as ISO strings.
 */
function snapshotSchedule(result: any, tasks: any[]) {
  return Object.fromEntries(
    result.scheduled.map((s: any) => {
      const t = tasks.find((t: any) => t.id === s.taskId);
      return [s.taskId, {
        scheduledDate: t?.scheduledDate ? (t.scheduledDate as Date).toISOString() : null,
        scheduledTime: t?.scheduledTime ? (t.scheduledTime as Date).toISOString() : null,
      }];
    }),
  );
}

/**
 * Writes the scheduler's output back to the database, updating each task's scheduled times and status.
 * @param result - The scheduler result whose `scheduled` entries are persisted.
 */
async function persistSchedule(result: any) {
  await Promise.all(result.scheduled.map((s: any) =>
    prisma.task.update({
      where: { id: s.taskId },
      data: {
        scheduledDate: s.scheduledDate,
        scheduledTime: s.scheduledTime instanceof Date ? s.scheduledTime : new Date(s.scheduledTime),
        status: "todo",
      } as Parameters<typeof prisma.task.update>[0]["data"],
    }),
  ));
}

/**
 * Persists a schedule log entry. Falls back to a reduced payload if the schema
 * doesn't yet have the `previousSchedule` or `days` columns.
 * @param logData - The full log payload including userId, mode, taskIds, previousSchedule, and days.
 */
async function createScheduleLog(logData: any) {
  try {
    await (prisma.scheduleLog as any).create({ data: logData });
  } catch (e: any) {
    if (e?.message?.includes("Unknown argument")) {
      const { previousSchedule: _ps, days: _d, ...safeData } = logData;
      await (prisma.scheduleLog as any).create({ data: safeData });
    } else {
      throw e;
    }
  }
}

/**
 * Schedules a set of tasks across one or more days.
 *
 * @param req - The incoming request. Body should contain:
 *   - `taskIds` - IDs of tasks to schedule.
 *   - `days` - Target days as "YYYY-MM-DD" strings.
 *   - `mode` - "day" or "week", used for the log label.
 *   - `ignoreCapacity` - If true, skips the over-capacity confirmation gate.
 *   - `breakOverrides` - Optional `{ sessionLength, breakLength }` to override user preferences.
 *   - `dateLabel` - Optional custom label for the schedule log entry.
 * @returns JSON with `scheduled` count, `overCapacity` task IDs, `missedDeadline` task IDs,
 *   and `requiresConfirmation` flag. Includes `wouldSchedule` count when returning a capacity warning.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { taskIds, days, mode, ignoreCapacity, breakOverrides, dateLabel } = await req.json();

  if (!days?.length) return NextResponse.json({ error: "days required" }, { status: 400 });
  if (!taskIds?.length) return NextResponse.json({ scheduled: 0, overCapacity: [], missedDeadline: [], requiresConfirmation: false });

  const [tasks, preferences] = await Promise.all([
    prisma.task.findMany({ where: { id: { in: taskIds }, userId: session.user.id } }),
    prisma.userPreferences.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!preferences) return NextResponse.json({ error: "User preferences not found" }, { status: 400 });

  const scheduleDays = buildScheduleDays(days);
  const windowEvents = await fetchWindowEvents(session.user.id, scheduleDays);
  const allEvents = await fetchAllEvents(tasks, windowEvents, session.user.id);
  const effectivePrefs = breakOverrides ? { ...preferences, sessionLength: breakOverrides.sessionLength, breakLength: breakOverrides.breakLength } : preferences;
  const result = scheduleTasks(tasks, windowEvents, effectivePrefs, scheduleDays, allEvents);

  if (result.overCapacity.length > 0 && !ignoreCapacity) {
    return NextResponse.json({ scheduled: 0, overCapacity: result.overCapacity, missedDeadline: result.missedDeadline, requiresConfirmation: true, wouldSchedule: result.scheduled.length });
  }

  const previousSchedule = snapshotSchedule(result, tasks);
  await persistSchedule(result);
  await createScheduleLog({ userId: session.user.id, mode, dateLabel: dateLabel ?? `${mode === "day" ? "Day" : "Week"} schedule`, taskIds: result.scheduled.map((s: any) => s.taskId), previousSchedule, days });

  return NextResponse.json({ scheduled: result.scheduled.length, overCapacity: [], missedDeadline: result.missedDeadline, requiresConfirmation: false });
}