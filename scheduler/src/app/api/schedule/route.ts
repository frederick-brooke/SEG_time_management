/**
 * POST /api/schedule
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleTasks } from "@/lib/scheduling/scheduler";

const DEFAULT_PREFERENCES = {
	workStartTime: "09:00",
	workEndTime: "20:00",
	daysOff: [],
	sessionLength: 60,
	breakLength: 15,
	breaksPerDay: 2,
	taskOrder: "hard-first",
	maxTasksPerDay: 5,
	defaultTaskDuration: 60,
	reminderDays: 2,
};

function buildScheduleDays(days: string[]): Date[] {
	return days.map((d) => {
		const [y, m, day] = d.split("-").map(Number);
		return new Date(y, m - 1, day, 0, 0, 0, 0);
	});
}

async function fetchWindowEvents(userId: string, scheduleDays: Date[]) {
	const start = new Date(scheduleDays[0]);
	start.setDate(start.getDate() - 1);
	const end = new Date(scheduleDays[scheduleDays.length - 1]);
	end.setHours(23, 59, 59, 999);
	end.setDate(end.getDate() + 1);
	return prisma.event.findMany({
		where: { userId, start: { gte: start, lte: end } },
	});
}

async function fetchAllEvents(
	tasks: any[],
	windowEvents: any[],
	userId: string,
) {
	const linkedIds = [
		...new Set(tasks.map((t) => t.eventId).filter(Boolean)),
	] as string[];
	if (!linkedIds.length) return [...windowEvents];
	const windowIds = new Set(windowEvents.map((e) => e.id));
	const missingIds = linkedIds.filter((id) => !windowIds.has(id));
	if (!missingIds.length) return [...windowEvents];
	const extra = await prisma.event.findMany({
		where: { id: { in: missingIds }, userId },
	});
	return [...windowEvents, ...extra];
}

function snapshotSchedule(result: any, tasks: any[]) {
	return Object.fromEntries(
		result.scheduled.map((s: any) => {
			const t = tasks.find((t: any) => t.id === s.taskId);
			return [
				s.taskId,
				{
					scheduledDate: t?.scheduledDate
						? (t.scheduledDate as Date).toISOString()
						: null,
					scheduledTime: t?.scheduledTime
						? (t.scheduledTime as Date).toISOString()
						: null,
				},
			];
		}),
	);
}

async function persistSchedule(result: any) {
	await Promise.all(
		result.scheduled.map((s: any) =>
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
}

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

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session)
		return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

	const { taskIds, days, mode, ignoreCapacity, breakOverrides, dateLabel } =
		await req.json();

	if (!days?.length)
		return NextResponse.json({ error: "days required" }, { status: 400 });
	if (!taskIds?.length)
		return NextResponse.json({
			scheduled: 0,
			overCapacity: [],
			missedDeadline: [],
			requiresConfirmation: false,
		});

	const userId = session.user.id as string;
	const [tasks, preferences] = await Promise.all([
		prisma.task.findMany({ where: { id: { in: taskIds }, userId } }),
		prisma.userPreferences.findUnique({ where: { userId } }),
	]);

	if (!preferences) {
		// Debug: check if preferences exist under any slight ID variation
		const allPrefs = await (prisma.userPreferences as any).findMany({
			take: 3,
			select: { userId: true },
		});
		console.warn(
			`[schedule] No preferences found for userId="${userId}" (type: ${typeof userId})`,
		);
		console.warn(
			`[schedule] Sample preference userIds in DB:`,
			allPrefs.map((p: any) => `"${p.userId}"`),
		);
	}

	// Fall back to sensible defaults if the user hasn't completed onboarding
	const effectivePrefs = preferences
		? breakOverrides
			? {
					...preferences,
					sessionLength: breakOverrides.sessionLength,
					breakLength: breakOverrides.breakLength,
				}
			: preferences
		: breakOverrides
			? {
					...DEFAULT_PREFERENCES,
					sessionLength: breakOverrides.sessionLength,
					breakLength: breakOverrides.breakLength,
				}
			: DEFAULT_PREFERENCES;

	const scheduleDays = buildScheduleDays(days);
	const windowEvents = await fetchWindowEvents(session.user.id, scheduleDays);
	const allEvents = await fetchAllEvents(
		tasks,
		windowEvents,
		session.user.id,
	);
	const result = scheduleTasks(
		tasks,
		windowEvents,
		effectivePrefs,
		scheduleDays,
		allEvents,
	);

	if (result.overCapacity.length > 0 && !ignoreCapacity) {
		return NextResponse.json({
			scheduled: 0,
			overCapacity: result.overCapacity,
			missedDeadline: result.missedDeadline,
			requiresConfirmation: true,
			wouldSchedule: result.scheduled.length,
		});
	}

	const previousSchedule = snapshotSchedule(result, tasks);
	await persistSchedule(result);
	await createScheduleLog({
		userId,
		mode,
		dateLabel: dateLabel ?? `${mode === "day" ? "Day" : "Week"} schedule`,
		taskIds: result.scheduled.map((s: any) => s.taskId),
		previousSchedule,
		days,
	});

	return NextResponse.json({
		scheduled: result.scheduled.length,
		overCapacity: [],
		missedDeadline: result.missedDeadline,
		requiresConfirmation: false,
	});
}
