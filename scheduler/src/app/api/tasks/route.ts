import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths } from "date-fns";

// ---------------------------------------------------------------------------
// Compute the calendar date for a task linked to an event via relative offset.
// e.g. offset = -1 means "1 day before" the next occurrence of the event.
// ---------------------------------------------------------------------------
function computeTaskDateFromEvent(event, relativeOffsetDays = 0) {
	const offset = relativeOffsetDays ?? 0;

	// Non-recurring: just shift the event start date
	if (!event.recurrence || event.recurrence.type === "none") {
		const base = new Date(event.start);
		base.setHours(0, 0, 0, 0);
		base.setDate(base.getDate() + offset);
		return base;
	}

	// Recurring: find the next occurrence on or after today
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const { type, days: recDays, until } = event.recurrence;
	const limitDate = until ? new Date(until) : addMonths(today, 12);
	const DAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

	let cursor = new Date(event.start);
	cursor.setHours(0, 0, 0, 0);
	let iterations = 0;

	while (cursor <= limitDate && iterations < 500) {
		iterations++;

		if (type === "daily") {
			if (cursor >= today) {
				const r = new Date(cursor);
				r.setDate(r.getDate() + offset);
				return r;
			}
			cursor = addDays(cursor, 1);
		} else if (type === "monthly") {
			if (cursor >= today) {
				const r = new Date(cursor);
				r.setDate(r.getDate() + offset);
				return r;
			}
			cursor = addMonths(cursor, 1);
		} else if (
			type === "weekly" &&
			Array.isArray(recDays) &&
			recDays.length > 0
		) {
			const weekStart = new Date(cursor);
			weekStart.setDate(cursor.getDate() - cursor.getDay()); // back to Sunday

			let found = null;
			for (const day of recDays) {
				const idx = DAY_MAP[day];
				if (idx === undefined) continue;
				const occ = new Date(weekStart);
				occ.setDate(weekStart.getDate() + idx);
				occ.setHours(0, 0, 0, 0);
				if (occ >= today && occ <= limitDate) {
					if (!found || occ < found) found = occ;
				}
			}
			if (found) {
				const r = new Date(found);
				r.setDate(r.getDate() + offset);
				return r;
			}
			cursor = addWeeks(cursor, 1);
		} else {
			break;
		}
	}

	// Fallback: event start + offset
	const fallback = new Date(event.start);
	fallback.setHours(0, 0, 0, 0);
	fallback.setDate(fallback.getDate() + offset);
	return fallback;
}

// ---------------------------------------------------------------------------
// GET /api/tasks?userId=xxx&page=1&limit=20
// ⚡ PERF: Added pagination to prevent loading all tasks at once
// ---------------------------------------------------------------------------
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(
			100,
			Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
		);

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID required" },
				{ status: 400 },
			);
		}

		const skip = (page - 1) * limit;

		// Get total count for pagination info
		const total = await prisma.task.count({ where: { userId } });

		// Get paginated tasks
		const tasks = await prisma.task.findMany({
			where: { userId },
			include: { exam: true, event: true },
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: skip,
		});

		return NextResponse.json({
			tasks,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("GET tasks error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tasks" },
			{ status: 500 },
		);
	}
}

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------
export async function POST(request) {
	try {
		const body = await request.json();

		// ── Bulk creation (event-linked tasks from EventForm) ───────
		if (body.tasks && Array.isArray(body.tasks)) {
			const created = await Promise.all(
				body.tasks.map(async (t) => {
					let scheduledDate = null;
					let scheduledTime = null;

					// ── Step 1: figure out WHICH DATE this task belongs to ─
					// This is determined by the relative option the user picked,
					// regardless of whether they also picked a specific clock time.
					let taskDate = null; // the calendar date (midnight), no time yet

					if (t.relativeMode === "custom") {
						// Custom date: user picked an explicit date (or range start)
						const src = t.customDate || t.customRangeStart;
						if (src) {
							taskDate = new Date(src);
							taskDate.setHours(0, 0, 0, 0);
						}
					} else if (t.relativeOffsetDays != null && t.eventId) {
						// Relative to event: compute date from event occurrence + offset
						const event = await prisma.event.findUnique({
							where: { id: t.eventId },
						});
						if (event) {
							taskDate = computeTaskDateFromEvent(
								event,
								t.relativeOffsetDays,
							);
						}
					} else if (t.isRecurring && t.recurrence?.startDate) {
						// Recurring task anchored to a start date
						taskDate = new Date(t.recurrence.startDate);
						taskDate.setHours(0, 0, 0, 0);
					}

					// ── Step 2: apply the clock time if the user toggled it on ───────
					if (taskDate) {
						// Always set scheduledDate to the computed date at midnight
						scheduledDate = new Date(taskDate);
						scheduledDate.setHours(0, 0, 0, 0);

						if (t.scheduleTime && t.specificTime) {
							// User explicitly picked a clock time → set scheduledTime
							// so the task appears on the calendar at that exact slot
							const [h, m] = t.specificTime
								.split(":")
								.map(Number);
							scheduledTime = new Date(taskDate);
							scheduledTime.setHours(h, m, 0, 0);
						}
						// If scheduleTime is false: scheduledDate is set (so the
						// scheduler knows the target day) but scheduledTime is null,
						// which means refreshUnscheduled() will pick it up because
						// we filter on !t.scheduledDate in the panel — BUT we do want
						// it to show as unscheduled, so we clear scheduledDate too.
						// The relative offset is stored in relativeOffsetDays so the
						// scheduler can use it when the user clicks "Schedule My Week".
						if (!t.scheduleTime) {
							scheduledDate = null;
							scheduledTime = null;
						}
					}

					// If taskDate is null (nothing was configured), both stay null
					// → task lands in Unscheduled Tasks panel.

					return prisma.task.create({
						data: {
							title: t.title,
							description: t.description || null,
							userId: t.userId,
							eventId: t.eventId || null,
							examId:
								t.examId && t.examId !== "none"
									? t.examId
									: null,
							duration: t.duration || 60,
							priority: t.priority || "Medium",
							isRecurring: t.isRecurring || false,
							recurrence: t.recurrence || null,
							scheduledDate,
							scheduledTime,
							status: "todo",
							completed: false,
							subtasks: [],
							bufferDays: t.bufferDays ?? null,
							url: t.url || null,
							scheduledRelativeTo: t.scheduledRelativeTo ?? null,
							relativeOffsetDays: t.relativeOffsetDays ?? null,
							eventLinkMode: t.eventLinkMode ?? null,
						},
					});
				}),
			);
			return NextResponse.json({ tasks: created });
		}

		// ── Single task creation ─────
		let examCategory = null;
		if (body.examId && body.examId !== "none") {
			const exam = await prisma.exam.findUnique({
				where: { id: body.examId },
			});
			examCategory = exam?.title;
		}

		const task = await prisma.task.create({
			data: {
				title: body.title,
				description: body.description || null,
				dueDate: body.dueDate ? new Date(body.dueDate) : null,
				userId: body.userId,
				completed: false,
				completedAt: null,
				priority: body.priority || "Medium",
				duration: body.duration || 0,
				subtasks: body.subtasks || [],
				examId:
					body.examId && body.examId !== "none" ? body.examId : null,
				category: examCategory || "General",
				eventId: body.eventId || null,
				isRecurring: body.isRecurring || false,
				recurrence: body.recurrence || null,
				scheduledDate: body.scheduledDate
					? new Date(body.scheduledDate)
					: null,
				scheduledTime: body.scheduledTime
					? new Date(body.scheduledTime)
					: null,
				bufferDays: body.bufferDays ?? null,
				url: body.url || null,
				scheduledRelativeTo: body.scheduledRelativeTo ?? null,
				relativeOffsetDays: body.relativeOffsetDays ?? null,
				eventLinkMode: body.eventLinkMode ?? null,
			},
			include: { exam: true },
		});
		return NextResponse.json({ task });
	} catch (error) {
		console.error("Task creation error:", error);
		return NextResponse.json(
			{ error: "Failed to create task" },
			{ status: 500 },
		);
	}
}
