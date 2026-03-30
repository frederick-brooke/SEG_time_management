/**
 * API route for managing schedule logs.
 * GET fetches all logs for the current user, POST creates a log entry directly,
 * and DELETE restores tasks to their pre-schedule state and removes the log.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ScheduleSnapshot = Record<
	string,
	{ scheduledDate: string | null; scheduledTime: string | null }
>;

/**
 * Restores each task in the log to its pre-schedule times using the snapshot.
 * 
 * @param taskIds - The IDs of tasks that were scheduled in this log entry.
 * @param snapshot - Map of taskId to previous scheduledDate and scheduledTime.
 */
async function restoreTaskSchedule(
	taskIds: string[],
	snapshot: ScheduleSnapshot,
) {
	await Promise.all(
		taskIds.map((taskId) => {
			const prev = snapshot[taskId];
			return prisma.task.updateMany({
				where: { id: taskId },
				data: {
					scheduledDate: prev?.scheduledDate
						? new Date(prev.scheduledDate)
						: null,
					scheduledTime: prev?.scheduledTime
						? new Date(prev.scheduledTime)
						: null,
				} as Parameters<typeof prisma.task.updateMany>[0]["data"],
			});
		}),
	);
}

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session)
		return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

	try {
		const logs = await (prisma.scheduleLog as any).findMany({
			where: { userId: session.user.id },
			orderBy: { scheduledAt: "desc" },
		});
		return NextResponse.json({ logs });
	} catch (error) {
		console.error("Schedule log fetch error:", error);
		return NextResponse.json({ logs: [] });
	}
}

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session)
		return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

	const { mode, dateLabel, taskIds, previousSchedule, days } =
		await req.json();

	const log = await (prisma.scheduleLog as any).create({
		data: {
			userId: session.user.id,
			mode,
			dateLabel,
			taskIds: taskIds || [],
			previousSchedule: previousSchedule || null,
			days: days || null,
		},
	});

	return NextResponse.json({ log });
}

/**
 * DELETE /api/schedule-log?id=<logId>
 * Restores each task to its pre-schedule times using the log's snapshot, then deletes the log.
 * 
 * @param req - Query param `id` is the log entry to undo and delete.
 * @returns `{ success: true }` on completion, or an error if the log is not found.
 */
export async function DELETE(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session)
		return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

	const id = new URL(req.url).searchParams.get("id");
	if (!id)
		return NextResponse.json({ error: "Log ID required" }, { status: 400 });

	const log = await (prisma.scheduleLog as any).findFirst({
		where: { id, userId: session.user.id },
	});
	if (!log)
		return NextResponse.json({ error: "Log not found" }, { status: 404 });

	const snapshot = (log.previousSchedule ?? {}) as ScheduleSnapshot;

	try {
		await restoreTaskSchedule(log.taskIds as string[], snapshot);
	} catch (error) {
		// Non-fatal — log the error but still delete the log entry
		console.error("Schedule restore error (non-fatal):", error);
	}

	await (prisma.scheduleLog as any).delete({ where: { id } });
	return NextResponse.json({ success: true });
}
