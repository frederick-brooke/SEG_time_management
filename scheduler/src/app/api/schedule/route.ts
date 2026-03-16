import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleTasks } from "@/lib/scheduler";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { taskIds, days, mode, ignoreCapacity, breakOverrides, dateLabel } =
    await req.json();

  if (!days?.length) {
    return NextResponse.json({ error: "days required" }, { status: 400 });
  }
  if (!taskIds || taskIds.length === 0) {
    return NextResponse.json({
      scheduled: 0,
      overCapacity: [],
      missedDeadline: [],
      requiresConfirmation: false,
    });
  }

  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, userId: session.user.id },
  });

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  if (!preferences) {
    return NextResponse.json(
      { error: "User preferences not found" },
      { status: 400 },
    );
  }

  const scheduleDays = days.map((d: string) => {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  });

  // Window events (for slot blocking) — widen by 1 day each side
  const startOfRange = new Date(scheduleDays[0]);
  startOfRange.setDate(startOfRange.getDate() - 1);
  const endOfRange = new Date(scheduleDays[scheduleDays.length - 1]);
  endOfRange.setHours(23, 59, 59, 999);
  endOfRange.setDate(endOfRange.getDate() + 1);

  const windowEvents = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      start: { gte: startOfRange, lte: endOfRange },
    },
  });

  // ── Fetch ALL events for dynamic deadline computation ────────────────────
  // Tasks linked to recurring events (e.g. pre-reading before Monday lecture)
  // need the full event recurrence data to compute their deadline this week.
  // We only fetch events for event IDs actually referenced by the tasks.
  const linkedEventIds = [
    ...new Set(
      tasks.map((t: any) => t.eventId).filter((id: any): id is string => !!id),
    ),
  ];

  let allEvents = [...windowEvents];

  if (linkedEventIds.length > 0) {
    // Fetch any linked events that aren't already in windowEvents
    const windowEventIds = new Set(windowEvents.map((e) => e.id));
    const missingIds = linkedEventIds.filter((id) => !windowEventIds.has(id));

    if (missingIds.length > 0) {
      const extraEvents = await prisma.event.findMany({
        where: { id: { in: missingIds }, userId: session.user.id },
      });
      allEvents = [...windowEvents, ...extraEvents];
    }
  }

  const effectivePreferences = breakOverrides
    ? {
        ...preferences,
        sessionLength: breakOverrides.sessionLength,
        breakLength: breakOverrides.breakLength,
      }
    : preferences;

  // Pass allEvents as the 5th argument so the scheduler can compute
  // dynamic deadlines for recurring event-linked tasks
  const result = scheduleTasks(
    tasks,
    windowEvents,
    effectivePreferences,
    scheduleDays,
    allEvents,
  );

  // Return warning without saving if over capacity and not yet confirmed
  if (result.overCapacity.length > 0 && !ignoreCapacity) {
    return NextResponse.json({
      scheduled: 0,
      overCapacity: result.overCapacity,
      missedDeadline: result.missedDeadline,
      requiresConfirmation: true,
      wouldSchedule: result.scheduled.length,
    });
  }

  // Snapshot current scheduled times before overwriting
  const previousSchedule: Record<
    string,
    { scheduledDate: string | null; scheduledTime: string | null }
  > = {};
  for (const s of result.scheduled) {
    const task = tasks.find((t: any) => t.id === s.taskId);
    if (task) {
      previousSchedule[s.taskId] = {
        scheduledDate: task.scheduledDate
          ? (task.scheduledDate as Date).toISOString()
          : null,
        scheduledTime: task.scheduledTime
          ? (task.scheduledTime as Date).toISOString()
          : null,
      };
    }
  }

  // Save new scheduled times
  await Promise.all(
    result.scheduled.map((s) =>
      prisma.task.update({
        where: { id: s.taskId },
        data: {
          scheduledDate: s.scheduledDate,
          scheduledTime:
            s.scheduledTime instanceof Date
              ? s.scheduledTime
              : new Date(s.scheduledTime),
          status: "todo",
        } as Parameters<typeof prisma.task.update>[0]["data"],
      }),
    ),
  );

  // Clear scheduled slots for tasks that couldn't be placed
  const placedIds = new Set(result.scheduled.map((s) => s.taskId));
  const unplacedIds = taskIds.filter((id: string) => !placedIds.has(id));

  if (unplacedIds.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: unplacedIds }, userId: session.user.id },
      data: { scheduledDate: null, scheduledTime: null },
    });
  }

  // Create schedule log
  const logLabel = dateLabel ?? `${mode === "day" ? "Day" : "Week"} schedule`;
  const logData: any = {
    userId: session.user.id,
    mode,
    dateLabel: logLabel,
    taskIds: result.scheduled.map((s) => s.taskId),
  };
  try {
    logData.previousSchedule = previousSchedule;
    logData.days = days;
  } catch {}

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

  return NextResponse.json({
    scheduled: result.scheduled.length,
    overCapacity: [],
    missedDeadline: result.missedDeadline,
    requiresConfirmation: false,
  });
}
